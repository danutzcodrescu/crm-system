import type { APIResponse } from '@playwright/test';
import { UNSAFE_decodeViaTurboStream, UNSAFE_SingleFetchRedirectSymbol } from 'react-router';

// Keep React Router's internal wire protocol confined to this test helper.
async function decode(response: APIResponse) {
  const body = new Response(new Uint8Array(await response.body())).body;
  if (!body) throw new Error('Missing route response body');
  const decoded = await UNSAFE_decodeViaTurboStream(body, globalThis);
  const value = decoded.value;
  if (typeof value !== 'object' || value === null) throw new Error('Expected a route response object');
  return value as Record<PropertyKey, unknown>;
}

export async function readRouteData<T = Record<string, unknown>>(response: APIResponse): Promise<T> {
  const value = await decode(response);
  const result = new URL(response.url()).searchParams.get('_routes');
  // Loader results are keyed by route ID; actions return one unkeyed result.
  const envelope = result && Object.hasOwn(value, result) ? value[result] : value;
  if (typeof envelope !== 'object' || envelope === null) throw new Error('Expected a route result');
  if ('error' in envelope) throw envelope.error;
  if (!('data' in envelope)) throw new Error('Expected route data');
  return envelope.data as T;
}

export async function redirectLocation(response: APIResponse): Promise<string | undefined> {
  if (response.headers().location) return response.headers().location;
  const value = await decode(response);
  const redirect = value[UNSAFE_SingleFetchRedirectSymbol] ?? value;
  if (typeof redirect !== 'object' || redirect === null || !('redirect' in redirect)) return;
  return typeof redirect.redirect === 'string' ? redirect.redirect : undefined;
}

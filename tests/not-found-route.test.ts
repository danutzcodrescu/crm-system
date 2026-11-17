import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { createRequestHandler, type ServerBuild } from 'react-router';

import routes from '../app/routes';

async function handler() {
  const errors: unknown[] = [];
  const fallback = routes.find((route) => route.path === '*');
  const build: ServerBuild = {
    entry: {
      module: {
        default: (_request, status) => new Response('Document', { status }),
        handleError: (error) => {
          errors.push(error);
        },
      },
    },
    routes: {
      root: { id: 'root', path: '', module: { default: () => null } },
      broken: {
        id: 'broken',
        parentId: 'root',
        path: 'broken',
        module: {
          default: () => null,
          loader() {
            throw new Error('synthetic genuine route failure');
          },
        },
      },
      ...(fallback
        ? {
            fallback: {
              id: 'fallback',
              parentId: 'root',
              path: fallback.path,
              module: await import(pathToFileURL(resolve('app', fallback.file)).href),
            },
          }
        : {}),
    },
    assets: { entry: { imports: [], module: '/entry.js' }, routes: {}, url: '/manifest.js', version: 'test' },
    publicPath: '/',
    assetsBuildDirectory: 'dist/client',
    future: {},
    ssr: true,
    isSpaMode: false,
    prerender: [],
    routeDiscovery: { mode: 'initial', manifestPath: '/__manifest' },
  };
  return { request: createRequestHandler(build, 'production'), errors };
}

test('unmatched document/data requests return 404 without triggering the server error/Sentry hook', async () => {
  const { request, errors } = await handler();
  for (const path of [
    '/.git/config',
    '/apple-touch-icon-precomposed.png',
    '/not-a-real-route',
    '/not-a-real-route.data',
  ]) {
    for (const method of ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE']) {
      const response = await request(new Request(`https://example.invalid${path}`, { method }));
      assert.equal(response.status, 404, `${method} ${path}`);
    }
  }
  assert.equal(errors.length, 0, 'normal 404s must not invoke entry.server.handleError');
});

test('a genuine error in an existing route still returns 500 and reaches the server error hook', async () => {
  const { request, errors } = await handler();
  const response = await request(new Request('https://example.invalid/broken'));
  assert.equal(response.status, 500);
  assert.equal(errors.length, 1);
  assert.match(String(errors[0]), /synthetic genuine route failure/);
});

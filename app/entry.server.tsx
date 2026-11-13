import { PassThrough } from 'node:stream';

import { CacheProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { createReadableStreamFromReadable } from '@react-router/node';
import * as Sentry from '@sentry/react-router';
import { sv } from 'date-fns/locale';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { type EntryContext, type HandleErrorFunction, ServerRouter } from 'react-router';

import { createEmotion } from './emotion/emotion-server';
import { logger } from './utils/server/logger.server';
import { theme } from './utils/theme';

export const handleError: HandleErrorFunction = (error, { request }) => {
  if (!request.signal.aborted) {
    logRequestError(error, request, 'request');
    Sentry.captureException(error);
  }
};

function logRequestError(error: unknown, request: Request, phase: 'request' | 'render') {
  // Pino's `err` serializer preserves Error stacks and thrown objects. String
  // interpolation reduced route error responses to an unhelpful [object Object].
  logger.error(
    {
      err: error,
      phase,
      method: request.method,
      pathname: new URL(request.url).pathname,
    },
    'React Router request failed',
  );
}

export const instrumentations = [Sentry.createSentryServerInstrumentation()];

const ABORT_DELAY = 5_000;

async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return isbot(request.headers.get('user-agent') || '')
    ? handleBotRequest(request, responseStatusCode, responseHeaders, routerContext)
    : handleBrowserRequest(request, responseStatusCode, responseHeaders, routerContext);
}

export default Sentry.wrapSentryHandleRequest(handleRequest);

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(<ServerRouter context={routerContext} url={request.url} />, {
      onAllReady() {
        shellRendered = true;
        const body = new PassThrough();
        const stream = createReadableStreamFromReadable(body);

        responseHeaders.set('Content-Type', 'text/html');

        resolve(
          new Response(stream, {
            headers: responseHeaders,
            status: responseStatusCode,
          }),
        );

        pipe(Sentry.getMetaTagTransformer(body));
      },
      onShellError(error: unknown) {
        reject(error);
      },
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          logRequestError(error, request, 'render');
        }
      },
    });

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const { cache, injectStyles } = createEmotion();
  // Single Fetch serializes hydration data through Suspense. renderToString
  // cannot finish those boundaries, so collect the completed stream before
  // extracting Emotion's critical CSS, as the existing renderer requires.
  return new Promise<Response>((resolve, reject) => {
    const body = new PassThrough();
    const chunks: Buffer[] = [];
    body.on('data', (chunk: Buffer) => chunks.push(chunk));
    body.on('error', reject);
    body.on('end', () => {
      const markup = injectStyles(Buffer.concat(chunks).toString('utf8'));
      responseHeaders.set('Content-Type', 'text/html');
      resolve(new Response(markup, { status: responseStatusCode, headers: responseHeaders }));
    });

    const { pipe, abort } = renderToPipeableStream(
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
            <ServerRouter context={routerContext} url={request.url} />
          </LocalizationProvider>
        </ThemeProvider>
      </CacheProvider>,
      {
        onAllReady() {
          pipe(Sentry.getMetaTagTransformer(body));
        },
        onShellError: reject,
        onError(error: unknown) {
          responseStatusCode = 500;
          logRequestError(error, request, 'render');
        },
      },
    );
    const timeout = setTimeout(abort, ABORT_DELAY);
    body.on('close', () => clearTimeout(timeout));
  });
}

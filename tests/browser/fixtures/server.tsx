import { CacheProvider } from '@emotion/react';
import { renderToString } from 'react-dom/server';

import { createEmotion } from '../../../app/emotion/emotion-server';
import { MunicipalityFixture } from './municipality';

export function render() {
  const { cache, injectStyles } = createEmotion();
  const html = renderToString(
    <CacheProvider value={cache}>
      <MunicipalityFixture />
    </CacheProvider>,
  );
  return injectStyles(
    `<!doctype html><html><head><meta name="emotion-insertion-point" content="emotion-insertion-point"/></head><body><div id="root">${html}</div><script type="module" src="/client.js"></script></body></html>`,
  );
}

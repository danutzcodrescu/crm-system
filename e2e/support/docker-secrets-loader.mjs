import { registerHooks } from 'node:module';

// Mounted only into the disposable test container. This file is excluded from
// production images with the rest of e2e/; no production bypass is introduced.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@infisical/sdk') {
      return { url: new URL('./docker-infisical.mjs', import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

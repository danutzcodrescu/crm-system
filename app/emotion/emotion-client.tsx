import { CacheProvider, EmotionCache } from '@emotion/react';
import { unstable_useEnhancedEffect as useEnhancedEffect } from '@mui/material';
import { createContext, useContext, useMemo, useState } from 'react';

import { createEmotionCache } from './emotion-cache';
export interface ClientStyleContextData {
  reset: () => void;
}

export const ClientStyleContext = createContext<ClientStyleContextData>({
  reset: () => {},
});

export const useClientStyleContext = () => {
  return useContext(ClientStyleContext);
};

interface ClientCacheProviderProps {
  children: React.ReactNode;
}

export function ClientCacheProvider({ children }: ClientCacheProviderProps) {
  const [cache, setCache] = useState(createEmotionCache());

  const context = useMemo(
    () => ({
      reset() {
        setCache(createEmotionCache());
      },
    }),
    [],
  );

  return (
    <ClientStyleContext.Provider value={context}>
      <CacheProvider value={cache}>{children}</CacheProvider>
    </ClientStyleContext.Provider>
  );
}

export function useInjectStyles(cache: EmotionCache) {
  const styles = useClientStyleContext();

  useEnhancedEffect(() => {
    cache.sheet.container = document.head;

    const tags = cache.sheet.tags;
    cache.sheet.flush();
    tags.forEach((tag) => {
      const sheet = cache.sheet as unknown as {
        _insertTag: (tag: HTMLStyleElement) => void;
      };
      sheet._insertTag(tag);
    });

    styles.reset();
  }, []);
}

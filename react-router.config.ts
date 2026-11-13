import type { Config } from '@react-router/dev/config';

export default {
  buildDirectory: 'dist',
  ssr: true,
  // The other v8 preparation flags are now the framework defaults.
  splitRouteModules: true,
} satisfies Config;

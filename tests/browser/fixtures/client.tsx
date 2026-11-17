import { hydrateRoot } from 'react-dom/client';

import { ClientCacheProvider } from '../../../app/emotion/emotion-client';
import { MunicipalityFixture } from './municipality';

const errors: string[] = [];
document.documentElement.dataset.hydrationErrors = '[]';
const root = document.getElementById('root');
if (!root) throw new Error('Missing hydration fixture root');
hydrateRoot(
  root,
  <ClientCacheProvider>
    <MunicipalityFixture />
  </ClientCacheProvider>,
  {
    onRecoverableError(error, info) {
      errors.push(`${String(error)}\n${info.componentStack}`);
      document.documentElement.dataset.hydrationErrors = JSON.stringify(errors);
    },
  },
);

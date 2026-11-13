import { ActionFunctionArgs, data as routeData, redirect } from 'react-router';

import { isLoggedIn, logout } from '~/utils/server/auth.server';
import { logger } from '~/utils/server/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  if (!(await isLoggedIn(request))) {
    return redirect('/signin');
  }
  // Native HTML forms use POST; retain DELETE for existing enhanced/API callers.
  if (request.method === 'POST' || request.method === 'DELETE') {
    try {
      await logout(request);
      return redirect('/signin');
    } catch (e) {
      logger.error(e);
      return routeData({ message: 'Could not logout', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
  }
}

import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { isLoggedIn, logout } from '~/utils/server/auth.server';
import { logger } from '~/utils/server/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  if (!isLoggedIn(request)) {
    return redirect('/signin');
  }
  if (request.method === 'DELETE') {
    try {
      await logout(request);
      return redirect('/signin');
    } catch (e) {
      logger.error(e);
      return json({ message: 'Could not logout', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
  }
}

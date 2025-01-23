import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { logger } from '~/utils/server/logger.server';

export async function action({ request }: ActionFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  if (request.method === 'DELETE') {
    try {
      await auth.logout(request);
      return redirect('/signin');
    } catch (e) {
      logger.error(e);
      return json({ message: 'Could not logout', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
  }
}

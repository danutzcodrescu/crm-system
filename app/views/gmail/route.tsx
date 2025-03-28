import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { logger } from '~/utils/server/logger.server';
import { gmail } from '~/utils/server/services/gmail.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return json({ error: 'Missing code or state' }, { status: 400 });
  const user = await auth.getUserFromSession(request);
  try {
    await gmail.setToken(code as string, user?.id as number);
    return redirect(state as string);
  } catch (e) {
    logger.error(e);
    return json({ error: 'Failed to set token' }, { status: 500 });
  }
}
export default function Gmail() {
  return <h1>auth successful</h1>;
}

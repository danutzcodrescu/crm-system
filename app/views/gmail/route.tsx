import { data as routeData, LoaderFunctionArgs, redirect } from 'react-router';

import { getUserFromSession, isLoggedIn } from '~/utils/server/auth.server';
import { logger } from '~/utils/server/logger.server';
import { setToken } from '~/utils/server/services/gmail.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  if (!code || !state) return routeData({ error: 'Missing code or state' }, { status: 400 });
  const user = await getUserFromSession(request);
  try {
    await setToken(code as string, user?.id as number);
    return redirect(state as string);
  } catch (e) {
    logger.error(e);
    return routeData({ error: 'Failed to set token' }, { status: 500 });
  }
}
export default function Gmail() {
  return <h1>auth successful</h1>;
}

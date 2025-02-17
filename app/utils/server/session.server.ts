import { createCookieSessionStorage } from '@remix-run/node';

import { maxAge } from './constants.server';
import { getSecret } from './infisical.server';

type SessionData = {
  session: string;
};

type SessionFlashData = {
  error: string;
};

const secret = await getSecret('COOKIE_SECRET');

const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: 'crm_session',
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    secrets: [secret.secretValue],
  },
});

export { commitSession, destroySession, getSession };

export async function getRequestSession(request: Request) {
  return getSession(request.headers.get('Cookie'));
}

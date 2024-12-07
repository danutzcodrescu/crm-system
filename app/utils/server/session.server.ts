import { createCookieSessionStorage } from '@remix-run/node';

import { maxAge } from './constants.server';

type SessionData = {
  session: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: 'crm_session',
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    // TODO add secret
    // secrets: []
  },
});

export { commitSession, destroySession, getSession };

export async function getRequestSession(request: Request) {
  return getSession(request.headers.get('Cookie'));
}

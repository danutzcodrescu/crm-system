import { getUser, loginUser } from './clerkClient.server';
import { commitSession, destroySession, getRequestSession, getSession } from './session.server';

export const auth = {
  login: async function (username: string, password: string, req: Request): Promise<[string, null] | [null, string]> {
    const [error, userId] = await loginUser(username, password);
    if (error) {
      return [error, null];
    }

    const session = await getRequestSession(req);

    session.set('userId', userId as string);
    const sessionString = await commitSession(session);
    return [null, sessionString];
  },

  logout: async function (req: Request) {
    const session = await getRequestSession(req);
    destroySession(session);
    return;
  },

  isLoggedIn: async function (request: Request): Promise<boolean> {
    const session = await getSession(request.headers.get('Cookie'));
    if (session.has('userId')) {
      return Boolean(await getUser(session.get('userId') as string));
    }
    return false;
  },
};

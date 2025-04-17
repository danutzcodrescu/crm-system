import { hash, verify } from '@node-rs/argon2';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';

import { logger } from './logger.server';
import { db } from './repositories/db.server';
import { Session, sessions, User, users } from './schema.server';
import { commitSession, destroySession, getRequestSession, getSession } from './session.server';

export type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

export async function login(userId: string, password: string, req: Request): Promise<[string, null] | [null, string]> {
  const user = await db
    .select({ password: users.password, userId: users.id })
    .from(users)
    .where(eq(users.username, userId));
  if (user.length !== 1) {
    logger.info('login -> user not found');
    return ['Invalid username or password', null];
  }
  const pass = await verifyPasswordHash(user[0].password, password);

  if (!pass) {
    logger.info('login -> password not valid');
    return ['Invalid username or password', null];
  }
  const sessionString = await setSession(req, user[0].userId);
  logger.debug(`login -> Session created for ${userId}`);
  return [null, sessionString];
}

export async function logout(req: Request) {
  const session = await getRequestSession(req);
  try {
    const sessionId = fromSessionTokenToSessionId(session.get('session') as string);
    await invalidateSession(sessionId);
    logger.debug(`logout -> Session destroyed for ${session.get('session')}`);
  } catch (e) {
    logger.error(e);
  }
  logger.debug(`logout -> Destroying session for ${session.get('session')}`);
  destroySession(session);
  return;
}

export async function isLoggedIn(request: Request): Promise<boolean> {
  const sessionDetails = await getSession(request.headers.get('Cookie'));
  if (sessionDetails.has('session')) {
    logger.debug(`isLoggedIn -> Session found`);
    const { session } = await validateSessionToken(sessionDetails.get('session') as string);
    logger.debug(`isLoggedIn -> ${Boolean(session)}, session is valid`);
    return Boolean(session);
  }
  return false;
}

export async function getUserFromSession(request: Request): Promise<User | null> {
  const sessionDetails = await getSession(request.headers.get('Cookie'));
  if (!sessionDetails.has('session')) {
    return null;
  }
  const { user } = await validateSessionToken(sessionDetails.get('session') as string);
  return user;
}

export async function signUp(
  username: string,
  password: string,
  req: Request,
  shouldCreateSessions = true,
): Promise<[string, null] | [null, string]> {
  const hashedPassword = await hashPassword(password);

  try {
    const data = await db.insert(users).values({ username, password: hashedPassword }).returning({ id: users.id });
    logger.info(`User created: ${username}`);
    if (!shouldCreateSessions) {
      return [null, ''];
    } else {
      const sessionString = await setSession(req, data[0].id);

      return [null, sessionString];
    }
  } catch (e) {
    logger.error(e);
    return ['User already exists', null];
  }
}

const SESSION_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 24 * 7; // 15 days
const SESSION_MAX_DURATION_MS = SESSION_REFRESH_INTERVAL_MS * 2;

const fromSessionTokenToSessionId = (sessionToken: string) => {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(sessionToken)));
};

function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

async function createSession(token: string, userId: number): Promise<Session> {
  const sessionId = fromSessionTokenToSessionId(token);
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + SESSION_MAX_DURATION_MS),
  };
  try {
    await db.insert(sessions).values(session);
  } catch (e) {
    logger.error(e);
  }
  return session;
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
  const sessionId = fromSessionTokenToSessionId(token);
  const result = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId));
  if (result.length < 1) {
    return { session: null, user: null };
  }
  const { user, session } = result[0];
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return { session: null, user: null };
  }
  if (Date.now() >= session.expiresAt.getTime() - SESSION_REFRESH_INTERVAL_MS) {
    session.expiresAt = new Date(Date.now() + SESSION_MAX_DURATION_MS);
    await db
      .update(sessions)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(sessions.id, session.id));
  }
  return { session, user };
}

async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

const hashPassword = async (password: string) => {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
};

const verifyPasswordHash = async (hash: string, password: string) => {
  return await verify(hash, password);
};

async function setSession(req: Request, userId: number) {
  const cookie = await getRequestSession(req);
  logger.debug(`SetSession -> Setting sessionToken for user ${userId}`);
  const sessionToken = generateSessionToken();
  logger.debug(`SetSession -> Creating session for user ${userId}`);
  await createSession(sessionToken, userId);
  logger.debug(`SetSession -> created for user ${userId}`);
  cookie.set('session', sessionToken);
  return commitSession(cookie);
}

export async function storeRefreshToken(userId: number, token: string) {
  try {
    await db.update(users).set({ gmailRefreshToken: token }).where(eq(users.id, userId));
  } catch (e) {
    logger.error(e);
  }
}

import { createClerkClient } from '@clerk/backend';

export const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function loginUser(username: string, password: string): Promise<[string, null] | [null, string]> {
  try {
    const user = await clerkClient.users.getUserList({ username: [username] });
    if (user.totalCount !== 1) return ['Too few/many users found', null];
    const userId = user.data[0].id;
    const resp = await clerkClient.users.verifyPassword({ userId, password });

    if (resp.verified) {
      return [null, userId];
    } else {
      return ['Username/password combination do not match', null];
    }
  } catch {
    return ['could not check username/password', null];
  }
}

export async function logoutUser(token: string): Promise<string | undefined> {
  try {
    await clerkClient.signInTokens.revokeSignInToken(token);
    return;
  } catch (e) {
    console.log(e);
    return 'could not clear token';
  }
}

export async function getUser(userId: string) {
  try {
    return clerkClient.users.getUser(userId);
  } catch {
    return undefined;
  }
}

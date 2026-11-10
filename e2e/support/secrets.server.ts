// Replaced by Vite ONLY in the isolated smoke server. Never reads developer secrets.
const secrets: Record<string, string> = {
  COOKIE_SECRET: 'isolated-smoke-cookie-secret-not-for-production',
  SIGNUP_ENABLED: 'true',
  GMAIL_CLIENT_ID: 'smoke.apps.googleusercontent.com',
  GMAIL_CLIENT_SECRET: 'not-a-real-google-secret',
  GMAIL_REDIRECT_URL: 'http://localhost/gmail-auth-redirect',
  TOKEN_KEY: 'smoke-token-key',
};

export async function getSecret(name: string) {
  if (!(name in secrets)) throw new Error(`Missing smoke secret: ${name}`);
  return { secretValue: secrets[name] };
}

// Use the same synthetic values as the Vite smoke fixture without reading any
// environment files or contacting Infisical. The actual app still calls its
// normal getSecret implementation and authenticates against the real test DB.
const secrets = {
  COOKIE_SECRET: 'isolated-smoke-cookie-secret-not-for-production',
  SIGNUP_ENABLED: 'true',
  GMAIL_CLIENT_ID: 'smoke.apps.googleusercontent.com',
  GMAIL_CLIENT_SECRET: 'not-a-real-google-secret',
  GMAIL_REDIRECT_URL: 'http://localhost/gmail-auth-redirect',
  TOKEN_KEY: 'smoke-token-key',
};

// Refuse to be used in an unexpected location instead of silently replacing
// the SDK if this module is ever copied outside the smoke container.
if (import.meta.url !== 'file:///smoke/docker-infisical.mjs') {
  throw new Error('Synthetic Infisical SDK is only for the Docker smoke container');
}

export class InfisicalSDK {
  auth() {
    return { universalAuth: { login: async () => ({}) } };
  }

  secrets() {
    return {
      getSecret: async ({ secretName }) => {
        if (!Object.hasOwn(secrets, secretName)) throw new Error(`Missing smoke secret: ${secretName}`);
        return { secretValue: secrets[secretName] };
      },
    };
  }
}

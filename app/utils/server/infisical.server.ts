import { InfisicalSDK } from '@infisical/sdk';

async function setupInfiscal() {
  const infisicalSdk = new InfisicalSDK();

  await infisicalSdk.auth().universalAuth.login({
    clientId: process.env.INFISICAL_CLIENT_ID!,
    clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
  });

  return infisicalSdk;
}

export const infisicalClient = await setupInfiscal();

export async function getSecret(secretName: string) {
  return infisicalClient.secrets().getSecret({
    environment: process.env.INFISICAL_ENVIRONMENT as string,
    projectId: process.env.INFISICAL_PROJECT_ID as string,
    secretPath: '/',
    secretName,
  });
}

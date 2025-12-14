import { prisma } from '@/db/prisma';
import { encryptField, decryptField } from '@/lib/encrypt';

const resolveRedirectUri = (opts: { isProduction: boolean }) => {
  const candidate =
    process.env.DOCUSIGN_REDIRECT_URI ||
    (opts.isProduction ? process.env.DOCUSIGN_BASE_URL : process.env.DOCUSIGN_URL) ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (!candidate) {
    throw new Error('DocuSign redirect URI not configured');
  }

  try {
    const asUrl = new URL(candidate);
    if (asUrl.pathname === '/api/docusign/callback') {
      return asUrl.toString();
    }
    return new URL('/api/docusign/callback', asUrl).toString();
  } catch {
    throw new Error('DocuSign redirect URI not configured');
  }
};

const getDocuSignConfig = () => {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const secretKey = process.env.DOCUSIGN_SECRET_KEY;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;

  if (!integrationKey || !secretKey) {
    throw new Error('DocuSign env vars DOCUSIGN_INTEGRATION_KEY/DOCUSIGN_SECRET_KEY are not set');
  }

  // Use production or demo based on environment
  const isProduction = process.env.NODE_ENV === 'production';

  const apiBaseUrl = isProduction ? 'https://www.docusign.net' : 'https://demo.docusign.net';
  const oauthBaseUrl = isProduction ? 'https://account.docusign.com' : 'https://account-d.docusign.com';
  const redirectUri = resolveRedirectUri({ isProduction });

  return {
    integrationKey,
    secretKey,
    accountId,
    apiBaseUrl,
    oauthBaseUrl,
    redirectUri,
    isProduction,
  };
};

export type DocuSignTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

export const getDocuSignAuthorizationUrl = async (opts: {
  landlordId: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256';
}) => {
  const config = getDocuSignConfig();

  // DocuSign OAuth scopes for signature operations
  const scopes = 'signature offline_access';

  const authUrl = new URL('/oauth/auth', config.oauthBaseUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('client_id', config.integrationKey);
  authUrl.searchParams.set('state', opts.state);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);

  if (opts.codeChallenge) {
    authUrl.searchParams.set('code_challenge', opts.codeChallenge);
    authUrl.searchParams.set('code_challenge_method', opts.codeChallengeMethod || 'S256');
  }

  // Check if DocuSignConnection table exists, if not we'll need to create it
  try {
    await (prisma as any).docuSignConnection.upsert({
      where: { landlordId: opts.landlordId },
      create: {
        landlordId: opts.landlordId,
        oauthState: opts.state,
        connectedAt: null,
      },
      update: {
        oauthState: opts.state,
      },
    });
  } catch (error) {
    console.warn('DocuSignConnection table may not exist yet:', error);
    // We'll handle this in the callback - for now just return the URL
  }

  return authUrl.toString();
};

export const exchangeDocuSignCode = async (opts: {
  landlordId: string;
  code: string;
  codeVerifier?: string;
}) => {
  const config = getDocuSignConfig();

  const tokenUrl = `${config.oauthBaseUrl}/oauth/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', opts.code);
  params.append('redirect_uri', config.redirectUri);

  if (opts.codeVerifier) {
    params.append('code_verifier', opts.codeVerifier);
  }

  const authHeader = Buffer.from(`${config.integrationKey}:${config.secretKey}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DocuSign token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in;

  if (!accessToken || !refreshToken || !expiresIn) {
    throw new Error('DocuSign token exchange failed: missing required tokens');
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  try {
    await (prisma as any).docuSignConnection.upsert({
      where: { landlordId: opts.landlordId },
      create: {
        landlordId: opts.landlordId,
        accessTokenEncrypted: await encryptField(accessToken),
        refreshTokenEncrypted: await encryptField(refreshToken),
        accessTokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        oauthState: null,
      },
      update: {
        accessTokenEncrypted: await encryptField(accessToken),
        refreshTokenEncrypted: await encryptField(refreshToken),
        accessTokenExpiresAt: expiresAt,
        connectedAt: new Date(),
        oauthState: null,
      },
    });
  } catch (error) {
    console.error('Failed to save DocuSign tokens:', error);
    throw new Error('Failed to save DocuSign connection');
  }
};

export const getDocuSignAccessToken = async (landlordId: string): Promise<{
  accessToken: string;
  accountId: string;
}> => {
  const config = getDocuSignConfig();

  if (!config.accountId) {
    throw new Error('DocuSign env var DOCUSIGN_ACCOUNT_ID is not set');
  }

  try {
    const conn = await (prisma as any).docuSignConnection.findUnique({
      where: { landlordId },
    });

    if (!conn?.accessTokenEncrypted || !conn.refreshTokenEncrypted) {
      throw new Error('DocuSign not connected');
    }

    const accessToken = await decryptField(conn.accessTokenEncrypted);
    const refreshToken = await decryptField(conn.refreshTokenEncrypted);

    if (!accessToken || !refreshToken) {
      throw new Error('DocuSign tokens missing');
    }

    const expiresAt = conn.accessTokenExpiresAt;
    const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() + 60_000 : true;

    if (!isExpired) {
      return { accessToken, accountId: config.accountId };
    }

    // Refresh the token
    const refreshUrl = `${config.oauthBaseUrl}/oauth/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const authHeader = Buffer.from(`${config.integrationKey}:${config.secretKey}`).toString('base64');

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DocuSign token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();

    const newAccessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken; // Some providers don't return new refresh token
    const newExpiresIn = tokenData.expires_in;

    if (!newAccessToken || !newExpiresIn) {
      throw new Error('DocuSign token refresh failed: missing tokens');
    }

    const newExpiresAt = new Date(Date.now() + newExpiresIn * 1000);

    await (prisma as any).docuSignConnection.update({
      where: { landlordId },
      data: {
        accessTokenEncrypted: await encryptField(newAccessToken),
        refreshTokenEncrypted: await encryptField(newRefreshToken),
        accessTokenExpiresAt: newExpiresAt,
      },
    });

    return { accessToken: newAccessToken, accountId: config.accountId };
  } catch (error) {
    console.error('DocuSign token retrieval error:', error);
    throw new Error('DocuSign not connected or tokens invalid');
  }
};

export const testDocuSignConnection = async (landlordId: string): Promise<boolean> => {
  try {
    const { accessToken, accountId } = await getDocuSignAccessToken(landlordId);
    const config = getDocuSignConfig();

    // Test the connection by getting user info
    const response = await fetch(
      `${config.apiBaseUrl}/restapi/v2.1/accounts/${accountId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('DocuSign connection test failed:', error);
    return false;
  }
};
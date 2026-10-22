import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const SERVICE_ACCOUNT_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

export const DRIVE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

export function getGoogleAuth(): GoogleAuth {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set');
  const credentials = JSON.parse(raw);
  return new GoogleAuth({ credentials, scopes: SERVICE_ACCOUNT_SCOPES });
}

// Pass GoogleAuth directly — avoids the TypeScript overload mismatch with getClient()
export function getSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth credentials (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET) are missing in environment variables.'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function getDriveClient() {
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  // 1. If OAuth refresh token exists, use OAuth 2.0 Web Client (drive.file scope)
  if (refreshToken && refreshToken.trim()) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken.trim() });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // 2. Fallback to Service Account if available
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const auth = getGoogleAuth();
    return google.drive({ version: 'v3', auth });
  }

  throw new Error(
    'Google Drive is not authorized. Please visit /api/auth/google to authorize Google Drive via OAuth.'
  );
}

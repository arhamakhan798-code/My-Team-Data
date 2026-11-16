import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const SERVICE_ACCOUNT_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
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

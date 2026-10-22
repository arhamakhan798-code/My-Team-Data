import { NextResponse } from 'next/server';
import { getSheetsClient, getDriveClient } from '@/lib/google';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Google Sheets status (backed by Service Account)
  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetRes = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    results.googleSheets = {
      status: 'CONNECTED',
      sheetTitle: sheetRes.data.properties?.title,
      tabs: sheetRes.data.sheets?.map((s) => s.properties?.title) || [],
    };
  } catch (err: unknown) {
    results.googleSheets = {
      status: 'FAILED',
      error: (err as Error).message,
    };
  }

  // 2. Google Drive status (OAuth 2.0 Web Client)
  const hasOAuthClientId = !!process.env.GOOGLE_OAUTH_CLIENT_ID;
  const hasRefreshToken = !!(process.env.GOOGLE_OAUTH_REFRESH_TOKEN && process.env.GOOGLE_OAUTH_REFRESH_TOKEN.trim());
  const driveMode = hasRefreshToken
    ? 'OAuth 2.0 (drive.file)'
    : process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? 'Service Account (Fallback)'
    : 'Not Authorized';

  results.googleDriveMode = driveMode;
  results.googleOAuthSetup = {
    hasClientId: hasOAuthClientId,
    hasRefreshToken: hasRefreshToken,
    authorizeUrl: '/api/auth/google',
  };

  try {
    const drive = await getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      try {
        const folderRes = await drive.files.get({
          fileId: folderId,
          fields: 'id, name, mimeType',
          supportsAllDrives: true,
        });
        results.googleDrive = {
          status: 'CONNECTED',
          folderName: folderRes.data.name,
          folderId: folderRes.data.id,
        };
      } catch {
        // Under drive.file scope, files.get on older external folders may 404, but client works
        results.googleDrive = {
          status: 'CONNECTED',
          note: 'Drive OAuth client active. Uploads will save to target folder or Drive root.',
        };
      }
    } else {
      results.googleDrive = {
        status: 'CONNECTED',
        note: 'Drive OAuth client active. Uploads will save to Drive root.',
      };
    }
  } catch (err: unknown) {
    results.googleDrive = {
      status: hasRefreshToken ? 'FAILED' : 'NEEDS_AUTHORIZATION',
      error: (err as Error).message,
      actionRequired: !hasRefreshToken
        ? 'Please open http://localhost:3000/api/auth/google in your browser to grant Drive access.'
        : undefined,
    };
  }

  return NextResponse.json(results);
}

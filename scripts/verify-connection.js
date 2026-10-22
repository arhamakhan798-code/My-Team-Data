const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
});

async function main() {
  console.log('--- Google Service Account & Cloud API Verification ---');
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not found in .env.local');
  }

  const credentials = JSON.parse(rawKey);
  console.log('[1/3] Service Account Email:', credentials.client_email);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
  const authClient = await auth.getClient();

  // Test Google Sheets
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  console.log('[2/3] Connected to Google Sheet:', sheetMeta.data.properties.title);

  // Test Google Drive
  const drive = google.drive({ version: 'v3', auth: authClient });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const folderMeta = await drive.files.get({
    fileId: folderId,
    fields: 'id, name, mimeType',
    supportsAllDrives: true,
  });
  console.log('[3/3] Connected to Google Drive Folder:', folderMeta.data.name);

  console.log('\nSUCCESS: Both Google Sheets and Google Drive APIs are fully connected and verified!');
}

main().catch((err) => {
  console.error('\nERROR verifying connection:', err.message || err);
  process.exit(1);
});

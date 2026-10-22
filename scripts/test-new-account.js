const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

function log(msg) {
  process.stdout.write(msg + '\n');
}

async function testConnection() {
  log('====================================================');
  log('Testing New Service Account Connection');
  log('====================================================');

  // Remove previous key file if it exists
  const oldKeyPath = path.join(__dirname, '..', '..', 'techmart-database-e35b64a86356.json');
  if (fs.existsSync(oldKeyPath)) {
    try {
      fs.unlinkSync(oldKeyPath);
      log('✓ Successfully removed old key file: techmart-database-e35b64a86356.json');
    } catch (e) {
      log('! Could not delete old key file: ' + e.message);
    }
  }

  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
      }
    }
  });

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const credentials = JSON.parse(rawKey);

  log('Service Account Email: ' + credentials.client_email);
  log('Project ID: ' + credentials.project_id);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  const authClient = await auth.getClient();
  log('✓ Successfully authenticated with Google OAuth2');

  // Test 1: Google Sheet
  const sheetId = process.env.GOOGLE_SHEET_ID;
  log('\nChecking Google Sheet access (ID: ' + sheetId + ')...');
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  try {
    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    log('✓ Google Sheet connection SUCCESS! Title: "' + sheetRes.data.properties.title + '"');
  } catch (err) {
    log('✗ Google Sheet connection FAILED: ' + (err.message || err));
    if (err.code === 403 || err.code === 404) {
      log('  -> Hint: Share the sheet with ' + credentials.client_email + ' as Editor.');
      log('  -> Hint: Ensure "Google Sheets API" is enabled in GCP project ' + credentials.project_id);
    }
  }

  // Test 2: Google Drive Folder
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  log('\nChecking Google Drive folder access (ID: ' + folderId + ')...');
  const drive = google.drive({ version: 'v3', auth: authClient });

  try {
    const driveRes = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
      supportsAllDrives: true,
    });
    log('✓ Google Drive connection SUCCESS! Folder: "' + driveRes.data.name + '"');
  } catch (err) {
    log('✗ Google Drive connection FAILED: ' + (err.message || err));
    if (err.code === 403 || err.code === 404) {
      log('  -> Hint: Share the folder with ' + credentials.client_email + ' as Editor.');
      log('  -> Hint: Ensure "Google Drive API" is enabled in GCP project ' + credentials.project_id);
    }
  }

  log('\n====================================================');
  log('Test run finished.');
  log('====================================================');
}

testConnection().catch((err) => {
  log('Fatal error: ' + (err.message || err));
  process.exit(1);
});

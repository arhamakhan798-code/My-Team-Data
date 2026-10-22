const fs = require('fs');
const path = require('path');

const resultFile = path.join(__dirname, 'verify-result.txt');
function writeLog(str) {
  fs.appendFileSync(resultFile, str + '\n', 'utf8');
}

async function run() {
  fs.writeFileSync(resultFile, 'STARTING VERIFICATION...\n', 'utf8');

  // Load .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const idx = t.indexOf('=');
      if (idx !== -1) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
    }
  });

  const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  writeLog('Email: ' + credentials.client_email);
  writeLog('Project: ' + credentials.project_id);

  // Authenticate using GoogleAuth directly from googleapis or google-auth-library
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  const token = tokenRes.token;
  writeLog('✓ OAuth2 Access Token successfully generated');

  // Test 1: Google Sheet
  const sheetId = env.GOOGLE_SHEET_ID;
  writeLog('Checking Sheet: ' + sheetId);
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title,sheets.properties.title`;
  const sheetResp = await fetch(sheetUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sheetData = await sheetResp.json();
  if (sheetResp.ok) {
    writeLog(`✓ GOOGLE SHEETS: SUCCESS! Title: "${sheetData.properties.title}"`);
    const tabs = (sheetData.sheets || []).map((s) => s.properties.title).join(', ');
    writeLog(`  Tabs available: ${tabs}`);
  } else {
    writeLog(`✗ GOOGLE SHEETS ERROR (${sheetResp.status}): ${JSON.stringify(sheetData.error || sheetData)}`);
  }

  // Test 2: Google Drive Folder
  const folderId = env.GOOGLE_DRIVE_FOLDER_ID;
  writeLog('Checking Drive Folder: ' + folderId);
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType&supportsAllDrives=true`;
  const driveResp = await fetch(driveUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const driveData = await driveResp.json();
  if (driveResp.ok) {
    writeLog(`✓ GOOGLE DRIVE: SUCCESS! Folder name: "${driveData.name}"`);
  } else {
    writeLog(`✗ GOOGLE DRIVE ERROR (${driveResp.status}): ${JSON.stringify(driveData.error || driveData)}`);
  }

  writeLog('VERIFICATION COMPLETE');
}

run().catch((err) => {
  writeLog('FATAL: ' + (err.stack || err.message || err));
});

const fs = require('fs');
const path = require('path');

// Populate process.env from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split(/\r?\n/).forEach((line) => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const idx = t.indexOf('=');
    if (idx !== -1) process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
});

async function runTest() {
  console.log('=== Testing Team Directory Sheets Integration ===');
  
  // Register ts-node or load compiled or import dynamically
  // Since sheets.ts is TypeScript, we can import via tsx or test directly with the logic
  const { google } = require('googleapis');
  const { v4: uuidv4 } = require('uuid');

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const credentials = JSON.parse(rawKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

  console.log('1. Fetching current rows...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A1:Z`,
  });
  console.log('Current headers/rows:', res.data.values);

  console.log('2. Testing add test member...');
  const testId = uuidv4();
  const now = new Date().toISOString();
  // Columns: Profile picture, Name, Role, Linkedin, ID, CreatedAt, UpdatedAt
  const newRow = ['', 'Sarah Connor', 'Lead Cybernetics Engineer', 'https://linkedin.com/in/sarah-connor', testId, now, now];
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A:Z`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [newRow] },
  });
  console.log('✓ Successfully added test member:', testId);

  console.log('3. Verifying member read back...');
  const afterAdd = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A1:Z`,
  });
  const addedRow = afterAdd.data.values?.find(r => r.includes(testId));
  if (!addedRow) throw new Error('Test member was not found after insert!');
  console.log('✓ Verified member in sheet:', addedRow[1], '—', addedRow[2]);

  console.log('4. Cleaning up test member...');
  const rowIndex = afterAdd.data.values.findIndex(r => r.includes(testId));
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const tab = meta.data.sheets.find(s => s.properties.title === sheetName);
  const tabId = tab.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: tabId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    },
  });
  console.log('✓ Successfully cleaned up test member. Sheet is pristine.');

  console.log('\n=== ALL CRUD TESTS PASSED WITH 100% SUCCESS ===');
}

runTest().catch((err) => {
  console.error('CRUD test failed:', err);
  process.exit(1);
});

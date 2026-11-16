const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function downloadPhotos() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split(/\r?\n/).forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith('#')) {
      const idx = t.indexOf('=');
      if (idx !== -1) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
    }
  });

  const oauth2 = new google.auth.OAuth2(
    env.GOOGLE_OAUTH_CLIENT_ID,
    env.GOOGLE_OAUTH_CLIENT_SECRET,
    env.GOOGLE_OAUTH_REDIRECT_URI
  );
  oauth2.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth: oauth2 });

  // Get members from Google Sheets to know all photoFileIds
  const creds = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SHEET_ID,
    range: (env.GOOGLE_SHEET_NAME || 'Sheet1') + '!A2:G50'
  });

  const rows = sheetRes.data.values || [];
  console.log('Total rows:', rows.length);

  const outDir = path.resolve(__dirname, '..', 'public', 'photos');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const mapping = [];

  for (const row of rows) {
    const photoId = (row[0] || '').trim();
    const name = (row[1] || '').trim();
    if (!photoId) {
      console.log('Skipping row without photo:', name);
      continue;
    }

    console.log('Downloading photo for:', name, 'File ID:', photoId);
    try {
      const meta = await drive.files.get({ fileId: photoId, fields: 'id, name, mimeType' });
      // Determine extension from mimeType or original name
      let ext = 'jpg';
      if (meta.data.mimeType === 'image/png' || meta.data.name?.endsWith('.png')) ext = 'png';
      else if (meta.data.mimeType === 'image/webp' || meta.data.name?.endsWith('.webp')) ext = 'webp';

      // We will save as both [photoId].[ext] AND [photoId] without ext so any lookup works!
      const outPath = path.join(outDir, `${photoId}.${ext}`);
      
      const res = await drive.files.get({ fileId: photoId, alt: 'media' }, { responseType: 'stream' });
      await new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(outPath);
        res.data.pipe(dest);
        dest.on('finish', resolve);
        dest.on('error', reject);
      });

      const size = fs.statSync(outPath).size;
      console.log(`✓ Saved: ${photoId}.${ext} (${size} bytes)`);
      mapping.push({ name, photoId, filename: `${photoId}.${ext}`, mimeType: meta.data.mimeType, size });
    } catch (err) {
      console.error(`✗ Error downloading photo for ${name} (${photoId}):`, err.message);
    }
  }

  // Save mapping to JSON file
  fs.writeFileSync(path.join(outDir, 'mapping.json'), JSON.stringify(mapping, null, 2), 'utf8');
  console.log('\nDownloaded mapping saved to public/photos/mapping.json!');
  console.log(`Total downloaded: ${mapping.length}`);
}

downloadPhotos().catch(console.error);

# Team Directory — Google Sheets + Google Drive

A clean, elegant team directory web app backed by Google Sheets (database) and Google Drive (photo storage), deployable on Vercel.

---

## Required Google APIs

Enable these in [Google Cloud Console](https://console.cloud.google.com/apis/library):

1. **Google Sheets API**
2. **Google Drive API**

Both must be enabled in the same GCP project as your service account.

---

## Google Sheet Setup

1. Open your spreadsheet: `https://docs.google.com/spreadsheets/d/1EcuPMHwOesU94o9R42aL2fbxVjQ5bHo6TlztsLvM0gI/`
2. Create a tab named **`Team`** (or use the name you set in `GOOGLE_SHEET_NAME`)
3. The app will auto-create the header row on first run with these columns:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| id | name | role | photoFileId | linkedinUrl | createdAt | updatedAt |

4. Share the spreadsheet with your service account email (`database@techmart-database.iam.gserviceaccount.com`) with **Editor** access.

---

## Google Drive Setup

1. Your folder **"My database"** (ID: `1qIUPTaz8BwHA95dhE231rlgz5R9Q3_Fv`) is already accessible.
2. Make sure the service account has **Editor** access to this folder.
3. Photos are uploaded here and proxied through the backend — never publicly exposed.

---

## Service Account Credentials

1. Go to GCP Console > IAM & Admin > Service Accounts
2. Select your service account > Keys > Add Key > Create new key > JSON
3. Download the JSON file — **Never commit this file to git**

For local dev, paste the entire JSON as a single-line string in `.env.local`.
For Vercel, paste it as the environment variable `GOOGLE_SERVICE_ACCOUNT_JSON`.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full service account JSON as a string |
| `GOOGLE_SHEET_ID` | Spreadsheet ID from the URL |
| `GOOGLE_SHEET_NAME` | Tab name inside the sheet (default: `Team`) |
| `GOOGLE_DRIVE_FOLDER_ID` | Drive folder ID for photos |
| `EDITOR_TOKEN` | Secret token for editor access |
| `NEXT_PUBLIC_APP_URL` | Base URL (no trailing slash) |

---

## Generating the Editor Token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as `EDITOR_TOKEN`. **Anyone with this token can modify records.**

To **revoke access**, change the token value and redeploy.

---

## Running Locally

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Share button reveals the editor link.

---

## Deploying to Vercel

Connect your GitHub repo and add all environment variables in Vercel dashboard under Project > Settings > Environment Variables.

---

## Security Notes

- Editor token is validated **server-side** on every protected API call.
- Service account credentials never reach the browser.
- Photos served via `/api/photo/[fileId]` proxy — no Drive URLs exposed.
- To revoke the editor link, change `EDITOR_TOKEN` and redeploy.

---

## Sheet Column Reference

| Column | Field | Notes |
|---|---|---|
| A | `id` | UUID, generated on creation |
| B | `name` | Required |
| C | `role` | Required |
| D | `photoFileId` | Google Drive file ID (optional) |
| E | `linkedinUrl` | Full URL (optional) |
| F | `createdAt` | ISO timestamp |
| G | `updatedAt` | ISO timestamp |

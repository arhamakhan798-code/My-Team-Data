import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/google';
import fs from 'fs';
import path from 'path';

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

  // 2. Local Photo Storage status
  const photosDir = path.join(process.cwd(), 'public', 'photos');
  let photoCount = 0;
  try {
    if (fs.existsSync(photosDir)) {
      photoCount = fs.readdirSync(photosDir).filter((f) => !f.endsWith('.json')).length;
    }
  } catch {
    // ignore
  }

  results.photoStorage = {
    status: 'READY',
    mode: 'Local Backend Storage',
    totalPhotos: photoCount,
  };

  return NextResponse.json(results);
}

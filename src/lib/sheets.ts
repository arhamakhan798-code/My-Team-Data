import { v4 as uuidv4 } from 'uuid';
import { getSheetsClient } from './google';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoFileId: string;
  linkedinUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ColumnMap {
  id: number;
  name: number;
  role: number;
  photoFileId: number;
  linkedinUrl: number;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_HEADER = [
  'Profile picture',
  'Name',
  'Role',
  'Linkedin',
  'ID',
  'CreatedAt',
  'UpdatedAt',
];

/**
 * Resolves the target sheet tab name and sheet ID.
 */
async function resolveSheetInfo(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>
): Promise<{ name: string; id: number }> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheetsList = meta.data.sheets || [];
  if (sheetsList.length === 0) {
    throw new Error('Spreadsheet contains no sheets or tabs');
  }

  const preferred = process.env.GOOGLE_SHEET_NAME;
  if (preferred) {
    const match = sheetsList.find(
      (s) => s.properties?.title?.toLowerCase() === preferred.toLowerCase()
    );
    if (match?.properties?.title && match.properties.sheetId != null) {
      return { name: match.properties.title, id: match.properties.sheetId };
    }
  }

  const first = sheetsList[0];
  return {
    name: first.properties?.title || 'Sheet1',
    id: first.properties?.sheetId ?? 0,
  };
}

/**
 * Reads and ensures headers exist in the sheet, returning the resolved ColumnMap.
 */
async function getOrCreateColumnMap(
  sheets: Awaited<ReturnType<typeof getSheetsClient>>,
  sheetName: string
): Promise<ColumnMap> {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A1:Z1`,
  });

  let headers: string[] = (resp.data.values?.[0] as string[]) || [];

  if (headers.length === 0) {
    // Empty sheet: write default headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${sheetName}'!A1:G1`,
      valueInputOption: 'RAW',
      requestBody: { values: [DEFAULT_HEADER] },
    });
    headers = DEFAULT_HEADER;
  }

  // Find column indices
  let colId = headers.findIndex((h) => /^id$/i.test(h.trim()));
  const colName = headers.findIndex((h) => /name/i.test(h.trim()));
  const colRole = headers.findIndex((h) => /role/i.test(h.trim()));
  const colPhoto = headers.findIndex((h) => /photo|picture|avatar|image/i.test(h.trim()));
  const colLinkedin = headers.findIndex((h) => /linkedin/i.test(h.trim()));
  let colCreated = headers.findIndex((h) => /created/i.test(h.trim()));
  let colUpdated = headers.findIndex((h) => /updated/i.test(h.trim()));

  // If ID column is missing, append ID, CreatedAt, UpdatedAt columns to row 1
  if (colId === -1) {
    colId = headers.length;
    colCreated = headers.length + 1;
    colUpdated = headers.length + 2;
    headers.push('ID', 'CreatedAt', 'UpdatedAt');

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${sheetName}'!A1:Z1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }

  return {
    id: colId,
    name: colName !== -1 ? colName : 1,
    role: colRole !== -1 ? colRole : 2,
    photoFileId: colPhoto !== -1 ? colPhoto : 0,
    linkedinUrl: colLinkedin !== -1 ? colLinkedin : 3,
    createdAt: colCreated !== -1 ? colCreated : 5,
    updatedAt: colUpdated !== -1 ? colUpdated : 6,
  };
}

function parseRow(row: string[], colMap: ColumnMap, fallbackIndex: number): TeamMember {
  const id = row[colMap.id] || `row-${fallbackIndex}`;
  const name = row[colMap.name] || '';
  const role = row[colMap.role] || '';
  const photoFileId = row[colMap.photoFileId] || '';
  const linkedinUrl = row[colMap.linkedinUrl] || '';
  const createdAt = row[colMap.createdAt] || '';
  const updatedAt = row[colMap.updatedAt] || '';

  return { id, name, role, photoFileId, linkedinUrl, createdAt, updatedAt };
}

export async function getAllMembers(): Promise<TeamMember[]> {
  const sheets = await getSheetsClient();
  const { name: sheetName } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A2:Z`,
  });

  const rows = resp.data.values || [];
  return rows
    .map((r, idx) => parseRow(r, colMap, idx + 2))
    .filter((m) => m.name.trim().length > 0);
}

export async function addMember(
  data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TeamMember> {
  const sheets = await getSheetsClient();
  const { name: sheetName } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const id = uuidv4();
  const now = new Date().toISOString();

  // Find max column index needed
  const maxCol = Math.max(
    colMap.id,
    colMap.name,
    colMap.role,
    colMap.photoFileId,
    colMap.linkedinUrl,
    colMap.createdAt,
    colMap.updatedAt
  );

  const rowData: string[] = new Array(maxCol + 1).fill('');
  rowData[colMap.id] = id;
  rowData[colMap.name] = data.name;
  rowData[colMap.role] = data.role;
  rowData[colMap.photoFileId] = data.photoFileId || '';
  rowData[colMap.linkedinUrl] = data.linkedinUrl || '';
  rowData[colMap.createdAt] = now;
  rowData[colMap.updatedAt] = now;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A:Z`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [rowData] },
  });

  return {
    id,
    name: data.name,
    role: data.role,
    photoFileId: data.photoFileId || '',
    linkedinUrl: data.linkedinUrl || '',
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateMember(
  id: string,
  data: Partial<Omit<TeamMember, 'id' | 'createdAt'>>
): Promise<TeamMember> {
  const sheets = await getSheetsClient();
  const { name: sheetName } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A:Z`,
  });
  const rows = resp.data.values || [];

  // row 0 is header; search data rows
  const rowIndex = rows.findIndex((r, i) => i > 0 && (r[colMap.id] === id || `row-${i + 1}` === id));
  if (rowIndex === -1) throw new Error(`Member with ID ${id} not found`);

  const existingRow = [...rows[rowIndex]];
  const existing = parseRow(existingRow, colMap, rowIndex + 1);

  const updated: TeamMember = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  const maxCol = Math.max(
    existingRow.length - 1,
    colMap.id,
    colMap.name,
    colMap.role,
    colMap.photoFileId,
    colMap.linkedinUrl,
    colMap.updatedAt
  );

  const rowData: string[] = new Array(maxCol + 1).fill('');
  for (let i = 0; i < existingRow.length; i++) {
    rowData[i] = existingRow[i] || '';
  }

  rowData[colMap.id] = id;
  if (data.name !== undefined) rowData[colMap.name] = data.name;
  if (data.role !== undefined) rowData[colMap.role] = data.role;
  if (data.photoFileId !== undefined) rowData[colMap.photoFileId] = data.photoFileId;
  if (data.linkedinUrl !== undefined) rowData[colMap.linkedinUrl] = data.linkedinUrl;
  rowData[colMap.updatedAt] = updated.updatedAt;

  const sheetRow = rowIndex + 1; // 1-indexed
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [rowData] },
  });

  return updated;
}

export async function deleteMember(id: string): Promise<void> {
  const sheets = await getSheetsClient();
  const { name: sheetName, id: sheetId } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A:Z`,
  });
  const rows = resp.data.values || [];
  const rowIndex = rows.findIndex((r, i) => i > 0 && (r[colMap.id] === id || `row-${i + 1}` === id));
  if (rowIndex === -1) throw new Error(`Member with ID ${id} not found`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
}

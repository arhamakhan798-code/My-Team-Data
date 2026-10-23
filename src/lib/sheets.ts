import { v4 as uuidv4 } from 'uuid';
import { getSheetsClient } from './google';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const FIELDS_SHEET_NAME = '_fields';

export interface CustomField {
  key: string;
  label: string;
  required: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoFileId: string;
  linkedinUrl: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, string>;
}

interface ColumnMap {
  id: number;
  name: number;
  role: number;
  photoFileId: number;
  linkedinUrl: number;
  createdAt: number;
  updatedAt: number;
  customColMap: Record<string, number>;
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
  sheets: ReturnType<typeof getSheetsClient>
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

  const first = sheetsList.find((s) => s.properties?.title !== FIELDS_SHEET_NAME) || sheetsList[0];
  return {
    name: first.properties?.title || 'Sheet1',
    id: first.properties?.sheetId ?? 0,
  };
}

/**
 * Reads and ensures headers exist in the sheet, returning the resolved ColumnMap.
 */
async function getOrCreateColumnMap(
  sheets: ReturnType<typeof getSheetsClient>,
  sheetName: string
): Promise<ColumnMap> {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A1:ZZ1`,
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
    headers = [...DEFAULT_HEADER];
  }

  // Find standard column indices
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
      range: `'${sheetName}'!A1:ZZ1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }

  const standardIndices = new Set([
    colId,
    colName,
    colRole,
    colPhoto,
    colLinkedin,
    colCreated,
    colUpdated,
  ]);

  const customColMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    if (!standardIndices.has(idx) && h && h.trim()) {
      const key = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      customColMap[key] = idx;
    }
  });

  return {
    id: colId,
    name: colName !== -1 ? colName : 1,
    role: colRole !== -1 ? colRole : 2,
    photoFileId: colPhoto !== -1 ? colPhoto : 0,
    linkedinUrl: colLinkedin !== -1 ? colLinkedin : 3,
    createdAt: colCreated !== -1 ? colCreated : 5,
    updatedAt: colUpdated !== -1 ? colUpdated : 6,
    customColMap,
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

  const customFields: Record<string, string> = {};
  for (const [key, colIdx] of Object.entries(colMap.customColMap)) {
    customFields[key] = row[colIdx] || '';
  }

  return { id, name, role, photoFileId, linkedinUrl, createdAt, updatedAt, customFields };
}

export async function getAllMembers(): Promise<TeamMember[]> {
  const sheets = getSheetsClient();
  const { name: sheetName } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A2:ZZ`,
  });

  const rows = resp.data.values || [];
  return rows
    .map((r, idx) => parseRow(r, colMap, idx + 2))
    .filter((m) => m.name.trim().length > 0);
}

export async function addMember(
  data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TeamMember> {
  const sheets = getSheetsClient();
  const { name: sheetName } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const id = uuidv4();
  const now = new Date().toISOString();

  let maxCol = Math.max(
    colMap.id,
    colMap.name,
    colMap.role,
    colMap.photoFileId,
    colMap.linkedinUrl,
    colMap.createdAt,
    colMap.updatedAt
  );

  for (const idx of Object.values(colMap.customColMap)) {
    if (idx > maxCol) maxCol = idx;
  }

  const rowData: string[] = new Array(maxCol + 1).fill('');
  rowData[colMap.id] = id;
  rowData[colMap.name] = data.name;
  rowData[colMap.role] = data.role;
  rowData[colMap.photoFileId] = data.photoFileId || '';
  rowData[colMap.linkedinUrl] = data.linkedinUrl || '';
  rowData[colMap.createdAt] = now;
  rowData[colMap.updatedAt] = now;

  if (data.customFields) {
    for (const [key, val] of Object.entries(data.customFields)) {
      const colIdx = colMap.customColMap[key];
      if (colIdx != null) {
        rowData[colIdx] = val || '';
      }
    }
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A:ZZ`,
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
    customFields: data.customFields || {},
  };
}

export async function updateMember(
  id: string,
  data: Partial<Omit<TeamMember, 'id' | 'createdAt'>>
): Promise<TeamMember> {
  const sheets = getSheetsClient();
  const { name: sheetName } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A:ZZ`,
  });
  const rows = resp.data.values || [];

  const rowIndex = rows.findIndex((r, i) => i > 0 && (r[colMap.id] === id || `row-${i + 1}` === id));
  if (rowIndex === -1) throw new Error(`Member with ID ${id} not found`);

  const existingRow = [...rows[rowIndex]];
  const existing = parseRow(existingRow, colMap, rowIndex + 1);

  const updated: TeamMember = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
    customFields: {
      ...(existing.customFields || {}),
      ...(data.customFields || {}),
    },
  };

  let maxCol = Math.max(
    existingRow.length - 1,
    colMap.id,
    colMap.name,
    colMap.role,
    colMap.photoFileId,
    colMap.linkedinUrl,
    colMap.updatedAt
  );

  for (const idx of Object.values(colMap.customColMap)) {
    if (idx > maxCol) maxCol = idx;
  }

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

  if (updated.customFields) {
    for (const [key, val] of Object.entries(updated.customFields)) {
      const colIdx = colMap.customColMap[key];
      if (colIdx != null) {
        rowData[colIdx] = val || '';
      }
    }
  }

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
  const sheets = getSheetsClient();
  const { name: sheetName, id: sheetId } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A:ZZ`,
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

/**
 * Reorders rows in the spreadsheet so members match orderedIds order.
 */
export async function reorderMembers(orderedIds: string[]): Promise<void> {
  const sheets = getSheetsClient();
  const { name: sheetName } = await resolveSheetInfo(sheets);
  const colMap = await getOrCreateColumnMap(sheets, sheetName);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A2:ZZ`,
  });
  const rows = resp.data.values || [];
  if (rows.length === 0) return;

  const rowMap = new Map<string, string[]>();
  rows.forEach((r, idx) => {
    const id = r[colMap.id] || `row-${idx + 2}`;
    rowMap.set(id, r);
  });

  const reordered: string[][] = [];
  const visited = new Set<string>();

  for (const id of orderedIds) {
    const row = rowMap.get(id);
    if (row) {
      reordered.push(row);
      visited.add(id);
    }
  }

  // Any remaining rows
  rows.forEach((r, idx) => {
    const id = r[colMap.id] || `row-${idx + 2}`;
    if (!visited.has(id)) {
      reordered.push(r);
    }
  });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A2:ZZ${rows.length + 5}`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${sheetName}'!A2`,
    valueInputOption: 'RAW',
    requestBody: { values: reordered },
  });
}

/**
 * Custom Fields schema management
 */
export async function getCustomFields(): Promise<CustomField[]> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheetsList = meta.data.sheets || [];
  const fieldsSheet = sheetsList.find(
    (s) => s.properties?.title?.toLowerCase() === FIELDS_SHEET_NAME.toLowerCase()
  );

  if (!fieldsSheet) {
    return [];
  }

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${FIELDS_SHEET_NAME}'!A2:C`,
  });

  const rows = resp.data.values || [];
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({
      key: r[0],
      label: r[1],
      required: String(r[2]).toLowerCase() === 'true',
    }));
}

export async function addCustomField(field: CustomField): Promise<CustomField> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheetsList = meta.data.sheets || [];
  const fieldsSheet = sheetsList.find(
    (s) => s.properties?.title?.toLowerCase() === FIELDS_SHEET_NAME.toLowerCase()
  );

  if (!fieldsSheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: FIELDS_SHEET_NAME },
            },
          },
        ],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${FIELDS_SHEET_NAME}'!A1:C1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['Key', 'Label', 'Required']] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `'${FIELDS_SHEET_NAME}'!A:C`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[field.key, field.label, field.required ? 'true' : 'false']],
    },
  });

  // Ensure column header exists in main sheet
  const { name: mainSheetName } = await resolveSheetInfo(sheets);
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${mainSheetName}'!A1:ZZ1`,
  });
  const headers: string[] = (resp.data.values?.[0] as string[]) || [];
  const exists = headers.some((h) => h.trim().toLowerCase() === field.label.trim().toLowerCase());
  if (!exists) {
    headers.push(field.label);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${mainSheetName}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }

  return field;
}

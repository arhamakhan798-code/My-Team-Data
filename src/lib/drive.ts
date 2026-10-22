import { getDriveClient } from './google';
import { Readable } from 'stream';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

/**
 * Extracts a Google Drive file ID from a raw ID or full Drive share URL.
 */
export function extractDriveFileId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // e.g. https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  return trimmed;
}

export async function uploadPhoto(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const drive = await getDriveClient();
  const stream = Readable.from(buffer);

  // Safe filename sanitization
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'photo.jpg';

  const requestBody: { name: string; parents?: string[] } = {
    name: safeFilename,
  };

  if (FOLDER_ID && FOLDER_ID.trim()) {
    requestBody.parents = [FOLDER_ID.trim()];
  }

  try {
    const res = await drive.files.create({
      requestBody,
      media: {
        mimeType: mimeType || 'image/jpeg',
        body: stream,
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const fileId = res.data.id!;
    return fileId;
  } catch (err: unknown) {
    const errorMsg = (err as Error).message || '';
    // If target parent folder was not found or lacks drive.file permissions, fallback to Drive root
    if (
      requestBody.parents &&
      (errorMsg.includes('File not found') ||
        errorMsg.includes('insufficientFilePermissions') ||
        (err as { code?: number }).code === 404 ||
        (err as { code?: number }).code === 403)
    ) {
      console.warn(
        `Could not upload to target folder ${FOLDER_ID} (${errorMsg}). Falling back to root directory...`
      );
      const fallbackStream = Readable.from(buffer);
      const fallbackRes = await drive.files.create({
        requestBody: { name: safeFilename },
        media: {
          mimeType: mimeType || 'image/jpeg',
          body: fallbackStream,
        },
        fields: 'id',
        supportsAllDrives: true,
      });
      return fallbackRes.data.id!;
    }
    throw err;
  }
}

export async function deletePhoto(fileIdOrUrl: string): Promise<void> {
  const fileId = extractDriveFileId(fileIdOrUrl);
  if (!fileId) return;
  const drive = await getDriveClient();
  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } catch (err: unknown) {
    // File might already be deleted or outside Drive; log but don't crash
    console.warn(`Could not delete photo ${fileId}:`, (err as Error).message);
  }
}

export async function getPhotoStream(fileIdOrUrl: string) {
  const fileId = extractDriveFileId(fileIdOrUrl);
  const drive = await getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' }
  );
  return {
    stream: res.data as NodeJS.ReadableStream,
    contentType: (res.headers['content-type'] as string) || 'image/jpeg',
  };
}

import fs from 'fs';
import path from 'path';

interface MappingItem {
  photoId: string;
  filename: string;
  mimeType: string;
}

let cachedMapping: Map<string, string> | null = null;

function getMapping(): Map<string, string> {
  if (cachedMapping) return cachedMapping;
  cachedMapping = new Map();
  try {
    const mappingPath = path.join(process.cwd(), 'public', 'photos', 'mapping.json');
    if (fs.existsSync(mappingPath)) {
      const items: MappingItem[] = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      for (const item of items) {
        if (item.photoId && item.filename) {
          cachedMapping.set(item.photoId, item.filename);
        }
      }
    }
  } catch {
    // ignore
  }
  return cachedMapping;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

/**
 * Searches for a photo by id or filename in public/photos and /tmp/photos
 */
export async function getPhotoBuffer(
  photoIdOrUrl: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!photoIdOrUrl) return null;

  const rawId = photoIdOrUrl.trim();
  // Strip any leading query string or URL parts if any
  const photoId = rawId.split('?')[0].split('/').pop() || rawId;

  const searchDirs = [
    path.join(process.cwd(), 'public', 'photos'),
    path.join('/tmp', 'photos'),
    path.join(process.cwd(), 'public'),
  ];

  // 1. Check mapping
  const mapping = getMapping();
  const mappedFilename = mapping.get(photoId);

  const candidates: string[] = [];
  if (mappedFilename) {
    candidates.push(mappedFilename);
  }
  candidates.push(
    photoId,
    `${photoId}.png`,
    `${photoId}.jpg`,
    `${photoId}.jpeg`,
    `${photoId}.webp`
  );

  for (const dir of searchDirs) {
    for (const candidate of candidates) {
      try {
        const fullPath = path.join(dir, candidate);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          const buffer = fs.readFileSync(fullPath);
          const contentType = getContentType(fullPath);
          return { buffer, contentType };
        }
      } catch {
        // ignore error and continue searching
      }
    }
  }

  return null;
}

/**
 * Uploads a photo locally to public/photos (or /tmp/photos in serverless environments)
 */
export async function uploadPhoto(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_') || 'photo.jpg';
  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
    ? 'webp'
    : 'jpg';

  const baseName = path.basename(safeFilename, path.extname(safeFilename));
  const uniqueName = `${Date.now()}_${baseName}.${ext}`;

  // Try writing to public/photos first (works locally and in containerized setups)
  const primaryDir = path.join(process.cwd(), 'public', 'photos');
  const fallbackDir = path.join('/tmp', 'photos');

  let targetDir = primaryDir;
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    fs.writeFileSync(path.join(primaryDir, uniqueName), buffer);
  } catch {
    // If primaryDir is read-only (e.g. Vercel serverless), write to /tmp/photos
    targetDir = fallbackDir;
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    fs.writeFileSync(path.join(fallbackDir, uniqueName), buffer);
  }

  // Update cached mapping
  const mapping = getMapping();
  mapping.set(uniqueName, uniqueName);

  return uniqueName;
}

/**
 * Deletes a photo from disk
 */
export async function deletePhoto(photoIdOrUrl: string): Promise<void> {
  if (!photoIdOrUrl) return;
  const rawId = photoIdOrUrl.trim().split('?')[0].split('/').pop() || photoIdOrUrl;

  const searchDirs = [
    path.join(process.cwd(), 'public', 'photos'),
    path.join('/tmp', 'photos'),
  ];

  const mapping = getMapping();
  const mappedFilename = mapping.get(rawId) || rawId;

  const candidates = [
    mappedFilename,
    rawId,
    `${rawId}.png`,
    `${rawId}.jpg`,
    `${rawId}.jpeg`,
    `${rawId}.webp`,
  ];

  for (const dir of searchDirs) {
    for (const c of candidates) {
      try {
        const fullPath = path.join(dir, c);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // ignore
      }
    }
  }
}

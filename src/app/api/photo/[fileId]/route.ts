import { NextRequest, NextResponse } from 'next/server';
import { getPhotoBuffer } from '@/lib/photos';

export const dynamic = 'force-dynamic';

// GET /api/photo/[fileId] — serves member photo directly from backend static storage
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> | { fileId: string } }
) {
  const rawParams = await Promise.resolve(params);
  const fileId = rawParams.fileId ? decodeURIComponent(rawParams.fileId).trim() : '';

  if (!fileId) {
    return new NextResponse('Missing fileId', { status: 400 });
  }

  try {
    const photo = await getPhotoBuffer(fileId);

    if (!photo) {
      return new NextResponse('Photo not found', { status: 404 });
    }

    return new NextResponse(photo.buffer, {
      headers: {
        'Content-Type': photo.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: unknown) {
    console.error(`GET /api/photo/${fileId} error:`, err);
    return new NextResponse('Photo not found', { status: 404 });
  }
}

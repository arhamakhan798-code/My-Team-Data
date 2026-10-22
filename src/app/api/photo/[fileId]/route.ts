import { NextRequest, NextResponse } from 'next/server';
import { getPhotoStream, extractDriveFileId } from '@/lib/drive';
import { Readable } from 'stream';

// GET /api/photo/[fileId] — proxy Drive photo through backend
// This keeps Drive files private and avoids exposing service account credentials.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> | { fileId: string } }
) {
  const rawParams = await Promise.resolve(params);
  const fileId = extractDriveFileId(rawParams.fileId);

  if (!fileId) {
    return new NextResponse('Missing fileId', { status: 400 });
  }

  try {
    const { stream, contentType } = await getPhotoStream(fileId);

    // Convert Node Readable to Web ReadableStream
    let webStream: ReadableStream;
    if (typeof (Readable as unknown as { toWeb: (s: NodeJS.ReadableStream) => ReadableStream }).toWeb === 'function') {
      webStream = (Readable as unknown as { toWeb: (s: NodeJS.ReadableStream) => ReadableStream }).toWeb(stream);
    } else {
      webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk: Buffer) => {
            try {
              controller.enqueue(chunk);
            } catch {
              // controller may be closed if client disconnected
            }
          });
          stream.on('end', () => {
            try {
              controller.close();
            } catch {
              // ignore
            }
          });
          stream.on('error', (err) => {
            try {
              controller.error(err);
            } catch {
              // ignore
            }
          });
        },
        cancel() {
          if ('destroy' in stream && typeof stream.destroy === 'function') {
            stream.destroy();
          }
        },
      });
    }

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: unknown) {
    console.error(`GET /api/photo/${fileId} error:`, err);
    return new NextResponse('Photo not found', { status: 404 });
  }
}

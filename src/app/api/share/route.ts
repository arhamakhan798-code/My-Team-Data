import { NextRequest, NextResponse } from 'next/server';
import { requireEditorToken } from '@/lib/auth';

// GET /api/share — get the current editor link (requires existing editor token to view)
export async function GET(req: NextRequest) {
  const authError = requireEditorToken(req);
  if (authError) return authError;

  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || '';
  const token = process.env.EDITOR_TOKEN || '';
  const editorLink = `${origin}/?token=${token}`;

  return NextResponse.json({
    editorLink,
    token,
    warning:
      'Anyone with this link can add, edit, and delete directory entries. Share carefully.',
  });
}

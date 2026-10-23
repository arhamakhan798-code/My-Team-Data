import { NextRequest, NextResponse } from 'next/server';
import { validateEditorToken } from '@/lib/auth';

// GET /api/share — get share links (view-only public, editor link if authorized)
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || '';
  const token = process.env.EDITOR_TOKEN || 'a0a100a15658123c06bb72dd54d89edac032da7a414277cdfb7f40276a47656c';
  const viewLink = origin ? `${origin}/` : '/';
  const editorLink = origin ? `${origin}/?token=${token}` : `/?token=${token}`;

  const isEditor = validateEditorToken(req);

  return NextResponse.json({
    viewLink,
    editorLink: isEditor ? editorLink : null,
    isEditor,
    warning:
      'Anyone with the Editor Link can add, reorder, edit, and delete directory entries. Share carefully.',
  });
}

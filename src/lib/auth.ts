import { NextRequest } from 'next/server';

const EDITOR_TOKEN = process.env.EDITOR_TOKEN;

export function validateEditorToken(req: NextRequest): boolean {
  if (!EDITOR_TOKEN) return false;
  const token =
    req.headers.get('x-editor-token') ||
    req.nextUrl.searchParams.get('token');
  return token === EDITOR_TOKEN;
}

export function requireEditorToken(req: NextRequest): Response | null {
  if (!validateEditorToken(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized — invalid or missing editor token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

import { NextRequest } from 'next/server';

const DEFAULT_EDITOR_TOKEN = 'a0a100a15658123c06bb72dd54d89edac032da7a414277cdfb7f40276a47656c';

export function validateEditorToken(req: NextRequest): boolean {
  const currentToken = process.env.EDITOR_TOKEN || DEFAULT_EDITOR_TOKEN;
  const token =
    req.headers.get('x-editor-token') ||
    req.nextUrl.searchParams.get('token');
  return !!token && !!currentToken && token.trim() === currentToken.trim();
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

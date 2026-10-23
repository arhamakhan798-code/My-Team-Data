import { NextRequest, NextResponse } from 'next/server';
import { validateEditorToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.token as string || '').trim();

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Access key is required' },
        { status: 400 }
      );
    }

    const testReq = new NextRequest(req.url, {
      headers: { 'x-editor-token': token },
    });

    const isValid = validateEditorToken(testReq);

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: 'Incorrect secret access key' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    console.error('Verify error:', err);
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

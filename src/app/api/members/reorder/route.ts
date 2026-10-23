import { NextRequest, NextResponse } from 'next/server';
import { reorderMembers } from '@/lib/sheets';
import { requireEditorToken } from '@/lib/auth';

// POST /api/members/reorder — save reordered member IDs (requires editor token)
export async function POST(req: NextRequest) {
  const authError = requireEditorToken(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const memberIds = body.memberIds as string[];

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'memberIds array is required' }, { status: 400 });
    }

    await reorderMembers(memberIds);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('POST /api/members/reorder error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to reorder members' },
      { status: 500 }
    );
  }
}

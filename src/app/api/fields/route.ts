import { NextRequest, NextResponse } from 'next/server';
import { getCustomFields, addCustomField } from '@/lib/sheets';
import { requireEditorToken } from '@/lib/auth';

// GET /api/fields — list custom fields
export async function GET() {
  try {
    const fields = await getCustomFields();
    return NextResponse.json({ fields });
  } catch (err: unknown) {
    console.error('GET /api/fields error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch fields' },
      { status: 500 }
    );
  }
}

// POST /api/fields — create a custom field (requires editor token)
export async function POST(req: NextRequest) {
  const authError = requireEditorToken(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const label = (body.label as string || '').trim();
    const required = Boolean(body.required);

    if (!label) {
      return NextResponse.json({ error: 'Field label is required' }, { status: 400 });
    }

    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (!key) {
      return NextResponse.json({ error: 'Invalid field label' }, { status: 400 });
    }

    const field = await addCustomField({
      key,
      label,
      required,
    });

    return NextResponse.json({ field }, { status: 201 });
  } catch (err: unknown) {
    console.error('POST /api/fields error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to add field' },
      { status: 500 }
    );
  }
}

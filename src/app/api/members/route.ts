import { NextRequest, NextResponse } from 'next/server';
import { getAllMembers, addMember } from '@/lib/sheets';
import { uploadPhoto } from '@/lib/drive';
import { requireEditorToken } from '@/lib/auth';

// GET /api/members — list all members (public read)
export async function GET() {
  try {
    const members = await getAllMembers();
    return NextResponse.json({ members });
  } catch (err: unknown) {
    console.error('GET /api/members error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/members — add a new member (requires editor token)
export async function POST(req: NextRequest) {
  const authError = requireEditorToken(req);
  if (authError) return authError;

  try {
    const contentType = req.headers.get('content-type') || '';
    let name = '';
    let role = '';
    let linkedinUrl = '';
    let photoFileId = '';
    let customFields: Record<string, string> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      name = (formData.get('name') as string) || '';
      role = (formData.get('role') as string) || '';
      linkedinUrl = (formData.get('linkedinUrl') as string) || '';

      const customFieldsJson = formData.get('customFields') as string;
      if (customFieldsJson) {
        try {
          customFields = JSON.parse(customFieldsJson);
        } catch {
          // ignore
        }
      }

      const photo = formData.get('photo') as File | null;
      if (photo && photo.size > 0) {
        const buffer = Buffer.from(await photo.arrayBuffer());
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'photo';
        const ext = photo.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
        const filename = `${safeName}_${Date.now()}.${ext}`;
        photoFileId = await uploadPhoto(buffer, photo.type || 'image/jpeg', filename);
      }
    } else {
      const body = await req.json();
      name = body.name || '';
      role = body.role || '';
      linkedinUrl = body.linkedinUrl || '';
      photoFileId = body.photoFileId || '';
      customFields = body.customFields || {};
    }

    if (!name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!role.trim()) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }
    if (!linkedinUrl.trim()) {
      return NextResponse.json({ error: 'LinkedIn URL is required' }, { status: 400 });
    }

    // Normalize LinkedIn URL
    let formattedLinkedin = linkedinUrl.trim();
    if (formattedLinkedin && !/^https?:\/\//i.test(formattedLinkedin)) {
      formattedLinkedin = 'https://' + formattedLinkedin;
    }

    const member = await addMember({
      name: name.trim(),
      role: role.trim(),
      linkedinUrl: formattedLinkedin,
      photoFileId,
      customFields,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err: unknown) {
    console.error('POST /api/members error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to add member' },
      { status: 500 }
    );
  }
}

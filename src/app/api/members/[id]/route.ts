import { NextRequest, NextResponse } from 'next/server';
import { updateMember, deleteMember, getAllMembers } from '@/lib/sheets';
import { uploadPhoto, deletePhoto } from '@/lib/drive';
import { requireEditorToken } from '@/lib/auth';

// PATCH /api/members/[id] — update a member
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const authError = requireEditorToken(req);
  if (authError) return authError;

  const { id } = await Promise.resolve(params);

  try {
    const contentType = req.headers.get('content-type') || '';
    let name: string | undefined;
    let role: string | undefined;
    let linkedinUrl: string | undefined;
    let newPhotoFileId: string | undefined;
    let removePhoto = false;
    let customFields: Record<string, string> | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      name = (formData.get('name') as string) || undefined;
      role = (formData.get('role') as string) || undefined;
      linkedinUrl = (formData.get('linkedinUrl') as string) ?? undefined;
      removePhoto = formData.get('removePhoto') === 'true';

      const photo = formData.get('photo') as File | null;
      if (photo && photo.size > 0) {
        // Delete previous photo from Drive
        const members = await getAllMembers();
        const existing = members.find((m) => m.id === id);
        if (existing?.photoFileId) {
          await deletePhoto(existing.photoFileId);
        }
        const buffer = Buffer.from(await photo.arrayBuffer());
        const safeName = (name || 'photo').replace(/[^a-zA-Z0-9_-]/g, '_');
        const ext = photo.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
        const filename = `${safeName}_${Date.now()}.${ext}`;
        newPhotoFileId = await uploadPhoto(buffer, photo.type || 'image/jpeg', filename);
      } else if (removePhoto) {
        const members = await getAllMembers();
        const existing = members.find((m) => m.id === id);
        if (existing?.photoFileId) {
          await deletePhoto(existing.photoFileId);
        }
        newPhotoFileId = '';
      }
      const customFieldsJson = formData.get('customFields') as string;
      if (customFieldsJson) {
        try {
          customFields = JSON.parse(customFieldsJson);
        } catch {}
      }
    } else {
      const body = await req.json();
      name = body.name;
      role = body.role;
      linkedinUrl = body.linkedinUrl;
      newPhotoFileId = body.photoFileId;
      customFields = body.customFields;
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (role !== undefined && !role.trim()) {
      return NextResponse.json({ error: 'Role cannot be empty' }, { status: 400 });
    }
    if (linkedinUrl !== undefined && !linkedinUrl.trim()) {
      return NextResponse.json({ error: 'LinkedIn URL cannot be empty' }, { status: 400 });
    }

    const updates: Partial<Parameters<typeof updateMember>[1]> = {};
    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role.trim();
    if (linkedinUrl !== undefined) {
      let formatted = linkedinUrl.trim();
      if (formatted && !/^https?:\/\//i.test(formatted)) {
        formatted = 'https://' + formatted;
      }
      updates.linkedinUrl = formatted;
    }
    if (newPhotoFileId !== undefined) updates.photoFileId = newPhotoFileId;
    if (customFields !== undefined) updates.customFields = customFields;

    const updated = await updateMember(id, updates);
    return NextResponse.json({ member: updated });
  } catch (err: unknown) {
    console.error(`PATCH /api/members/${id} error:`, err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id] — delete a member and their photo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const authError = requireEditorToken(req);
  if (authError) return authError;

  const { id } = await Promise.resolve(params);

  try {
    const members = await getAllMembers();
    const member = members.find((m) => m.id === id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await deleteMember(id);

    // Clean up photo from Drive (best-effort)
    if (member.photoFileId) {
      await deletePhoto(member.photoFileId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error(`DELETE /api/members/${id} error:`, err);
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to delete member' },
      { status: 500 }
    );
  }
}

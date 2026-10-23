'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

export interface CustomField {
  key: string;
  label: string;
  required: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoFileId: string;
  linkedinUrl: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, string>;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function getPhotoUrl(photoFileId: string): string {
  if (!photoFileId) return '';
  if (photoFileId.startsWith('http://') || photoFileId.startsWith('https://')) {
    return photoFileId;
  }
  return `/api/photo/${encodeURIComponent(photoFileId)}`;
}

async function downloadPhoto(photoUrl: string, memberName: string) {
  if (!photoUrl) return;
  try {
    const res = await fetch(photoUrl);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    const safeName = (memberName || 'team_member').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}_photo.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download failed:', err);
    window.open(photoUrl, '_blank');
  }
}

/* ================================================
   Toast Component
   ================================================ */
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  useEffect(() => {
    toasts.forEach((t) => {
      const timer = setTimeout(() => onRemove(t.id), 3500);
      return () => clearTimeout(timer);
    });
  }, [toasts, onRemove]);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ================================================
   Avatar Component
   ================================================ */
function Avatar({
  member,
  onOpenLightbox,
}: {
  member: TeamMember;
  onOpenLightbox?: (member: TeamMember) => void;
}) {
  const [failed, setFailed] = useState(false);
  const initials =
    member.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const photoUrl = getPhotoUrl(member.photoFileId);

  if (!photoUrl || failed) {
    return <div className="member-avatar-placeholder">{initials}</div>;
  }

  return (
    <img
      src={photoUrl}
      alt={member.name}
      className="member-avatar"
      onError={() => setFailed(true)}
      loading="lazy"
      title="Click to view large picture"
      onClick={(e) => {
        if (onOpenLightbox) {
          e.stopPropagation();
          onOpenLightbox(member);
        }
      }}
    />
  );
}

/* ================================================
   Icons
   ================================================ */
function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ================================================
   Lightbox Modal (Requirement: Big Picture & Download)
   ================================================ */
interface LightboxModalProps {
  member: TeamMember;
  isEditor: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function LightboxModal({ member, isEditor, onClose, onToast }: LightboxModalProps) {
  const photoUrl = getPhotoUrl(member.photoFileId);

  return (
    <div className="lightbox-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lightbox-content">
        <button className="lightbox-close-btn" onClick={onClose} aria-label="Close picture">
          ✕
        </button>

        {photoUrl ? (
          <img src={photoUrl} alt={member.name} className="lightbox-image" />
        ) : (
          <div className="detail-avatar-large-placeholder" style={{ width: 220, height: 220, fontSize: '4rem' }}>
            {member.name.charAt(0)}
          </div>
        )}

        <div className="lightbox-footer">
          <div className="lightbox-caption">
            <div className="lightbox-name">{member.name}</div>
            <div className="lightbox-role">{member.role}</div>
          </div>

          {isEditor && photoUrl && (
            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => {
                downloadPhoto(photoUrl, member.name);
                onToast(`Downloading ${member.name}'s picture...`, 'success');
              }}
            >
              <DownloadIcon /> Download Picture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================
   Add Dynamic Field Modal
   ================================================ */
interface AddFieldModalProps {
  token: string;
  onClose: () => void;
  onFieldAdded: (field: CustomField) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function AddFieldModal({ token, onClose, onFieldAdded, onToast }: AddFieldModalProps) {
  const [label, setLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      onToast('Field name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-editor-token': token,
        },
        body: JSON.stringify({ label: cleanLabel, required }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add field');

      onFieldAdded(data.field);
      onToast(`Field "${cleanLabel}" added to directory!`, 'success');
      onClose();
    } catch (err: unknown) {
      onToast((err as Error).message || 'Failed to add field', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">+ Add New Field</span>
          <button className="btn-ghost btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
              Add a custom attribute to member profiles (e.g. Age, Department, Phone, Location). This creates a new column in your Google Sheet.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="field-label">Field Name *</label>
              <input
                id="field-label"
                className="form-input"
                type="text"
                placeholder="e.g. Age, Department, Location"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Requirement Rule</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="field-req"
                    checked={!required}
                    onChange={() => setRequired(false)}
                  />
                  Optional
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="field-req"
                    checked={required}
                    onChange={() => setRequired(true)}
                  />
                  Required
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Creating…</> : 'Create Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================
   Person Detail Modal
   ================================================ */
interface DetailModalProps {
  member: TeamMember;
  customFieldsList: CustomField[];
  onClose: () => void;
  onEdit?: () => void;
  onOpenLightbox: (member: TeamMember) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
  isEditor: boolean;
}

function DetailModal({
  member,
  customFieldsList,
  onClose,
  onEdit,
  onOpenLightbox,
  onToast,
  isEditor,
}: DetailModalProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials =
    member.name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const photoUrl = getPhotoUrl(member.photoFileId);

  function copyLinkedIn() {
    if (!member.linkedinUrl) return;
    navigator.clipboard.writeText(member.linkedinUrl).then(() => {
      onToast('LinkedIn link copied to clipboard!', 'success');
    });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <span className="modal-title" style={{ opacity: 0 }}>Profile</span>
          <button className="btn-ghost btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="detail-modal-body">
          {photoUrl && !imgFailed ? (
            <img
              src={photoUrl}
              alt={member.name}
              className="detail-avatar-large"
              style={{ cursor: 'pointer' }}
              title="Click to view big picture"
              onClick={() => onOpenLightbox(member)}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="detail-avatar-large-placeholder">{initials}</div>
          )}

          <h2 className="detail-name">{member.name}</h2>
          <div className="detail-role">{member.role}</div>

          {/* LinkedIn Actions */}
          {member.linkedinUrl ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={member.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-linkedin-link"
              >
                <LinkedInIcon />
                View LinkedIn Profile
              </a>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={copyLinkedIn}
                title="Copy LinkedIn Link"
              >
                <CopyIcon /> Copy Link
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
              No LinkedIn profile provided
            </span>
          )}

          {/* Download Photo Button in Editor Mode */}
          {isEditor && photoUrl && (
            <div style={{ marginTop: 12 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  downloadPhoto(photoUrl, member.name);
                  onToast(`Downloading ${member.name}'s picture...`, 'success');
                }}
              >
                <DownloadIcon /> Download Picture
              </button>
            </div>
          )}

          {/* Dynamic Custom Fields Grid */}
          {customFieldsList.length > 0 && (
            <div className="custom-fields-list">
              {customFieldsList.map((cf) => {
                const val = member.customFields?.[cf.key] || '';
                if (!val) return null;
                return (
                  <div key={cf.key} className="custom-field-badge">
                    <span className="custom-field-label">{cf.label}</span>
                    <span className="custom-field-val">{val}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isEditor && onEdit && (
          <div className="modal-footer" style={{ justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onEdit}>
              <EditIcon /> Edit Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================
   Add / Edit Form Modal
   ================================================ */
interface FormModalProps {
  member: TeamMember | null;
  customFieldsList: CustomField[];
  token: string;
  onClose: () => void;
  onSaved: (member: TeamMember, isNew: boolean) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function FormModal({
  member,
  customFieldsList,
  token,
  onClose,
  onSaved,
  onToast,
}: FormModalProps) {
  const isEdit = !!member;
  const [name, setName] = useState(member?.name || '');
  const [role, setRole] = useState(member?.role || '');
  const [linkedinUrl, setLinkedinUrl] = useState(member?.linkedinUrl || '');
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    return member?.customFields ? { ...member.customFields } : {};
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existingPhotoUrl =
    member?.photoFileId && !removeExistingPhoto ? getPhotoUrl(member.photoFileId) : null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setRemoveExistingPhoto(false);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function handleClearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemoveExistingPhoto(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!role.trim()) errs.role = 'Role is required';
    if (!linkedinUrl.trim()) errs.linkedinUrl = 'LinkedIn URL is required';

    // Validate required custom fields
    customFieldsList.forEach((cf) => {
      if (cf.required) {
        const val = (customValues[cf.key] || '').trim();
        if (!val) {
          errs[cf.key] = `${cf.label} is required`;
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || saving) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('role', role.trim());
      formData.append('linkedinUrl', linkedinUrl.trim());
      formData.append('customFields', JSON.stringify(customValues));

      if (photoFile) {
        formData.append('photo', photoFile);
      }
      if (removeExistingPhoto) {
        formData.append('removePhoto', 'true');
      }

      const url = isEdit ? `/api/members/${member!.id}` : '/api/members';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'x-editor-token': token },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      onSaved(data.member, !isEdit);
      onToast(isEdit ? 'Profile updated!' : 'Team member added!', 'success');
      onClose();
    } catch (err: unknown) {
      onToast((err as Error).message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  const displayPhoto = photoPreview || existingPhotoUrl;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Person' : 'Add Team Member'}</span>
          <button className="btn-ghost btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Photo */}
            <div className="form-group">
              <label className="form-label">Profile Picture (optional)</label>
              <div className="photo-upload-area">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoChange}
                  aria-label="Upload profile photo"
                />
                {displayPhoto ? (
                  <img src={displayPhoto} alt="Preview" className="photo-preview" />
                ) : (
                  <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }}>📷</div>
                )}
                <div className="photo-upload-text">
                  <strong>{photoFile ? photoFile.name : 'Click to upload picture'}</strong>
                  {!photoFile && <span>PNG, JPG, WEBP — up to 5 MB</span>}
                </div>
              </div>

              {displayPhoto && (
                <button
                  type="button"
                  className="btn-remove-photo"
                  onClick={handleClearPhoto}
                >
                  ✕ Remove photo
                </button>
              )}
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name *</label>
              <input
                id="name"
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tanveer Alam Siddiqui"
                autoFocus
              />
              {errors.name && <p className="form-hint" style={{ color: 'var(--danger)' }}>{errors.name}</p>}
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role *</label>
              <input
                id="role"
                className="form-input"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. President"
              />
              {errors.role && <p className="form-hint" style={{ color: 'var(--danger)' }}>{errors.role}</p>}
            </div>

            {/* LinkedIn (Requirement: REQUIRED) */}
            <div className="form-group">
              <label className="form-label" htmlFor="linkedin">LinkedIn URL *</label>
              <input
                id="linkedin"
                className="form-input"
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
              {errors.linkedinUrl && (
                <p className="form-hint" style={{ color: 'var(--danger)' }}>{errors.linkedinUrl}</p>
              )}
            </div>

            {/* Dynamic Custom Fields */}
            {customFieldsList.map((cf) => (
              <div key={cf.key} className="form-group">
                <label className="form-label" htmlFor={`custom-${cf.key}`}>
                  {cf.label} {cf.required ? '*' : '(optional)'}
                </label>
                <input
                  id={`custom-${cf.key}`}
                  className="form-input"
                  type="text"
                  value={customValues[cf.key] || ''}
                  onChange={(e) =>
                    setCustomValues((prev) => ({ ...prev, [cf.key]: e.target.value }))
                  }
                  placeholder={`Enter ${cf.label.toLowerCase()}`}
                />
                {errors[cf.key] && (
                  <p className="form-hint" style={{ color: 'var(--danger)' }}>
                    {errors[cf.key]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : isEdit ? 'Save Changes' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================
   Confirm Delete Modal
   ================================================ */
interface ConfirmModalProps {
  member: TeamMember;
  token: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function ConfirmModal({ member, token, onClose, onDeleted, onToast }: ConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: { 'x-editor-token': token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      onDeleted(member.id);
      onToast(`${member.name} removed from directory`, 'success');
      onClose();
    } catch (err: unknown) {
      onToast((err as Error).message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Remove Person</span>
          <button className="btn-ghost btn" onClick={onClose}>✕</button>
        </div>
        <div className="confirm-body">
          Are you sure you want to remove <span className="confirm-name">{member.name}</span> from the directory?
          This will also remove their profile photo from Google Drive.
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><span className="spinner" /> Removing…</> : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================
   Share Modal (Requirement: View-Only AND Editor Both)
   ================================================ */
interface ShareModalProps {
  token: string;
  isEditor: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function ShareModal({ token, isEditor, onClose, onToast }: ShareModalProps) {
  const [viewLink, setViewLink] = useState<string>('');
  const [editorLink, setEditorLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/share', {
      headers: token ? { 'x-editor-token': token } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        const origin = window.location.origin;
        setViewLink(d.viewLink || `${origin}/`);
        if (d.editorLink) {
          setEditorLink(d.editorLink);
        } else if (isEditor && token) {
          setEditorLink(`${origin}/?token=${token}`);
        }
      })
      .catch(() => {
        const origin = window.location.origin;
        setViewLink(`${origin}/`);
        if (isEditor && token) {
          setEditorLink(`${origin}/?token=${token}`);
        }
      })
      .finally(() => setLoading(false));
  }, [token, isEditor]);

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      onToast(`${label} copied to clipboard!`, 'success');
    });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span className="modal-title">Share Directory</span>
          <button className="btn-ghost btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-state" style={{ padding: '20px 0' }}>
              <span className="spinner" /> Loading links…
            </div>
          ) : (
            <div className="share-tabs-container">
              {/* Option 1: View-Only Link */}
              <div className="share-card">
                <div className="share-card-header">
                  <span className="share-card-title">🌐 View-Only Link</span>
                  <span className="share-badge public">Public View</span>
                </div>
                <p className="share-desc">
                  Anyone with this link can view the directory, enlarged pictures, and copy LinkedIn links. No editing allowed.
                </p>
                <div className="share-link-box">
                  <input
                    readOnly
                    value={viewLink}
                    className="share-link-input"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyText(viewLink, 'View-only link')}
                  >
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Option 2: Editor Link (Admin / Editor) */}
              {isEditor && editorLink && (
                <div className="share-card">
                  <div className="share-card-header">
                    <span className="share-card-title">🔒 Editor Access Link</span>
                    <span className="share-badge editor">Admin / Editor</span>
                  </div>
                  <p className="share-desc">
                    Allows adding, reordering (changing positions), editing, and deleting team members.
                  </p>
                  <div className="share-link-box">
                    <input
                      readOnly
                      value={editorLink}
                      className="share-link-input"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => copyText(editorLink, 'Editor link')}
                    >
                      Copy Editor Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================
   Editor Login Modal
   ================================================ */
interface EditorLoginModalProps {
  onClose: () => void;
  onSuccess: (token: string) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

const DEFAULT_EDITOR_TOKEN = 'a0a100a15658123c06bb72dd54d89edac032da7a414277cdfb7f40276a47656c';

function EditorLoginModal({ onClose, onSuccess, onToast }: EditorLoginModalProps) {
  const [inputToken, setInputToken] = useState('');

  function handleUnlock(tokenToUse: string) {
    const finalToken = (tokenToUse || DEFAULT_EDITOR_TOKEN).trim();
    onSuccess(finalToken);
    onToast('Editor mode enabled! You can now add, reorder, and manage members.', 'success');
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">🔑 Editor & Admin Access</span>
          <button className="btn-ghost btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16, lineHeight: 1.5 }}>
            Unlock editor permissions to change positions, add or edit team members, and download pictures.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="editor-key-input">Editor Access Key</label>
            <input
              id="editor-key-input"
              className="form-input"
              type="password"
              placeholder="Paste editor token or use default key..."
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn-ghost btn"
              style={{ fontSize: '0.8rem', padding: '4px 8px', textDecoration: 'underline', color: 'var(--text-secondary)' }}
              onClick={() => handleUnlock(DEFAULT_EDITOR_TOKEN)}
            >
              Quick Unlock (Default Key)
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleUnlock(inputToken || DEFAULT_EDITOR_TOKEN)}
          >
            Unlock Editor
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================
   Member Row (Requirement: Reordering & Copying LinkedIn)
   ================================================ */
interface MemberRowProps {
  member: TeamMember;
  index: number;
  total: number;
  isEditor: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onCopyLinkedIn: (url: string) => void;
  onOpenLightbox: (member: TeamMember) => void;
}

function MemberRow({
  member,
  index,
  total,
  isEditor,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  onCopyLinkedIn,
  onOpenLightbox,
}: MemberRowProps) {
  return (
    <div
      className="member-row"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      title="Click to view full details"
    >
      <Avatar member={member} onOpenLightbox={onOpenLightbox} />

      <div className="member-info">
        <div className="member-name">{member.name}</div>
        <div className="member-role">{member.role}</div>
      </div>

      <div className="member-actions" onClick={(e) => e.stopPropagation()}>
        {/* Reordering Controls (Requirement: change positions / on top, only on editor access) */}
        {isEditor && (
          <div className="reorder-btns" title="Change position in directory">
            {index > 0 && (
              <button
                className="reorder-btn top-btn"
                onClick={() => onMove(index, 0)}
                title="Move directly to Top"
              >
                Top
              </button>
            )}
            <button
              className="reorder-btn"
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
              title="Move Up"
            >
              ▲
            </button>
            <button
              className="reorder-btn"
              disabled={index === total - 1}
              onClick={() => onMove(index, index + 1)}
              title="Move Down"
            >
              ▼
            </button>
          </div>
        )}

        {/* LinkedIn Profile + Copy LinkedIn Link (Requirement: copy link in view only mode) */}
        {member.linkedinUrl && (
          <>
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-btn"
              title="Open LinkedIn Profile"
              aria-label={`${member.name}'s LinkedIn profile`}
            >
              <LinkedInIcon />
            </a>
            <button
              className="icon-btn"
              onClick={() => onCopyLinkedIn(member.linkedinUrl)}
              title="Copy LinkedIn Link"
              aria-label={`Copy LinkedIn link of ${member.name}`}
            >
              <CopyIcon />
            </button>
          </>
        )}

        {/* Edit and Delete (Editor mode only) */}
        {isEditor && (
          <>
            <button
              className="icon-btn"
              onClick={onEdit}
              title="Edit"
              aria-label={`Edit ${member.name}`}
            >
              <EditIcon />
            </button>
            <button
              className="icon-btn danger"
              onClick={onDelete}
              title="Remove"
              aria-label={`Remove ${member.name}`}
            >
              <TrashIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================
   Main Page
   ================================================ */
export default function HomePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [isEditor, setIsEditor] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [lightboxMember, setLightboxMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showEditorLogin, setShowEditorLogin] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Read editor token from URL or localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
        setIsEditor(true);
        localStorage.setItem('team_editor_token', urlToken);
      } else {
        const saved = localStorage.getItem('team_editor_token');
        if (saved) {
          setToken(saved);
          setIsEditor(true);
        }
      }
    } catch {
      // LocalStorage might be restricted
    }
  }, []);

  // Fetch directory members and custom fields
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setFetchError(null);
      try {
        const [membersRes, fieldsRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/fields'),
        ]);

        const membersData = await membersRes.json();
        if (!membersRes.ok) throw new Error(membersData.error || 'Failed to fetch directory');
        setMembers(membersData.members || []);

        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          setCustomFields(fieldsData.fields || []);
        }
      } catch (err: unknown) {
        setFetchError((err as Error).message || 'Failed to load directory');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function addToast(message: string, type: 'success' | 'error') {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSaved(member: TeamMember, isNew: boolean) {
    if (isNew) {
      setMembers((prev) => [...prev, member]);
    } else {
      setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
      if (selectedMember?.id === member.id) {
        setSelectedMember(member);
      }
    }
  }

  function handleDeleted(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (selectedMember?.id === id) {
      setSelectedMember(null);
    }
  }

  function handleExitEditor() {
    try {
      localStorage.removeItem('team_editor_token');
    } catch {}
    setToken('');
    setIsEditor(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.pathname);
    addToast('Exited editor mode', 'success');
  }

  function handleUnlockEditor(newToken: string) {
    setToken(newToken);
    setIsEditor(true);
    try {
      localStorage.setItem('team_editor_token', newToken);
      const url = new URL(window.location.href);
      url.searchParams.set('token', newToken);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }

  // Reorder Handler (Requirement: change positions however I want)
  async function handleMoveMember(fromIdx: number, toIdx: number) {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= members.length ||
      toIdx >= members.length
    ) {
      return;
    }

    const reordered = [...members];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // Optimistic update
    setMembers(reordered);

    try {
      const res = await fetch('/api/members/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-editor-token': token,
        },
        body: JSON.stringify({ memberIds: reordered.map((m) => m.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reorder');
      addToast(
        toIdx === 0 ? `Moved ${moved.name} to top!` : `Updated ${moved.name}'s position!`,
        'success'
      );
    } catch (err: unknown) {
      addToast((err as Error).message || 'Failed to save order to spreadsheet', 'error');
      // Rollback on failure
      setMembers(members);
    }
  }

  function handleCopyLinkedIn(url: string) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      addToast('LinkedIn link copied to clipboard!', 'success');
    });
  }

  // Real-time search filter
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        Object.values(m.customFields || {}).some((v) => v.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  return (
    <div className="app-wrapper">
      <main className="page-container">
        {/* Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Our Team</h1>
            <p className="page-subtitle">Meet the people behind our work</p>
          </div>

          <div className="header-actions">
            {/* Share button available for BOTH Viewers and Editors */}
            <button
              id="share-btn"
              className="btn btn-secondary"
              onClick={() => setShowShare(true)}
              title="Share directory link"
            >
              <ShareIcon /> Share
            </button>

            {!isEditor ? (
              <button
                id="login-btn"
                className="btn btn-secondary"
                onClick={() => setShowEditorLogin(true)}
                title="Unlock editor controls to add, reorder, or edit team members"
              >
                🔑 Admin / Editor
              </button>
            ) : (
              <>
                <button
                  id="add-field-btn"
                  className="btn btn-secondary"
                  onClick={() => setShowAddField(true)}
                  title="Add custom information field (e.g. Age, Department)"
                >
                  + Add Field
                </button>
                <button
                  id="add-person-btn"
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingMember(null);
                    setShowForm(true);
                  }}
                >
                  + Add Member
                </button>
                <button
                  className="btn-exit-editor"
                  onClick={handleExitEditor}
                  title="Switch to guest/viewer mode"
                >
                  Exit Editor
                </button>
              </>
            )}
          </div>
        </header>

        {/* Real-time Search Bar */}
        {!loading && members.length > 0 && (
          <div className="search-bar-wrapper">
            <div className="search-input-box">
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search team by name, role, or details…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search team members"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading directory…
          </div>
        ) : fetchError ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <div className="empty-title">Could not load directory</div>
            <div className="empty-subtitle">{fetchError}</div>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No team members yet</div>
            <div className="empty-subtitle">
              {isEditor
                ? 'Add your first team member to populate the directory.'
                : 'The directory is currently empty. Are you an admin? Unlock Editor Mode to add members.'}
            </div>
            {isEditor ? (
              <button
                id="empty-add-btn"
                className="btn btn-primary"
                onClick={() => {
                  setEditingMember(null);
                  setShowForm(true);
                }}
              >
                + Add Member
              </button>
            ) : (
              <button
                id="empty-unlock-btn"
                className="btn btn-primary"
                onClick={() => setShowEditorLogin(true)}
              >
                🔑 Unlock Editor & Add Member
              </button>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-icon" style={{ fontSize: '2rem' }}>🔍</div>
            <div className="empty-title">No matching members</div>
            <div className="empty-subtitle">
              No one matches &ldquo;{searchQuery}&rdquo;. Try another name or role.
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
              Clear search
            </button>
          </div>
        ) : (
          <section className="directory-list" aria-label="Team directory">
            {filteredMembers.map((member, idx) => (
              <MemberRow
                key={member.id}
                member={member}
                index={idx}
                total={filteredMembers.length}
                isEditor={isEditor}
                onSelect={() => setSelectedMember(member)}
                onEdit={() => {
                  setEditingMember(member);
                  setShowForm(true);
                }}
                onDelete={() => setDeletingMember(member)}
                onMove={handleMoveMember}
                onCopyLinkedIn={handleCopyLinkedIn}
                onOpenLightbox={setLightboxMember}
              />
            ))}
          </section>
        )}
      </main>

      {/* Lightbox / Big Picture Modal (Requirement: big picture view + download in editor mode) */}
      {lightboxMember && (
        <LightboxModal
          member={lightboxMember}
          isEditor={isEditor}
          onClose={() => setLightboxMember(null)}
          onToast={addToast}
        />
      )}

      {/* Detail Modal (when record is clicked) */}
      {selectedMember && (
        <DetailModal
          member={selectedMember}
          customFieldsList={customFields}
          isEditor={isEditor}
          onClose={() => setSelectedMember(null)}
          onOpenLightbox={setLightboxMember}
          onToast={addToast}
          onEdit={() => {
            const m = selectedMember;
            setSelectedMember(null);
            setEditingMember(m);
            setShowForm(true);
          }}
        />
      )}

      {/* Add / Edit Member Modal */}
      {showForm && (
        <FormModal
          member={editingMember}
          customFieldsList={customFields}
          token={token}
          onClose={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
          onSaved={handleSaved}
          onToast={addToast}
        />
      )}

      {/* Add Custom Field Modal */}
      {showAddField && (
        <AddFieldModal
          token={token}
          onClose={() => setShowAddField(false)}
          onFieldAdded={(newField) => setCustomFields((prev) => [...prev, newField])}
          onToast={addToast}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingMember && (
        <ConfirmModal
          member={deletingMember}
          token={token}
          onClose={() => setDeletingMember(null)}
          onDeleted={handleDeleted}
          onToast={addToast}
        />
      )}

      {/* Share Modal (Requirement: View-only & Editor both) */}
      {showShare && (
        <ShareModal
          token={token}
          isEditor={isEditor}
          onClose={() => setShowShare(false)}
          onToast={addToast}
        />
      )}

      {/* Editor Login Modal */}
      {showEditorLogin && (
        <EditorLoginModal
          onClose={() => setShowEditorLogin(false)}
          onSuccess={handleUnlockEditor}
          onToast={addToast}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

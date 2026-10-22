'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoFileId: string;
  linkedinUrl: string;
  createdAt: string;
  updatedAt: string;
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
function Avatar({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false);
  const initials = member.name
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
   Person Detail Modal (Requirement 2)
   ================================================ */
interface DetailModalProps {
  member: TeamMember;
  onClose: () => void;
  onEdit?: () => void;
  isEditor: boolean;
}

function DetailModal({ member, onClose, onEdit, isEditor }: DetailModalProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const photoUrl = getPhotoUrl(member.photoFileId);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
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
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="detail-avatar-large-placeholder">{initials}</div>
          )}

          <h2 className="detail-name">{member.name}</h2>
          <div className="detail-role">{member.role}</div>

          {member.linkedinUrl ? (
            <a
              href={member.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-linkedin-link"
            >
              <LinkedInIcon />
              View LinkedIn Profile
            </a>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No LinkedIn profile provided
            </span>
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
  token: string;
  onClose: () => void;
  onSaved: (member: TeamMember, isNew: boolean) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function FormModal({ member, token, onClose, onSaved, onToast }: FormModalProps) {
  const isEdit = !!member;
  const [name, setName] = useState(member?.name || '');
  const [role, setRole] = useState(member?.role || '');
  const [linkedinUrl, setLinkedinUrl] = useState(member?.linkedinUrl || '');
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
                placeholder="e.g. Sarah Chen"
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
                placeholder="e.g. Lead Product Designer"
              />
              {errors.role && <p className="form-hint" style={{ color: 'var(--danger)' }}>{errors.role}</p>}
            </div>

            {/* LinkedIn */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="linkedin">LinkedIn URL (optional)</label>
              <input
                id="linkedin"
                className="form-input"
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
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
   Share Modal
   ================================================ */
interface ShareModalProps {
  token: string;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

function ShareModal({ token, onClose, onToast }: ShareModalProps) {
  const [editorLink, setEditorLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/share', {
      headers: { 'x-editor-token': token },
    })
      .then((r) => r.json())
      .then((d) => setEditorLink(d.editorLink))
      .catch(() => setEditorLink(null))
      .finally(() => setLoading(false));
  }, [token]);

  function copyLink() {
    if (!editorLink) return;
    navigator.clipboard.writeText(editorLink).then(() => {
      onToast('Editor link copied to clipboard!', 'success');
    });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Share Editor Access</span>
          <button className="btn-ghost btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 14 }}>
            Anyone with this link can add, edit, and delete directory entries:
          </p>

          {loading ? (
            <div className="loading-state" style={{ padding: '20px 0' }}>
              <span className="spinner" /> Loading…
            </div>
          ) : editorLink ? (
            <>
              <div className="share-link-box">
                <input
                  readOnly
                  value={editorLink}
                  className="share-link-input"
                  onFocus={(e) => e.target.select()}
                />
                <button className="btn btn-primary" onClick={copyLink}>Copy</button>
              </div>
              <div className="warning-text">
                ⚠️ Share carefully. To revoke access, update the EDITOR_TOKEN environment variable in Vercel.
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
              Could not load share link.
            </p>
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
   Member Row (Click opens detail modal)
   ================================================ */
interface MemberRowProps {
  member: TeamMember;
  isEditor: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MemberRow({ member, isEditor, onSelect, onEdit, onDelete }: MemberRowProps) {
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
      title="Click to view profile"
    >
      <Avatar member={member} />

      <div className="member-info">
        <div className="member-name">{member.name}</div>
        <div className="member-role">{member.role}</div>
      </div>

      <div className="member-actions" onClick={(e) => e.stopPropagation()}>
        {member.linkedinUrl && (
          <a
            href={member.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="linkedin-btn"
            title="Open LinkedIn profile"
            aria-label={`${member.name}'s LinkedIn profile`}
          >
            <LinkedInIcon />
          </a>
        )}
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
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [token, setToken] = useState('');
  const [isEditor, setIsEditor] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [showShare, setShowShare] = useState(false);

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

  // Fetch directory members
  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch('/api/members');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch directory');
        setMembers(data.members || []);
      } catch (err: unknown) {
        setFetchError((err as Error).message || 'Failed to load directory');
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
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
    // Remove token query param from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.pathname);
    addToast('Exited editor mode', 'success');
  }

  // Real-time search filter
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
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
            {isEditor ? (
              <>
                <button
                  id="share-btn"
                  className="btn btn-secondary"
                  onClick={() => setShowShare(true)}
                  title="Share editor link"
                >
                  <ShareIcon /> Share
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
            ) : null}
          </div>
        </header>

        {/* Real-time Search Bar (Requirement 2) */}
        {!loading && members.length > 0 && (
          <div className="search-bar-wrapper">
            <div className="search-input-box">
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search team by name or role…"
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
                : 'The directory is currently empty.'}
            </div>
            {isEditor && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingMember(null);
                  setShowForm(true);
                }}
              >
                + Add Member
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
            {filteredMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isEditor={isEditor}
                onSelect={() => setSelectedMember(member)}
                onEdit={() => {
                  setEditingMember(member);
                  setShowForm(true);
                }}
                onDelete={() => setDeletingMember(member)}
              />
            ))}
          </section>
        )}
      </main>

      {/* Detail Modal (when record is clicked) */}
      {selectedMember && (
        <DetailModal
          member={selectedMember}
          isEditor={isEditor}
          onClose={() => setSelectedMember(null)}
          onEdit={() => {
            const m = selectedMember;
            setSelectedMember(null);
            setEditingMember(m);
            setShowForm(true);
          }}
        />
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <FormModal
          member={editingMember}
          token={token}
          onClose={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
          onSaved={handleSaved}
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

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          token={token}
          onClose={() => setShowShare(false)}
          onToast={addToast}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

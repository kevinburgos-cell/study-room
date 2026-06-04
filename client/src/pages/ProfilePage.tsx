import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usernameExists } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  onLogout: () => void;
}

export default function ProfilePage({ onLogout }: ProfilePageProps) {
  const { user, firebaseUser, updateUserProfile, updateUserEmail, deleteCurrentAccount } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmError, setDeleteConfirmError] = useState('');

  useEffect(() => {
    setUsername(user?.username || '');
    setPhotoURL(user?.photoURL || '');
    setEmail(user?.email || '');
  }, [user]);

  const isGoogleAccount = (firebaseUser?.providerData || []).some((provider) => provider.providerId === 'google.com');

  const usernameChanged = useMemo(() => {
    return username.trim().toLowerCase() !== (user?.username || '').trim().toLowerCase();
  }, [username, user?.username]);

  const photoChanged = useMemo(() => {
    return (photoURL.trim() || '') !== (user?.photoURL || '');
  }, [photoURL, user?.photoURL]);

  const emailChanged = useMemo(() => {
    return email.trim().toLowerCase() !== (user?.email || '').trim().toLowerCase();
  }, [email, user?.email]);

  const canSave = username.trim().length >= 3 && (usernameChanged || photoChanged || (!isGoogleAccount && emailChanged));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const normalizedUsername = username.trim();
    if (normalizedUsername.length < 3) {
      setError('El username debe tener al menos 3 caracteres');
      return;
    }

    setSaving(true);
    try {
      setCheckingUsername(true);
      if (usernameChanged && await usernameExists(normalizedUsername)) {
        setError('Este username ya está en uso');
        return;
      }

      if (!isGoogleAccount && emailChanged) {
        await updateUserEmail(email);
      }

      await updateUserProfile(normalizedUsername, photoURL.trim() || null);
      setIsEditing(false);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el perfil');
    } finally {
      setCheckingUsername(false);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'delete my account') {
      setDeleteConfirmError('El texto está mal escrito. Debe ser exactamente "delete my account".');
      return;
    }

    setDeleting(true);
    setError('');
    setDeleteConfirmError('');
    try {
      await deleteCurrentAccount();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar la cuenta');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <nav className="sidebar" aria-label="Navegación principal de la aplicación">
        <details className="sidebar-mobile-shell" open>
          <summary className="sidebar-mobile-toggle interactive-element" aria-label="Abrir o cerrar menú">
            <span className="sidebar-mobile-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Menú</span>
          </summary>
          <div className="sidebar-shell-content">
            <div>
              <div className="logo-container">
                <div className="logo-icon">SR</div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>StudyRoom</span>
              </div>
              <ul className="nav-list">
                <li>
                  <NavLink to="/dashboard" className={({ isActive }) => `nav-link interactive-element ${isActive ? 'active' : ''}`}>
                    📊 Panel General
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/profile" className={({ isActive }) => `nav-link interactive-element ${isActive ? 'active' : ''}`}>
                    👤 Mi Perfil
                  </NavLink>
                </li>
              </ul>
            </div>
            <div>
              <button onClick={onLogout} className="btn-secondary interactive-element" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </details>
      </nav>

      <main className="main-content" aria-label="Configuración de perfil">
        <header className="page-header">
          <div>
            <h1>Mi Perfil</h1>
            <p className="page-title-desc">Actualiza tus datos y foto de perfil. Los cambios se reflejan al instante.</p>
          </div>
        </header>

        {success && <div className="alert-box alert-info" role="alert">{success}</div>}
        {error && <div className="alert-box" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }} role="alert">{error}</div>}

        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
                {photoURL.trim() ? (
                  <img src={photoURL.trim()} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>Sin foto</div>
                )}
              </div>
              <div style={{ fontWeight: 700 }}>@{user?.username}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user?.email}</div>
            </div>

            <form onSubmit={handleSave} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="username-input">Username</label>
                  <input
                    id="username-input"
                    className={`form-input interactive-element ${isEditing ? 'edit-mode-field' : ''}`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={saving || !isEditing}
                  />
                  {usernameChanged && isEditing && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                      {checkingUsername ? 'Comprobando disponibilidad...' : 'Se validará que sea único al guardar'}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="photo-input">Foto de perfil</label>
                  <input
                    id="photo-input"
                    className={`form-input interactive-element ${isEditing ? 'edit-mode-field' : ''}`}
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    disabled={saving || !isEditing}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    className={`form-input interactive-element ${isEditing && !isGoogleAccount ? 'edit-mode-field' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={saving || !isEditing || isGoogleAccount}
                    style={isGoogleAccount ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  />
                  {isGoogleAccount && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      El correo no se puede editar en cuentas de Google.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn-primary interactive-element"
                    onClick={() => setIsEditing((v) => !v)}
                    style={{ width: '100%', background: 'rgba(0, 115, 255, 0.9)' }}
                  >
                    {isEditing ? 'Cancelar edición' : 'Editar perfil'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn-primary interactive-element" disabled={saving || !isEditing || !canSave}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem', borderColor: 'rgba(239,68,68,0.18)' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Zona de peligro</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Eliminar tu cuenta borra permanentemente tus datos de Study Room y su base de datos.
          </p>
          <button type="button" className="btn-secondary interactive-element" style={{ borderColor: 'rgba(239,68,68,0.25)', color: '#fca5a5' }} onClick={() => setShowDeleteModal(true)}>
            Eliminar cuenta
          </button>
        </section>
      </main>

      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div className="glass-panel" style={{ maxWidth: 520, width: '100%', padding: '1.5rem' }}>
            <h2 id="delete-title" style={{ marginBottom: '0.75rem' }}>Confirmar eliminación</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Esta acción eliminará tu cuenta permanentemente. No podrás recuperar tu perfil ni tus datos.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="delete-confirm-input">
                Para eliminar tu cuenta, escribe <strong>delete my account</strong>
              </label>
              <input
                id="delete-confirm-input"
                className={`form-input interactive-element ${deleteConfirmError ? 'delete-confirm-invalid' : ''}`}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete my account"
                disabled={deleting}
              />
              {deleteConfirmError && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#fca5a5' }}>
                  {deleteConfirmError}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn-secondary interactive-element" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancelar
              </button>
              <button type="button" className="btn-primary interactive-element" style={{ background: '#dc2626' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Sí, eliminar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

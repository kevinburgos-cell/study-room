import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePageProps {
  onLogout: () => void;
}

/**
 * ProfilePage manages user details, bios, and weekly study hour goals,
 * persisting edits directly into Cloud Firestore database via backend.
 */
export default function ProfilePage({ onLogout }: ProfilePageProps) {
  const { user, updateUserProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [studyGoal, setStudyGoal] = useState('10');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync state with active authenticated user context
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setStudyGoal(user.studyGoal || '10');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre completo.');
      return;
    }

    setError('');
    setSubmitting(false);
    setSubmitting(true);
    try {
      await updateUserProfile(name.trim(), bio.trim(), studyGoal);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos en la base de datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Navigation Sidebar */}
      <nav className="sidebar" aria-label="Navegación principal de la aplicación">
        <div>
          <div className="logo-container">
            <div className="logo-icon">SR</div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>StudyRoom</span>
          </div>
          <ul className="nav-list">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `nav-link interactive-element ${isActive ? 'active' : ''}`}
                aria-label="Ir al panel general"
              >
                📊 Panel General
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `nav-link interactive-element ${isActive ? 'active' : ''}`}
                aria-label="Ir a mi perfil"
              >
                👤 Mi Perfil
              </NavLink>
            </li>
          </ul>
        </div>
        <div>
          <button 
            onClick={onLogout} 
            className="btn-secondary interactive-element" 
            style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
            aria-label="Cerrar sesión de la aplicación"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content" aria-label="Configuración de Perfil">
        <header className="page-header" aria-label="Encabezado del perfil">
          <div>
            <h1 id="profile-title">Mi Perfil</h1>
            <p className="page-title-desc">Administra tus datos personales y objetivos de estudio conectados a Firestore.</p>
          </div>
        </header>

        {savedSuccess && (
          <div className="alert-box alert-info" role="alert" aria-live="polite">
            ✅ ¡Datos guardados exitosamente en la base de datos!
          </div>
        )}

        {error && (
          <div className="alert-box" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }} role="alert">
            ❌ {error}
          </div>
        )}

        <section className="glass-panel" aria-labelledby="form-section-heading" style={{ padding: '2rem' }}>
          <h2 id="form-section-heading" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Información Personal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Nombre de usuario único registrado: <strong style={{ color: '#ffffff' }}>@{user?.username}</strong>
          </p>
          
          <form onSubmit={handleSave} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name-input">
                  Nombre Completo
                </label>
                <input
                  id="name-input"
                  type="text"
                  className="form-input interactive-element"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  aria-label="Nombre completo del estudiante"
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-email-input">
                  Correo Electrónico
                </label>
                <input
                  id="profile-email-input"
                  type="email"
                  className="form-input interactive-element"
                  value={user?.email || ''}
                  disabled={true}
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  aria-label="Correo electrónico (no modificable)"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" htmlFor="bio-input">
                Biografía
              </label>
              <textarea
                id="bio-input"
                className="form-input interactive-element"
                style={{ resize: 'vertical', minHeight: '100px', fontFamily: 'inherit' }}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={submitting}
                aria-label="Escribe una breve biografía sobre ti"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem', maxWidth: '300px' }}>
              <label className="form-label" htmlFor="goal-input">
                Meta Semanal de Estudio (horas)
              </label>
              <input
                id="goal-input"
                type="number"
                min="1"
                max="100"
                className="form-input interactive-element"
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
                disabled={submitting}
                aria-label="Meta de horas semanales de estudio"
              />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn-primary interactive-element"
                style={{ width: 'auto', minWidth: '180px' }}
                disabled={submitting}
                aria-label="Guardar cambios del perfil en base de datos"
              >
                {submitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

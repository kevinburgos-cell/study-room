import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface ProfilePageProps {
  onLogout: () => void;
}

export default function ProfilePage({ onLogout }: ProfilePageProps) {
  const [username, setUsername] = useState('Kevin Burgos');
  const [email, setEmail] = useState('kevin@ejemplo.com');
  const [bio, setBio] = useState('Estudiante de Ingeniería de Software. Apasionado por la web y la inteligencia artificial.');
  const [studyGoal, setStudyGoal] = useState('25'); // hours per week
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
            <p className="page-title-desc">Administra tus datos personales y objetivos de estudio.</p>
          </div>
        </header>

        {savedSuccess && (
          <div className="alert-box alert-info" role="alert" aria-live="polite">
            ✅ ¡Preferencias y perfil guardados exitosamente!
          </div>
        )}

        <section className="glass-panel" aria-labelledby="form-section-heading" style={{ padding: '2rem' }}>
          <h2 id="form-section-heading" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Información Personal</h2>
          
          <form onSubmit={handleSave} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="username-input">
                  Nombre de Usuario
                </label>
                <input
                  id="username-input"
                  type="text"
                  className="form-input interactive-element"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-label="Nombre de usuario"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Correo electrónico de perfil"
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
                aria-label="Meta de horas semanales de estudio"
              />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn-primary interactive-element"
                style={{ width: 'auto', minWidth: '180px' }}
                aria-label="Guardar cambios del perfil"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

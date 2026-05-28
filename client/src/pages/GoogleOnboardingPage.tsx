import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleOnboardingPage() {
  const { completeGoogleOnboard, error: authError, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Get tempUser details passed from Login
  const tempUser = location.state?.tempUser || { name: 'Estudiante', email: '' };

  useEffect(() => {
    clearError();
  }, []);

  // Check username availability with debounce
  useEffect(() => {
    if (username.trim().length < 3) {
      setStatus(null);
      return;
    }

    // Basic regex validation first
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      setStatus({ 
        available: false, 
        message: 'Solo letras, números, puntos (.) y guiones bajos (_).' 
      });
      return;
    }

    setChecking(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/check-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim() })
        });
        const data = await res.json();
        setStatus({
          available: data.available,
          message: data.message
        });
      } catch (err) {
        console.error('Error checking username', err);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || (status && !status.available)) {
      setError('Por favor, selecciona un nombre de usuario disponible.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await completeGoogleOnboard(username.trim());
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al completar el registro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-container split-layout" aria-label="Pantalla de bienvenida y onboarding de Google">
      
      {/* Left panel: Info Panel (Dark Theme) */}
      <section className="info-panel" aria-labelledby="branding-heading">
        <div className="branding-container">
          <div className="branding-logo">SR</div>
          <span className="branding-text">StudyRoom</span>
        </div>
        
        <div className="info-content">
          <h2 id="branding-heading" className="info-title">
            ¡Ya casi <span className="highlight-text">comenzamos!</span>
          </h2>
          <p className="info-desc">
            Para garantizar una experiencia colaborativa única, cada estudiante en StudyRoom requiere un identificador exclusivo.
          </p>

          <div className="features-list">
            <article className="feature-item">
              <span className="feature-icon">🆔</span>
              <div>
                <h3 className="feature-title">Nombre de Usuario Único</h3>
                <p className="feature-sub">Te identificará en el chat y salas de estudio.</p>
              </div>
            </article>

            <article className="feature-item">
              <span className="feature-icon">🛡️</span>
              <div>
                <h3 className="feature-title">Seguridad Académica</h3>
                <p className="feature-sub">Bloqueamos cuentas falsas e identificadores duplicados.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Right panel: Onboarding Form (Light Theme) */}
      <section className="form-panel" aria-labelledby="onboard-title">
        <div className="form-card-wrapper">
          <div className="form-header">
            <h1 id="onboard-title" className="form-main-title">Último Paso</h1>
            <p className="form-subtitle">Completa tu perfil de Google para ingresar</p>
          </div>

          <div className="user-pill">
            <span className="user-avatar">👤</span>
            <div>
              <div className="user-pill-name">{tempUser.name}</div>
              <div className="user-pill-email">{tempUser.email}</div>
            </div>
          </div>

          {(error || authError) && (
            <div className="alert-box-light alert-danger-light" role="alert">
              ❌ {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-light">
              <label className="form-label-light" htmlFor="username-onboard">
                Crea tu Nombre de Usuario
              </label>
              <input
                id="username-onboard"
                type="text"
                className="form-input-light"
                placeholder="ej. kevin.burgos"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                aria-required="true"
                aria-label="Crea tu nombre de usuario único"
              />
              
              {/* Live validation feedback */}
              {username.trim().length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  {checking && <span style={{ color: '#2563eb' }}>🔄 Validando disponibilidad...</span>}
                  {!checking && status && (
                    <span style={{ color: status.available ? '#16a34a' : '#dc2626' }}>
                      {status.available ? '✅ ' : '❌ '} {status.message}
                    </span>
                  )}
                  {!checking && username.trim().length < 3 && (
                    <span style={{ color: '#dc2626' }}>El nombre debe tener mínimo 3 caracteres.</span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary-light"
              disabled={submitting || checking || (status ? !status.available : true)}
              style={{ marginTop: '2rem' }}
              aria-label="Completar registro e ingresar a StudyRoom"
            >
              {submitting ? 'Guardando perfil...' : 'Confirmar e Ingresar'}
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}

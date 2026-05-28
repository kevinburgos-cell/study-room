import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loginWithGoogle, isAuthenticated, error: authError, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated]);

  // Debounced username checking
  useEffect(() => {
    if (username.trim().length < 3) {
      setUsernameStatus(null);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus({ 
        available: false, 
        message: 'Solo letras, números, puntos (.) y guiones bajos (_).' 
      });
      return;
    }

    setCheckingUsername(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/check-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim() })
        });
        const data = await res.json();
        setUsernameStatus({
          available: data.available,
          message: data.message
        });
      } catch (err) {
        console.error('Error checking username', err);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name || !email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (usernameStatus && !usernameStatus.available) {
      setError('Por favor, elige un nombre de usuario disponible.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await register(username.trim(), name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      // Error is stored in global AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.onboardingRequired) {
        navigate('/google-onboard', { state: { tempUser: res.tempUser } });
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      // Handled globally
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-container split-layout" aria-label="Página de registro de cuenta de StudyRoom">
      
      {/* Left panel: Info Panel (Dark Theme) */}
      <section className="info-panel" aria-labelledby="branding-heading">
        <div className="branding-container">
          <div className="branding-logo">SR</div>
          <span className="branding-text">StudyRoom</span>
        </div>
        
        <div className="info-content">
          <h1 id="branding-heading" className="info-title">
            Únete a la <span className="highlight-text">comunidad</span>
          </h1>
          <p className="info-desc">
            Crea tu cuenta hoy y accede a decenas de salas de estudio virtuales con herramientas integradas de Pomodoro y colaboración.
          </p>

          <div className="features-list">
            <article className="feature-item" aria-label="Gestión Eficiente">
              <span className="feature-icon-wrapper">📊</span>
              <div>
                <h2 className="feature-title">Gestión Eficiente</h2>
                <p className="feature-sub">Organiza tus salas, notas y proyectos con facilidad.</p>
              </div>
            </article>

            <article className="feature-item" aria-label="Conectividad Total">
              <span className="feature-icon-wrapper">🤝</span>
              <div>
                <h2 className="feature-title">Conectividad Total</h2>
                <p className="feature-sub">Crea redes de apoyo y estudia en tiempo real con compañeros.</p>
              </div>
            </article>

            <article className="feature-item" aria-label="Seguridad Garantizada">
              <span className="feature-icon-wrapper">🔒</span>
              <div>
                <h2 className="feature-title">Seguridad Garantizada</h2>
                <p className="feature-sub">Tus apuntes y datos universitarios siempre protegidos.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Right panel: Form Panel (Light Theme) */}
      <section className="form-panel" aria-labelledby="register-title">
        <div className="form-card-wrapper" style={{ padding: '2rem 0' }}>
          <div className="form-header">
            <h2 id="register-title" className="form-main-title">Crea tu Cuenta</h2>
            <p className="form-subtitle">Comienza a estudiar de manera inteligente</p>
          </div>

          {/* Toggle pill selector */}
          <div className="toggle-tab-container" role="tablist">
            <Link 
              to="/login" 
              className="toggle-tab inactive" 
              role="tab" 
              aria-selected="false"
              aria-label="Ir a la pestaña Iniciar Sesión"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              Iniciar sesión
            </Link>
            <button 
              className="toggle-tab active" 
              role="tab" 
              aria-selected="true"
              aria-label="Pestaña Registrarse"
            >
              Registrarse
            </button>
          </div>

          {(error || authError) && (
            <div className="alert-box-light alert-danger-light" role="alert">
              ❌ {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            
            <div className="form-group-light">
              <label className="form-label-light" htmlFor="username-register">
                Nombre de Usuario
              </label>
              <input
                id="username-register"
                type="text"
                className="form-input-light"
                placeholder="ej. kevinburgos"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                aria-required="true"
                aria-label="Crea tu nombre de usuario único"
              />
              
              {/* Real-time username uniqueness feedback */}
              {username.trim().length > 0 && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
                  {checkingUsername && <span style={{ color: '#2563eb' }}>🔄 Comprobando disponibilidad...</span>}
                  {!checkingUsername && usernameStatus && (
                    <span style={{ color: usernameStatus.available ? '#16a34a' : '#dc2626' }}>
                      {usernameStatus.available ? '✅ ' : '❌ '} {usernameStatus.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group-light">
              <label className="form-label-light" htmlFor="name-register">
                Nombre Completo
              </label>
              <input
                id="name-register"
                type="text"
                className="form-input-light"
                placeholder="Kevin Burgos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                aria-required="true"
                aria-label="Ingresa tu nombre completo"
              />
            </div>

            <div className="form-group-light">
              <label className="form-label-light" htmlFor="email-register">
                Correo electrónico
              </label>
              <input
                id="email-register"
                type="email"
                className="form-input-light"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                aria-required="true"
                aria-label="Ingresa tu correo electrónico"
              />
            </div>

            <div className="form-group-light">
              <label className="form-label-light" htmlFor="password-register">
                Contraseña
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password-register"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-light password-field"
                  placeholder="Min. 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  aria-required="true"
                  aria-label="Crea una contraseña de al menos 6 caracteres"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-light"
              disabled={submitting || checkingUsername || (usernameStatus ? !usernameStatus.available : false)}
              aria-label="Registrarse e ingresar a la cuenta"
            >
              {submitting ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>

          <div className="social-divider">
            <span>o continúa con</span>
          </div>

          <button
            type="button"
            className="btn-google-light"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            aria-label="Registrarse con Google"
          >
            <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuar con Google
          </button>

          <footer className="auth-footer-light">
            Al continuar, aceptas nuestros <a href="#tos">Términos de Servicio</a> y <a href="#privacy">Política de Privacidad</a>.
          </footer>
        </div>
      </section>

    </main>
  );
}

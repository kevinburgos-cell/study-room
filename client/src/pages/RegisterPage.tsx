import React, { useEffect, useState } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { mapFirebaseError, usernameExists } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';

type LocationState = {
  googleOnboarding?: boolean;
  tempUser?: {
    uid: string;
    email: string;
    photoURL: string | null;
  };
};

export default function RegisterPage() {
  const {
    register,
    signInWithGoogle,
    completeGoogleOnboarding,
    user,
    loading,
    error,
    clearError,
  } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const googleOnboarding = !!state?.googleOnboarding;
  const tempUser = state?.tempUser;

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    const run = async () => {
      if (!username.trim()) {
        setUsernameTaken(false);
        return;
      }

      setCheckingUsername(true);
      try {
        setUsernameTaken(await usernameExists(username));
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(run, 400);
    return () => clearTimeout(timer);
  }, [username]);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim()) {
      setLocalError('Por favor, completa todos los campos.');
      return;
    }

    if (!googleOnboarding) {
      if (!email.trim() || !password.trim()) {
        setLocalError('Por favor, completa todos los campos.');
        return;
      }

      if (password.length < 6) {
        setLocalError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }

    if (usernameTaken) {
      setLocalError('Por favor, elige un nombre de usuario disponible.');
      return;
    }

    try {
      setSubmitting(true);

      if (googleOnboarding) {
        await completeGoogleOnboarding(username);
      } else {
        await register(username, email, password);
      }

      navigate('/dashboard', {
        replace: true,
        state: { successMessage: 'Registro exitoso. Ya puedes empezar a estudiar.' },
      });
    } catch (err: any) {
      setLocalError(mapFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setLocalError('');
    try {
      setSubmitting(true);
      const result = await signInWithGoogle();
      if (result.onboardingRequired) {
        navigate('/register', {
          replace: true,
          state: {
            googleOnboarding: true,
            tempUser: result.tempUser,
          },
        });
        return;
      }
      navigate('/dashboard', {
        replace: true,
        state: { successMessage: 'Registro exitoso con Google.' },
      });
    } catch (err: any) {
      setLocalError(mapFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-container split-layout" aria-label="Página de registro de cuenta de StudyRoom">
      <section className="info-panel" aria-labelledby="branding-heading">
        <div className="branding-container">
          <div className="branding-logo" tabIndex={1} aria-label="Logo de StudyRoom">SR</div>
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

      <section className="form-panel" aria-labelledby="register-title">
        <div className="form-card-wrapper">
          <div className="form-header">
            <h2 id="register-title" className="form-main-title">
              {googleOnboarding ? 'Completar Registro' : 'Crea tu Cuenta'}
            </h2>
            <p className="form-subtitle">
              {googleOnboarding
                ? 'Solo falta elegir un nombre de usuario.'
                : 'Comienza a estudiar de manera inteligente'}
            </p>
          </div>

          <div className="toggle-tab-container" role="tablist">
            <Link
              to="/login"
              tabIndex={7}
              className="toggle-tab inactive"
              role="tab"
              aria-selected="false"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              Iniciar sesión
            </Link>
            <button className="toggle-tab active" role="tab" aria-selected="true" tabIndex={-1}>
              Registrarse
            </button>
          </div>

          {(localError || error) && (
            <div className="alert-box-light alert-danger-light" role="alert">
              ❌ {localError || error}
            </div>
          )}

          {googleOnboarding && tempUser && (
            <div className="user-pill">
              <span className="user-avatar">👤</span>
              <div>
                <div className="user-pill-name">{tempUser.email}</div>
                <div className="user-pill-email">Cuenta de Google detectada</div>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailRegister} noValidate>
            <div className="form-group-light">
              <label className="form-label-light" htmlFor="username-register">
                Nombre de Usuario
              </label>
              <input
                id="username-register"
                tabIndex={2}
                type="text"
                className="form-input-light"
                placeholder="ej. kevinburgos"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
              />

              {username.trim().length > 0 && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
                  {checkingUsername && <span style={{ color: '#1e40af' }}>🔄 Comprobando disponibilidad...</span>}
                  {!checkingUsername && usernameTaken && (
                    <span style={{ color: '#dc2626' }}>❌ Username ya existe</span>
                  )}
                </div>
              )}
            </div>

            {!googleOnboarding && (
              <>
                <div className="form-group-light">
                  <label className="form-label-light" htmlFor="email-register">
                    Correo electrónico
                  </label>
                  <input
                    id="email-register"
                    tabIndex={3}
                    type="email"
                    className="form-input-light"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group-light">
                  <label className="form-label-light" htmlFor="password-register">
                    Contraseña
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="password-register"
                      tabIndex={4}
                      type={showPassword ? 'text' : 'password'}
                      className="form-input-light password-field"
                      placeholder="Min. 6 caracteres"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
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
              </>
            )}

            <button
              type="submit"
              tabIndex={5}
              className="btn-primary-light"
              disabled={submitting || checkingUsername || usernameTaken}
            >
              {submitting
                ? 'Procesando...'
                : googleOnboarding
                  ? 'Confirmar e Ingresar'
                  : 'Registrarse'}
            </button>
          </form>

          {!googleOnboarding && (
            <>
              <div className="social-divider">
                <span>o continúa con</span>
              </div>

              <button
                type="button"
                tabIndex={6}
                className="btn-google-light"
                onClick={handleGoogle}
                disabled={submitting}
              >
                <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continuar con Google
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

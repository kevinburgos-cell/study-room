import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Error handled by AuthContext
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
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-container split-layout" aria-label="Página de inicio de sesión de StudyRoom">
      
      {/* Left panel: Info Panel (Dark Theme) */}
      <section className="info-panel" aria-labelledby="branding-heading">
        <div className="branding-container">
          <div className="branding-logo">SR</div>
          <span className="branding-text">StudyRoom</span>
        </div>
        
        <div className="info-content">
          <h1 id="branding-heading" className="info-title">
            Domina tus <span className="highlight-text">salas de estudio</span>
          </h1>
          <p className="info-desc">
            Optimiza tu tiempo y mejora tu rendimiento en una plataforma diseñada para el éxito académico y colaborativo.
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
      <section className="form-panel" aria-labelledby="login-title">
        <div className="form-card-wrapper">
          <div className="form-header">
            <h2 id="login-title" className="form-main-title">Bienvenido</h2>
            <p className="form-subtitle">Accede a tu cuenta para continuar</p>
          </div>

          {/* Toggle pill selector */}
          <div className="toggle-tab-container" role="tablist">
            <button 
              className="toggle-tab active" 
              role="tab" 
              aria-selected="true"
              aria-label="Pestaña Iniciar Sesión"
            >
              Iniciar sesión
            </button>
            <Link 
              to="/register" 
              className="toggle-tab inactive" 
              role="tab" 
              aria-selected="false"
              aria-label="Ir a la pestaña Registrarse"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              Registrarse
            </Link>
          </div>

          {(error || authError) && (
            <div className="alert-box-light alert-danger-light" role="alert">
              ❌ {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-light">
              <label className="form-label-light" htmlFor="email-login">
                Correo electrónico
              </label>
              <input
                id="email-login"
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

            <div className="form-group-light" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label-light" htmlFor="password-login" style={{ margin: 0 }}>
                  Contraseña
                </label>
                <a href="#forgot" className="forgot-password-link" aria-label="¿Olvidaste tu contraseña?">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password-login"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input-light password-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  aria-required="true"
                  aria-label="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-light"
              disabled={submitting}
              aria-label="Iniciar Sesión en StudyRoom"
            >
              {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Google Sign-In Button */}
          <div className="social-divider">
            <span>o continúa con</span>
          </div>

          <button
            type="button"
            className="btn-google-light"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            aria-label="Iniciar sesión con Google"
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
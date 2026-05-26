import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';

interface LoginPageProps {
  isAuthenticated: boolean;
  onLogin: () => void;
}

export default function LoginPage({ isAuthenticated, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    onLogin(); // Activa el estado de autenticación simulado
  };

  return (
    <main className="auth-container" aria-label="Página de inicio de sesión">
      <section className="glass-panel auth-card" aria-labelledby="login-title">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="logo-icon" style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}>SR</div>
          </div>
          <h1 id="login-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>StudyRoom</h1>
          <p className="page-title-desc">Tu espacio virtual de estudio colaborativo</p>
        </div>

        <div className="auth-simulator-banner">
          <strong>Modo Simulación:</strong> Puedes ingresar cualquier correo y contraseña para probar el acceso.
        </div>

        {error && (
          <div className="alert-box" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Correo Electrónico
            </label>
            <input
              id="email-input"
              type="email"
              className="form-input interactive-element"
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-label="Ingresa tu correo electrónico"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="password-input" style={{ margin: 0 }}>
                Contraseña
              </label>
            </div>
            <input
              id="password-input"
              type="password"
              className="form-input interactive-element"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              aria-label="Ingresa tu contraseña"
            />
          </div>

          <button
            type="submit"
            className="btn-primary interactive-element"
            aria-label="Iniciar sesión en tu cuenta de StudyRoom"
          >
            Iniciar Sesión
          </button>
        </form>

        <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="interactive-element" aria-label="Ir a la página de registro" style={{ fontWeight: 600 }}>
            Regístrate gratis
          </Link>

        </footer>
      </section>
    </main>
  );
}
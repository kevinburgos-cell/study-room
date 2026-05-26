import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';

interface RegisterPageProps {
  isAuthenticated: boolean;
  onRegister: () => void;
}

export default function RegisterPage({ isAuthenticated, onRegister }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    onRegister(); // Activa el estado de autenticación simulado
  };

  return (
    <main className="auth-container" aria-label="Página de registro de cuenta">
      <section className="glass-panel auth-card" aria-labelledby="register-title">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="logo-icon" style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}>SR</div>
          </div>
          <h1 id="register-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Crea tu Cuenta</h1>
          <p className="page-title-desc">Únete a salas virtuales de estudio</p>
        </div>

        {error && (
          <div className="alert-box" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name-input">
              Nombre Completo
            </label>
            <input
              id="name-input"
              type="text"
              className="form-input interactive-element"
              placeholder="Kevin Burgos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-required="true"
              aria-label="Ingresa tu nombre completo"
            />
          </div>

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
              aria-label="Ingresa tu correo electrónico de registro"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password-input">
              Contraseña
            </label>
            <input
              id="password-input"
              type="password"
              className="form-input interactive-element"
              placeholder="Min. 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              aria-label="Ingresa una contraseña segura de 8 o más caracteres"
            />
          </div>

          <button
            type="submit"
            className="btn-primary interactive-element"
            aria-label="Registrar nueva cuenta e iniciar sesión"
          >
            Registrarse e Ingresar
          </button>
        </form>

        <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="interactive-element" aria-label="Ir a iniciar sesión" style={{ fontWeight: 600 }}>
            Inicia Sesión
          </Link>
        </footer>
      </section>
    </main>
  );
}

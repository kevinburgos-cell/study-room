import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component restricts route access to authenticated users.
 * If the user is unauthenticated, they are redirected to /login.
 * Displays a professional full-screen loading state during verification.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <main 
        className="auth-container" 
        style={{ flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}
        aria-label="Verificando credenciales de acceso"
      >
        <div className="spinner"></div>
        <p style={{ fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
          Verificando sesión segura...
        </p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

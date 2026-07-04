import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const RoomPage = React.lazy(() => import('./pages/RoomPage'));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-200">
      Loading...
    </div>
  );
}

/**
 * AppContent contains routes for the application.
 * Utilizes useAuth context to hook up authentication events and routes.
 */
function AppContent() {
  const { signOut, user } = useAuth();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage onLogout={() => setIsLogoutConfirmOpen(true)} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage onLogout={() => setIsLogoutConfirmOpen(true)} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms/:id"
            element={
              <ProtectedRoute>
                <RoomPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Suspense>

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-5 text-white shadow-2xl">
            <h2 className="mb-3 text-lg font-semibold text-slate-100">🚪 Cerrar Sesión</h2>
            <p className="mb-4 text-sm text-slate-300">¿Seguro que deseas cerrar sesión?</p>
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                className="rounded-xl px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition" 
                onClick={() => setIsLogoutConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition" 
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  signOut();
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * App main component wraps the entire SPA inside our global AuthProvider context.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

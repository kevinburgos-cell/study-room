import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoogleOnboardingPage from './pages/GoogleOnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';

/**
 * AppContent contains routes for the application.
 * Utilizes useAuth context to hook up authentication events and routes.
 */
function AppContent() {
  const { logout } = useAuth();

  return (
    <Routes>
      {/* Home redirects to Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/google-onboard" element={<GoogleOnboardingPage />} />

      {/* Protected study workspace routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage onLogout={logout} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage onLogout={logout} />
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

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
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

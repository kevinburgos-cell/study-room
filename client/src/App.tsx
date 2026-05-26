import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RoomPage from './pages/RoomPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Simulated Login Handler
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Simulated Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Home redirects to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public auth routes - if logged in, they redirect to /dashboard */}
        <Route 
          path="/login" 
          element={
            <LoginPage 
              isAuthenticated={isAuthenticated} 
              onLogin={handleLogin} 
            />
          } 
        />
        <Route 
          path="/register" 
          element={
            <RegisterPage 
              isAuthenticated={isAuthenticated} 
              onRegister={handleLogin} 
            />
          } 
        />

        {/* Protected study workspace routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProfilePage onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/rooms/:id" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RoomPage />
            </ProtectedRoute>
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

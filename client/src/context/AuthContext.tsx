import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  isMockFirebase,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  FirebaseUser
} from '../firebase';

interface UserProfile {
  uid: string;
  username: string;
  name: string;
  email: string;
  bio: string;
  studyGoal: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ onboardingRequired: boolean; tempUser?: { uid: string; email: string; name: string } }>;
  completeGoogleOnboard: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, bio: string, studyGoal: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tempGoogleToken, setTempGoogleToken] = useState<string | null>(null);

  // Sync session on mount
  useEffect(() => {
    if (isMockFirebase) {
      // Simulation mode
      const saved = localStorage.getItem('study_room_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          
          // Save token for API calls
          localStorage.setItem('auth_token', token);

          // Get profile from backend
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            console.warn('Could not sync user profile from backend on reload. Logging out.');
            setUser(null);
            localStorage.removeItem('auth_token');
          }
        } else {
          setUser(null);
          localStorage.removeItem('auth_token');
        }
      } catch (err) {
        console.error('Error syncing auth state:', err);
        setError('Error al conectar con la base de datos.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      if (isMockFirebase) {
        // Simulate login
        const storedUsersStr = localStorage.getItem('study_room_users_mock') || '[]';
        const storedUsers = JSON.parse(storedUsersStr);
        const match = storedUsers.find((u: UserProfile) => u.email === email.trim().toLowerCase());
        
        // Let's create a default if no users are stored yet for easy dev testing
        if (!match && email === 'kevin@ejemplo.com') {
          const defaultUser = {
            uid: 'mock_uid_kevin',
            username: 'KevinBurgos',
            name: 'Kevin Burgos',
            email: 'kevin@ejemplo.com',
            bio: 'Estudiante de Ingeniería de Software. Apasionado por la web y la IA.',
            studyGoal: '25',
            createdAt: new Date().toISOString()
          };
          setUser(defaultUser);
          localStorage.setItem('study_room_user', JSON.stringify(defaultUser));
          setLoading(false);
          return;
        }

        if (match) {
          setUser(match);
          localStorage.setItem('study_room_user', JSON.stringify(match));
        } else {
          throw new Error('Credenciales inválidas. En simulación, regístrate primero.');
        }
      } else {
        if (!auth) throw new Error('Firebase Auth no está inicializado.');
        
        // 1. Firebase Auth Client Sign In
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        const token = await credentials.user.getIdToken();
        localStorage.setItem('auth_token', token);

        // 2. Fetch full profile from database
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          throw new Error('Error al recuperar perfil de usuario en base de datos.');
        }
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Error al iniciar sesión. Por favor, verifica tu correo y contraseña.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Correo o contraseña incorrectos.';
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Call backend directly to perform unified validation & persistence
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar el usuario.');
      }

      if (isMockFirebase) {
        // Store in mock storage
        const storedUsersStr = localStorage.getItem('study_room_users_mock') || '[]';
        const storedUsers = JSON.parse(storedUsersStr);
        storedUsers.push(data.user);
        localStorage.setItem('study_room_users_mock', JSON.stringify(storedUsers));
        setUser(data.user);
        localStorage.setItem('study_room_user', JSON.stringify(data.user));
      } else {
        if (!auth) throw new Error('Firebase Auth no está inicializado.');
        
        // Log in the client now using the created credentials to trigger state change
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        const token = await credentials.user.getIdToken();
        localStorage.setItem('auth_token', token);
        setUser(data.user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al completar el registro.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      let idToken: string;
      
      if (isMockFirebase) {
        // Simulate google login
        idToken = 'mock_google_id_token_' + Date.now();
      } else {
        if (!auth) throw new Error('Firebase Auth no está inicializado.');
        const result = await signInWithPopup(auth, googleProvider);
        idToken = await result.user.getIdToken();
      }

      // Sync with backend
      const res = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión con Google.');
      }

      if (data.status === 'ONBOARDING_REQUIRED') {
        // We save the token temporarily to allow onboarding
        setTempGoogleToken(idToken);
        return { onboardingRequired: true, tempUser: data.tempUser };
      } else {
        localStorage.setItem('auth_token', idToken);
        setUser(data.user);
        if (isMockFirebase) {
          localStorage.setItem('study_room_user', JSON.stringify(data.user));
        }
        return { onboardingRequired: false };
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al iniciar sesión con Google.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleOnboard = async (username: string) => {
    const token = tempGoogleToken || localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Sesión de Google no encontrada. Por favor reintenta.');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/google-onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken: token, username })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar nombre de usuario.');
      }

      localStorage.setItem('auth_token', token);
      setUser(data.user);
      if (isMockFirebase) {
        localStorage.setItem('study_room_user', JSON.stringify(data.user));
        const storedUsersStr = localStorage.getItem('study_room_users_mock') || '[]';
        const storedUsers = JSON.parse(storedUsersStr);
        storedUsers.push(data.user);
        localStorage.setItem('study_room_users_mock', JSON.stringify(storedUsers));
      }
      setTempGoogleToken(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al completar el registro.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!isMockFirebase && auth) {
        await signOut(auth);
      }
      setUser(null);
      setTempGoogleToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('study_room_user');
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (name: string, bio: string, studyGoal: string) => {
    setError(null);
    const token = localStorage.getItem('auth_token') || 'mock_uid_kevin';
    try {
      const res = await fetch(`${API_URL}/auth/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, bio, studyGoal })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil.');
      }

      setUser(data.user);
      if (isMockFirebase) {
        localStorage.setItem('study_room_user', JSON.stringify(data.user));
        
        // Sync mock users storage as well
        const storedUsersStr = localStorage.getItem('study_room_users_mock') || '[]';
        const storedUsers = JSON.parse(storedUsersStr);
        const userIndex = storedUsers.findIndex((u: any) => u.uid === data.user.uid);
        if (userIndex !== -1) {
          storedUsers[userIndex] = data.user;
          localStorage.setItem('study_room_users_mock', JSON.stringify(storedUsers));
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al actualizar perfil.');
      throw err;
    }
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      error,
      login,
      register,
      loginWithGoogle,
      completeGoogleOnboard,
      logout,
      updateUserProfile,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};

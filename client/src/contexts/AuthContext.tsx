import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  AppUser,
  completeGoogleUsername,
  getProfile,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  updateProfileData,
} from '../firebase/auth';

type AuthContextType = {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<
    | { onboardingRequired: false; profile: AppUser | null }
    | { onboardingRequired: true; tempUser: { uid: string; email: string; photoURL: string | null } }
  >;
  completeGoogleOnboarding: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (name: string, bio: string, studyGoal: string) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid: string;
    email: string;
    photoURL: string | null;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await getProfile(currentUser.uid);
      setUser(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const res = await loginWithEmail({ email, password });
      setUser(res.profile);
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setError(null);
    try {
      const res = await registerWithEmail({ username, email, password });
      setUser(res.profile);
    } catch (err: any) {
      setError(err?.message || 'Error al registrarse');
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const res = await loginWithGoogle();
      if (res.onboardingRequired) {
        setPendingGoogleUser({
          uid: res.user.uid,
          email: res.user.email || '',
          photoURL: res.user.photoURL,
        });
        return {
          onboardingRequired: true as const,
          tempUser: {
            uid: res.user.uid,
            email: res.user.email || '',
            photoURL: res.user.photoURL,
          },
        };
      }

      setUser(res.profile);
      return { onboardingRequired: false as const, profile: res.profile };
    } catch (err: any) {
      setError(err?.message || 'Error con Google');
      throw err;
    }
  };

  const completeGoogleOnboarding = async (username: string) => {
    setError(null);
    try {
      const current = auth.currentUser;
      const source = pendingGoogleUser || {
        uid: current?.uid || '',
        email: current?.email || '',
        photoURL: current?.photoURL || null,
      };

      if (!source.uid || !source.email) {
        throw new Error('No se encontró la sesión de Google');
      }

      const profile = await completeGoogleUsername({
        uid: source.uid,
        email: source.email,
        username,
        photoURL: source.photoURL,
      });

      setUser(profile);
      setPendingGoogleUser(null);
    } catch (err: any) {
      setError(err?.message || 'Error al completar Google');
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await logout();
      setUser(null);
      setFirebaseUser(null);
      setPendingGoogleUser(null);
    } catch (err: any) {
      setError(err?.message || 'Error al cerrar sesión');
      throw err;
    }
  };

  const updateUserProfile = async (name: string, bio: string, studyGoal: string) => {
    if (!auth.currentUser) {
      throw new Error('No hay sesión activa');
    }

    setError(null);
    try {
      const profile = await updateProfileData({
        uid: auth.currentUser.uid,
        name,
        bio,
        studyGoal,
      });

      setUser(profile);
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar perfil');
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      error,
      login,
      register,
      signInWithGoogle,
      completeGoogleOnboarding,
      signOut,
      updateUserProfile,
      clearError: () => setError(null),
    }),
    [user, firebaseUser, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

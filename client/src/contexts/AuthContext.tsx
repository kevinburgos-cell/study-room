import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  User,
  updateEmail as updateFirebaseEmail,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import {
  AppUser,
  completeGoogleUsername,
  deleteAccountData,
  deleteFirebaseAccount,
  getProfile,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  updateProfileData,
} from '../firebase/auth';

type AuthContextValue = {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<{
    onboardingRequired: boolean;
    tempUser: { uid: string; email: string; photoURL: string | null } | null;
  }>;
  completeGoogleOnboarding: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (username: string, photoURL: string | null) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  deleteCurrentAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    return unsubscribe;
  }, []);

  const clearError = () => setError('');

  const withErrorHandling = async <T,>(fn: () => Promise<T>) => {
    try {
      setError('');
      return await fn();
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado');
      throw err;
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    firebaseUser,
    loading,
    error,
    clearError,
    login: async (email, password) => {
      const result = await withErrorHandling(() => loginWithEmail({ email, password }));
      setFirebaseUser(result.user);
      setUser(result.profile);
    },
    register: async (username, email, password) => {
      const result = await withErrorHandling(() => registerWithEmail({ username, email, password }));
      setFirebaseUser(result.user);
      setUser(result.profile);
    },
    signInWithGoogle: async () => {
      const result = await withErrorHandling(() => loginWithGoogle());
      setFirebaseUser(result.user);
      setUser(result.profile);
      return {
        onboardingRequired: result.onboardingRequired,
        tempUser: {
          uid: result.user.uid,
          email: result.user.email || '',
          photoURL: result.user.photoURL,
        },
      };
    },
    completeGoogleOnboarding: async (username) => {
      if (!firebaseUser) {
        throw new Error('No hay sesión activa');
      }

      await withErrorHandling(async () => {
        const profile = await completeGoogleUsername({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          username,
          photoURL: firebaseUser.photoURL,
        });
        setUser(profile);
        await updateFirebaseProfile(firebaseUser, { displayName: username });
      });
    },
    signOut: async () => {
      await withErrorHandling(async () => {
        await logout();
        setFirebaseUser(null);
        setUser(null);
      });
    },
    updateUserProfile: async (username, photoURL) => {
      if (!firebaseUser) {
        throw new Error('No hay sesión activa');
      }

      const profile = await withErrorHandling(async () => {
        const updated = await updateProfileData({
          uid: firebaseUser.uid,
          username,
          photoURL,
        });

        await updateFirebaseProfile(firebaseUser, {
          displayName: updated?.username || username,
          photoURL: photoURL || null,
        });

        return updated;
      });

      setUser(profile);
    },
    updateUserEmail: async (email) => {
      if (!firebaseUser) {
        throw new Error('No hay sesión activa');
      }

      const providerIds = firebaseUser.providerData.map((provider) => provider.providerId);
      if (providerIds.includes('google.com')) {
        throw new Error('El correo no se puede editar en cuentas de Google');
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new Error('Ingresa un correo válido');
      }

      await withErrorHandling(async () => {
        await updateFirebaseEmail(firebaseUser, normalizedEmail);
        await updateDoc(doc(db, 'users', firebaseUser.uid), { email: normalizedEmail });
        setFirebaseUser({ ...firebaseUser, email: normalizedEmail });
        setUser((current) => (current ? { ...current, email: normalizedEmail } : current));
      });
    },
    deleteCurrentAccount: async () => {
      if (!firebaseUser) {
        throw new Error('No hay sesión activa');
      }

      await withErrorHandling(async () => {
        await deleteAccountData(firebaseUser.uid);
        await deleteFirebaseAccount();
        setFirebaseUser(null);
        setUser(null);
      });
    },
  }), [user, firebaseUser, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

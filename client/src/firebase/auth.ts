import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './config';

export type AppUser = {
  uid: string;
  email: string;
  username: string;
  photoURL: string | null;
  createdAt: unknown;
  name?: string;
  bio?: string;
  studyGoal?: string;
};

const usersRef = collection(db, 'users');
const usernamesRef = collection(db, 'usernames');

export function mapFirebaseError(error: any): string {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'Email ya en uso';
    case 'auth/invalid-email':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'Credenciales incorrectas';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres';
    case 'auth/popup-closed-by-user':
      return 'Se cerró Google antes de completar el acceso';
    default:
      return error?.message || 'Ocurrió un error inesperado';
  }
}

export async function usernameExists(username: string) {
  const normalized = username.trim().toLowerCase();
  const snap = await getDoc(doc(db, 'usernames', normalized));
  return snap.exists();
}

async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

async function createUserProfile(params: {
  uid: string;
  email: string;
  username: string;
  photoURL: string | null;
}) {
  const payload = {
    uid: params.uid,
    email: params.email.trim().toLowerCase(),
    username: params.username.trim(),
    photoURL: params.photoURL || null,
    createdAt: serverTimestamp(),
  };

  const normalized = params.username.trim().toLowerCase();
  const userRef = doc(db, 'users', params.uid);
  const usernameRef = doc(db, 'usernames', normalized);

  await runTransaction(db, async (transaction) => {
    const usernameSnap = await transaction.get(usernameRef);
    if (usernameSnap.exists()) {
      throw new Error('Username ya existe');
    }

    transaction.set(usernameRef, {
      uid: params.uid,
      username: params.username.trim(),
      createdAt: serverTimestamp(),
    });
    transaction.set(userRef, payload);
  });

  return payload;
}

export async function registerWithEmail(params: {
  username: string;
  email: string;
  password: string;
}) {
  const username = params.username.trim();
  const email = params.email.trim().toLowerCase();

  if (!username || !email || !params.password) {
    throw new Error('Completa todos los campos');
  }

  if (await usernameExists(username)) {
    throw new Error('Username ya existe');
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    params.password
  );

  await updateProfile(credential.user, { displayName: username });
  await createUserProfile({
    uid: credential.user.uid,
    email,
    username,
    photoURL: credential.user.photoURL,
  });

  return {
    user: credential.user,
    profile: await getUserProfile(credential.user.uid),
  };
}

export async function loginWithEmail(params: {
  email: string;
  password: string;
}) {
  if (!params.email.trim() || !params.password) {
    throw new Error('Completa todos los campos');
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    params.email.trim().toLowerCase(),
    params.password
  );

  return {
    user: credential.user,
    profile: await getUserProfile(credential.user.uid),
  };
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;
  const profile = await getUserProfile(firebaseUser.uid);

  if (profile) {
    return { user: firebaseUser, profile, onboardingRequired: false as const };
  }

  return {
    user: firebaseUser,
    profile: null,
    onboardingRequired: true as const,
  };
}

export async function completeGoogleUsername(params: {
  uid: string;
  email: string;
  username: string;
  photoURL: string | null;
}) {
  const username = params.username.trim();

  if (!username) {
    throw new Error('Completa el username');
  }

  if (await usernameExists(username)) {
    throw new Error('Username ya existe');
  }

  await createUserProfile({
    uid: params.uid,
    email: params.email,
    username,
    photoURL: params.photoURL,
  });

  await updateProfile(auth.currentUser as any, { displayName: username });
  return await getUserProfile(params.uid);
}

export async function logout() {
  await firebaseSignOut(auth);
}

export async function getProfile(uid: string) {
  return await getUserProfile(uid);
}

export async function updateProfileData(params: {
  uid: string;
  name: string;
  bio: string;
  studyGoal: string;
}) {
  await updateDoc(doc(db, 'users', params.uid), {
    name: params.name,
    bio: params.bio,
    studyGoal: params.studyGoal,
  });

  return await getUserProfile(params.uid);
}

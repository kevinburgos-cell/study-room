import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if configuration is realistic or mock
const isMockFirebase = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('MOCK_KEY');

let app;
let auth: ReturnType<typeof getAuth>;
const googleProvider = new GoogleAuthProvider();

// Apply custom scopes if needed
googleProvider.addScope('profile');
googleProvider.addScope('email');

if (!isMockFirebase) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    console.log('Firebase Client SDK initialized with project:', firebaseConfig.projectId);
  } catch (error) {
    console.error('Firebase Client SDK initialization failed, falling back to mock mode:', error);
  }
} else {
  console.warn('Firebase configured in SIMULATION/MOCK mode. Using mock auth provider.');
}

export { 
  auth, 
  googleProvider, 
  isMockFirebase,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup
};
export type { FirebaseUser };

import admin from 'firebase-admin';

/**
 * Verifies a Firebase ID token using the admin SDK.
 * Returns the decoded token containing uid, name, picture, email, etc.
 */
export async function verifyFirebaseToken(token: string) {
  if (!token) {
    throw new Error('El token de autenticación es obligatorio');
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    console.error('Error in verifyFirebaseToken:', error.message || error);
    throw new Error('Token inválido o expirado');
  }
}



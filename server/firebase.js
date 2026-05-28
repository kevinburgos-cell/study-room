const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Determine path to firebase credentials
const credPath = process.env.FIREBASE_CREDENTIALS_PATH || './firebase-service-account.json';
const absoluteCredPath = path.resolve(__dirname, credPath);

let serviceAccount;
try {
  if (fs.existsSync(absoluteCredPath)) {
    serviceAccount = require(absoluteCredPath);
  } else {
    // If the file doesn't exist, we fallback to environment variables or local mock in development
    console.warn(`Firebase service account file not found at ${absoluteCredPath}. Falling back to default or mock.`);
  }
} catch (error) {
  console.error('Error reading service account key:', error);
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully with project:', serviceAccount.project_id);
} else {
  // If no credentials, we initialize in simulation/mock mode
  console.warn('Initializing Firebase in MOCK/SIMULATION mode because credentials are missing.');
}

const db = serviceAccount ? admin.firestore() : null;
const auth = serviceAccount ? admin.auth() : null;

module.exports = {
  admin,
  db,
  auth,
  isMock: !serviceAccount
};

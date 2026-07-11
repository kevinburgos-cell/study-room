const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

function loadServiceAccountFromFile() {
  const credPath = process.env.FIREBASE_CREDENTIALS_PATH || './firebase-service-account.json';
  const absoluteCredPath = path.resolve(__dirname, credPath);

  if (!fs.existsSync(absoluteCredPath)) {
    console.warn(`Firebase service account file not found at ${absoluteCredPath}.`);
    return null;
  }

  try {
    return require(absoluteCredPath);
  } catch (error) {
    console.error('Error reading service account key file:', error);
    return null;
  }
}

function loadServiceAccountFromEnv() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
      }
      return parsed;
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY
      .replace(/^"|"$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .trim()
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

const serviceAccount = loadServiceAccountFromFile() || loadServiceAccountFromEnv();

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  const projectLabel = serviceAccount.project_id || serviceAccount.projectId || 'unknown';
  console.log('Firebase Admin SDK initialized successfully with project:', projectLabel);
} else {
  console.warn('Initializing Firebase in MOCK/SIMULATION mode because credentials are missing.');
}

const db = serviceAccount ? admin.firestore() : null;
const auth = serviceAccount ? admin.auth() : null;
const projectId = serviceAccount ? (serviceAccount.project_id || serviceAccount.projectId) : process.env.FIREBASE_PROJECT_ID;

module.exports = {
  admin,
  db,
  auth,
  isMock: !serviceAccount,
  projectId
};

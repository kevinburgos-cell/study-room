import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { initializeSockets } from './socket';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URLS = (process.env.CLIENT_URLS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Setup basic Express middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'study-room-realtime' });
});

// Initialize Firebase Admin SDK
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
      console.error('[Firebase] Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim()
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

function loadServiceAccountFromFile() {
  const credPath = process.env.FIREBASE_CREDENTIALS_PATH || './firebase-service-account.json';
  const absoluteCredPath = path.resolve(__dirname, '..', credPath);

  if (!fs.existsSync(absoluteCredPath)) {
    console.warn(`[Firebase] Service account file not found at ${absoluteCredPath}.`);
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(absoluteCredPath);
  } catch (error) {
    console.error('[Firebase] Error reading service account key file:', error);
    return null;
  }
}

const serviceAccountFromEnv = loadServiceAccountFromEnv();
const serviceAccountFromFile = loadServiceAccountFromFile();
const serviceAccount = serviceAccountFromEnv || serviceAccountFromFile;

if (serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    const projectLabel = (serviceAccount as any).project_id || (serviceAccount as any).projectId || 'unknown';
    console.log('[Firebase] Admin SDK initialized successfully for project:', projectLabel);
  } catch (err: any) {
    console.error('[Firebase] Failed to initialize Admin SDK with custom cert:', err.message || err);
    process.exit(1);
  }
} else {
  console.error('[Firebase] Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_* env vars, or FIREBASE_CREDENTIALS_PATH.');
  process.exit(1);
}

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.io with dynamic CORS origins
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URLS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

(io.engine as any).pingTimeout = 10000;
(io.engine as any).pingInterval = 5000;

// Initialize WebSockets logic
initializeSockets(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`[Server] Realtime WebSocket server is listening on port ${PORT}`);
  console.log(`[Server] Allowing CORS origins: ${CLIENT_URLS.join(', ')}`);
});

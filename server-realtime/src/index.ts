import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { initializeSockets } from './socket';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup basic Express middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'study-room-realtime' });
});

// Initialize Firebase Admin SDK
const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

import path from 'path';
import fs from 'fs';

if (credentialsPath) {
  try {
    const absolutePath = path.resolve(process.cwd(), credentialsPath);
    if (fs.existsSync(absolutePath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[Firebase] Admin SDK initialized using credentials file: ${credentialsPath}`);
    } else {
      throw new Error(`Credentials file not found at: ${absolutePath}`);
    }
  } catch (err: any) {
    console.error('[Firebase] Failed to initialize Admin SDK with file path:', err.message || err);
  }
} else if (projectId && clientEmail && privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[Firebase] Admin SDK initialized successfully with individual properties.');
  } catch (err: any) {
    console.error('[Firebase] Failed to initialize Admin SDK with custom cert:', err.message || err);
  }
} else {
  try {
    admin.initializeApp();
    console.log('[Firebase] Admin SDK initialized using default application credentials.');
  } catch (err) {
    console.warn(
      '[Firebase] Warning: Firebase credentials not set. WebSockets verifyToken will fail until configured.'
    );
  }
}

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.io with dynamic CORS origins
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173',
      CLIENT_URL
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize WebSockets logic
initializeSockets(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`[Server] Realtime WebSocket server is listening on port ${PORT}`);
  console.log(`[Server] Allowing CORS origins: http://localhost:5173 and ${CLIENT_URL}`);
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const socket_1 = require("./socket");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const CLIENT_URLS = (process.env.CLIENT_URLS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
// Setup basic Express middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        }
        catch (error) {
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
const serviceAccountFromEnv = loadServiceAccountFromEnv();
if (serviceAccountFromEnv) {
    try {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccountFromEnv),
        });
        const projectLabel = serviceAccountFromEnv.project_id || serviceAccountFromEnv.projectId || 'unknown';
        console.log('[Firebase] Admin SDK initialized successfully with env credentials for project:', projectLabel);
    }
    catch (err) {
        console.error('[Firebase] Failed to initialize Admin SDK with custom cert:', err.message || err);
        process.exit(1);
    }
}
else {
    console.error('[Firebase] Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or the individual FIREBASE_* env vars.');
    process.exit(1);
}
// Create HTTP server
const httpServer = (0, http_1.createServer)(app);
// Setup Socket.io with dynamic CORS origins
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: CLIENT_URLS,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
// Initialize WebSockets logic
(0, socket_1.initializeSockets)(io);
// Start server
httpServer.listen(PORT, () => {
    console.log(`[Server] Realtime WebSocket server is listening on port ${PORT}`);
    console.log(`[Server] Allowing CORS origins: ${CLIENT_URLS.join(', ')}`);
});

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
const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
if (credentialsPath) {
    try {
        const absolutePath = path_1.default.resolve(process.cwd(), credentialsPath);
        if (fs_1.default.existsSync(absolutePath)) {
            const serviceAccount = JSON.parse(fs_1.default.readFileSync(absolutePath, 'utf8'));
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
            console.log(`[Firebase] Admin SDK initialized using credentials file: ${credentialsPath}`);
        }
        else {
            throw new Error(`Credentials file not found at: ${absolutePath}`);
        }
    }
    catch (err) {
        console.error('[Firebase] Failed to initialize Admin SDK with file path:', err.message || err);
    }
}
else if (projectId && clientEmail && privateKey) {
    try {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        console.log('[Firebase] Admin SDK initialized successfully with individual properties.');
    }
    catch (err) {
        console.error('[Firebase] Failed to initialize Admin SDK with custom cert:', err.message || err);
    }
}
else {
    try {
        firebase_admin_1.default.initializeApp();
        console.log('[Firebase] Admin SDK initialized using default application credentials.');
    }
    catch (err) {
        console.warn('[Firebase] Warning: Firebase credentials not set. WebSockets verifyToken will fail until configured.');
    }
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

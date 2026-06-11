"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatHandlers = registerChatHandlers;
const verifyToken_1 = require("../middlewares/verifyToken");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const crypto_1 = __importDefault(require("crypto"));
function registerChatHandlers(io, socket) {
    socket.on('send-message', async (payload) => {
        const { roomId, text, token } = payload;
        const trimmedText = typeof text === 'string' ? text.trim() : '';
        if (!roomId || !trimmedText || !token) {
            socket.emit('error', { message: 'Faltan datos obligatorios para enviar el mensaje' });
            return;
        }
        if (trimmedText.length > 500) {
            socket.emit('error', { message: 'El mensaje no puede superar 500 caracteres' });
            return;
        }
        try {
            // 1. Verify token of Firebase
            const decodedToken = await (0, verifyToken_1.verifyFirebaseToken)(token);
            const uid = decodedToken.uid;
            const username = decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Estudiante');
            const photoURL = decodedToken.picture || null;
            // 2. Create message object
            const messageId = crypto_1.default.randomUUID();
            const message = {
                id: messageId,
                roomId,
                senderUid: uid,
                senderUsername: username,
                senderPhotoURL: photoURL,
                text: trimmedText,
                timestamp: new Date().toISOString()
            };
            // 3. Save to Firestore under rooms/{roomId}/messages/{messageId}
            try {
                const db = firebase_admin_1.default.firestore();
                await db.collection('rooms').doc(roomId).collection('messages').doc(messageId).set(message);
            }
            catch (dbError) {
                console.error('[Socket Chat] Failed to persist message to Firestore:', dbError.message || dbError);
                // Continue even if database is in mock or offline mode, but log it
            }
            // 4. Emit "new-message" to ALL in the room
            io.to(roomId).emit('new-message', message);
            console.log(`[Socket Chat] Message ${messageId} broadcasted to room ${roomId}`);
        }
        catch (err) {
            console.error('[Socket Chat] Error in send-message event:', err.message || err);
            socket.emit('error', { message: err.message || 'Error al enviar el mensaje' });
        }
    });
}

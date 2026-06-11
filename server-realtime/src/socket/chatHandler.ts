import { Server, Socket } from 'socket.io';
import { verifyFirebaseToken } from '../middlewares/verifyToken';
import admin from 'firebase-admin';
import crypto from 'crypto';

export function registerChatHandlers(io: Server, socket: Socket) {
  socket.on('send-message', async (payload: { roomId: string; text: string; token: string }) => {
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
      const decodedToken = await verifyFirebaseToken(token);
      const uid = decodedToken.uid;
      
      const username = decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Estudiante');
      const photoURL = decodedToken.picture || null;

      // 2. Create message object
      const messageId = crypto.randomUUID();
      const message = {
        id: messageId,
        roomId,
        senderUid: uid,
        senderUsername: username,
        senderPhotoURL: photoURL,
        text: trimmedText,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      // 3. Save to Firestore under rooms/{roomId}/messages/{messageId}
      const db = admin.firestore();
      await db.collection('rooms').doc(roomId).collection('messages').doc(messageId).set(message);
      console.log(`[Socket Chat] Message ${messageId} persisted in Firestore for room ${roomId}`);

      // 4. Emit "new-message" to ALL in the room with a serializable timestamp
      io.to(roomId).emit('new-message', {
        ...message,
        timestamp: new Date().toISOString(),
      });
      console.log(`[Socket Chat] Message ${messageId} broadcasted to room ${roomId}`);
    } catch (err: any) {
      console.error('[Socket Chat] Error in send-message event:', err.message || err);
      socket.emit('error', { message: 'No se pudo enviar el mensaje, intenta de nuevo' });
    }
  });
}

import { Server, Socket } from 'socket.io';
import { verifyFirebaseToken } from '../middlewares/verifyToken';
import { ConnectedUser, JoinRoomPayload, LeaveRoomPayload } from '../types/socket.types';

// In-memory storage for users in each room
export const connectedUsers: { [roomId: string]: ConnectedUser[] } = {};

export function registerRoomHandlers(io: Server, socket: Socket) {
  const emitRoomUsers = (roomId: string) => {
    io.to(roomId).emit('room-users', {
      users: (connectedUsers[roomId] || []).map(({ uid, username, photoURL }) => ({
        uid,
        username,
        photoURL,
      })),
    });
  };

  const emitExistingPeers = (roomId: string) => {
    const peersList = connectedUsers[roomId]
      .filter((u) => u.socketId !== socket.id)
      .map((u) => {
        const peerSocket = io.sockets.sockets.get(u.socketId);
        return {
          socketId: u.socketId,
          uid: u.uid,
          username: u.username,
          audioEnabled: Boolean(peerSocket?.data?.audioEnabled ?? u.audioEnabled ?? true),
          videoEnabled: Boolean(peerSocket?.data?.videoEnabled ?? u.videoEnabled ?? true),
          isScreenSharing: Boolean(peerSocket?.data?.isScreenSharing ?? u.isScreenSharing),
        };
      });

    console.log(`[Socket-Room] Emitting existing-peers list for ${socket.id}:`, JSON.stringify(peersList));
    socket.emit('existing-peers', { peers: peersList });
  };
  
  // 1. Join Room Event
  socket.on('join-room', async (payload: JoinRoomPayload) => {
    const { roomId, token } = payload;
    
    if (!roomId) {
      socket.emit('error', { message: 'El ID de la sala es obligatorio' });
      return;
    }

    try {
      // Verify token
      const decodedToken = await verifyFirebaseToken(token);
      const uid = decodedToken.uid;
      
      // Map user details
      const username = decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Estudiante');
      const photoURL = decodedToken.picture || null;

      // Join room in Socket.io
      socket.join(roomId);

      // Save socket metadata for automatic cleanup
      socket.data.roomId = roomId;
      socket.data.uid = uid;
      socket.data.username = username;
      socket.data.photoURL = photoURL;
      socket.data.audioEnabled = true;
      socket.data.videoEnabled = true;
      socket.data.isScreenSharing = false;

      if (!connectedUsers[roomId]) {
        connectedUsers[roomId] = [];
      }

      // Remove previous connections of the same user in this room to avoid duplicates
      connectedUsers[roomId] = connectedUsers[roomId].filter((u) => u.uid !== uid);

      const newUser: ConnectedUser = {
        uid,
        username,
        photoURL,
        socketId: socket.id,
        audioEnabled: true,
        videoEnabled: true,
        isScreenSharing: false,
      };

      connectedUsers[roomId].push(newUser);

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        uid: newUser.uid,
        username: newUser.username,
        photoURL: newUser.photoURL,
      });

      // Keep every client in the room synchronized with the full participants list
      emitRoomUsers(roomId);

      console.log(`[Socket-Room] User ${username} (${uid}, socket: ${socket.id}) joined room ${roomId}.`);

      // Emit existing peers list after a short delay to reduce WebRTC race conditions
      setTimeout(() => {
        emitExistingPeers(roomId);
      }, 500);
    } catch (err: any) {
      socket.emit('error', { message: err.message || 'Error al unirse a la sala' });
    }
  });

  socket.on('request-rejoin', (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId) return;
    setTimeout(() => {
      if (socket.connected && connectedUsers[roomId]?.some((u) => u.socketId !== socket.id)) {
        emitExistingPeers(roomId);
      } else if (socket.connected && connectedUsers[roomId]) {
        emitExistingPeers(roomId);
      }
    }, 500);
  });

  // 2. Leave Room Event
  socket.on('leave-room', (payload: LeaveRoomPayload) => {
    const { roomId } = payload;
    
    if (!roomId) return;

    socket.leave(roomId);

    // Clean up memory
    if (connectedUsers[roomId]) {
      const userLeaving = connectedUsers[roomId].find((u) => u.socketId === socket.id);
      connectedUsers[roomId] = connectedUsers[roomId].filter((u) => u.socketId !== socket.id);

      if (userLeaving) {
        socket.to(roomId).emit('user-left', {
          uid: userLeaving.uid,
          username: userLeaving.username,
        });
        emitRoomUsers(roomId);
        console.log(`[Socket] User ${userLeaving.username} left room ${roomId}`);
      }

      if (connectedUsers[roomId].length === 0) {
        delete connectedUsers[roomId];
      }
    }

    delete socket.data.roomId;
    delete socket.data.uid;
    delete socket.data.username;
    delete socket.data.photoURL;
    delete socket.data.audioEnabled;
    delete socket.data.videoEnabled;
    delete socket.data.isScreenSharing;
  });

  // 3. Delete Room Event
  socket.on('delete-room', (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId) return;
    io.to(roomId).emit('room-deleted', { roomId });
    console.log(`[Socket] Room ${roomId} was deleted. Notifying clients.`);
  });

  // 4. Disconnect Event (automatic)
  socket.on('disconnect', () => {
    // Search across all rooms to remove this socket and notify others
    for (const roomId in connectedUsers) {
      const idx = connectedUsers[roomId].findIndex((u) => u.socketId === socket.id);
      
      if (idx !== -1) {
        const userLeaving = connectedUsers[roomId][idx];
        connectedUsers[roomId].splice(idx, 1);

        io.to(roomId).emit('user-left', {
          uid: userLeaving.uid,
          username: userLeaving.username,
        });
        emitRoomUsers(roomId);

        console.log(`[Socket] User ${userLeaving.username} disconnected from room ${roomId}`);

        if (connectedUsers[roomId].length === 0) {
          delete connectedUsers[roomId];
        }
      }
    }
  });

  socket.on('heartbeat', (payload: { roomId: string; uid?: string }) => {
    if (payload?.roomId) {
      socket.emit('heartbeat-ack', {
        timestamp: Date.now(),
        roomId: payload.roomId,
        uid: payload.uid ?? socket.data.uid ?? null,
      });
    }
  });
}

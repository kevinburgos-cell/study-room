import { Server, Socket } from 'socket.io';
import { verifyFirebaseToken } from '../middlewares/verifyToken';
import { ConnectedUser, JoinRoomPayload, LeaveRoomPayload } from '../types/socket.types';

// In-memory storage for users in each room
const connectedUsers: { [roomId: string]: ConnectedUser[] } = {};

export function registerRoomHandlers(io: Server, socket: Socket) {
  
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
      (socket as any).roomId = roomId;
      (socket as any).uid = uid;

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
      };

      connectedUsers[roomId].push(newUser);

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        uid: newUser.uid,
        username: newUser.username,
        photoURL: newUser.photoURL,
      });

      // Send the current list of online users to the joining client
      socket.emit('room-users', {
        users: connectedUsers[roomId].map(({ uid, username, photoURL }) => ({
          uid,
          username,
          photoURL,
        })),
      });

      console.log(`[Socket] User ${username} (${uid}) joined room ${roomId}`);
    } catch (err: any) {
      socket.emit('error', { message: err.message || 'Error al unirse a la sala' });
    }
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
        console.log(`[Socket] User ${userLeaving.username} left room ${roomId}`);
      }

      if (connectedUsers[roomId].length === 0) {
        delete connectedUsers[roomId];
      }
    }

    delete (socket as any).roomId;
    delete (socket as any).uid;
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

        console.log(`[Socket] User ${userLeaving.username} disconnected from room ${roomId}`);

        if (connectedUsers[roomId].length === 0) {
          delete connectedUsers[roomId];
        }
      }
    }
  });
}

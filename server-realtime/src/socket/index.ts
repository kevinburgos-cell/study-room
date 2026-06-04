import { Server, Socket } from 'socket.io';
import { registerRoomHandlers } from './roomHandler';

export function initializeSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Register all feature handlers
    registerRoomHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

import { Server, Socket } from 'socket.io';

export function registerWebRTCHandlers(io: Server, socket: Socket) {
  // 1. Forward WebRTC offer to target peer
  socket.on('webrtc-offer', (payload: { roomId: string; targetSocketId: string; offer: any }) => {
    const { targetSocketId, offer, roomId } = payload;
    const uid = (socket as any).uid;
    
    console.log(`[Socket-WebRTC] Received webrtc-offer from ${socket.id} (uid: ${uid}) targeting ${targetSocketId} in room ${roomId}`);
    
    io.to(targetSocketId).emit('webrtc-offer', {
      offer,
      fromSocketId: socket.id,
      fromUid: uid
    });
  });

  // 2. Forward WebRTC answer to target peer
  socket.on('webrtc-answer', (payload: { roomId: string; targetSocketId: string; answer: any }) => {
    const { targetSocketId, answer, roomId } = payload;
    
    console.log(`[Socket-WebRTC] Received webrtc-answer from ${socket.id} targeting ${targetSocketId} in room ${roomId}`);
    
    io.to(targetSocketId).emit('webrtc-answer', {
      answer,
      fromSocketId: socket.id
    });
  });

  // 3. Forward ICE Candidate to target peer
  socket.on('webrtc-ice-candidate', (payload: { roomId: string; targetSocketId: string; candidate: any }) => {
    const { targetSocketId, candidate, roomId } = payload;
    
    console.log(`[Socket-WebRTC] Received webrtc-ice-candidate from ${socket.id} targeting ${targetSocketId} in room ${roomId}`);
    
    io.to(targetSocketId).emit('webrtc-ice-candidate', {
      candidate,
      fromSocketId: socket.id
    });
  });
}

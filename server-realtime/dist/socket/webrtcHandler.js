"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebRTCHandlers = registerWebRTCHandlers;
function registerWebRTCHandlers(io, socket) {
    // 1. Forward WebRTC offer to target peer
    socket.on('webrtc-offer', (payload) => {
        const { targetSocketId, offer, roomId } = payload;
        const uid = socket.uid;
        console.log(`[Socket-WebRTC] Received webrtc-offer from ${socket.id} (uid: ${uid}) targeting ${targetSocketId} in room ${roomId}`);
        io.to(targetSocketId).emit('webrtc-offer', {
            offer,
            fromSocketId: socket.id,
            fromUid: uid
        });
    });
    // 2. Forward WebRTC answer to target peer
    socket.on('webrtc-answer', (payload) => {
        const { targetSocketId, answer, roomId } = payload;
        console.log(`[Socket-WebRTC] Received webrtc-answer from ${socket.id} targeting ${targetSocketId} in room ${roomId}`);
        io.to(targetSocketId).emit('webrtc-answer', {
            answer,
            fromSocketId: socket.id
        });
    });
    // 3. Forward ICE Candidate to target peer
    socket.on('webrtc-ice-candidate', (payload) => {
        const { targetSocketId, candidate, roomId } = payload;
        console.log(`[Socket-WebRTC] Received webrtc-ice-candidate from ${socket.id} targeting ${targetSocketId} in room ${roomId}`);
        io.to(targetSocketId).emit('webrtc-ice-candidate', {
            candidate,
            fromSocketId: socket.id
        });
    });
    // 4. Broadcast media state changes (mic/camera) to all other peers in the room
    socket.on('webrtc-media-state', (payload) => {
        const { roomId, isMuted, isCameraOff } = payload;
        socket.isMuted = isMuted;
        socket.isCameraOff = isCameraOff;
        console.log(`[Socket-WebRTC] Media state from ${socket.id} in room ${roomId}: muted=${isMuted}, cameraOff=${isCameraOff}`);
        // Broadcast to everyone else in the room (not the sender)
        socket.to(roomId).emit('webrtc-media-state', {
            fromSocketId: socket.id,
            isMuted,
            isCameraOff,
        });
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebRTCHandlers = registerWebRTCHandlers;
function registerWebRTCHandlers(io, socket) {
    // 1. Forward WebRTC offer to target peer
    socket.on('webrtc-offer', (payload) => {
        const { targetSocketId, offer } = payload;
        const uid = socket.uid;
        io.to(targetSocketId).emit('webrtc-offer', {
            offer,
            fromSocketId: socket.id,
            fromUid: uid
        });
    });
    // 2. Forward WebRTC answer to target peer
    socket.on('webrtc-answer', (payload) => {
        const { targetSocketId, answer } = payload;
        io.to(targetSocketId).emit('webrtc-answer', {
            answer,
            fromSocketId: socket.id
        });
    });
    // 3. Forward ICE Candidate to target peer
    socket.on('webrtc-ice-candidate', (payload) => {
        const { targetSocketId, candidate } = payload;
        io.to(targetSocketId).emit('webrtc-ice-candidate', {
            candidate,
            fromSocketId: socket.id
        });
    });
}

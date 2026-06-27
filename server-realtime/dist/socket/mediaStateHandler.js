"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMediaStateHandler = registerMediaStateHandler;
const roomHandler_1 = require("./roomHandler");
function registerMediaStateHandler(io, socket) {
    socket.on('media-state-changed', (payload) => {
        const { roomId, audioEnabled, videoEnabled, isScreenSharing = false } = payload;
        const uid = socket.data?.uid || socket.uid;
        const username = socket.data?.username || socket.username || 'Estudiante';
        // Store on socket.data so roomHandler's emitExistingPeers can read it
        socket.data.audioEnabled = audioEnabled;
        socket.data.videoEnabled = videoEnabled;
        socket.data.isScreenSharing = isScreenSharing;
        if (roomHandler_1.connectedUsers[roomId]) {
            const user = roomHandler_1.connectedUsers[roomId].find((u) => u.socketId === socket.id);
            if (user) {
                user.audioEnabled = audioEnabled;
                user.videoEnabled = videoEnabled;
                user.isScreenSharing = isScreenSharing;
            }
        }
        console.log(`[Socket-Media] ${socket.id} (${uid}) in room ${roomId}: audio=${audioEnabled}, video=${videoEnabled}, screen=${isScreenSharing}`);
        socket.to(roomId).emit('peer-media-state', {
            uid,
            socketId: socket.id,
            username,
            audioEnabled,
            videoEnabled,
            isScreenSharing,
        });
    });
}

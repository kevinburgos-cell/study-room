"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMediaStateHandler = registerMediaStateHandler;
function registerMediaStateHandler(io, socket) {
    socket.on('media-state-changed', (payload) => {
        const { roomId, audioEnabled, videoEnabled, isScreenSharing = false } = payload;
        const uid = socket.uid;
        const username = socket.username || 'Estudiante';
        socket.audioEnabled = audioEnabled;
        socket.videoEnabled = videoEnabled;
        socket.isScreenSharing = isScreenSharing;
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectedUsers = void 0;
exports.registerRoomHandlers = registerRoomHandlers;
const verifyToken_1 = require("../middlewares/verifyToken");
// In-memory storage for users in each room
exports.connectedUsers = {};
function registerRoomHandlers(io, socket) {
    const emitRoomUsers = (roomId) => {
        io.to(roomId).emit('room-users', {
            users: (exports.connectedUsers[roomId] || []).map(({ uid, username, photoURL }) => ({
                uid,
                username,
                photoURL,
            })),
        });
    };
    const emitExistingPeers = (roomId) => {
        const peersList = exports.connectedUsers[roomId]
            .filter((u) => u.socketId !== socket.id)
            .map((u) => {
            const peerSocket = io.sockets.sockets.get(u.socketId);
            return {
                socketId: u.socketId,
                uid: u.uid,
                username: u.username,
                photoURL: u.photoURL,
                audioEnabled: Boolean(peerSocket?.data?.audioEnabled ?? u.audioEnabled ?? true),
                videoEnabled: Boolean(peerSocket?.data?.videoEnabled ?? u.videoEnabled ?? true),
                isScreenSharing: Boolean(peerSocket?.data?.isScreenSharing ?? u.isScreenSharing),
            };
        });
        console.log(`[Socket-Room] Emitting existing-peers list for ${socket.id}:`, JSON.stringify(peersList));
        socket.emit('existing-peers', { peers: peersList });
    };
    // 1. Join Room Event
    socket.on('join-room', async (payload) => {
        const { roomId, token } = payload;
        if (!roomId) {
            socket.emit('error', { message: 'El ID de la sala es obligatorio' });
            return;
        }
        try {
            // Verify token
            const decodedToken = await (0, verifyToken_1.verifyFirebaseToken)(token);
            const uid = decodedToken.uid;
            // Map user details
            const username = payload.username?.trim() || decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Estudiante');
            const photoURL = payload.photoURL || decodedToken.picture || null;
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
            if (!exports.connectedUsers[roomId]) {
                exports.connectedUsers[roomId] = [];
            }
            // Remove previous connections of the same user in this room to avoid duplicates
            exports.connectedUsers[roomId] = exports.connectedUsers[roomId].filter((u) => u.uid !== uid);
            const newUser = {
                uid,
                username,
                photoURL,
                socketId: socket.id,
                audioEnabled: true,
                videoEnabled: true,
                isScreenSharing: false,
            };
            exports.connectedUsers[roomId].push(newUser);
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
        }
        catch (err) {
            socket.emit('error', { message: err.message || 'Error al unirse a la sala' });
        }
    });
    socket.on('request-rejoin', (payload) => {
        const { roomId } = payload;
        if (!roomId)
            return;
        setTimeout(() => {
            if (socket.connected && exports.connectedUsers[roomId]?.some((u) => u.socketId !== socket.id)) {
                emitExistingPeers(roomId);
            }
            else if (socket.connected && exports.connectedUsers[roomId]) {
                emitExistingPeers(roomId);
            }
        }, 500);
    });
    // 2. Leave Room Event
    socket.on('leave-room', (payload) => {
        const { roomId } = payload;
        if (!roomId)
            return;
        socket.leave(roomId);
        // Clean up memory
        if (exports.connectedUsers[roomId]) {
            const userLeaving = exports.connectedUsers[roomId].find((u) => u.socketId === socket.id);
            exports.connectedUsers[roomId] = exports.connectedUsers[roomId].filter((u) => u.socketId !== socket.id);
            if (userLeaving) {
                socket.to(roomId).emit('user-left', {
                    uid: userLeaving.uid,
                    username: userLeaving.username,
                });
                emitRoomUsers(roomId);
                console.log(`[Socket] User ${userLeaving.username} left room ${roomId}`);
            }
            if (exports.connectedUsers[roomId].length === 0) {
                delete exports.connectedUsers[roomId];
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
    socket.on('delete-room', (payload) => {
        const { roomId } = payload;
        if (!roomId)
            return;
        io.to(roomId).emit('room-deleted', { roomId });
        console.log(`[Socket] Room ${roomId} was deleted. Notifying clients.`);
    });
    // 4. Disconnect Event (automatic)
    socket.on('disconnect', () => {
        // Search across all rooms to remove this socket and notify others
        for (const roomId in exports.connectedUsers) {
            const idx = exports.connectedUsers[roomId].findIndex((u) => u.socketId === socket.id);
            if (idx !== -1) {
                const userLeaving = exports.connectedUsers[roomId][idx];
                exports.connectedUsers[roomId].splice(idx, 1);
                io.to(roomId).emit('user-left', {
                    uid: userLeaving.uid,
                    username: userLeaving.username,
                });
                emitRoomUsers(roomId);
                console.log(`[Socket] User ${userLeaving.username} disconnected from room ${roomId}`);
                if (exports.connectedUsers[roomId].length === 0) {
                    delete exports.connectedUsers[roomId];
                }
            }
        }
    });
    socket.on('heartbeat', (payload) => {
        if (payload?.roomId) {
            socket.emit('heartbeat-ack', {
                timestamp: Date.now(),
                roomId: payload.roomId,
                uid: payload.uid ?? socket.data.uid ?? null,
            });
        }
    });
}

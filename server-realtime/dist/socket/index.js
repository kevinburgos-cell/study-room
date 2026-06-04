"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSockets = initializeSockets;
const roomHandler_1 = require("./roomHandler");
function initializeSockets(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        // Register all feature handlers
        (0, roomHandler_1.registerRoomHandlers)(io, socket);
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSockets = initializeSockets;
const roomHandler_1 = require("./roomHandler");
const chatHandler_1 = require("./chatHandler");
const webrtcHandler_1 = require("./webrtcHandler");
function initializeSockets(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        // Register all feature handlers
        (0, roomHandler_1.registerRoomHandlers)(io, socket);
        (0, chatHandler_1.registerChatHandlers)(io, socket);
        (0, webrtcHandler_1.registerWebRTCHandlers)(io, socket);
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
}

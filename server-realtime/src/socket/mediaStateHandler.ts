import { Server, Socket } from 'socket.io';

type MediaStatePayload = {
  roomId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing?: boolean;
};

export function registerMediaStateHandler(io: Server, socket: Socket) {
  socket.on('media-state-changed', (payload: MediaStatePayload) => {
    const { roomId, audioEnabled, videoEnabled, isScreenSharing = false } = payload;
    const uid = (socket as any).uid;
    const username = (socket as any).username || 'Estudiante';

    (socket as any).audioEnabled = audioEnabled;
    (socket as any).videoEnabled = videoEnabled;
    (socket as any).isScreenSharing = isScreenSharing;

    console.log(
      `[Socket-Media] ${socket.id} (${uid}) in room ${roomId}: audio=${audioEnabled}, video=${videoEnabled}, screen=${isScreenSharing}`
    );

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

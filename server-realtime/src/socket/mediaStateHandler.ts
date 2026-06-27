import { Server, Socket } from 'socket.io';
import { connectedUsers } from './roomHandler';

type MediaStatePayload = {
  roomId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing?: boolean;
};

export function registerMediaStateHandler(io: Server, socket: Socket) {
  socket.on('media-state-changed', (payload: MediaStatePayload) => {
    const { roomId, audioEnabled, videoEnabled, isScreenSharing = false } = payload;
    const uid = socket.data?.uid || (socket as any).uid;
    const username = socket.data?.username || (socket as any).username || 'Estudiante';

    // Store on socket.data so roomHandler's emitExistingPeers can read it
    socket.data.audioEnabled = audioEnabled;
    socket.data.videoEnabled = videoEnabled;
    socket.data.isScreenSharing = isScreenSharing;

    if (connectedUsers[roomId]) {
      const user = connectedUsers[roomId].find((u) => u.socketId === socket.id);
      if (user) {
        user.audioEnabled = audioEnabled;
        user.videoEnabled = videoEnabled;
        user.isScreenSharing = isScreenSharing;
      }
    }

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

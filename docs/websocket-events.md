# Eventos de Socket.io - StudyRoom

## Sala

| Evento | Direccion | Payload |
|--------|-----------|---------|
| join-room | C->S | {roomId, token} |
| leave-room | C->S | {roomId} |
| room-users | S->C | {users[]} |
| user-joined | S->C | {uid, username, photoURL} |
| user-left | S->C | {uid, username} |
| existing-peers | S->C | {peers[]} |

## Chat

| Evento | Direccion | Payload |
|--------|-----------|---------|
| send-message | C->S | {roomId, text, token} |
| new-message | S->C | {id, roomId, senderUid, senderUsername, text, timestamp} |

## WebRTC Signaling

| Evento | Direccion | Payload |
|--------|-----------|---------|
| webrtc-offer | C->S->C | {offer, targetSocketId} |
| webrtc-answer | C->S->C | {answer, targetSocketId} |
| webrtc-ice-candidate | C->S->C | {candidate, targetSocketId} |

## Estado de medios

| Evento | Direccion | Payload |
|--------|-----------|---------|
| media-state-changed | C->S | {roomId, audioEnabled, videoEnabled, isScreenSharing} |
| peer-media-state | S->C | {socketId, uid, audioEnabled, videoEnabled, isScreenSharing} |

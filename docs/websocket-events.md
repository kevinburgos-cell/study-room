# WebSocket Events

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `join-room` | C→S | `{ roomId, token }` | Usuario entra a una sala |
| `leave-room` | C→S | `{ roomId }` | Usuario sale de una sala |
| `room-users` | S→C | `{ users[] }` | Lista inicial de usuarios |
| `user-joined` | S→C | `{ uid, username, photoURL }` | Notifica nuevo usuario |
| `user-left` | S→C | `{ uid, username }` | Notifica salida de usuario |
| `send-message` | C→S | `{ roomId, text, token }` | Enviar mensaje de chat |
| `new-message` | S→C | `{ id, roomId, senderUid, text, timestamp }` | Mensaje nuevo |
| `existing-peers` | S→C | `{ peers[] }` | Peers para iniciar WebRTC |
| `webrtc-offer` | C→S→C | `{ offer, targetSocketId }` | Oferta SDP |
| `webrtc-answer` | C→S→C | `{ answer, targetSocketId }` | Respuesta SDP |
| `webrtc-ice-candidate` | C→S→C | `{ candidate, targetSocketId }` | Candidato ICE |
| `media-state-changed` | C→S | `{ roomId, audioEnabled, videoEnabled, isScreenSharing }` | Cambio de estado de medios |
| `peer-media-state` | S→C | `{ uid, socketId, audioEnabled, videoEnabled, isScreenSharing }` | Notifica cambio a otros |

## useWebRTC

Funciones públicas principales del hook:

```ts
/**
 * Pausa o reanuda el audio local sin cerrar la conexión WebRTC.
 * Usa `track.enabled` en vez de `stop()` para preservar el `peerConnection`.
 */
toggleAudio()

/**
 * Activa o desactiva el video local sin renegociar la conexión.
 * Mantiene el track vivo y solo alterna `track.enabled`.
 */
toggleVideo()

/**
 * Inicia la compartición de pantalla reemplazando el track de video
 * de cada `RTCRtpSender` con `replaceTrack()`, sin renegociación.
 */
startScreenShare()

/**
 * Restaura el video de cámara original después de compartir pantalla.
 */
stopScreenShare()
```

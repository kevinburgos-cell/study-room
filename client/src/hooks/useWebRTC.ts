import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../socket/socket';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

interface PeerInfo {
  stream: MediaStream;
  uid: string;
  username: string;
}

export function useWebRTC(roomId: string | undefined, onlineUsers: { uid: string; username: string }[]) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Mute/Camera toggle states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Refs for WebRTC state
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const onlineUsersRef = useRef(onlineUsers);

  // Keep onlineUsersRef up to date
  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  // Clean up a peer connection
  const closeConnection = useCallback((socketId: string) => {
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(socketId);
    }
    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  // Initialize Media Stream
  const initLocalStream = useCallback(async (withVideo = true, withAudio = true) => {
    setIsConnecting(true);
    setPermissionError(null);
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: withVideo,
        audio: withAudio,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCameraOff(!withVideo);
      setIsMuted(!withAudio);
      setIsConnecting(false);
      return stream;
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      setIsConnecting(false);
      
      // Map error types
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('NotAllowedError');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('NotFoundError');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setPermissionError('NotReadableError');
      } else {
        setPermissionError(err.message || 'UnknownError');
      }
      return null;
    }
  }, []);

  // Helper to create RTCPeerConnection
  const createPeerConnection = useCallback((targetSocketId: string, peerUid: string, peerUsername: string, stream: MediaStream | null) => {
    if (peerConnections.current.has(targetSocketId)) {
      closeConnection(targetSocketId);
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnections.current.set(targetSocketId, pc);

    // Add local tracks if stream is available
    if (stream) {
      console.log(`[useWebRTC] Adding local tracks to peer connection for ${peerUsername}`);
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } else {
      console.log(`[useWebRTC] Creating peer connection for ${peerUsername} in receive-only mode (no local tracks)`);
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socket.emit('webrtc-ice-candidate', {
          roomId,
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote track
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      console.log(`[useWebRTC] Received remote track from ${peerUsername}. Stream ID: ${remoteStream.id}`);
      setPeers((prev) => {
        const next = new Map(prev);
        next.set(targetSocketId, {
          stream: remoteStream,
          uid: peerUid,
          username: peerUsername,
        });
        return next;
      });
    };

    // Connection state handler
    pc.onconnectionstatechange = () => {
      console.log(`[useWebRTC] Connection state change for ${peerUsername}: ${pc.connectionState}`);
      if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        closeConnection(targetSocketId);
      }
    };

    return pc;
  }, [roomId, closeConnection]);

  // Main peer negotiation trigger
  useEffect(() => {
    if (!roomId) {
      console.log('[useWebRTC] No roomId provided, skipping setup');
      return;
    }

    console.log(`[useWebRTC] Hook active for roomId: ${roomId}. Registering socket listeners.`);

    const handleExistingPeers = async (payload: { peers: { socketId: string; uid: string; username: string }[] }) => {
      console.log('[useWebRTC] Received "existing-peers" event with payload:', JSON.stringify(payload));
      let stream = localStreamRef.current;
      if (!stream && !permissionError) {
        console.log('[useWebRTC] No local stream found on existing-peers, initializing stream...');
        stream = await initLocalStream();
      }
      
      if (!stream) {
        console.warn('[useWebRTC] No local stream available, proceeding in receive-only mode');
      }

      console.log(`[useWebRTC] Starting WebRTC negotiation with ${payload.peers.length} peers`);
      for (const peer of payload.peers) {
        try {
          console.log(`[useWebRTC] Creating RTCPeerConnection for peer: ${peer.username} (socket: ${peer.socketId})`);
          const pc = createPeerConnection(peer.socketId, peer.uid, peer.username, stream);
          const offer = await pc.createOffer();
          console.log(`[useWebRTC] Created offer for ${peer.username}, setting local description`);
          await pc.setLocalDescription(offer);
          
          console.log(`[useWebRTC] Emitting "webrtc-offer" to server targeting ${peer.socketId}`);
          socket.emit('webrtc-offer', {
            roomId,
            targetSocketId: peer.socketId,
            offer,
          });
        } catch (err) {
          console.error('[useWebRTC] Error creating WebRTC offer:', err);
        }
      }
    };

    const handleWebRTCOffer = async (payload: { offer: RTCSessionDescriptionInit; fromSocketId: string; fromUid: string }) => {
      const { offer, fromSocketId, fromUid } = payload;
      console.log(`[useWebRTC] Received "webrtc-offer" from socket ${fromSocketId} (uid: ${fromUid})`);
      
      let stream = localStreamRef.current;
      if (!stream && !permissionError) {
        console.log('[useWebRTC] No local stream found on webrtc-offer, initializing stream...');
        stream = await initLocalStream();
      }

      try {
        const peerUser = onlineUsersRef.current.find((u) => u.uid === fromUid);
        const peerUsername = peerUser ? peerUser.username : 'Compañero';
        console.log(`[useWebRTC] Creating RTCPeerConnection for incoming offer from ${peerUsername} (${fromSocketId})`);
        const pc = createPeerConnection(fromSocketId, fromUid, peerUsername, stream);
        
        console.log('[useWebRTC] Setting remote description (offer)');
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        console.log('[useWebRTC] Setting local description (answer)');
        await pc.setLocalDescription(answer);

        console.log(`[useWebRTC] Emitting "webrtc-answer" targeting ${fromSocketId}`);
        socket.emit('webrtc-answer', {
          roomId,
          targetSocketId: fromSocketId,
          answer,
        });
      } catch (err) {
        console.error('[useWebRTC] Error handling WebRTC offer:', err);
      }
    };

    const handleWebRTCAnswer = async (payload: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => {
      const { answer, fromSocketId } = payload;
      console.log(`[useWebRTC] Received "webrtc-answer" from socket ${fromSocketId}`);
      const pc = peerConnections.current.get(fromSocketId);
      if (pc) {
        try {
          console.log('[useWebRTC] Setting remote description (answer)');
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('[useWebRTC] Error setting remote answer:', err);
        }
      } else {
        console.warn(`[useWebRTC] No RTCPeerConnection found for socket ${fromSocketId} to apply answer`);
      }
    };

    const handleWebRTCIceCandidate = async (payload: { candidate: RTCIceCandidateInit; fromSocketId: string }) => {
      const { candidate, fromSocketId } = payload;
      console.log(`[useWebRTC] Received "webrtc-ice-candidate" from socket ${fromSocketId}`);
      const pc = peerConnections.current.get(fromSocketId);
      if (pc) {
        try {
          console.log('[useWebRTC] Adding ICE candidate');
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[useWebRTC] Error adding remote ICE candidate:', err);
        }
      } else {
        console.warn(`[useWebRTC] No RTCPeerConnection found for socket ${fromSocketId} to add ICE candidate`);
      }
    };

    const handleUserLeft = (payload: { uid: string; username: string }) => {
      console.log(`[useWebRTC] User left room: ${payload.username} (uid: ${payload.uid})`);
      // Find socketId corresponding to this uid to close connection
      for (const [socketId, peerInfo] of peers.entries()) {
        if (peerInfo.uid === payload.uid) {
          console.log(`[useWebRTC] Closing peer connection for user ${payload.username} (socket: ${socketId})`);
          closeConnection(socketId);
        }
      }
    };

    socket.on('existing-peers', handleExistingPeers);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleWebRTCIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      console.log('[useWebRTC] Cleaning up socket listeners');
      socket.off('existing-peers', handleExistingPeers);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleWebRTCIceCandidate);
      socket.off('user-left', handleUserLeft);
    };
  }, [roomId, permissionError, createPeerConnection, closeConnection, initLocalStream, peers]);

  // Initial mount: request media permissions
  useEffect(() => {
    initLocalStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      setPeers(new Map());
    };
  }, [initLocalStream]);

  // Control togglers
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, []);

  const retryPermissions = useCallback(async () => {
    await initLocalStream(true, true);
  }, [initLocalStream]);

  const continueWithoutVideo = useCallback(async () => {
    // Only requests audio
    await initLocalStream(false, true);
  }, [initLocalStream]);

  return {
    localStream,
    peers,
    permissionError,
    isConnecting,
    isMuted,
    isCameraOff,
    toggleMic,
    toggleCamera,
    retryPermissions,
    continueWithoutVideo,
  };
}

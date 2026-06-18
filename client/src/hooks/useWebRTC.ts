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
  const createPeerConnection = useCallback((targetSocketId: string, peerUid: string, peerUsername: string, stream: MediaStream) => {
    if (peerConnections.current.has(targetSocketId)) {
      closeConnection(targetSocketId);
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnections.current.set(targetSocketId, pc);

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

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
    if (!roomId) return;

    const handleExistingPeers = async (payload: { peers: { socketId: string; uid: string; username: string }[] }) => {
      let stream = localStreamRef.current;
      if (!stream && !permissionError) {
        stream = await initLocalStream();
      }
      if (!stream) return;

      for (const peer of payload.peers) {
        try {
          const pc = createPeerConnection(peer.socketId, peer.uid, peer.username, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', {
            roomId,
            targetSocketId: peer.socketId,
            offer,
          });
        } catch (err) {
          console.error('Error creating WebRTC offer:', err);
        }
      }
    };

    const handleWebRTCOffer = async (payload: { offer: RTCSessionDescriptionInit; fromSocketId: string; fromUid: string }) => {
      const { offer, fromSocketId, fromUid } = payload;
      let stream = localStreamRef.current;
      if (!stream && !permissionError) {
        stream = await initLocalStream();
      }
      if (!stream) return;

      try {
        const peerUser = onlineUsersRef.current.find((u) => u.uid === fromUid);
        const peerUsername = peerUser ? peerUser.username : 'Compañero';
        const pc = createPeerConnection(fromSocketId, fromUid, peerUsername, stream);
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          roomId,
          targetSocketId: fromSocketId,
          answer,
        });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    };

    const handleWebRTCAnswer = async (payload: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => {
      const { answer, fromSocketId } = payload;
      const pc = peerConnections.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote answer:', err);
        }
      }
    };

    const handleWebRTCIceCandidate = async (payload: { candidate: RTCIceCandidateInit; fromSocketId: string }) => {
      const { candidate, fromSocketId } = payload;
      const pc = peerConnections.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding remote ICE candidate:', err);
        }
      }
    };

    const handleUserLeft = (payload: { uid: string; username: string }) => {
      // Find socketId corresponding to this uid to close connection
      for (const [socketId, peerInfo] of peers.entries()) {
        if (peerInfo.uid === payload.uid) {
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

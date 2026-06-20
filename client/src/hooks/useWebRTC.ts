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
  isMuted: boolean;
  isCameraOff: boolean;
}

interface MediaState {
  isMuted: boolean;
  isCameraOff: boolean;
}

export function useWebRTC(roomId: string | undefined, onlineUsers: { uid: string; username: string }[]) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // All mutable state that event handlers need lives in refs
  // so socket listeners never need to be recreated
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteMediaStatesRef = useRef<Map<string, MediaState>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const onlineUsersRef = useRef(onlineUsers);
  const permissionErrorRef = useRef<string | null>(null);
  const roomIdRef = useRef(roomId);

  // Keep refs in sync with current values
  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  useEffect(() => {
    permissionErrorRef.current = permissionError;
  }, [permissionError]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const emitMediaState = useCallback((nextState: MediaState) => {
    if (!roomIdRef.current || !socket.connected) return;

    socket.emit('webrtc-media-state', {
      roomId: roomIdRef.current,
      ...nextState,
    });
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const publishCurrentMediaState = () => {
      emitMediaState({ isMuted, isCameraOff });
    };

    if (socket.connected) {
      publishCurrentMediaState();
    }

    socket.on('connect', publishCurrentMediaState);

    return () => {
      socket.off('connect', publishCurrentMediaState);
    };
  }, [roomId, isMuted, isCameraOff, emitMediaState]);

  // Remove a peer connection cleanly
  const closeConnection = useCallback((socketId: string) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    remoteMediaStatesRef.current.delete(socketId);
    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  // Initialize local media stream
  const initLocalStream = useCallback(async (withVideo = true, withAudio = true) => {
    setIsConnecting(true);
    setPermissionError(null);
    permissionErrorRef.current = null;
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: withAudio,
      });
      const nextState = {
        isMuted: !withAudio,
        isCameraOff: !withVideo,
      };
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCameraOff(nextState.isCameraOff);
      setIsMuted(nextState.isMuted);
      emitMediaState(nextState);
      setIsConnecting(false);
      return stream;
    } catch (err: any) {
      console.error('[useWebRTC] Error accessing media devices:', err.name, err.message);
      setIsConnecting(false);
      const errType =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'NotAllowedError'
          : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
          ? 'NotFoundError'
          : err.name === 'NotReadableError' || err.name === 'TrackStartError'
          ? 'NotReadableError'
          : err.message || 'UnknownError';
      setPermissionError(errType);
      permissionErrorRef.current = errType;
      if (errType === 'NotFoundError') {
        const spectatorState = { isMuted: true, isCameraOff: true };
        setIsMuted(spectatorState.isMuted);
        setIsCameraOff(spectatorState.isCameraOff);
        emitMediaState(spectatorState);
      }
      return null;
    }
  }, [emitMediaState]);

  // Create an RTCPeerConnection — stream can be null for receive-only
  const createPeerConnection = useCallback(
    (targetSocketId: string, peerUid: string, peerUsername: string, stream: MediaStream | null) => {
      // Close existing connection for this socket if any
      const existing = peerConnectionsRef.current.get(targetSocketId);
      if (existing) {
        existing.close();
        peerConnectionsRef.current.delete(targetSocketId);
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionsRef.current.set(targetSocketId, pc);

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        console.log(`[useWebRTC] Added ${stream.getTracks().length} local track(s) for ${peerUsername}`);
      } else {
        console.log(`[useWebRTC] Receive-only mode for ${peerUsername} (no local stream)`);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && roomIdRef.current) {
          console.log(`[useWebRTC] Sending ICE candidate to ${targetSocketId}`);
          socket.emit('webrtc-ice-candidate', {
            roomId: roomIdRef.current,
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        console.log(`[useWebRTC] ✅ Remote track received from ${peerUsername} — stream: ${remoteStream.id}`);
        setPeers((prev) => {
          const mediaState = remoteMediaStatesRef.current.get(targetSocketId) ?? {
            isMuted: false,
            isCameraOff: false,
          };
          const next = new Map(prev);
          next.set(targetSocketId, {
            stream: remoteStream,
            uid: peerUid,
            username: peerUsername,
            ...mediaState,
          });
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        console.log(`[useWebRTC] Connection state [${peerUsername}]: ${pc.connectionState}`);
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          // Clean up without calling closeConnection to avoid re-render loop
          peerConnectionsRef.current.delete(targetSocketId);
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(targetSocketId);
            return next;
          });
        }
      };

      return pc;
    },
    [] // No external deps — uses refs only
  );

  // ─── Main signaling effect — runs ONCE per roomId ───────────────────────────
  useEffect(() => {
    if (!roomId) return;

    console.log(`[useWebRTC] Setting up signaling listeners for room: ${roomId}`);

    const handleExistingPeers = async (payload: {
      peers: { socketId: string; uid: string; username: string; isMuted?: boolean; isCameraOff?: boolean }[];
    }) => {
      console.log('[useWebRTC] existing-peers received:', JSON.stringify(payload.peers));

      let stream = localStreamRef.current;
      if (!stream && !permissionErrorRef.current) {
        stream = await initLocalStream();
      }
      if (!stream) {
        console.warn('[useWebRTC] Proceeding without local stream (receive-only)');
      }

      for (const peer of payload.peers) {
        try {
          remoteMediaStatesRef.current.set(peer.socketId, {
            isMuted: Boolean(peer.isMuted),
            isCameraOff: Boolean(peer.isCameraOff),
          });
          console.log(`[useWebRTC] Creating offer for ${peer.username} (${peer.socketId})`);
          const pc = createPeerConnection(peer.socketId, peer.uid, peer.username, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', {
            roomId,
            targetSocketId: peer.socketId,
            offer,
          });
          console.log(`[useWebRTC] Offer sent to ${peer.username}`);
        } catch (err) {
          console.error('[useWebRTC] Offer creation failed:', err);
        }
      }
    };

    const handleOffer = async (payload: {
      offer: RTCSessionDescriptionInit;
      fromSocketId: string;
      fromUid: string;
    }) => {
      const { offer, fromSocketId, fromUid } = payload;
      console.log(`[useWebRTC] Offer received from ${fromSocketId}`);

      let stream = localStreamRef.current;
      if (!stream && !permissionErrorRef.current) {
        stream = await initLocalStream();
      }

      try {
        const peerUser = onlineUsersRef.current.find((u) => u.uid === fromUid);
        const peerUsername = peerUser?.username ?? 'Compañero';
        const pc = createPeerConnection(fromSocketId, fromUid, peerUsername, stream);

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          roomId,
          targetSocketId: fromSocketId,
          answer,
        });
        console.log(`[useWebRTC] Answer sent to ${fromSocketId}`);
      } catch (err) {
        console.error('[useWebRTC] Failed to handle offer:', err);
      }
    };

    const handleAnswer = async (payload: {
      answer: RTCSessionDescriptionInit;
      fromSocketId: string;
    }) => {
      const { answer, fromSocketId } = payload;
      console.log(`[useWebRTC] Answer received from ${fromSocketId}`);
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`[useWebRTC] Remote description set ✅ for ${fromSocketId}`);
        } catch (err) {
          console.error('[useWebRTC] Failed to set remote answer:', err);
        }
      } else {
        console.warn(`[useWebRTC] No PeerConnection for answer from ${fromSocketId}`);
      }
    };

    const handleIceCandidate = async (payload: {
      candidate: RTCIceCandidateInit;
      fromSocketId: string;
    }) => {
      const { candidate, fromSocketId } = payload;
      const pc = peerConnectionsRef.current.get(fromSocketId);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[useWebRTC] Failed to add ICE candidate:', err);
        }
      }
    };

    const handleMediaState = (payload: {
      fromSocketId: string;
      isMuted: boolean;
      isCameraOff: boolean;
    }) => {
      const nextState = {
        isMuted: payload.isMuted,
        isCameraOff: payload.isCameraOff,
      };

      remoteMediaStatesRef.current.set(payload.fromSocketId, nextState);
      setPeers((prev) => {
        const peer = prev.get(payload.fromSocketId);
        if (!peer) return prev;

        const next = new Map(prev);
        next.set(payload.fromSocketId, {
          ...peer,
          ...nextState,
        });
        return next;
      });
    };

    const handleUserLeft = (payload: { uid: string; username: string }) => {
      console.log(`[useWebRTC] User left: ${payload.username}`);
      // Search by uid across all peer connections
      peerConnectionsRef.current.forEach((pc, socketId) => {
        // We stored uid-to-socketId indirectly; search peers map
        setPeers((prev) => {
          const info = prev.get(socketId);
          if (info && info.uid === payload.uid) {
            pc.close();
            peerConnectionsRef.current.delete(socketId);
            remoteMediaStatesRef.current.delete(socketId);
            const next = new Map(prev);
            next.delete(socketId);
            return next;
          }
          return prev;
        });
      });
    };

    socket.on('existing-peers', handleExistingPeers);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('webrtc-media-state', handleMediaState);
    socket.on('user-left', handleUserLeft);

    return () => {
      console.log('[useWebRTC] Removing signaling listeners');
      socket.off('existing-peers', handleExistingPeers);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('webrtc-media-state', handleMediaState);
      socket.off('user-left', handleUserLeft);
    };
  }, [roomId, createPeerConnection, initLocalStream]); // ← NO peers here

  // ─── Init local stream on mount ─────────────────────────────────────────────
  useEffect(() => {
    initLocalStream();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteMediaStatesRef.current.clear();
      setPeers(new Map());
    };
  }, []); // Run once

  // ─── Controls ────────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const nextState = {
        isMuted: !track.enabled,
        isCameraOff,
      };
      setIsMuted(nextState.isMuted);
      emitMediaState(nextState);
    }
  }, [emitMediaState, isCameraOff]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      const nextState = {
        isMuted,
        isCameraOff: !track.enabled,
      };
      setIsCameraOff(nextState.isCameraOff);
      emitMediaState(nextState);
    }
  }, [emitMediaState, isMuted]);

  const retryPermissions = useCallback(async () => {
    await initLocalStream(true, true);
  }, [initLocalStream]);

  const continueWithoutVideo = useCallback(async () => {
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

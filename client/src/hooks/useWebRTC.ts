import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from '../socket/socket';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

interface PeerInfo {
  stream: MediaStream | null;
  uid: string;
  username: string;
  photoURL?: string | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
}

interface MediaStatePayload {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing?: boolean;
}

export function useWebRTC(roomId: string | undefined, onlineUsers: { uid: string; username: string }[]) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteMediaStatesRef = useRef<Map<string, MediaStatePayload>>(new Map());
  const peersRef = useRef<Map<string, PeerInfo>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const onlineUsersRef = useRef(onlineUsers);
  const permissionErrorRef = useRef<string | null>(null);
  const roomIdRef = useRef(roomId);
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const isVideoEnabledRef = useRef(isVideoEnabled);
  const isScreenSharingRef = useRef(isScreenSharing);
  const initPromiseRef = useRef<Promise<MediaStream | null> | null>(null);
  const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    onlineUsersRef.current = onlineUsers;
  }, [onlineUsers]);

  useEffect(() => {
    permissionErrorRef.current = permissionError;
  }, [permissionError]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    isVideoEnabledRef.current = isVideoEnabled;
  }, [isVideoEnabled]);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  const emitMediaState = useCallback((nextState: MediaStatePayload) => {
    if (!roomIdRef.current || !socket.connected) return;
    socket.emit('media-state-changed', {
      roomId: roomIdRef.current,
      ...nextState,
    });
  }, []);

  const syncCurrentMediaState = useCallback(() => {
    emitMediaState({
      audioEnabled: isAudioEnabledRef.current,
      videoEnabled: isVideoEnabledRef.current,
      isScreenSharing: isScreenSharingRef.current,
    });
  }, [emitMediaState]);

  useEffect(() => {
    if (!roomId) return;
    if (socket.connected) {
      syncCurrentMediaState();
    }
    socket.on('connect', syncCurrentMediaState);
    return () => {
      socket.off('connect', syncCurrentMediaState);
    };
  }, [roomId, syncCurrentMediaState]);

  const getOutboundStream = useCallback((fallbackStream: MediaStream | null) => {
    if (!isScreenSharingRef.current || !screenStreamRef.current) {
      return fallbackStream;
    }

    const outboundStream = new MediaStream();
    screenStreamRef.current.getVideoTracks().forEach((track) => outboundStream.addTrack(track));
    cameraStreamRef.current?.getAudioTracks().forEach((track) => outboundStream.addTrack(track));
    return outboundStream;
  }, []);

  const getSenderByKind = (pc: RTCPeerConnection, kind: 'audio' | 'video') => (
    pc.getSenders().find((sender) => sender.track?.kind === kind)
    ?? pc.getTransceivers().find((transceiver) => transceiver.receiver.track?.kind === kind)?.sender
  );

  const replaceSenderTrack = useCallback(async (kind: 'audio' | 'video', track: MediaStreamTrack | null) => {
    await Promise.all(
      Array.from(peerConnectionsRef.current.values()).map(async (pc) => {
        const sender = getSenderByKind(pc, kind);
        if (sender) {
          await sender.replaceTrack(track);
        }
      })
    );
  }, []);

  const closeConnection = useCallback((socketId: string) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    iceCandidateQueueRef.current.delete(socketId);
    remoteMediaStatesRef.current.delete(socketId);
    setPeers((prev) => {
      const next = new Map(prev);
      next.delete(socketId);
      return next;
    });
  }, []);

  const queueIceCandidate = useCallback((socketId: string, candidate: RTCIceCandidateInit) => {
    const queue = iceCandidateQueueRef.current.get(socketId) ?? [];
    queue.push(candidate);
    iceCandidateQueueRef.current.set(socketId, queue);
    console.log('[WebRTC] ICE candidate queued for:', socketId);
  }, []);

  const flushIceCandidateQueue = useCallback(async (socketId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidateQueueRef.current.get(socketId) ?? [];
    if (queue.length === 0) return;

    console.log('[WebRTC] Flushing ICE queue for:', socketId, 'candidates:', queue.length);
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Error flushing ICE candidate:', err);
      }
    }
    iceCandidateQueueRef.current.delete(socketId);
  }, []);

  const initLocalStream = useCallback(async (withVideo = true, withAudio = true) => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const promise = (async () => {
      setIsConnecting(true);
      setPermissionError(null);
      permissionErrorRef.current = null;
      try {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        const tryGetUserMedia = async () => {
          const attempts = [
            { video: withVideo, audio: withAudio },
            { video: withVideo, audio: false },
            { video: false, audio: withAudio },
          ].filter((constraints, index, list) => (
            constraints.video || constraints.audio
          ) && list.findIndex((item) => item.video === constraints.video && item.audio === constraints.audio) === index);

          let lastError: any = null;
          for (const constraints of attempts) {
            try {
              return await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err: any) {
              lastError = err;
              if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                throw err;
              }
            }
          }
          throw lastError;
        };

        const stream = await tryGetUserMedia();
        const audioEnabled = stream.getAudioTracks().length > 0;
        const videoEnabled = stream.getVideoTracks().length > 0;
        cameraStreamRef.current = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsAudioEnabled(audioEnabled);
        setIsVideoEnabled(videoEnabled);
        setIsScreenSharing(false);
        isAudioEnabledRef.current = audioEnabled;
        isVideoEnabledRef.current = videoEnabled;
        isScreenSharingRef.current = false;
        emitMediaState({
          audioEnabled,
          videoEnabled,
          isScreenSharing: false,
        });
        // Sync tracks to existing peer connections (important for retry after permission error)
        const audioTrack = stream.getAudioTracks()[0] ?? null;
        const videoTrack = stream.getVideoTracks()[0] ?? null;
        if (audioTrack) replaceSenderTrack('audio', audioTrack);
        if (videoTrack) replaceSenderTrack('video', videoTrack);
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
          setIsAudioEnabled(false);
          setIsVideoEnabled(false);
          emitMediaState({ audioEnabled: false, videoEnabled: false, isScreenSharing: false });
        }
        return null;
      } finally {
        initPromiseRef.current = null;
      }
    })();

    initPromiseRef.current = promise;
    return promise;
  }, [emitMediaState]);

  const createPeerConnection = useCallback(
    (
      targetSocketId: string,
      peerUid: string,
      peerUsername: string,
      stream: MediaStream | null,
      replaceExisting = true,
      initialState?: Partial<Pick<PeerInfo, 'photoURL' | 'audioEnabled' | 'videoEnabled' | 'isScreenSharing'>>
    ) => {
      const existing = peerConnectionsRef.current.get(targetSocketId);
      if (existing && !replaceExisting) {
        setPeers((prev) => {
          const next = new Map(prev);
          const current = next.get(targetSocketId);
          next.set(targetSocketId, {
            stream: current?.stream ?? null,
            uid: peerUid,
            username: peerUsername,
            photoURL: initialState?.photoURL ?? current?.photoURL ?? null,
            audioEnabled: initialState?.audioEnabled ?? current?.audioEnabled ?? true,
            videoEnabled: initialState?.videoEnabled ?? current?.videoEnabled ?? true,
            isScreenSharing: initialState?.isScreenSharing ?? current?.isScreenSharing ?? false,
          });
          return next;
        });
        return existing;
      }

      if (existing) {
        existing.close();
        peerConnectionsRef.current.delete(targetSocketId);
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionsRef.current.set(targetSocketId, pc);
      setPeers((prev) => {
        const next = new Map(prev);
        const current = prev.get(targetSocketId);
        next.set(targetSocketId, {
          stream: current?.stream ?? null,
          uid: peerUid,
          username: peerUsername,
          photoURL: initialState?.photoURL ?? current?.photoURL ?? null,
          audioEnabled: initialState?.audioEnabled ?? current?.audioEnabled ?? true,
          videoEnabled: initialState?.videoEnabled ?? current?.videoEnabled ?? true,
          isScreenSharing: initialState?.isScreenSharing ?? current?.isScreenSharing ?? false,
        });
        return next;
      });

      const outboundStream = getOutboundStream(stream);
      const outboundTracks = outboundStream?.getTracks() ?? [];
      if (outboundStream) {
        outboundTracks.forEach((track) => pc.addTrack(track, outboundStream));
        console.log(`[useWebRTC] Added ${outboundTracks.length} local track(s) for ${peerUsername}`);
      }

      if (!outboundTracks.some((track) => track.kind === 'audio')) pc.addTransceiver('audio', { direction: 'sendrecv' });
      if (!outboundTracks.some((track) => track.kind === 'video')) pc.addTransceiver('video', { direction: 'sendrecv' });

      pc.onicecandidate = (event) => {
        if (event.candidate && roomIdRef.current) {
          socket.emit('webrtc-ice-candidate', {
            roomId: roomIdRef.current,
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(`[WebRTC] ontrack received from: ${peerUsername}, track kind: ${event.track.kind}`);
        setPeers((prev) => {
          const existingPeer = prev.get(targetSocketId);
          let remoteStream = existingPeer?.stream;

          if (!remoteStream) {
            remoteStream = event.streams[0] || new MediaStream();
          }

          if (!remoteStream.getTracks().includes(event.track)) {
            remoteStream.addTrack(event.track);
          }

          // Force a new MediaStream reference to trigger React updates and VideoTile rebind
          const updatedStream = new MediaStream(remoteStream.getTracks());

          const next = new Map(prev);
          const current = next.get(targetSocketId);
          next.set(targetSocketId, {
            stream: updatedStream,
            uid: peerUid,
            username: peerUsername,
            photoURL: current?.photoURL ?? initialState?.photoURL ?? null,
            audioEnabled: current?.audioEnabled ?? initialState?.audioEnabled ?? true,
            videoEnabled: current?.videoEnabled ?? initialState?.videoEnabled ?? true,
            isScreenSharing: current?.isScreenSharing ?? initialState?.isScreenSharing ?? false,
          });
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('[WebRTC] Connection state with', peerUsername, ':', state);

        if (state === 'failed') {
          console.log('[WebRTC] Connection failed, attempting ICE restart');
          pc.restartIce();

          setTimeout(() => {
            const currentPc = peerConnectionsRef.current.get(targetSocketId);
            if (currentPc !== pc || pc.connectionState !== 'failed') return;
            console.log('[WebRTC] ICE restart failed, closing connection');
            closeConnection(targetSocketId);
            if (roomIdRef.current && socket.connected) {
              socket.emit('request-rejoin', { roomId: roomIdRef.current });
            }
          }, 5000);
        }

        if (state === 'disconnected') {
          setTimeout(() => {
            const currentPc = peerConnectionsRef.current.get(targetSocketId);
            if (currentPc !== pc) return;
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
              closeConnection(targetSocketId);
              if (roomIdRef.current && socket.connected) {
                socket.emit('request-rejoin', { roomId: roomIdRef.current });
              }
            }
          }, 3000);
        }

        if (state === 'closed') {
          closeConnection(targetSocketId);
        }
      };

      return pc;
    },
    [closeConnection, getOutboundStream]
  );

  const renegotiatePeer = useCallback(async (targetSocketId: string) => {
    const pc = peerConnectionsRef.current.get(targetSocketId);
    if (!pc || !roomIdRef.current) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', {
        roomId: roomIdRef.current,
        targetSocketId,
        offer,
      });
    } catch (err) {
      console.error('[useWebRTC] Renegotiation failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const handleExistingPeers = async (payload: {
      peers: { socketId: string; uid: string; username: string; photoURL?: string | null; audioEnabled?: boolean; videoEnabled?: boolean; isScreenSharing?: boolean }[];
    }) => {
      let stream = localStreamRef.current;
      if (!stream && !permissionErrorRef.current) {
        stream = await initLocalStream();
      }

      for (const peer of payload.peers) {
        remoteMediaStatesRef.current.set(peer.socketId, {
          audioEnabled: Boolean(peer.audioEnabled ?? true),
          videoEnabled: Boolean(peer.videoEnabled ?? true),
          isScreenSharing: Boolean(peer.isScreenSharing),
        });
        const pc = createPeerConnection(peer.socketId, peer.uid, peer.username, stream, true, {
          photoURL: peer.photoURL ?? null,
          audioEnabled: Boolean(peer.audioEnabled ?? true),
          videoEnabled: Boolean(peer.videoEnabled ?? true),
          isScreenSharing: Boolean(peer.isScreenSharing),
        });
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', {
            roomId,
            targetSocketId: peer.socketId,
            offer,
          });
        } catch (err) {
          console.error('[useWebRTC] Offer creation failed:', err);
        }
      }
    };

    const handleOffer = async (payload: { offer: RTCSessionDescriptionInit; fromSocketId: string; fromUid: string; fromUsername?: string }) => {
      let stream = localStreamRef.current;
      if (!stream && !permissionErrorRef.current) {
        stream = await initLocalStream();
      }
      const peerUser = onlineUsersRef.current.find((u) => u.uid === payload.fromUid);
      const pc = createPeerConnection(
        payload.fromSocketId,
        payload.fromUid,
        payload.fromUsername ?? peerUser?.username ?? 'Compañero',
        stream,
        false,
        {
          audioEnabled: true,
          videoEnabled: true,
          isScreenSharing: false,
        }
      );
      if (pc.signalingState !== 'stable') {
        await pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      await flushIceCandidateQueue(payload.fromSocketId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', {
        roomId,
        targetSocketId: payload.fromSocketId,
        answer,
      });
    };

    const handleAnswer = async (payload: { answer: RTCSessionDescriptionInit; fromSocketId: string }) => {
      const pc = peerConnectionsRef.current.get(payload.fromSocketId);
      if (pc) {
        if (pc.signalingState === 'stable') {
          if (pc.remoteDescription) {
            await flushIceCandidateQueue(payload.fromSocketId, pc);
          }
          return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        await flushIceCandidateQueue(payload.fromSocketId, pc);
      }
    };

    const handleIceCandidate = async (payload: { candidate: RTCIceCandidateInit; fromSocketId: string }) => {
      const pc = peerConnectionsRef.current.get(payload.fromSocketId);
      if (!pc) {
        queueIceCandidate(payload.fromSocketId, payload.candidate);
        return;
      }

      if (!pc.remoteDescription) {
        queueIceCandidate(payload.fromSocketId, payload.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    const handleMediaState = (payload: {
      socketId?: string;
      fromSocketId?: string;
      audioEnabled: boolean;
      videoEnabled: boolean;
      isScreenSharing?: boolean;
    }) => {
      const socketId = payload.socketId ?? payload.fromSocketId;
      if (!socketId) return;
      const nextState = {
        audioEnabled: payload.audioEnabled,
        videoEnabled: payload.videoEnabled,
        isScreenSharing: Boolean(payload.isScreenSharing),
      };
      remoteMediaStatesRef.current.set(socketId, nextState);
      setPeers((prev) => {
        const peer = prev.get(socketId);
        if (!peer) return prev;
        const next = new Map(prev);
        next.set(socketId, {
          ...peer,
          audioEnabled: nextState.audioEnabled,
          videoEnabled: nextState.videoEnabled,
          isScreenSharing: nextState.isScreenSharing,
        });
        return next;
      });
    };

    const handleUserLeft = (payload: { uid: string; username: string }) => {
      peerConnectionsRef.current.forEach((pc, socketId) => {
        const info = peersRef.current.get(socketId);
        if (info?.uid === payload.uid) {
          pc.close();
          peerConnectionsRef.current.delete(socketId);
          iceCandidateQueueRef.current.delete(socketId);
          remoteMediaStatesRef.current.delete(socketId);
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(socketId);
            return next;
          });
        }
      });
    };

    socket.on('existing-peers', handleExistingPeers);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('peer-media-state', handleMediaState);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('existing-peers', handleExistingPeers);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('peer-media-state', handleMediaState);
      socket.off('user-left', handleUserLeft);
    };
  }, [roomId, createPeerConnection, flushIceCandidateQueue, initLocalStream, queueIceCandidate]);

  useEffect(() => {
    initLocalStream();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      iceCandidateQueueRef.current.clear();
      remoteMediaStatesRef.current.clear();
      setPeers(new Map());
    };
  }, []);

  /**
   * Pausa o reanuda el audio local sin cerrar la conexión WebRTC.
   * Usa `track.enabled` en vez de `track.stop()` para preservar el stream.
   * @function toggleAudio
   * @returns {Promise<void>}
   */
  const toggleAudio = useCallback(async () => {
    let tracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (tracks.length === 0 && !isAudioEnabledRef.current) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const audioTrack = audioStream.getAudioTracks()[0];
        if (!audioTrack) return;
        const baseStream = cameraStreamRef.current || localStreamRef.current || new MediaStream();
        baseStream.addTrack(audioTrack);
        cameraStreamRef.current = baseStream;
        localStreamRef.current = isScreenSharingRef.current && screenStreamRef.current ? screenStreamRef.current : baseStream;
        if (!isScreenSharingRef.current) setLocalStream(baseStream);
        tracks = [audioTrack];
        await replaceSenderTrack('audio', audioTrack);
      } catch (err) {
        console.error('[WebRTC] Error enabling microphone:', err);
        return;
      }
    }
    if (tracks.length === 0) return;
    const nextAudioEnabled = !isAudioEnabledRef.current;
    tracks.forEach((track) => {
      track.enabled = nextAudioEnabled;
    });
    console.log('[WebRTC] Audio toggled:', nextAudioEnabled);
    for (const [id, pc] of peerConnectionsRef.current) {
      console.log('[WebRTC] Connection state after mute:', id, pc.connectionState);
    }
    const nextState = {
      audioEnabled: nextAudioEnabled,
      videoEnabled: isVideoEnabledRef.current,
      isScreenSharing: isScreenSharingRef.current,
    };
    setIsAudioEnabled(nextAudioEnabled);
    isAudioEnabledRef.current = nextAudioEnabled;
    emitMediaState(nextState);
  }, [emitMediaState, replaceSenderTrack]);

  /**
   * Activa o desactiva el video local sin renegociar WebRTC.
   * Alterna `track.enabled` para que los peers vean avatar sin romper la conexión.
   * @function toggleVideo
   * @returns {Promise<void>}
   */
  const toggleVideo = useCallback(async () => {
    let tracks = cameraStreamRef.current?.getVideoTracks() ?? [];
    if (tracks.length === 0 && !isVideoEnabledRef.current) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoTrack = videoStream.getVideoTracks()[0];
        if (!videoTrack) return;
        const baseStream = cameraStreamRef.current || new MediaStream();
        baseStream.addTrack(videoTrack);
        cameraStreamRef.current = baseStream;
        if (!isScreenSharingRef.current) {
          localStreamRef.current = baseStream;
          setLocalStream(baseStream);
          await replaceSenderTrack('video', videoTrack);
        }
        tracks = [videoTrack];
      } catch (err) {
        console.error('[WebRTC] Error enabling camera:', err);
        return;
      }
    }
    if (tracks.length === 0) return;
    const nextVideoEnabled = !isVideoEnabledRef.current;
    tracks.forEach((track) => {
      track.enabled = nextVideoEnabled;
    });
    if (!isScreenSharingRef.current) {
      await replaceSenderTrack('video', nextVideoEnabled ? tracks[0] : null);
    }
    console.log('[WebRTC] Video toggled:', nextVideoEnabled);
    for (const [id, pc] of peerConnectionsRef.current) {
      console.log('[WebRTC] Connection state after video toggle:', id, pc.connectionState);
    }
    const nextState = {
      audioEnabled: isAudioEnabledRef.current,
      videoEnabled: nextVideoEnabled,
      isScreenSharing: isScreenSharingRef.current,
    };
    setIsVideoEnabled(nextVideoEnabled);
    isVideoEnabledRef.current = nextVideoEnabled;
    emitMediaState(nextState);
  }, [emitMediaState, replaceSenderTrack]);

  /**
   * Inicia compartir pantalla reemplazando el track de video de cada sender.
   * Usa `replaceTrack()` y no crea una nueva oferta WebRTC.
   * @function startScreenShare
   * @returns {Promise<void>}
   */
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = screenStream.getVideoTracks()[0];
      const cameraStream = cameraStreamRef.current || localStreamRef.current;
      if (!screenTrack) {
        screenStream.getTracks().forEach((track) => track.stop());
        return;
      }

      await Promise.all(
        Array.from(peerConnectionsRef.current.entries()).map(async ([socketId, pc]) => {
          const sender = getSenderByKind(pc, 'video');
          if (sender) {
            await sender.replaceTrack(screenTrack);
            console.log('[WebRTC] Screen track replaced for peer:', socketId);
            console.log('[WebRTC] ✅ Screen sharing started, connection state:', pc.connectionState);
          } else {
            pc.addTrack(screenTrack, screenStream);
            await renegotiatePeer(socketId);
          }
        })
      );

      screenTrack.onended = () => {
        stopScreenShare();
      };

      screenStreamRef.current = screenStream;
      setLocalStream(screenStream);
      setIsScreenSharing(true);
      isScreenSharingRef.current = true;
      emitMediaState({
        audioEnabled: isAudioEnabledRef.current,
        videoEnabled: isVideoEnabledRef.current,
        isScreenSharing: true,
      });
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        console.log('Usuario canceló compartir pantalla');
        throw err;
      }
      console.error('Error compartiendo pantalla:', err);
      throw err;
    }
  }, [emitMediaState, renegotiatePeer]);

  /**
   * Detiene compartir pantalla y restaura el track original de la cámara.
   * La restauración también usa `replaceTrack()` para evitar renegociación.
   * @function stopScreenShare
   * @returns {Promise<void>}
   */
  const stopScreenShare = useCallback(async () => {
    const screenStream = screenStreamRef.current;
    const cameraStream = cameraStreamRef.current || localStreamRef.current;
    if (!screenStream) return;
    const cameraTrack = cameraStream?.getVideoTracks()[0] ?? null;

    await Promise.all(
      Array.from(peerConnectionsRef.current.entries()).map(async ([socketId, pc]) => {
        const sender = getSenderByKind(pc, 'video');
        if (sender) {
          await sender.replaceTrack(cameraTrack);
          console.log('[WebRTC] Camera track restored for peer:', socketId);
          console.log('[WebRTC] ✅ Screen sharing stopped, connection state:', pc.connectionState);
        }
      })
    );

    screenStream.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setLocalStream(cameraStream ?? null);
    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
    emitMediaState({
      audioEnabled: isAudioEnabledRef.current,
      videoEnabled: isVideoEnabledRef.current,
      isScreenSharing: false,
    });
  }, [emitMediaState, renegotiatePeer]);

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
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    retryPermissions,
    continueWithoutVideo,
  };
}

import { useEffect, useMemo, useState } from 'react';
import { socket } from '../socket/socket';

export interface PeerMediaState {
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing?: boolean;
}

export function usePeerMediaState() {
  const [peerMediaState, setPeerMediaState] = useState<Map<string, PeerMediaState>>(new Map());

  useEffect(() => {
    const upsertPeerState = (uid: string, socketId: string, state: PeerMediaState) => {
      setPeerMediaState((prev) => {
        const next = new Map(prev);
        next.set(socketId, state);
        next.set(uid, state);
        return next;
      });
    };

    const handlePeerMediaState = (payload: {
      uid: string;
      socketId: string;
      audioEnabled: boolean;
      videoEnabled: boolean;
      isScreenSharing?: boolean;
    }) => {
      upsertPeerState(payload.uid, payload.socketId, {
        audioEnabled: payload.audioEnabled,
        videoEnabled: payload.videoEnabled,
        isScreenSharing: Boolean(payload.isScreenSharing),
      });
    };

    const handleExistingPeers = (payload: {
      peers: Array<{
        uid: string;
        socketId: string;
        audioEnabled?: boolean;
        videoEnabled?: boolean;
        isScreenSharing?: boolean;
      }>;
    }) => {
      setPeerMediaState((prev) => {
        const next = new Map(prev);
        payload.peers.forEach((peer) => {
          const state = {
            audioEnabled: peer.audioEnabled ?? true,
            videoEnabled: peer.videoEnabled ?? true,
            isScreenSharing: Boolean(peer.isScreenSharing),
          };
          next.set(peer.socketId, state);
          next.set(peer.uid, state);
        });
        return next;
      });
    };

    const handleUserLeft = (payload: { uid: string }) => {
      setPeerMediaState((prev) => {
        const next = new Map(prev);
        next.delete(payload.uid);
        return next;
      });
    };

    socket.on('peer-media-state', handlePeerMediaState);
    socket.on('existing-peers', handleExistingPeers);
    socket.on('user-left', handleUserLeft);
    return () => {
      socket.off('peer-media-state', handlePeerMediaState);
      socket.off('existing-peers', handleExistingPeers);
      socket.off('user-left', handleUserLeft);
    };
  }, []);

  return useMemo(() => peerMediaState, [peerMediaState]);
}

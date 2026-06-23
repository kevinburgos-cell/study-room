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
    const handlePeerMediaState = (payload: {
      uid: string;
      socketId: string;
      audioEnabled: boolean;
      videoEnabled: boolean;
      isScreenSharing?: boolean;
    }) => {
      setPeerMediaState((prev) => {
        const next = new Map(prev);
        const state = {
          audioEnabled: payload.audioEnabled,
          videoEnabled: payload.videoEnabled,
          isScreenSharing: Boolean(payload.isScreenSharing),
        };
        next.set(payload.socketId, state);
        next.set(payload.uid, state);
        return next;
      });
    };

    socket.on('peer-media-state', handlePeerMediaState);
    return () => {
      socket.off('peer-media-state', handlePeerMediaState);
    };
  }, []);

  return useMemo(() => peerMediaState, [peerMediaState]);
}

import React from 'react';
import VideoTile from './VideoTile';
import type { PeerMediaState } from '../hooks/usePeerMediaState';

interface VideoGridProps {
  localStream: MediaStream | null;
  localUser: { uid: string; username: string; photoURL?: string | null };
  peers: Map<string, { stream: MediaStream; uid: string; username: string }>;
  mediaStates?: Map<string, PeerMediaState>;
  isLocalMuted?: boolean;
  isLocalCameraOff?: boolean;
  className?: string;
}

export default function VideoGrid({
  localStream,
  localUser,
  peers,
  mediaStates,
  isLocalMuted = false,
  isLocalCameraOff = false,
  className = '',
}: VideoGridProps) {
  const peerList = Array.from(peers.entries());
  const total = 1 + peerList.length;

  const gridStyle: React.CSSProperties =
    total === 1
      ? { gridTemplateColumns: '1fr', maxWidth: '900px' }
      : total === 2
        ? { gridTemplateColumns: '1fr', maxWidth: '1100px' }
        : total === 3
          ? { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', maxWidth: '1200px' }
          : { gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' };

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 'clamp(0.5rem, 1.5vw, 1rem)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gap: '0.9rem',
          alignContent: 'start',
          overflowY: total > 4 ? 'auto' : 'hidden',
          ...gridStyle,
        }}
      >
        <div style={total === 2 ? { display: 'flex', justifyContent: 'center' } : undefined}>
          <VideoTile
            stream={localStream}
            username={localUser.username}
            isLocal
            mediaState={{
              audioEnabled: !isLocalMuted,
              videoEnabled: !isLocalCameraOff,
            }}
            photoURL={localUser.photoURL}
          />
        </div>

        {peerList.map(([socketId, peerInfo]) => {
          const peerMedia = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid);
          const isLargeScreenShare = Boolean(peerMedia?.isScreenSharing);
          return (
            <div
              key={socketId}
              style={
                isLargeScreenShare
                  ? {
                      gridColumn: 'span 2',
                      minHeight: 'min(42vh, 420px)',
                    }
                  : undefined
              }
            >
              <VideoTile
                stream={peerInfo.stream}
                username={peerInfo.username}
                mediaState={peerMedia}
                isScreenSharing={peerMedia?.isScreenSharing}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

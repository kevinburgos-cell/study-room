import React from 'react';
import VideoTile from './VideoTile';

interface VideoGridProps {
  localStream: MediaStream | null;
  localUser: { uid: string; username: string; photoURL?: string | null };
  peers: Map<string, { stream: MediaStream; uid: string; username: string; isMuted: boolean; isCameraOff: boolean }>;
  isLocalMuted?: boolean;
  isLocalCameraOff?: boolean;
}

export default function VideoGrid({
  localStream,
  localUser,
  peers,
  isLocalMuted = false,
  isLocalCameraOff = false,
}: VideoGridProps) {
  const peerList = Array.from(peers.entries());
  const totalParticipants = 1 + peerList.length;

  // Compute grid style based on participants
  const getGridStyles = (): { grid: React.CSSProperties; container: React.CSSProperties } => {
    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '1rem',
    };

    const baseGrid: React.CSSProperties = {
      display: 'grid',
      gap: '1rem',
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      minHeight: 0,
    };

    if (totalParticipants === 1) {
      return {
        container: containerStyle,
        grid: {
          ...baseGrid,
          gridTemplateColumns: '1fr',
          maxWidth: '720px',
          aspectRatio: '16/9',
        },
      };
    }

    if (totalParticipants === 2) {
      return {
        container: containerStyle,
        grid: {
          ...baseGrid,
          gridTemplateColumns: 'repeat(2, 1fr)',
          maxWidth: '1200px',
          alignContent: 'center',
        },
      };
    }

    if (totalParticipants === 3) {
      return {
        container: containerStyle,
        grid: {
          ...baseGrid,
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          maxWidth: '1100px',
        },
      };
    }

    if (totalParticipants === 4) {
      return {
        container: containerStyle,
        grid: {
          ...baseGrid,
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          maxWidth: '1100px',
        },
      };
    }

    // 5+ participants
    return {
      container: {
        ...containerStyle,
        alignItems: 'flex-start',
        overflowY: 'auto',
      },
      grid: {
        ...baseGrid,
        gridTemplateColumns: 'repeat(3, 1fr)',
        alignContent: 'start',
      },
    };
  };

  const styles = getGridStyles();

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {/* Local Participant Tile */}
        <VideoTile
          stream={localStream}
          username={localUser.username}
          isLocal={true}
          isMuted={isLocalMuted}
          isCameraOff={isLocalCameraOff}
          photoURL={localUser.photoURL}
        />

        {/* Remote Participant Tiles */}
        {peerList.map(([socketId, peerInfo], idx) => {
          // If totalParticipants === 3 and this is the last one (idx === 1), we can optionally center it
          const isThirdInThree = totalParticipants === 3 && idx === 1;
          const tileStyle: React.CSSProperties = isThirdInThree
            ? { gridColumn: 'span 2', justifySelf: 'center', width: '50%' }
            : {};

          return (
            <div key={socketId} style={tileStyle}>
              <VideoTile
                stream={peerInfo.stream}
                username={peerInfo.username}
                isLocal={false}
                isMuted={peerInfo.isMuted}
                isCameraOff={peerInfo.isCameraOff}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

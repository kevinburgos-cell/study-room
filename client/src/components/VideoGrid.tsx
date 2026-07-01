import React from 'react';
import VideoTile from './VideoTile';
import type { PeerMediaState } from '../hooks/usePeerMediaState';

interface VideoGridProps {
  localStream: MediaStream | null;
  localUser: { uid: string; username: string; photoURL?: string | null };
  peers: Map<string, {
    stream: MediaStream | null;
    uid: string;
    username: string;
    photoURL?: string | null;
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    isScreenSharing?: boolean;
  }>;
  mediaStates?: Map<string, PeerMediaState>;
  isLocalMuted?: boolean;
  isLocalCameraOff?: boolean;
  isLocalScreenSharing?: boolean;
  className?: string;
}

function getMeetGridStyle(totalParticipants: number): React.CSSProperties {
  const minTileWidth = totalParticipants <= 2 ? 360 : totalParticipants <= 6 ? 260 : 200;
  return {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minTileWidth}px), 1fr))`,
    gridAutoRows: 'minmax(160px, 1fr)',
  };
}

function toMediaState(peer: {
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isScreenSharing?: boolean;
}): PeerMediaState {
  return {
    audioEnabled: peer.audioEnabled ?? true,
    videoEnabled: peer.videoEnabled ?? true,
    isScreenSharing: Boolean(peer.isScreenSharing),
  };
}

export default function VideoGrid({
  localStream,
  localUser,
  peers,
  mediaStates,
  isLocalMuted = false,
  isLocalCameraOff = false,
  isLocalScreenSharing = false,
  className = '',
}: VideoGridProps) {
  const peerList = Array.from(peers.entries());
  const totalParticipants = 1 + peerList.length;

  const localMediaState = {
    audioEnabled: !isLocalMuted,
    videoEnabled: !isLocalCameraOff,
    isScreenSharing: isLocalScreenSharing,
  };

  const localSharingActive = localMediaState.isScreenSharing;
  const sharingPeer = peerList.find(([socketId, peerInfo]) => {
    const mediaState = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid) ?? peerInfo;
    return Boolean(mediaState?.isScreenSharing);
  });

  const hasScreenShare = localSharingActive || Boolean(sharingPeer);

  // 1 Person layout
  if (totalParticipants === 1 && !hasScreenShare) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-black p-2 ${className}`}>
        <div className="relative w-full max-w-[800px] aspect-video flex items-center justify-center">
          <VideoTile
            stream={localStream}
            username={localUser.username}
            isLocal
            mediaState={localMediaState}
            photoURL={localUser.photoURL}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg bg-black/20">
            <span className="text-slate-300 text-sm md:text-base font-normal bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
              Esperando que otros se unan...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Screen Share Layout
  if (hasScreenShare) {
    let screenShareStream: MediaStream | null = null;
    let screenShareUser = '';
    let screenShareMedia: PeerMediaState | undefined;
    let sidePeersList: Array<{ stream: MediaStream | null; username: string; isLocal: boolean; mediaState: any; photoURL?: string | null; id: string }> = [];

    if (localSharingActive) {
      screenShareStream = localStream;
      screenShareUser = localUser.username;
      screenShareMedia = localMediaState;
      sidePeersList = peerList.map(([socketId, peerInfo]) => ({
        id: socketId,
        stream: peerInfo.stream,
        username: peerInfo.username,
        isLocal: false,
        photoURL: peerInfo.photoURL,
        mediaState: mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid) ?? toMediaState(peerInfo),
      }));
    } else if (sharingPeer) {
      const [sharingSocketId, sharingPeerInfo] = sharingPeer;
      screenShareStream = sharingPeerInfo.stream;
      screenShareUser = sharingPeerInfo.username;
      screenShareMedia = mediaStates?.get(sharingSocketId) ?? mediaStates?.get(sharingPeerInfo.uid) ?? toMediaState(sharingPeerInfo);

      sidePeersList = [
        {
          id: 'local',
          stream: localStream,
          username: localUser.username,
          isLocal: true,
          mediaState: localMediaState,
          photoURL: localUser.photoURL,
        },
        ...peerList
          .filter(([socketId]) => socketId !== sharingSocketId)
          .map(([socketId, peerInfo]) => ({
            id: socketId,
            stream: peerInfo.stream,
            username: peerInfo.username,
            isLocal: false,
            photoURL: peerInfo.photoURL,
            mediaState: mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid) ?? toMediaState(peerInfo),
          })),
      ];
    }

    return (
      <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
        <div className="flex h-full w-full flex-col gap-2 p-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)]">
          <div className="min-h-0 flex-1 lg:h-full">
            <VideoTile
              stream={screenShareStream}
              username={screenShareUser}
              mediaState={screenShareMedia}
              isScreenSharing
            />
          </div>

          <div
            className="grid max-h-[32vh] shrink-0 grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2 overflow-y-auto lg:max-h-none lg:auto-rows-max lg:grid-cols-1"
          >
            {sidePeersList.map((peer) => (
              <div key={peer.id} className="aspect-video min-h-[96px] lg:min-h-0">
                <VideoTile
                  stream={peer.stream}
                  username={peer.username}
                  isLocal={peer.isLocal}
                  mediaState={peer.mediaState}
                  photoURL={peer.photoURL}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-y-auto bg-black ${className}`} role="grid" aria-label="Videos de participantes">
      <div
        className="grid min-h-full w-full auto-rows-fr content-center gap-2 p-2"
        style={getMeetGridStyle(totalParticipants)}
      >
        {/* Local user tile */}
        <div className="aspect-video min-h-[150px] w-full">
          <VideoTile
            stream={localStream}
            username={localUser.username}
            isLocal
            mediaState={localMediaState}
            photoURL={localUser.photoURL}
          />
        </div>

        {/* Peer tiles */}
        {peerList.map(([socketId, peerInfo]) => {
          const peerMedia = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid) ?? toMediaState(peerInfo);
          return (
            <div key={socketId} className="aspect-video min-h-[150px] w-full">
              <VideoTile
                stream={peerInfo.stream}
                username={peerInfo.username}
                mediaState={peerMedia}
                photoURL={peerInfo.photoURL}
                audioEnabled={peerInfo.audioEnabled}
                videoEnabled={peerInfo.videoEnabled}
                isScreenSharing={peerInfo.isScreenSharing}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

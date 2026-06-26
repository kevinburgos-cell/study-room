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

function getGridClass(totalParticipants: number) {
  if (totalParticipants <= 1) return 'grid-cols-1 place-items-center max-w-[800px]';
  if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
  if (totalParticipants <= 4) return 'grid-cols-2';
  return 'grid-cols-3';
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
  const totalParticipants = 1 + peerList.length;

  const localMediaState = {
    audioEnabled: !isLocalMuted,
    videoEnabled: !isLocalCameraOff,
    isScreenSharing: Boolean(mediaStates?.get(localUser.uid)?.isScreenSharing),
  };

  const isLocalScreenSharing = localMediaState.isScreenSharing;
  const sharingPeer = peerList.find(([socketId, peerInfo]) => {
    const mediaState = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid);
    return Boolean(mediaState?.isScreenSharing);
  });

  const hasScreenShare = isLocalScreenSharing || Boolean(sharingPeer);

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

    if (isLocalScreenSharing) {
      screenShareStream = localStream;
      screenShareUser = localUser.username;
      screenShareMedia = localMediaState;
      sidePeersList = peerList.map(([socketId, peerInfo]) => ({
        id: socketId,
        stream: peerInfo.stream,
        username: peerInfo.username,
        isLocal: false,
        mediaState: mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid),
      }));
    } else if (sharingPeer) {
      const [sharingSocketId, sharingPeerInfo] = sharingPeer;
      screenShareStream = sharingPeerInfo.stream;
      screenShareUser = sharingPeerInfo.username;
      screenShareMedia = mediaStates?.get(sharingSocketId) ?? mediaStates?.get(sharingPeerInfo.uid);

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
            mediaState: mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid),
          })),
      ];
    }

    return (
      <div className={`relative h-full w-full bg-black ${className}`}>
        <div className="grid h-full w-full gap-2 p-2 grid-cols-1 md:grid-cols-[2fr_1fr] overflow-hidden">
          {/* Main Sharing Tile */}
          <div className="min-h-0 h-[60vh] md:h-auto">
            <VideoTile
              stream={screenShareStream}
              username={screenShareUser}
              mediaState={screenShareMedia}
              isScreenSharing
            />
          </div>

          {/* Sidebar Tiles */}
          <div className="grid min-h-0 grid-cols-2 md:grid-cols-1 gap-2 overflow-y-auto content-start">
            {sidePeersList.map((peer) => (
              <div key={peer.id} className="aspect-video">
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

  // Standard layouts: 2, 3-4, 5+
  let layoutClasses = 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1'; // Default 2 people layout
  if (totalParticipants >= 3 && totalParticipants <= 4) {
    layoutClasses = 'grid-cols-2 grid-rows-2';
  } else if (totalParticipants >= 5) {
    layoutClasses = 'grid-cols-2 md:grid-cols-3 overflow-y-auto';
  }

  return (
    <div className={`relative h-full w-full bg-black ${className}`}>
      <div className={`grid h-full w-full gap-2 p-2 ${layoutClasses}`}>
        {/* Local user tile */}
        <div className="w-full h-full min-h-[140px]">
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
          const peerMedia = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid);
          return (
            <div key={socketId} className="w-full h-full min-h-[140px]">
              <VideoTile
                stream={peerInfo.stream}
                username={peerInfo.username}
                mediaState={peerMedia}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

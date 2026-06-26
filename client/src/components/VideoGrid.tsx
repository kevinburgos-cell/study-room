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
  const screenSharingPeer = peerList.find(([socketId, peerInfo]) => {
    const mediaState = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid);
    return Boolean(mediaState?.isScreenSharing);
  });
  const hasScreenShare = Boolean(screenSharingPeer);
  const gridClass = getGridClass(totalParticipants);
  const localMediaState = {
    audioEnabled: !isLocalMuted,
    videoEnabled: !isLocalCameraOff,
  };

  if (hasScreenShare && screenSharingPeer) {
    const [sharingSocketId, sharingPeer] = screenSharingPeer;
    const sharingMedia = mediaStates?.get(sharingSocketId) ?? mediaStates?.get(sharingPeer.uid);
    const sidePeers = peerList.filter(([socketId]) => socketId !== sharingSocketId);

    return (
      <div className={`relative h-full w-full ${className}`}>
        <div className="grid h-full w-full gap-2 overflow-hidden p-2 md:grid-cols-[2fr_1fr]">
          <div className="min-h-0">
            <VideoTile
              stream={sharingPeer.stream}
              username={sharingPeer.username}
              mediaState={sharingMedia}
              isScreenSharing
            />
          </div>

          <div className="grid min-h-0 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-1">
            <div className="min-h-[120px]">
              <VideoTile
                stream={localStream}
                username={localUser.username}
                isLocal
                mediaState={localMediaState}
                photoURL={localUser.photoURL}
              />
            </div>

            {sidePeers.map(([socketId, peerInfo]) => {
              const peerMedia = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid);
              return (
                <div key={socketId} className="min-h-[120px]">
                  <VideoTile stream={peerInfo.stream} username={peerInfo.username} mediaState={peerMedia} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        className={[
          'grid h-full w-full gap-2 overflow-y-auto p-2',
          gridClass,
          totalParticipants === 1 ? 'justify-items-center' : '',
        ].join(' ')}
      >
        <div
          className={[
            'w-full',
            totalParticipants === 1 ? 'max-w-[800px]' : '',
            totalParticipants === 2 ? 'aspect-video' : '',
            totalParticipants >= 5 ? 'min-h-[180px]' : '',
          ].join(' ')}
        >
          <VideoTile
            stream={localStream}
            username={localUser.username}
            isLocal
            mediaState={localMediaState}
            photoURL={localUser.photoURL}
          />
        </div>

        {peerList.map(([socketId, peerInfo]) => {
          const peerMedia = mediaStates?.get(socketId) ?? mediaStates?.get(peerInfo.uid);
          const isScreenSharing = Boolean(peerMedia?.isScreenSharing);
          return (
            <div
              key={socketId}
              className={[
                'w-full',
                isScreenSharing ? 'md:col-span-2 md:min-h-[55vh]' : '',
                totalParticipants === 2 ? 'aspect-video' : '',
                totalParticipants >= 5 ? 'min-h-[180px]' : '',
              ].join(' ')}
            >
              <VideoTile
                stream={peerInfo.stream}
                username={peerInfo.username}
                mediaState={peerMedia}
                isScreenSharing={isScreenSharing}
              />
            </div>
          );
        })}
      </div>

      {totalParticipants === 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/45 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            Esperando que otros se unan...
          </div>
        </div>
      )}
    </div>
  );
}

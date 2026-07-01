import React, { useEffect, useRef } from 'react';
import type { PeerMediaState } from '../hooks/usePeerMediaState';

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  isLocal?: boolean;
  mediaState?: PeerMediaState;
  photoURL?: string | null;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isScreenSharing?: boolean;
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 5.2 2.1" />
      <path d="M19 11a7 7 0 0 1-7 7m-4-1a7 7 0 0 0 11-6" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export default function VideoTile({
  stream,
  username,
  isLocal = false,
  mediaState,
  photoURL = null,
  audioEnabled: audioEnabledProp,
  videoEnabled: videoEnabledProp,
  isScreenSharing = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioEnabled = audioEnabledProp ?? mediaState?.audioEnabled ?? true;
  const videoEnabled = videoEnabledProp ?? mediaState?.videoEnabled ?? true;
  const sharing = mediaState?.isScreenSharing ?? isScreenSharing;
  const hasVideoTrack = (stream?.getVideoTracks()?.length ?? 0) > 0;
  const shouldShowVideo = hasVideoTrack && (videoEnabled || sharing);
  const showAvatar = !shouldShowVideo;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('[VideoTile] Autoplay blocked:', err);
      });
    }
  }, [stream]);

  useEffect(() => {
    if (shouldShowVideo && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('[VideoTile] Video play failed:', err);
      });
    }
  }, [shouldShowVideo]);

  useEffect(() => {
    if (audioRef.current && stream && !isLocal) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((err) => {
        console.warn('[VideoTile] Audio autoplay blocked:', err);
      });
    }
  }, [stream, isLocal]);

  const initial = username ? username[0].toUpperCase() : 'U';

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-black shadow-[0_18px_40px_rgba(2,6,23,0.42)]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || showAvatar}
        className={[
          'h-full w-full object-cover',
          shouldShowVideo ? 'block' : 'hidden',
          isLocal && !sharing ? 'scale-x-[-1]' : '',
        ].join(' ')}
      />

      {showAvatar && stream && !isLocal && (
        <audio ref={audioRef} autoPlay playsInline />
      )}

      {showAvatar && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E293B]">
          {photoURL ? (
            <img src={photoURL} alt={username} className="h-16 w-16 rounded-full object-cover ring-2 ring-white/10" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
              {initial}
            </div>
          )}
          <span className="mt-2 text-sm font-medium text-white">{username}</span>
        </div>
      )}

      {sharing && (
        <div className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-lg">
          Compartiendo pantalla
        </div>
      )}

      {isLocal && (
        <div className={`absolute left-2 ${sharing ? 'top-9' : 'top-2'} rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white`}>
          Tú
        </div>
      )}

      {!audioEnabled && (
        <div className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow-md flex items-center justify-center">
          <MicOffIcon />
        </div>
      )}

      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-sm font-medium text-white">
        {username}
      </div>
    </div>
  );
}

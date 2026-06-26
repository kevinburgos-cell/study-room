import React, { useEffect, useRef } from 'react';
import type { PeerMediaState } from '../hooks/usePeerMediaState';

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  isLocal?: boolean;
  mediaState?: PeerMediaState;
  photoURL?: string | null;
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
  isScreenSharing = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioEnabled = mediaState?.audioEnabled ?? true;
  const videoEnabled = mediaState?.videoEnabled ?? true;
  const sharing = mediaState?.isScreenSharing ?? isScreenSharing;
  const showAvatar = !stream || !videoEnabled || sharing;

  useEffect(() => {
    if (videoRef.current && stream && !showAvatar) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream, showAvatar]);

  const initials = username ? username.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-slate-950 shadow-[0_18px_40px_rgba(2,6,23,0.42)]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={[
          'h-full w-full object-cover transition-opacity duration-300',
          isLocal ? 'scale-x-[-1]' : '',
          showAvatar ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      />

      {showAvatar && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
          {photoURL ? (
            <img src={photoURL} alt={username} className="mb-3 h-20 w-20 rounded-full object-cover ring-2 ring-white/10" />
          ) : (
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-slate-600 text-2xl font-bold text-white ring-2 ring-white/10">
              {initials}
            </div>
          )}
          <span className="text-sm text-slate-200">{sharing ? 'Compartiendo pantalla' : 'Cámara apagada'}</span>
        </div>
      )}

      {sharing && (
        <div className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-lg">
          Compartiendo pantalla
        </div>
      )}

      {isLocal && (
        <div className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
          Tú
        </div>
      )}

      {!audioEnabled && (
        <div className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow-lg">
          <MicOffIcon />
        </div>
      )}

      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-sm font-medium text-white">
        {username}
      </div>
    </div>
  );
}

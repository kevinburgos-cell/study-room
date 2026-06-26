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
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 5.2 2.1" />
      <path d="M19 11a7 7 0 0 1-7 7m-4-1a7 7 0 0 0 11-6" />
      <path d="M5 11v1a7 7 0 0 0 12.5 4.3" />
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

  useEffect(() => {
    if (videoRef.current && stream && videoEnabled && !sharing) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream, videoEnabled, sharing]);

  const initials = username ? username.slice(0, 2).toUpperCase() : 'U';
  const shouldShowAvatar = !stream || !videoEnabled || sharing;

  return (
    <div
      className="video-tile"
      style={{
        position: 'relative',
        backgroundColor: '#020617',
        borderRadius: '1.25rem',
        border: isLocal ? '1px solid rgba(59, 130, 246, 0.55)' : '1px solid rgba(148, 163, 184, 0.16)',
        overflow: 'hidden',
        aspectRatio: '16 / 9',
        width: '100%',
        height: '100%',
        boxShadow: '0 18px 36px rgba(2,6,23,0.35)',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: shouldShowAvatar ? 'none' : 'block',
          transform: isLocal ? 'scaleX(-1)' : 'none',
        }}
      />

      {shouldShowAvatar && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top, #1e293b 0%, #020617 72%)',
            color: '#f8fafc',
          }}
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={username}
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.16)',
                marginBottom: '0.75rem',
              }}
            />
          ) : (
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                backgroundColor: '#334155',
                fontSize: '1.75rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid rgba(255,255,255,0.16)',
                marginBottom: '0.75rem',
              }}
            >
              {initials}
            </div>
          )}
          <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            {sharing ? 'Compartiendo pantalla' : 'Cámara apagada'}
          </span>
        </div>
      )}

      {!audioEnabled && (
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            backgroundColor: 'rgba(220, 38, 38, 0.95)',
            color: '#fff',
            borderRadius: '999px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 18px rgba(0,0,0,0.28)',
            zIndex: 10,
          }}
          title="Micrófono silenciado"
        >
          <MicOffIcon />
        </div>
      )}

      {sharing && (
        <div
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            backgroundColor: 'rgba(37, 99, 235, 0.95)',
            color: '#fff',
            padding: '0.35rem 0.6rem',
            borderRadius: '999px',
            fontSize: '0.76rem',
            fontWeight: 700,
            zIndex: 10,
          }}
        >
          Compartiendo pantalla
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '0.75rem',
          left: '0.75rem',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          padding: '0.35rem 0.7rem',
          borderRadius: '999px',
          fontSize: '0.82rem',
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {username}
        {isLocal && <span style={{ marginLeft: '0.35rem', color: '#86efac' }}>Tú</span>}
      </div>
    </div>
  );
}

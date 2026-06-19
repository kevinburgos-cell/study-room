import React, { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  photoURL?: string | null;
}

export default function VideoTile({
  stream,
  username,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  photoURL = null,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      // Check if there is an active video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.enabled && !isCameraOff) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream, isCameraOff]);

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'U';

  const videoTrack = stream?.getVideoTracks()[0];
  const hasVideoTrack = Boolean(videoTrack && videoTrack.readyState === 'live' && !isCameraOff);

  return (
    <div 
      className="video-tile"
      style={{
        position: 'relative',
        backgroundColor: '#000000',
        borderRadius: 'var(--radius-lg)',
        border: isLocal ? '2px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
        overflow: 'hidden',
        aspectRatio: '16/9',
        width: '100%',
        height: '100%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video playback to avoid feedback loop
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: hasVideoTrack ? 'block' : 'none',
          transform: isLocal ? 'scaleX(-1)' : 'none', // Mirror effect for local self-view
        }}
      />

      {/* Avatar Fallback */}
      {!hasVideoTrack && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
            color: 'var(--text-primary)',
          }}
        >
          {photoURL ? (
            <img 
              src={photoURL} 
              alt={username} 
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--border-color)',
                marginBottom: '0.75rem',
              }}
            />
          ) : (
            <div 
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '1.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid var(--border-color)',
                marginBottom: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              }}
            >
              {initials}
            </div>
          )}
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Cámara apagada
          </span>
        </div>
      )}

      {/* Mic Mute Indicator Icon */}
      {isMuted && (
        <div 
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            color: '#ffffff',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10,
          }}
          title="Micrófono silenciado"
        >
          🎙️❌
        </div>
      )}

      {/* Username / Status Label Bar */}
      <div 
        style={{
          position: 'absolute',
          bottom: '0.75rem',
          left: '0.75rem',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          color: '#ffffff',
          padding: '0.25rem 0.6rem',
          borderRadius: '4px',
          fontSize: '0.85rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <span>{username}</span>
        {isLocal && (
          <span 
            style={{
              backgroundColor: 'var(--color-success)',
              color: '#ffffff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.05rem 0.3rem',
              borderRadius: '2px',
              textTransform: 'uppercase',
            }}
          >
            Tú
          </span>
        )}
      </div>
    </div>
  );
}

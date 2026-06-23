import React from 'react';
import { RoomMember } from '../types/room.types';
import type { PeerMediaState } from '../hooks/usePeerMediaState';

interface MembersSidebarProps {
  members: RoomMember[];
  hostUid: string;
  currentUserUid: string;
  mediaStates?: Map<string, PeerMediaState>;
  isConnecting?: boolean;
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 5.2 2.1" />
      <path d="M19 11a7 7 0 0 1-7 7m-4-1a7 7 0 0 0 11-6" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export default function MembersSidebar({ members, hostUid, currentUserUid, mediaStates, isConnecting }: MembersSidebarProps) {
  const getInitials = (username: string) => (username ? username.substring(0, 2).toUpperCase() : '??');

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        overflowY: 'auto',
      }}
      aria-label="Participantes de la sala"
    >
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Participantes</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.1rem 0.5rem', borderRadius: '999px' }}>
          {members.length}
        </span>
      </h2>

      {isConnecting && (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500, backgroundColor: 'rgba(59,130,246,0.08)', padding: '0.6rem', borderRadius: '10px' }}>
          Conectando...
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {members.map((member) => {
          const isMe = member.uid === currentUserUid;
          const isHost = member.uid === hostUid;
          const mediaState = mediaStates?.get(member.uid);

          return (
            <div
              key={member.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.55rem',
                borderRadius: '12px',
                backgroundColor: isMe ? 'rgba(59,130,246,0.06)' : 'transparent',
                border: isMe ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent',
              }}
            >
              <div
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'white',
                  overflow: 'hidden',
                  border: isHost ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                }}
              >
                {member.photoURL ? (
                  <img src={member.photoURL} alt={member.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(member.username)
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      color: isMe ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {member.username}
                  </span>
                  {mediaState?.audioEnabled === false && (
                    <span title="Silenciado" style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center' }}>
                      <MicOffIcon />
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.1rem', flexWrap: 'wrap' }}>
                  {isMe && (
                    <span style={{ fontSize: '0.68rem', padding: '0.05rem 0.35rem', borderRadius: '999px', backgroundColor: 'rgba(34,197,94,0.15)', color: '#86efac', fontWeight: 600 }}>
                      Tú
                    </span>
                  )}
                  {isHost && (
                    <span style={{ fontSize: '0.68rem', padding: '0.05rem 0.35rem', borderRadius: '999px', backgroundColor: 'rgba(59,130,246,0.15)', color: '#9fc5ff', fontWeight: 600 }}>
                      Host
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

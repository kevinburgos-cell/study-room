import React from 'react';
import { RoomMember } from '../types/room.types';

interface MembersSidebarProps {
  members: RoomMember[];
  hostUid: string;
  currentUserUid: string;
}

export default function MembersSidebar({ members, hostUid, currentUserUid }: MembersSidebarProps) {
  const getInitials = (username: string) => {
    return username ? username.substring(0, 2).toUpperCase() : '??';
  };

  return (
    <aside 
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        height: '100%',
        overflowY: 'auto'
      }}
      aria-label="Participantes de la sala"
    >
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Participantes</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
          {members.length}
        </span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {members.map((member) => {
          const isMe = member.uid === currentUserUid;
          const isHost = member.uid === hostUid;

          return (
            <div 
              key={member.uid} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '8px',
                backgroundColor: isMe ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                border: isMe ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent'
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
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'white',
                  overflow: 'hidden',
                  border: isHost ? '2px solid var(--color-primary)' : '1px solid var(--border-color)'
                }}
              >
                {member.photoURL ? (
                  <img 
                    src={member.photoURL} 
                    alt={member.username} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(member.username)
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                <span 
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    color: isMe ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {member.username}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.1rem' }}>
                  {isMe && (
                    <span style={{ fontSize: '0.7rem', padding: '0.05rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#86efac', fontWeight: 600 }}>
                      Tú
                    </span>
                  )}
                  {isHost && (
                    <span style={{ fontSize: '0.7rem', padding: '0.05rem 0.35rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#9fc5ff', fontWeight: 600 }}>
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

import React, { useState, useRef, useEffect } from 'react';
import { Room } from '../types/room.types';

interface RoomCardProps {
  room: Room;
  currentUserUid: string;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onEnter: (room: Room) => void;
}

export default function RoomCard({ room, currentUserUid, onEdit, onDelete, onEnter }: RoomCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isHost = room.hostUid === currentUserUid;
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <article 
      className="glass-panel room-card interactive-element" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        minHeight: '13rem',
        padding: '1.5rem'
      }}
      aria-label={`Sala ${room.name}`}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Host / Member Badge */}
            {isHost ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#9fc5ff' }}>
                👤 Anfitrión
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                👥 Miembro
              </span>
            )}

            {/* Private Badge */}
            {room.isPrivate && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                🔒 Privada
              </span>
            )}
          </div>

          {/* Three Dots Menu for Host */}
          {isHost && (
            <div className="dropdown-container" ref={menuRef}>
              <button 
                type="button"
                className="dropdown-trigger" 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                aria-label="Opciones de sala"
              >
                ⋮
              </button>
              {menuOpen && (
                <div className="dropdown-menu">
                  <button 
                    type="button"
                    className="dropdown-item" 
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(room);
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    type="button"
                    className="dropdown-item dropdown-item-danger" 
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(room);
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 700, marginBottom: '0.5rem', wordBreak: 'break-word' }}>
          {room.name}
        </h3>
        
        {room.description && (
          <p 
            style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              marginBottom: '1rem'
            }}
          >
            {room.description}
          </p>
        )}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            👥 {room.members ? room.members.length : 0} {room.members?.length === 1 ? 'miembro' : 'miembros'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
            ID: <code style={{ backgroundColor: 'var(--bg-main)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{room.id}</code>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onEnter(room)}
          className="btn-secondary interactive-element"
          style={{ 
            width: '100%', 
            padding: '0.5rem 1rem', 
            fontSize: '0.875rem', 
            borderColor: 'var(--color-primary)', 
            color: 'var(--color-primary)',
            background: 'transparent'
          }}
          aria-label={`Entrar a la sala ${room.name}`}
        >
          Entrar a la sala
        </button>
      </div>
    </article>
  );
}

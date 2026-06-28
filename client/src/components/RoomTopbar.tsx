import React from 'react';

interface RoomTopbarProps {
  roomName: string;
  elapsedTime: string;
  participantCount: number;
  onLeave: () => void;
  isConnected?: boolean;
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function RoomTopbar({ roomName, elapsedTime, participantCount, isConnected = true }: RoomTopbarProps & { onLeave?: () => void }) {
  return (
    <header className="flex h-[56px] shrink-0 items-center bg-[#1E293B] px-4 text-white">
      <div className="flex flex-1 items-center">
        <h1 className="truncate text-base font-semibold text-white">{roomName}</h1>
      </div>

      <div className="flex flex-1 items-center justify-center gap-3">
        <span className="text-slate-400 font-mono text-sm">{elapsedTime}</span>
        <span style={{
          fontSize: '0.75rem',
          color: isConnected ? '#86efac' : '#94a3b8',
          backgroundColor: 'rgba(15,23,42,0.72)',
          padding: '0.25rem 0.65rem',
          borderRadius: '999px',
          border: isConnected ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(148,163,184,0.16)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          userSelect: 'none'
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#22c55e' : '#ef4444'
          }}
          className={isConnected ? 'animate-pulse' : ''} />
          {isConnected ? 'En línea' : 'Desconectado'}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end">
        <div className="flex items-center gap-2 text-slate-300">
          <PeopleIcon />
          <span className="text-sm font-medium">{participantCount}</span>
        </div>
      </div>
    </header>
  );
}

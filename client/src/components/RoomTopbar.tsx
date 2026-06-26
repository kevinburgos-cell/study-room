import React from 'react';

interface RoomTopbarProps {
  roomName: string;
  elapsedTime: string;
  participantCount: number;
  onLeave: () => void;
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

export default function RoomTopbar({ roomName, elapsedTime, participantCount }: Omit<RoomTopbarProps, 'onLeave'> & { onLeave?: () => void }) {
  return (
    <header className="flex h-[56px] shrink-0 items-center bg-[#1E293B] px-4 text-white">
      <div className="flex flex-1 items-center">
        <h1 className="truncate text-base font-semibold text-white">{roomName}</h1>
      </div>

      <div className="flex flex-1 items-center justify-center text-sm text-slate-400 font-mono">
        {elapsedTime}
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

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

export default function RoomTopbar({ roomName, elapsedTime, participantCount, onLeave }: RoomTopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-slate-700 bg-slate-800 px-4 text-white">
      <div className="flex flex-1 items-center gap-3">
        <h1 className="truncate text-base font-semibold">{roomName}</h1>
      </div>

      <div className="hidden flex-1 items-center justify-center text-sm text-slate-300 md:flex">
        {elapsedTime}
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-200 md:flex">
          <PeopleIcon />
          <span>{participantCount}</span>
        </div>
        <button
          onClick={onLeave}
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          Salir
        </button>
      </div>
    </header>
  );
}

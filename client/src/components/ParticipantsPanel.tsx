import React from 'react';
import { RoomMember } from '../types/room.types';
import type { PeerMediaState } from '../hooks/usePeerMediaState';

interface ParticipantsPanelProps {
  members: RoomMember[];
  hostUid: string;
  currentUserUid: string;
  mediaStates?: Map<string, PeerMediaState>;
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
  chatOpen?: boolean;
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

function CameraOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l22 22" />
      <path d="M15 8l5-3v14l-5-3" />
      <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export default function ParticipantsPanel({ members, hostUid, currentUserUid, mediaStates, open, onClose, mobile = false, chatOpen = false }: ParticipantsPanelProps) {
  const getInitials = (username: string) => (username ? username.slice(0, 2).toUpperCase() : '??');

  if (!open) return null;

  const panel = mobile ? (
    <div className="rounded-t-2xl bg-slate-800 text-white shadow-2xl">
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-600" />
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <h3 className="text-base font-semibold">Participantes ({members.length})</h3>
        <button onClick={onClose} className="rounded-full p-2 text-slate-300 hover:bg-slate-700 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-[50vh] overflow-y-auto px-3 py-3">
        {members.map((member) => {
          const isMe = member.uid === currentUserUid;
          const isHost = member.uid === hostUid;
          const mediaState = mediaStates?.get(member.uid) ?? mediaStates?.get(member.uid);
          return (
            <div key={member.uid} className="mb-2 flex items-center gap-3 rounded-xl bg-slate-700/40 p-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-600 text-sm font-semibold text-white">
                {member.photoURL ? <img src={member.photoURL} alt={member.username} className="h-full w-full object-cover" /> : getInitials(member.username)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{member.username}</span>
                  {mediaState?.audioEnabled === false && <span className="text-red-400"><MicOffIcon /></span>}
                  {mediaState?.videoEnabled === false && <span className="text-slate-400"><CameraOffIcon /></span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {isMe && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">Tú</span>}
                  {isHost && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-300">Host</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="absolute right-0 top-0 z-20 w-[280px] overflow-hidden rounded-xl border border-slate-700 bg-slate-800 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <h3 className="text-sm font-semibold">Participantes ({members.length})</h3>
        <button onClick={onClose} className="rounded-full p-2 text-slate-300 hover:bg-slate-700 hover:text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto px-3 py-3">
        {members.map((member) => {
          const isMe = member.uid === currentUserUid;
          const isHost = member.uid === hostUid;
          const mediaState = mediaStates?.get(member.uid) ?? mediaStates?.get(member.uid);
          return (
            <div key={member.uid} className="mb-2 flex items-center gap-3 rounded-xl bg-slate-700/40 p-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-600 text-sm font-semibold text-white">
                {member.photoURL ? <img src={member.photoURL} alt={member.username} className="h-full w-full object-cover" /> : getInitials(member.username)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{member.username}</span>
                  {mediaState?.audioEnabled === false && <span className="text-red-400"><MicOffIcon /></span>}
                  {mediaState?.videoEnabled === false && <span className="text-slate-400"><CameraOffIcon /></span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {isMe && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">Tú</span>}
                  {isHost && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-300">Host</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return mobile ? panel : panel;
}

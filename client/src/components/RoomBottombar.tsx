import React from 'react';

interface RoomBottombarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  peopleOpen: boolean;
  chatOpen: boolean;
  unreadChatCount: number;
  participantCount: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onTogglePeople: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
}

function MicIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 5.2 2.1" />
      <path d="M19 11a7 7 0 0 1-7 7m-4-1a7 7 0 0 0 11-6" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
    </svg>
  );
}

function CameraIcon({ off }: { off: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l22 22" />
      <path d="M15 8l5-3v14l-5-3" />
      <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10l5-3v10l-5-3" />
    </svg>
  );
}

function ScreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
      <path d="M8 9l2 2 4-4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export default function RoomBottombar({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  peopleOpen,
  chatOpen,
  unreadChatCount,
  participantCount,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onTogglePeople,
  onToggleChat,
  onLeave,
}: RoomBottombarProps) {
  return (
    <footer className="shrink-0 border-t border-slate-700 bg-slate-800 text-white">
      <div className="flex items-center justify-center gap-2 px-3 py-3 md:gap-3 md:py-4">
        <button
          onClick={onToggleAudio}
          className={[
            'flex min-w-[80px] flex-col items-center justify-center gap-1 rounded-full px-3 py-2 transition',
            isAudioEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-500',
          ].join(' ')}
        >
          <MicIcon muted={!isAudioEnabled} />
          <span className="hidden text-[11px] font-semibold md:block">{isAudioEnabled ? 'Mic' : 'Mute'}</span>
        </button>

        <button
          onClick={onToggleVideo}
          className={[
            'flex min-w-[80px] flex-col items-center justify-center gap-1 rounded-full px-3 py-2 transition',
            isVideoEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-500',
          ].join(' ')}
        >
          <CameraIcon off={!isVideoEnabled} />
          <span className="hidden text-[11px] font-semibold md:block">{isVideoEnabled ? 'Cam' : 'Off'}</span>
        </button>

        <button
          onClick={onToggleScreenShare}
          className={[
            'flex min-w-[80px] flex-col items-center justify-center gap-1 rounded-full px-3 py-2 transition',
            isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 hover:bg-slate-600',
          ].join(' ')}
        >
          <ScreenIcon active={isScreenSharing} />
          <span className="hidden text-[11px] font-semibold md:block">{isScreenSharing ? 'Compartiendo' : 'Compartir'}</span>
        </button>

        <button
          onClick={onTogglePeople}
          className={[
            'relative flex min-w-[80px] flex-col items-center justify-center gap-1 rounded-full border px-3 py-2 transition',
            peopleOpen ? 'border-blue-500 bg-blue-500/20' : 'border-transparent bg-slate-700 hover:bg-slate-600',
          ].join(' ')}
        >
          <span className="absolute -top-1 right-2 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{participantCount}</span>
          <PeopleIcon />
          <span className="hidden text-[11px] font-semibold md:block">Personas</span>
        </button>

        <button
          onClick={onToggleChat}
          className={[
            'relative flex min-w-[80px] flex-col items-center justify-center gap-1 rounded-full border px-3 py-2 transition',
            chatOpen ? 'border-blue-500 bg-blue-500/20' : 'border-transparent bg-slate-700 hover:bg-slate-600',
          ].join(' ')}
        >
          {unreadChatCount > 0 && !chatOpen && (
            <span className="absolute -top-1 right-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadChatCount}
            </span>
          )}
          <ChatIcon />
          <span className="hidden text-[11px] font-semibold md:block">Chat</span>
        </button>

        <button
          onClick={onLeave}
          className="ml-auto flex min-w-[80px] flex-col items-center justify-center gap-1 rounded-full bg-red-600 px-3 py-2 transition hover:bg-red-500"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 3v18" />
          </svg>
          <span className="hidden text-[11px] font-semibold md:block">Salir</span>
        </button>
      </div>
    </footer>
  );
}

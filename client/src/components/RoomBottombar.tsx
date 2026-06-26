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
    <footer className="shrink-0 bg-[#1E293B] border-t border-[#334155] h-[64px] md:h-[72px] text-white px-4 md:px-6 flex items-center justify-between">
      {/* Left spacer/aligner to balance out ml-auto on Salir button or keep controls centered */}
      <div className="flex-1 hidden md:block" />

      {/* Center Controls */}
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-1 md:flex-initial">
        {/* Mic Button */}
        <button
          onClick={onToggleAudio}
          className="flex flex-col items-center justify-center min-w-[48px] md:min-w-[80px] focus:outline-none"
        >
          <div
            className={[
              'rounded-full p-2.5 md:p-3 transition-all duration-200 text-white flex items-center justify-center',
              isAudioEnabled ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-red-600 hover:bg-red-500',
            ].join(' ')}
          >
            <MicIcon muted={!isAudioEnabled} />
          </div>
          <span className="hidden md:block text-[11px] font-medium text-slate-300 mt-1 select-none">
            {isAudioEnabled ? 'Silenciar' : 'Activar mic'}
          </span>
        </button>

        {/* Camera Button */}
        <button
          onClick={onToggleVideo}
          className="flex flex-col items-center justify-center min-w-[48px] md:min-w-[80px] focus:outline-none"
        >
          <div
            className={[
              'rounded-full p-2.5 md:p-3 transition-all duration-200 text-white flex items-center justify-center',
              isVideoEnabled ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-red-600 hover:bg-red-500',
            ].join(' ')}
          >
            <CameraIcon off={!isVideoEnabled} />
          </div>
          <span className="hidden md:block text-[11px] font-medium text-slate-300 mt-1 select-none">
            {isVideoEnabled ? 'Detener video' : 'Iniciar video'}
          </span>
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          className="flex flex-col items-center justify-center min-w-[48px] md:min-w-[80px] focus:outline-none"
        >
          <div
            className={[
              'rounded-full p-2.5 md:p-3 transition-all duration-200 text-white flex items-center justify-center',
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#334155] hover:bg-[#475569]',
            ].join(' ')}
          >
            <ScreenIcon active={isScreenSharing} />
          </div>
          <span className="hidden md:block text-[11px] font-medium text-slate-300 mt-1 select-none">
            {isScreenSharing ? 'Compartiendo' : 'Presentar'}
          </span>
        </button>

        {/* People Button */}
        <button
          onClick={onTogglePeople}
          className="flex flex-col items-center justify-center min-w-[48px] md:min-w-[80px] focus:outline-none"
        >
          <div
            className={[
              'relative rounded-full p-2.5 md:p-3 transition-all duration-200 text-white flex items-center justify-center',
              peopleOpen
                ? 'bg-blue-600/20 border border-blue-600'
                : 'border border-transparent bg-[#334155] hover:bg-[#475569]',
            ].join(' ')}
          >
            {participantCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md">
                {participantCount}
              </span>
            )}
            <PeopleIcon />
          </div>
          <span className="hidden md:block text-[11px] font-medium text-slate-300 mt-1 select-none">
            Personas
          </span>
        </button>

        {/* Chat Button */}
        <button
          onClick={onToggleChat}
          className="flex flex-col items-center justify-center min-w-[48px] md:min-w-[80px] focus:outline-none"
        >
          <div
            className={[
              'relative rounded-full p-2.5 md:p-3 transition-all duration-200 text-white flex items-center justify-center',
              chatOpen
                ? 'bg-blue-600/20 border border-blue-600'
                : 'border border-transparent bg-[#334155] hover:bg-[#475569]',
            ].join(' ')}
          >
            {unreadChatCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md animate-pulse">
                {unreadChatCount}
              </span>
            )}
            <ChatIcon />
          </div>
          <span className="hidden md:block text-[11px] font-medium text-slate-300 mt-1 select-none">
            Chat
          </span>
        </button>
      </div>

      {/* Right Controls / Salir Button */}
      <div className="flex-1 flex items-center justify-end">
        <button
          onClick={onLeave}
          className="flex flex-col items-center justify-center min-w-[48px] md:min-w-[80px] focus:outline-none"
        >
          <div className="rounded-full p-2.5 md:p-3 bg-red-600 hover:bg-red-500 transition-all duration-200 text-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <span className="hidden md:block text-[11px] font-medium text-red-300 mt-1 select-none">
            Salir
          </span>
        </button>
      </div>
    </footer>
  );
}

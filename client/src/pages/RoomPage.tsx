import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { leaveRoom } from '../hooks/useRooms';
import { Room } from '../types/room.types';
import EditRoomModal from '../components/modals/EditRoomModal';
import DeleteRoomModal from '../components/modals/DeleteRoomModal';
import Toast from '../components/Toast';
import { socket } from '../socket/socket';
import { useSocket } from '../hooks/useSocket';
import { useRoomUsers } from '../hooks/useRoomUsers';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/VideoGrid';
import PermissionErrorPanel from '../components/PermissionErrorPanel';
import { usePeerMediaState } from '../hooks/usePeerMediaState';
import RoomTopbar from '../components/RoomTopbar';
import RoomBottombar from '../components/RoomBottombar';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';

type MobileSheet = 'none' | 'chat' | 'people';

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>('none');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isPointerActive, setIsPointerActive] = useState(false);

  useEffect(() => {
    const handleRoomDeleted = () => setIsDeletedModalOpen(true);
    socket.on('room-deleted', handleRoomDeleted);
    return () => {
      socket.off('room-deleted', handleRoomDeleted);
    };
  }, []);

  useEffect(() => {
    if (!id || !user) return;
    setLoadingRoom(true);
    const roomRef = doc(db, 'rooms', id);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists()) {
        navigate('/dashboard', { state: { successMessage: 'La sala ya no existe o fue eliminada.' } });
        return;
      }
      const roomData = { id: docSnap.id, ...docSnap.data() } as Room;
      const isHost = roomData.hostUid === user.uid;
      const isMember = roomData.members.some((m) => m.uid === user.uid);
      if (!isHost && !isMember) {
        navigate('/dashboard');
        return;
      }
      setRoom(roomData);
      setLoadingRoom(false);
    });
    return () => unsubscribe();
  }, [id, user, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const { isConnected, isConnecting, showReconnectingBanner, showConnectedSuccess } = useSocket(id);
  const onlineUsers = useRoomUsers({
    onUserJoined: (username) => setToast({ message: `${username} se unió a la sala`, type: 'success' }),
    onUserLeft: (username) => setToast({ message: `${username} salió de la sala`, type: 'success' }),
    onError: (errorMessage) => {
      setToast({ message: `Error en tiempo real: ${errorMessage}`, type: 'error' });
      if (errorMessage.toLowerCase().includes('token')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    },
  });

  const {
    localStream,
    peers,
    permissionError,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    retryPermissions,
    continueWithoutVideo,
  } = useWebRTC(id, onlineUsers);

  const peerMediaStates = usePeerMediaState();
  const hasMountedRoom = useMemo(() => Boolean(room && user), [room, user]);
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  const isMissingMediaDevice = permissionError === 'NotFoundError';
  const shouldShowPermissionPanel = Boolean(permissionError && !isMissingMediaDevice);

  useEffect(() => {
    if (mobileSheet === 'chat') setUnreadChatCount(0);
  }, [mobileSheet]);

  useEffect(() => {
    if (!isDesktop) return;
    if (peopleOpen || chatOpen) {
      setShowControls(true);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleMove = () => {
      setShowControls(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setShowControls(false), 3000);
    };
    handleMove();
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('keydown', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('keydown', handleMove);
      if (timer) clearTimeout(timer);
    };
  }, [peopleOpen, chatOpen, isDesktop]);

  useEffect(() => {
    if (!isDesktop) setShowControls(true);
  }, [isDesktop]);

  useEffect(() => {
    const onNewMessage = () => {
      if (isDesktop) {
        if (!chatOpen) setUnreadChatCount((count) => count + 1);
      } else if (mobileSheet !== 'chat') {
        setUnreadChatCount((count) => count + 1);
      }
    };
    socket.on('new-message', onNewMessage);
    return () => {
      socket.off('new-message', onNewMessage);
    };
  }, [chatOpen, mobileSheet, isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    if (!peopleOpen && !chatOpen) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-participants-panel]') || target.closest('[data-chat-panel]') || target.closest('[data-bottombar]')) return;
      setPeopleOpen(false);
      setChatOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [peopleOpen, chatOpen, isDesktop]);

  if (loadingRoom || !hasMountedRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Cargando sala de estudio...
      </div>
    );
  }

  const isHost = room!.hostUid === user!.uid;
  const shouldRenderDesktopChat = isDesktop && chatOpen;
  const shouldRenderDesktopPeople = isDesktop && peopleOpen;
  const mobileSheetOpen = !isDesktop && mobileSheet !== 'none';

  const handleExitClick = () => {
    if (!room || !user) return;
    if (room.hostUid === user.uid) navigate('/dashboard');
    else setIsLeaveConfirmOpen(true);
  };

  const handleJustLeave = () => {
    setIsLeaveConfirmOpen(false);
    navigate('/dashboard');
  };

  const handleLeavePermanently = async () => {
    if (!room || !user) return;
    try {
      await leaveRoom(room.id, user.uid);
      navigate('/dashboard');
    } catch (err: any) {
      setToast({ message: err.message || 'Error al abandonar la sala', type: 'error' });
    }
  };

  const toggleMobileSheet = (sheet: MobileSheet) => {
    setPeopleOpen(false);
    setChatOpen(false);
    setMobileSheet((current) => (current === sheet ? 'none' : sheet));
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {showReconnectingBanner && <div className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-black">Conexión perdida. Intentando reconectar...</div>}
      {showConnectedSuccess && <div className="bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white">Conexión restablecida con éxito.</div>}

      <RoomTopbar
        roomName={room!.name}
        elapsedTime={new Date(elapsedSeconds * 1000).toISOString().slice(11, 19)}
        participantCount={onlineUsers.length}
        onLeave={handleExitClick}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative flex min-h-0 flex-1 overflow-hidden bg-black">
          <div className="relative flex min-h-0 flex-1">
            {shouldShowPermissionPanel ? (
              <div className="flex flex-1 items-center justify-center bg-slate-950">
                <PermissionErrorPanel errorType={permissionError || 'UnknownError'} onRetry={retryPermissions} onContinueWithoutVideo={continueWithoutVideo} />
              </div>
            ) : (
              <VideoGrid
                localStream={localStream}
                localUser={{ uid: user!.uid, username: user!.username || 'Tú', photoURL: user!.photoURL || null }}
                peers={peers}
                mediaStates={peerMediaStates}
                isLocalMuted={!isAudioEnabled}
                isLocalCameraOff={!isVideoEnabled || isMissingMediaDevice}
                className="relative"
              />
            )}

            {isDesktop && shouldRenderDesktopPeople && (
              <div className={`absolute top-4 z-20 ${chatOpen ? 'right-[340px]' : 'right-4'}`} data-participants-panel>
                <ParticipantsPanel
                  members={onlineUsers}
                  hostUid={room!.hostUid}
                  currentUserUid={user!.uid}
                  mediaStates={peerMediaStates}
                  open
                  onClose={() => setPeopleOpen(false)}
                />
              </div>
            )}
          </div>

          {isDesktop && (
            <aside
              data-chat-panel
              className={[
                'h-full shrink-0 overflow-hidden border-l border-slate-700 bg-slate-800 transition-all duration-300 ease-in-out',
                shouldRenderDesktopChat ? 'w-[320px] translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0',
              ].join(' ')}
            >
              <ChatPanel roomId={room!.id} open={chatOpen} onClose={() => setChatOpen(false)} />
            </aside>
          )}
        </div>

        {isDesktop ? (
          <div
            data-bottombar
            className={[
              'transition-all duration-300 ease-in-out',
              showControls || peopleOpen || chatOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
            ].join(' ')}
          >
            <RoomBottombar
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isScreenSharing={isScreenSharing}
              peopleOpen={peopleOpen}
              chatOpen={chatOpen}
              unreadChatCount={unreadChatCount}
              participantCount={onlineUsers.length}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={async () => {
                if (isScreenSharing) await stopScreenShare();
                else await startScreenShare();
              }}
              onTogglePeople={() => {
                setChatOpen(false);
                setPeopleOpen((prev) => !prev);
              }}
              onToggleChat={() => {
                setPeopleOpen(false);
                setChatOpen((prev) => !prev);
              }}
              onLeave={handleExitClick}
            />
          </div>
        ) : (
          <>
            <RoomBottombar
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isScreenSharing={isScreenSharing}
              peopleOpen={mobileSheet === 'people'}
              chatOpen={mobileSheet === 'chat'}
              unreadChatCount={unreadChatCount}
              participantCount={onlineUsers.length}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={async () => {
                if (isScreenSharing) await stopScreenShare();
                else await startScreenShare();
              }}
              onTogglePeople={() => toggleMobileSheet('people')}
              onToggleChat={() => toggleMobileSheet('chat')}
              onLeave={handleExitClick}
            />

            {mobileSheetOpen && (
              <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileSheet('none')}>
                <div
                  className="absolute inset-x-0 bottom-0 max-h-[70vh]"
                  onClick={(e) => e.stopPropagation()}
                  data-mobile-sheet
                >
                  {mobileSheet === 'chat' ? (
                    <ChatPanel roomId={room!.id} open onClose={() => setMobileSheet('none')} mobile />
                  ) : (
                    <ParticipantsPanel
                      members={onlineUsers}
                      hostUid={room!.hostUid}
                      currentUserUid={user!.uid}
                      mediaStates={peerMediaStates}
                      open
                      onClose={() => setMobileSheet('none')}
                      mobile
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isHost && <EditRoomModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} room={room!} onUpdated={() => setToast({ message: 'Sala actualizada', type: 'success' })} />}
      {isHost && <DeleteRoomModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} room={room!} onDeleted={() => { setToast({ message: 'Sala eliminada', type: 'success' }); setIsDeleteOpen(false); navigate('/dashboard'); }} />}

      {isLeaveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-5 text-white shadow-2xl">
            <h2 className="mb-3 text-lg font-semibold">¿Salir de la sala?</h2>
            <p className="mb-4 text-sm text-slate-300">Puedes salir solo al dashboard o abandonar la sala permanentemente.</p>
            <div className="space-y-2">
              <button type="button" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white" onClick={handleJustLeave}>Solo salir al dashboard</button>
              <button type="button" className="w-full rounded-xl border border-red-500/30 px-4 py-3 font-semibold text-red-200" onClick={handleLeavePermanently}>Salir y abandonar sala permanentemente</button>
              <button type="button" className="w-full rounded-xl px-4 py-3 font-semibold text-slate-300" onClick={() => setIsLeaveConfirmOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60]">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {isDeletedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-5 text-white shadow-2xl">
            <h2 className="mb-3 text-lg font-semibold text-red-300">Sala eliminada</h2>
            <p className="mb-4 text-sm text-slate-300">Esta sala fue eliminada por el anfitrión.</p>
            <button type="button" className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white" onClick={() => { setIsDeletedModalOpen(false); navigate('/dashboard'); }}>
              Volver al dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

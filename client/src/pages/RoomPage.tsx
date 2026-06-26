import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { leaveRoom } from '../hooks/useRooms';
import { Room } from '../types/room.types';
import MembersSidebar from '../components/MembersSidebar';
import EditRoomModal from '../components/modals/EditRoomModal';
import DeleteRoomModal from '../components/modals/DeleteRoomModal';
import Toast from '../components/Toast';
import ChatPanel from '../components/ChatPanel';
import { socket } from '../socket/socket';
import { useSocket } from '../hooks/useSocket';
import { useRoomUsers } from '../hooks/useRoomUsers';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoGrid from '../components/VideoGrid';
import PermissionErrorPanel from '../components/PermissionErrorPanel';
import { usePeerMediaState } from '../hooks/usePeerMediaState';

type MobileTab = 'video' | 'people' | 'chat';

function IconMic({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 5.2 2.1" />
      <path d="M19 11a7 7 0 0 1-7 7m-4-1a7 7 0 0 0 11-6" />
      <path d="M1 1l22 22" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
    </svg>
  );
}

function IconCamera({ off }: { off: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l22 22" />
      <path d="M15 8l5-3v14l-5-3" />
      <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10l5-3v10l-5-3" />
    </svg>
  );
}

function IconScreen({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
      <path d="M8 9l2 2 4-4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

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
  const [activeTab, setActiveTab] = useState<MobileTab>('video');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

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

  const { isConnected, isConnecting, showReconnectingBanner, showConnectedSuccess } = useSocket(id);
  const onlineUsers = useRoomUsers({
    onUserJoined: (username) => setToast({ message: `¡${username} se unió a la sala!`, type: 'success' }),
    onUserLeft: (username) => setToast({ message: `${username} salió de la sala.`, type: 'success' }),
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

  useEffect(() => {
    const handleNewMessage = () => {
      if (activeTab !== 'chat') {
        setUnreadChatCount((count) => count + 1);
      }
    };
    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChatCount(0);
    }
  }, [activeTab]);

  const hasMountedRoom = useMemo(() => Boolean(room && user), [room, user]);

  if (loadingRoom || !hasMountedRoom) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div className="skeleton-pulse" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          Cargando sala de estudio...
        </div>
      </div>
    );
  }

  const isHost = room!.hostUid === user!.uid;
  const isMissingMediaDevice = permissionError === 'NotFoundError';
  const shouldShowPermissionPanel = Boolean(permissionError && !isMissingMediaDevice);

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

  const mobileVideoContent = shouldShowPermissionPanel ? (
    <PermissionErrorPanel errorType={permissionError || 'UnknownError'} onRetry={retryPermissions} onContinueWithoutVideo={continueWithoutVideo} />
  ) : (
    <>
      {isMissingMediaDevice && (
        <div role="status" style={{ margin: '0.75rem', backgroundColor: 'rgba(15,23,42,0.92)', border: '1px solid rgba(245,158,11,0.45)', color: '#f8fafc', borderRadius: '12px', padding: '0.8rem 1rem', fontSize: '0.88rem', textAlign: 'center' }}>
          <strong style={{ display: 'block', marginBottom: '0.2rem' }}>No se encontró cámara o micrófono</strong>
          <span style={{ color: '#cbd5e1' }}>Entraste como espectador: puedes ver a los demás y usar el chat.</span>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <VideoGrid
          localStream={localStream}
          localUser={{ uid: user!.uid, username: user!.username || 'Tú', photoURL: user!.photoURL || null }}
          peers={peers}
          mediaStates={peerMediaStates}
          isLocalMuted={!isAudioEnabled}
          isLocalCameraOff={!isVideoEnabled || isMissingMediaDevice}
          className="h-full"
        />
      </div>
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          padding: '0.75rem',
          background: 'linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,0.92) 35%)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'center' }}>
          <button onClick={toggleAudio} style={{ backgroundColor: isAudioEnabled ? '#334155' : 'rgba(220,38,38,0.2)', border: isAudioEnabled ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(239,68,68,0.8)', color: '#fff', borderRadius: '14px', padding: '0.8rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <IconMic muted={!isAudioEnabled} />
            Mic
          </button>
          <button onClick={toggleVideo} style={{ backgroundColor: isVideoEnabled ? '#334155' : 'rgba(220,38,38,0.2)', border: isVideoEnabled ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(239,68,68,0.8)', color: '#fff', borderRadius: '14px', padding: '0.8rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <IconCamera off={!isVideoEnabled} />
            Cámara
          </button>
          <button
            onClick={async () => {
              if (isScreenSharing) await stopScreenShare();
              else await startScreenShare();
            }}
            style={{ backgroundColor: isScreenSharing ? '#2563eb' : '#334155', border: '1px solid rgba(148,163,184,0.2)', color: '#fff', borderRadius: '14px', padding: '0.8rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <IconScreen active={isScreenSharing} />
            {isScreenSharing ? 'Compartiendo' : 'Compartir'}
          </button>
          <button onClick={handleExitClick} style={{ backgroundColor: '#ef4444', border: '1px solid transparent', color: '#fff', borderRadius: '14px', padding: '0.8rem 0.95rem' }}>
            Salir
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="room-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {showReconnectingBanner && <div style={{ backgroundColor: 'var(--color-warning)', color: '#000', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>Conexión perdida. Intentando reconectar...</div>}
      {showConnectedSuccess && <div style={{ backgroundColor: 'var(--color-success)', color: '#fff', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>Conexión restablecida con éxito.</div>}

      <nav className="room-topbar" style={{ borderRadius: 0, flexShrink: 0 }}>
        <div className="room-topbar-inner" style={{ gap: '0.75rem' }}>
          <button onClick={handleExitClick} className="btn-secondary interactive-element room-control-btn" style={{ fontSize: '0.9rem' }}>
            ← Salir de sala
          </button>
          <div className="room-topbar-meta" style={{ flexGrow: 1, justifyContent: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>{room!.name}</h1>
              <span style={{ fontSize: '0.85rem', color: isConnected ? '#86efac' : 'var(--text-secondary)', backgroundColor: 'rgba(15,23,42,0.72)', padding: '0.25rem 0.65rem', borderRadius: '999px', border: isConnected ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(148,163,184,0.16)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }} />
              En línea: {onlineUsers.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isHost && (
              <>
                <button onClick={() => setIsEditOpen(true)} className="btn-secondary interactive-element room-control-btn" style={{ height: '38px' }}>
                  Editar
                </button>
                <button onClick={() => setIsDeleteOpen(true)} className="btn-secondary interactive-element room-control-btn" style={{ height: '38px', color: '#fca5a5' }}>
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, minHeight: 0 }} className="md:hidden">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="room-stage" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'video' && mobileVideoContent}
            {activeTab === 'people' && <div className="room-stage-panel" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}><MembersSidebar members={onlineUsers} hostUid={room!.hostUid} currentUserUid={user!.uid} mediaStates={peerMediaStates} isConnecting={isConnecting} /></div>}
            {activeTab === 'chat' && (
              <div className="room-stage-panel" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <ChatPanel roomId={room!.id} />
              </div>
            )}
          </div>
          <div className="room-mobile-tabs">
            <button onClick={() => setActiveTab('video')} className={`room-mobile-tab ${activeTab === 'video' ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}><IconScreen active={false} />Video</span>
            </button>
            <button onClick={() => setActiveTab('people')} className={`room-mobile-tab ${activeTab === 'people' ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}><IconPeople />People</span>
            </button>
            <button onClick={() => setActiveTab('chat')} className={`room-mobile-tab ${activeTab === 'chat' ? 'active' : ''}`}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}><IconChat />Chat {unreadChatCount > 0 && activeTab !== 'chat' ? `(${unreadChatCount})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <MembersSidebar members={onlineUsers} hostUid={room!.hostUid} currentUserUid={user!.uid} mediaStates={peerMediaStates} isConnecting={isConnecting} />
        <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 0, overflow: 'hidden' }}>
          <section className="room-stage-panel" style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(148,163,184,0.16)', minHeight: 0, overflow: 'hidden', backgroundColor: 'rgba(2, 6, 23, 0.72)' }}>
            {shouldShowPermissionPanel ? (
              <PermissionErrorPanel errorType={permissionError || 'UnknownError'} onRetry={retryPermissions} onContinueWithoutVideo={continueWithoutVideo} />
            ) : (
              <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                <VideoGrid localStream={localStream} localUser={{ uid: user!.uid, username: user!.username || 'Tú', photoURL: user!.photoURL || null }} peers={peers} mediaStates={peerMediaStates} isLocalMuted={!isAudioEnabled} isLocalCameraOff={!isVideoEnabled || isMissingMediaDevice} />
              </div>
            )}
          </section>
          <ChatPanel roomId={room!.id} />
        </main>
      </div>

      <div className="hidden md:flex room-control-dock">
        <button onClick={toggleAudio} className="btn-secondary interactive-element room-control-btn" style={{ backgroundColor: isAudioEnabled ? 'var(--bg-tertiary)' : 'rgba(239,68,68,0.2)', borderColor: isAudioEnabled ? '#334155' : 'rgba(239,68,68,0.8)', color: '#fff' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IconMic muted={!isAudioEnabled} />{isAudioEnabled ? 'Micrófono' : 'Silenciado'}</span>
        </button>
        <button onClick={toggleVideo} className="btn-secondary interactive-element room-control-btn" style={{ backgroundColor: isVideoEnabled ? 'var(--bg-tertiary)' : 'rgba(239,68,68,0.2)', borderColor: isVideoEnabled ? '#334155' : 'rgba(239,68,68,0.8)', color: '#fff' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IconCamera off={!isVideoEnabled} />{isVideoEnabled ? 'Cámara' : 'Cámara apagada'}</span>
        </button>
        <button onClick={async () => (isScreenSharing ? stopScreenShare() : startScreenShare())} className="btn-secondary interactive-element room-control-btn" style={{ backgroundColor: isScreenSharing ? '#2563eb' : 'var(--bg-tertiary)', color: '#fff' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IconScreen active={isScreenSharing} />{isScreenSharing ? 'Compartiendo' : 'Compartir'}</span>
        </button>
        <button onClick={handleExitClick} className="btn-secondary interactive-element room-control-btn" style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }}>
          Salir
        </button>
      </div>

      {isHost && <EditRoomModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} room={room!} onUpdated={() => setToast({ message: 'Sala actualizada', type: 'success' })} />}
      {isHost && <DeleteRoomModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} room={room!} onDeleted={() => { setToast({ message: 'Sala eliminada', type: 'success' }); setIsDeleteOpen(false); navigate('/dashboard'); }} />}

      {isLeaveConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsLeaveConfirmOpen(false)}>
          <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>¿Salir de la sala?</h2>
              <button type="button" className="modal-close" onClick={() => setIsLeaveConfirmOpen(false)} aria-label="Cerrar modal">&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Selecciona si deseas simplemente salir al dashboard o abandonar la sala permanentemente.</p>
            </div>
            <div className="modal-footer" style={{ flexDirection: 'column', gap: '0.5rem' }}>
              <button type="button" className="btn-primary" onClick={handleJustLeave} style={{ width: '100%', padding: '0.65rem' }}>Solo salir al dashboard</button>
              <button type="button" className="btn-secondary" onClick={handleLeavePermanently} style={{ width: '100%', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.25)', padding: '0.65rem' }}>Salir y abandonar sala permanentemente</button>
              <button type="button" className="btn-secondary" onClick={() => setIsLeaveConfirmOpen(false)} style={{ width: '100%', border: 0, minHeight: 'auto', padding: '0.5rem', color: 'var(--text-secondary)' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /></div>}

      {isDeletedModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--color-danger)', fontSize: '1.25rem' }}>Sala eliminada</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.5' }}>Esta sala de estudio fue eliminada por el anfitrión.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={() => { setIsDeletedModalOpen(false); navigate('/dashboard'); }} style={{ width: '100%', padding: '0.65rem' }}>
                Volver al dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

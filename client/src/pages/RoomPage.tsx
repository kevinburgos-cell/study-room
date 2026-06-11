import React, { useState, useEffect } from 'react';
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

// Sockets hooks imports
import { useSocket } from '../hooks/useSocket';
import { useRoomUsers } from '../hooks/useRoomUsers';

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // Modal and dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isDeletedModalOpen, setIsDeletedModalOpen] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Listen for room-deleted event from socket
  useEffect(() => {
    const handleRoomDeleted = () => {
      setIsDeletedModalOpen(true);
    };

    socket.on('room-deleted', handleRoomDeleted);

    return () => {
      socket.off('room-deleted', handleRoomDeleted);
    };
  }, []);

  // Firestore subscription to check authorization and get host info
  useEffect(() => {
    if (!id || !user) return;

    setLoadingRoom(true);
    const roomRef = doc(db, 'rooms', id);

    const unsubscribe = onSnapshot(
      roomRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          console.error('Room does not exist');
          navigate('/dashboard', { state: { successMessage: 'La sala ya no existe o fue eliminada.' } });
          return;
        }

        const roomData = { id: docSnap.id, ...docSnap.data() } as Room;
        
        // Security Check: Verify user membership or host
        const isHost = roomData.hostUid === user.uid;
        const isMember = roomData.members.some((m) => m.uid === user.uid);

        if (!isHost && !isMember) {
          console.error('Security Check: User is not a member of this room');
          navigate('/dashboard');
          return;
        }

        setRoom(roomData);
        setLoadingRoom(false);
      },
      (err) => {
        console.error('Error fetching room detail:', err);
        navigate('/dashboard');
      }
    );

    return () => unsubscribe();
  }, [id, user, navigate]);

  // Connect to the WebSockets realtime server for this room
  const { isConnected, isConnecting, showReconnectingBanner, showConnectedSuccess } = useSocket(id);

  // Get active online users in real-time and bind events for notifications
  const onlineUsers = useRoomUsers({
    onUserJoined: (username) => {
      setToast({ message: `¡${username} se unió a la sala!`, type: 'success' });
    },
    onUserLeft: (username) => {
      setToast({ message: `${username} salió de la sala.`, type: 'success' });
    },
    onError: (errorMessage) => {
      setToast({ message: `Error en tiempo real: ${errorMessage}`, type: 'error' });
      // If the authentication token was invalid, force redirect to login
      if (errorMessage.toLowerCase().includes('token')) {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    }
  });

  const handleExitClick = () => {
    if (!room || !user) return;

    if (room.hostUid === user.uid) {
      // Host just navigates back
      navigate('/dashboard');
    } else {
      // Guest gets a leaving confirmation modal
      setIsLeaveConfirmOpen(true);
    }
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

  if (loadingRoom || !room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div className="skeleton-pulse" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          Cargando sala de estudio...
        </div>
      </div>
    );
  }

  const isHost = room.hostUid === user?.uid;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      
      {/* Realtime Reconnecting Banner */}
      {showReconnectingBanner && (
        <div style={{ backgroundColor: 'var(--color-warning)', color: '#000000', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, zIndex: 100 }}>
          ⚠️ Conexión perdida. Intentando reconectar al servidor en tiempo real...
        </div>
      )}

      {/* Realtime Reconnect Success Banner */}
      {showConnectedSuccess && (
        <div style={{ backgroundColor: 'var(--color-success)', color: '#ffffff', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, zIndex: 100 }}>
          ✅ Conexión restablecida con éxito.
        </div>
      )}

      {/* Header Navigation Navbar */}
      <nav className="room-topbar" style={{ borderRadius: 0 }} aria-label="Menú superior de la sala">
        <div className="room-topbar-inner">
          <button 
            onClick={handleExitClick}
            className="btn-secondary interactive-element" 
            style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.9rem', borderColor: 'var(--border-color)' }}
            aria-label="Salir de la sala"
          >
            ← Salir de sala
          </button>
          
          <div className="room-topbar-meta" style={{ flexGrow: 1, justifyContent: 'center' }}>
            <h1 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700 }}>
              {room.name}
            </h1>
            <span 
              style={{ 
                fontSize: '0.85rem', 
                color: isConnected ? '#86efac' : 'var(--text-secondary)', 
                backgroundColor: 'var(--bg-surface)', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px', 
                border: isConnected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title={isConnected ? 'Servidor en tiempo real conectado' : 'Desconectado'}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }} />
              En línea: {onlineUsers.length}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isHost && (
              <>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="btn-secondary interactive-element"
                  style={{ width: 'auto', height: '38px', minHeight: 'auto', padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--border-color)' }}
                  aria-label="Editar sala"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => setIsDeleteOpen(true)}
                  className="btn-secondary interactive-element"
                  style={{ width: 'auto', height: '38px', minHeight: 'auto', padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#fca5a5' }}
                  aria-label="Eliminar sala"
                >
                  ⚠️ Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout containing Sidebar and Work Area */}
      <div style={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 73px)', overflow: 'hidden' }}>
        
        {/* Left Sidebar of Members (connected in real-time) */}
        <MembersSidebar
          members={onlineUsers}
          hostUid={room.hostUid}
          currentUserUid={user?.uid || ''}
          isConnecting={isConnecting}
        />

        {/* Workspace Areas */}
        <main 
          style={{ 
            flexGrow: 1, 
            display: 'grid', 
            gridTemplateColumns: '1fr 320px', 
            height: '100%', 
            backgroundColor: 'var(--bg-main)' 
          }}
          aria-label="Áreas de trabajo"
        >
          
          {/* Main Area: Video Placeholder */}
          <section 
            style={{ 
              padding: '2.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRight: '1px solid var(--border-color)',
              textAlign: 'center'
            }}
            aria-labelledby="video-placeholder-heading"
          >
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem', opacity: 0.8 }} role="img" aria-label="Cámara de video">📹</div>
            <h2 id="video-placeholder-heading" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Las videollamadas estarán disponibles pronto
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '450px' }}>
              En el Sprint 4 implementaremos videollamadas grupales. Por ahora puedes usar el chat para comunicarte con tus compañeros.
            </p>
          </section>

          {/* Chat Panel */}
          <ChatPanel roomId={room.id} />

        </main>
      </div>

      {/* Host Edit Modal */}
      {isHost && (
        <EditRoomModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          room={room}
          onUpdated={() => setToast({ message: 'Sala actualizada', type: 'success' })}
        />
      )}

      {isHost && (
        <DeleteRoomModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          room={room}
          onDeleted={() => {
            setToast({ message: 'Sala eliminada', type: 'success' });
            setIsDeleteOpen(false);
            navigate('/dashboard');
          }}
        />
      )}

      {/* Guest Leaving Confirmation Overlay */}
      {isLeaveConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsLeaveConfirmOpen(false)}>
          <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>¿Salir de la sala?</h2>
              <button type="button" className="modal-close" onClick={() => setIsLeaveConfirmOpen(false)} aria-label="Cerrar modal">
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Selecciona si deseas simplemente salir al dashboard o abandonar la sala permanentemente.
              </p>
            </div>

            <div className="modal-footer" style={{ flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleJustLeave}
                style={{ width: '100%', padding: '0.65rem' }}
              >
                Solo salir al dashboard
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleLeavePermanently}
                style={{ width: '100%', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.25)', padding: '0.65rem' }}
              >
                Salir y abandonar sala permanentemente
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsLeaveConfirmOpen(false)}
                style={{ width: '100%', border: '0', minHeight: 'auto', padding: '0.5rem', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Room Deleted Modal Overlay */}
      {isDeletedModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--color-danger)', fontSize: '1.25rem' }}>⚠️ Sala Eliminada</h2>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.5' }}>
                Esta sala de estudio fue eliminada por el anfitrión.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setIsDeletedModalOpen(false);
                  navigate('/dashboard');
                }}
                style={{ width: '100%', padding: '0.65rem' }}
              >
                Volver al dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

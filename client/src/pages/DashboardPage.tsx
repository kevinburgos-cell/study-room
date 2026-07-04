import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoomsList } from '../hooks/useRooms';
import RoomCard from '../components/RoomCard';
import CreateRoomModal from '../components/modals/CreateRoomModal';
import JoinRoomModal from '../components/modals/JoinRoomModal';
import EditRoomModal from '../components/modals/EditRoomModal';
import DeleteRoomModal from '../components/modals/DeleteRoomModal';
import Toast from '../components/Toast';
import { Room } from '../types/room.types';

interface DashboardPageProps {
  onLogout: () => void;
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Firestore Rooms Hook
  const { myRooms, guestRooms, loading } = useRoomsList(user?.uid);

  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchActiveCounts = async () => {
      try {
        const url = (import.meta.env.VITE_REALTIME_URL || 'http://localhost:4000') + '/rooms/active-counts';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setActiveCounts(data);
        }
      } catch (err) {
        console.error('Error fetching active user counts:', err);
      }
    };

    fetchActiveCounts();
    const interval = setInterval(fetchActiveCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Selected room for edit/delete
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleRoomCreated = (roomId: string) => {
    showToast('Sala creada exitosamente', 'success');
    // Optionally navigate to room directly
    setTimeout(() => {
      navigate(`/rooms/${roomId}`);
    }, 1000);
  };

  const handleRoomJoined = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleRoomUpdated = () => {
    showToast('Sala actualizada', 'success');
  };

  const handleRoomDeleted = () => {
    showToast('Sala eliminada', 'success');
  };

  const handleEnterRoom = (room: Room) => {
    navigate(`/rooms/${room.id}`);
  };

  const triggerEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsEditOpen(true);
  };

  const triggerDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

  return (
    <div className="dashboard-layout">
      {/* Navigation Sidebar */}
      <nav className="sidebar" aria-label="Navegación principal de la aplicación">
        <details className="sidebar-mobile-shell" open>
          <summary className="sidebar-mobile-toggle interactive-element" aria-label="Abrir o cerrar menú">
            <span className="sidebar-mobile-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>Menú</span>
          </summary>
          <div className="sidebar-shell-content">
            <div>
              <div className="logo-container">
                <div className="logo-icon">SR</div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>StudyRoom</span>
              </div>
              <ul className="nav-list">
                <li>
                  <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => `nav-link interactive-element ${isActive ? 'active' : ''}`}
                    aria-label="Ir al panel general"
                  >
                    📊 Panel General
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/profile" 
                    className={({ isActive }) => `nav-link interactive-element ${isActive ? 'active' : ''}`}
                    aria-label="Ir a mi perfil"
                  >
                    👤 Mi Perfil
                  </NavLink>
                </li>
              </ul>
            </div>
            <div>
              <button 
                onClick={onLogout} 
                className="btn-secondary interactive-element" 
                style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
                aria-label="Cerrar sesión de la aplicación"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </details>
      </nav>

      {/* Main Content Area */}
      <main className="main-content" aria-label="Contenido del panel general">
        <header className="page-header" aria-label="Encabezado del panel">
          <div>
            <h1 id="dashboard-title">Panel General</h1>
            <p className="page-title-desc">¡Bienvenido de vuelta, {user?.name || 'Estudiante'}! Gestiona tus salas o únete a una.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              @{user?.username || 'estudiante'}
            </div>
          </div>
        </header>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary interactive-element"
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            ➕ Crear sala
          </button>
          <button 
            onClick={() => setIsJoinOpen(true)}
            className="btn-secondary interactive-element"
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--color-primary)', color: 'var(--text-primary)' }}
          >
            🔑 Unirse con ID de sala
          </button>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <section aria-label="Cargando salas" style={{ border: 'none', background: 'none', padding: 0 }}>
            <div className="rooms-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card skeleton-pulse">
                  <div>
                    <div className="skeleton-line" style={{ width: '40%', height: '1.2rem', marginBottom: '1rem' }} />
                    <div className="skeleton-line" style={{ width: '80%', height: '1.5rem', marginBottom: '0.5rem' }} />
                    <div className="skeleton-line" style={{ width: '60%', height: '0.9rem' }} />
                  </div>
                  <div>
                    <div className="skeleton-line" style={{ width: '100%', height: '2.5rem' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Content Sections when Loaded */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Mis Salas Section */}
            <section aria-labelledby="my-rooms-heading" style={{ border: 'none', background: 'none', padding: 0 }}>
              <h2 id="my-rooms-heading" style={{ marginBottom: '1.25rem', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Mis salas
              </h2>

              {myRooms.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '3rem' }} role="img" aria-label="Casa de estudio">🏠</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Aún no tienes salas</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: 0 }}>
                    Crea tu primera sala y empieza a estudiar con tus compañeros de clase en línea.
                  </p>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="btn-primary interactive-element"
                    style={{ width: 'auto', marginTop: '0.5rem', padding: '0.6rem 1.5rem' }}
                  >
                    ➕ Crear mi primera sala
                  </button>
                </div>
              ) : (
                <ul className="rooms-grid" style={{ listStyle: 'none', padding: 0 }}>
                  {myRooms.map((room) => (
                    <li key={room.id}>
                      <RoomCard
                        room={room}
                        currentUserUid={user?.uid || ''}
                        onEdit={triggerEdit}
                        onDelete={triggerDelete}
                        onEnter={handleEnterRoom}
                        activeCount={activeCounts[room.id] || 0}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Salas en las que participo Section */}
            <section aria-labelledby="participating-rooms-heading" style={{ border: 'none', background: 'none', padding: 0 }}>
              <h2 id="participating-rooms-heading" style={{ marginBottom: '1.25rem', fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Salas en las que participo
              </h2>

              {guestRooms.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Aún no participas en ninguna sala como invitado. ¡Pide un código para unirte!
                </div>
              ) : (
                <ul className="rooms-grid" style={{ listStyle: 'none', padding: 0 }}>
                  {guestRooms.map((room) => (
                    <li key={room.id}>
                      <RoomCard
                        room={room}
                        currentUserUid={user?.uid || ''}
                        onEdit={triggerEdit}
                        onDelete={triggerDelete}
                        onEnter={handleEnterRoom}
                        activeCount={activeCounts[room.id] || 0}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleRoomCreated}
        currentUser={user ? { uid: user.uid, username: user.username, photoURL: user.photoURL } : null}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={handleRoomJoined}
        currentUser={user ? { uid: user.uid, username: user.username, photoURL: user.photoURL } : null}
      />

      <EditRoomModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onUpdated={handleRoomUpdated}
      />

      <DeleteRoomModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onDeleted={handleRoomDeleted}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-container">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}

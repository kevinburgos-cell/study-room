import React from 'react';
import { NavLink, Link } from 'react-router-dom';

interface DashboardPageProps {
  onLogout: () => void;
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  // Mock data for study rooms
  const rooms = [
    { id: 'prog-101', name: 'Algoritmos y Estructuras', subject: 'Programación', members: 12, max: 20, active: true },
    { id: 'math-202', name: 'Cálculo Multivariable', subject: 'Matemáticas', members: 4, max: 10, active: true },
    { id: 'eng-305', name: 'Conversación Avanzada', subject: 'Idiomas', members: 8, max: 15, active: false },
    { id: 'design-40', name: 'UI/UX & Figma Workshop', subject: 'Diseño', members: 19, max: 25, active: true }
  ];

  return (
    <div className="dashboard-layout">
      {/* Navigation Sidebar */}
      <nav className="sidebar" aria-label="Navegación principal de la aplicación">
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
      </nav>

      {/* Main Content Area */}
      <main className="main-content" aria-label="Contenido del panel general">
        <header className="page-header" aria-label="Encabezado del panel">
          <div>
            <h1 id="dashboard-title">Panel General</h1>
            <p className="page-title-desc">¡Bienvenido de vuelta! Selecciona una sala para empezar a estudiar.</p>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: 'var(--color-primary-glow)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600 }}>
            Estudiante Verificado
          </div>
        </header>

        {/* Quick Stats section */}
        <section aria-labelledby="stats-heading" style={{ border: 'none', background: 'none', padding: 0 }}>
          <h2 id="stats-heading" style={{ display: 'none' }}>Estadísticas Rápidas</h2>
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Horas Estudiadas</div>
              <div className="stat-value">24.5 hrs</div>
            </div>
            <div className="glass-panel stat-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sesiones Completadas</div>
              <div className="stat-value">42</div>
            </div>
            <div className="glass-panel stat-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Salas Disponibles</div>
              <div className="stat-value">12 Activas</div>
            </div>
          </div>
        </section>

        {/* Study Rooms list section */}
        <section aria-labelledby="rooms-heading" style={{ border: 'none', background: 'none', padding: 0 }}>
          <h2 id="rooms-heading" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Salas de Estudio Disponibles</h2>
          
          <div className="rooms-grid">
            {rooms.map((room) => (
              <article 
                key={room.id} 
                className="glass-panel room-card interactive-element" 
                aria-label={`Sala ${room.name}, materia ${room.subject}, ${room.members} estudiantes de ${room.max} activos`}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="room-badge">{room.subject}</span>
                    {room.active && (
                      <span className="room-badge active" style={{ margin: 0 }}>En Vivo</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{room.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Estudiantes: {room.members} / {room.max}
                  </p>
                </div>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <Link 
                    to={`/rooms/${room.id}`} 
                    className="btn-primary interactive-element" 
                    style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                    aria-label={`Ingresar a la sala ${room.name}`}
                  >
                    Unirse a la Sala →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

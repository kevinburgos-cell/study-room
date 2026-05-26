import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Message {
  id: number;
  author: string;
  text: string;
  self: boolean;
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  
  // Timer States (Pomodoro 25 min default = 1500 seconds)
  const [secondsLeft, setSecondsLeft] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, author: 'Sofía', text: '¡Hola a todos! Listos para estudiar hoy.', self: false },
    { id: 2, author: 'Carlos', text: 'Sí, yo repasaré algoritmos de ordenamiento.', self: false }
  ]);
  const [inputText, setInputText] = useState('');
  
  // Notes State
  const [notes, setNotes] = useState('Escribe tus apuntes de estudio aquí...');

  // Effect to handle Pomodoro countdown timer
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            alert('¡Tiempo cumplido! Toma un descanso de 5 minutos.');
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      author: 'Tú',
      text: inputText.trim(),
      self: true
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Navigation */}
      <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(10, 12, 26, 0.9)' }} aria-label="Menú superior de la sala">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link 
            to="/dashboard" 
            className="btn-secondary interactive-element" 
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            aria-label="Volver al panel general"
          >
            ← Volver
          </Link>
          <span style={{ color: 'var(--text-secondary)' }}>|</span>
          <h1 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-title)' }}>Sala: {id}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="room-badge active" style={{ margin: 0 }}>En Línea</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>3 Estudiantes</span>
        </div>
      </nav>

      {/* Main Workspace Layout */}
      <main className="main-content" style={{ flexGrow: 1, padding: '2rem 2.5rem' }} aria-label={`Área de estudio de la sala ${id}`}>
        <div className="workspace-grid">
          
          {/* Left Area: Timer and Study Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Pomodoro Timer component */}
            <section className="glass-panel timer-container" aria-labelledby="timer-heading">
              <h2 id="timer-heading" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Temporizador Pomodoro</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enfócate en bloques de estudio continuos</p>
              
              <div className="timer-circle">
                <div className="timer-display" aria-live="off" aria-label={`Tiempo restante: ${formatTime(secondsLeft)}`}>
                  {formatTime(secondsLeft)}
                </div>
              </div>

              <div className="timer-controls">
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)} 
                  className="btn-primary interactive-element"
                  style={{ flex: 2, background: isTimerRunning ? 'linear-gradient(135deg, var(--color-accent-warning), #d97706)' : undefined, boxShadow: isTimerRunning ? '0 4px 14px rgba(245, 158, 11, 0.3)' : undefined }}
                  aria-label={isTimerRunning ? 'Pausar temporizador' : 'Iniciar temporizador de estudio'}
                >
                  {isTimerRunning ? '⏸️ Pausar' : '▶️ Empezar'}
                </button>
                <button 
                  onClick={() => {
                    setIsTimerRunning(false);
                    setSecondsLeft(1500);
                  }} 
                  className="btn-secondary interactive-element"
                  style={{ flex: 1 }}
                  aria-label="Restablecer temporizador a 25 minutos"
                >
                  🔄 Reset
                </button>
              </div>
            </section>

            {/* Shared Notes workspace */}
            <section className="glass-panel" style={{ padding: '1.5rem' }} aria-labelledby="notes-heading">
              <h2 id="notes-heading" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Mis Notas de Estudio</h2>
              <textarea
                className="form-input interactive-element"
                style={{ width: '100%', minHeight: '180px', resize: 'vertical', fontFamily: 'inherit', padding: '1rem', lineHeight: '1.6' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-label="Área editable para capturar tus apuntes de estudio"
              />
            </section>

          </div>

          {/* Right Area: Workspace Chat Log */}
          <div>
            <section className="glass-panel chat-container" aria-labelledby="chat-heading">
              <div>
                <h2 id="chat-heading" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Chat de la Sala</h2>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }} />
              </div>

              {/* Chat Message feed */}
              <div className="chat-messages" aria-live="polite" aria-label="Mensajes de chat recientes">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble ${msg.self ? 'self' : ''}`}>
                    <div className="chat-bubble-author">{msg.author}</div>
                    <div className="chat-bubble-text">{msg.text}</div>
                  </div>
                ))}
              </div>

              {/* Send message text area */}
              <form onSubmit={handleSendMessage} className="chat-input-wrapper">
                <input
                  type="text"
                  className="form-input interactive-element"
                  placeholder="Envía un mensaje..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  aria-label="Escribe tu mensaje para los demás estudiantes de la sala"
                />
                <button 
                  type="submit" 
                  className="btn-primary interactive-element" 
                  style={{ width: 'auto', padding: '0 1.25rem' }}
                  aria-label="Enviar mensaje al chat"
                >
                  Enviar
                </button>
              </form>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

import React from 'react';

interface PermissionErrorPanelProps {
  errorType: string;
  onRetry: () => void;
  onContinueWithoutVideo?: () => void;
}

export default function PermissionErrorPanel({
  errorType,
  onRetry,
  onContinueWithoutVideo,
}: PermissionErrorPanelProps) {
  let title = 'Error al acceder a los dispositivos';
  let message = 'No se pudo obtener acceso a tu cámara o micrófono.';
  let instructions: string[] = [];
  let icon = '⚠️';
  let showContinueBtn = false;

  if (errorType === 'NotAllowedError') {
    icon = '🚫';
    title = 'Permisos de cámara y micrófono denegados';
    message = 'Para participar con video y audio necesitas permitir el acceso en tu navegador.';
    instructions = [
      'Haz clic en el ícono de la cámara/candado en la barra de direcciones.',
      'Selecciona "Permitir siempre" o restablece los permisos.',
      'Recarga la página o haz clic en Reintentar.',
    ];
  } else if (errorType === 'NotFoundError') {
    icon = '🔍';
    title = 'No se encontró cámara o micrófono';
    message = 'No pudimos detectar ningún dispositivo de entrada de audio o video en tu equipo.';
    instructions = [
      'Verifica que tu cámara o micrófono estén correctamente conectados.',
      'Asegúrate de que no estén deshabilitados en la configuración del sistema.',
    ];
    showContinueBtn = true;
  } else if (errorType === 'NotReadableError') {
    icon = '🔒';
    title = 'Cámara o micrófono ocupados';
    message = 'Tu cámara está siendo usada por otra aplicación.';
    instructions = [
      'Cierra otras pestañas del navegador o aplicaciones que puedan estar usando la cámara (Zoom, Teams, etc.).',
      'Haz clic en Reintentar una vez cerradas.',
    ];
  }

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: '2rem',
        color: '#ffffff',
        background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
        {title}
      </h2>
      <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '480px', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        {message}
      </p>

      {instructions.length > 0 && (
        <div 
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid #334155',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'left',
            marginBottom: '2rem',
          }}
        >
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Instrucciones para solucionar:
          </p>
          <ol style={{ paddingLeft: '1.2rem', margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {instructions.map((inst, idx) => (
              <li key={idx} style={{ marginBottom: '0.35rem' }}>{inst}</li>
            ))}
          </ol>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center', maxWidth: '480px' }}>
        <button
          onClick={onRetry}
          className="btn-primary interactive-element"
          style={{ padding: '0.75rem 2rem', fontWeight: 600, width: 'auto' }}
        >
          🔄 Reintentar
        </button>
        {showContinueBtn && onContinueWithoutVideo && (
          <button
            onClick={onContinueWithoutVideo}
            className="btn-secondary interactive-element"
            style={{ padding: '0.75rem 2rem', fontWeight: 600, width: 'auto', borderColor: '#475569' }}
          >
            🎙️ Continuar solo con Audio
          </button>
        )}
      </div>
    </div>
  );
}

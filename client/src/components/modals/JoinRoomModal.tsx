import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { joinRoomWithCode } from '../../hooks/useRooms';
import { Room } from '../../types/room.types';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (roomId: string) => void;
  currentUser: { uid: string; username: string; photoURL: string | null } | null;
}

export default function JoinRoomModal({ isOpen, onClose, onJoined, currentUser }: JoinRoomModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setCode('');
    setError('');
    setPreviewRoom(null);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError('');
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('El código es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const roomRef = doc(db, 'rooms', trimmedCode);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setError('No se encontró ninguna sala con ese código');
        setLoading(false);
        return;
      }

      const roomData = { id: roomSnap.id, ...roomSnap.data() } as Room;

      // Validation 1: Already the host
      if (roomData.hostUid === currentUser.uid) {
        onJoined(roomData.id);
        onClose();
        handleReset();
        return;
      }

      // Validation 2: Already a member
      const isAlreadyMember = roomData.members.some((m) => m.uid === currentUser.uid);
      if (isAlreadyMember) {
        onJoined(roomData.id);
        onClose();
        handleReset();
        return;
      }

      // Show preview
      setPreviewRoom(roomData);
    } catch (err: any) {
      console.error('Error during room search:', err);
      setError(err.message || 'Error al buscar la sala');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!currentUser || !previewRoom) return;

    setLoading(true);
    setError('');
    try {
      const roomId = await joinRoomWithCode(previewRoom.id, currentUser);
      onJoined(roomId);
      onClose();
      handleReset();
    } catch (err: any) {
      setError(err.message || 'No se pudo unir a la sala, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => { handleReset(); onClose(); }}>
      <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
            {previewRoom ? 'Confirmar Entrada' : 'Unirse con Código'}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={() => { handleReset(); onClose(); }}
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {error && (
          <div style={{ margin: '1rem 1.5rem 0' }} className="alert-box alert-danger-light" role="alert">
            ⚠️ {error}
          </div>
        )}

        {!previewRoom ? (
          <form onSubmit={handleSearch}>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Pide el código al anfitrión de la sala para poder ingresar.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="room-code">
                  Código de la sala (ID)
                </label>
                <input
                  id="room-code"
                  type="text"
                  className="form-input"
                  placeholder="Ej. pgQ8vBkWzN..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { handleReset(); onClose(); }}
                style={{ width: 'auto', minWidth: '80px' }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: 'auto', minWidth: '100px' }}
                disabled={loading}
              >
                {loading ? 'Buscando sala...' : 'Buscar'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="modal-body">
              <div
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#ffffff' }}>
                  {previewRoom.name}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                  {previewRoom.description || 'Sin descripción.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Anfitrión:</span>{' '}
                    <strong style={{ color: '#ffffff' }}>{previewRoom.hostUsername}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Miembros:</span>{' '}
                    <strong style={{ color: '#ffffff' }}>{previewRoom.members?.length || 0} estudiantes</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Privacidad:</span>{' '}
                    <strong style={{ color: '#ffffff' }}>{previewRoom.isPrivate ? 'Privada' : 'Pública'}</strong>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                ¿Deseas unirte a esta sala de estudio?
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPreviewRoom(null)}
                style={{ width: 'auto', minWidth: '80px' }}
                disabled={loading}
              >
                Atrás
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmJoin}
                style={{ width: 'auto', minWidth: '100px' }}
                disabled={loading}
              >
                {loading ? 'Uniéndose...' : 'Unirse'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { joinRoomWithCode } from '../../hooks/useRooms';

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      const roomId = await joinRoomWithCode(trimmedCode, currentUser);
      onJoined(roomId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo unir a la sala, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>Unirse con Código</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert-box alert-danger-light" role="alert">
                ⚠️ {error}
              </div>
            )}

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
              onClick={onClose}
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
              {loading ? 'Buscando sala...' : 'Unirse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

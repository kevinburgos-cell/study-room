import React, { useState } from 'react';
import { createRoom } from '../../hooks/useRooms';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (roomId: string) => void;
  currentUser: { uid: string; username: string; photoURL: string | null } | null;
}

export default function CreateRoomModal({ isOpen, onClose, onCreated, currentUser }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError('');
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('El nombre es obligatorio');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Máximo 50 caracteres');
      return;
    }
    if (description.length > 100) {
      setError('Descripción máxima 100 caracteres');
      return;
    }

    setLoading(true);
    try {
      const roomId = await createRoom({
        name: trimmedName,
        description,
        isPrivate,
        host: currentUser,
      });
      onCreated(roomId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la sala, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Crear Sala de Estudio</h2>
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

            <div className="form-group">
              <label className="form-label" htmlFor="room-name">
                Nombre de la sala *
              </label>
              <input
                id="room-name"
                type="text"
                className="form-input"
                placeholder="Ej. Estudio de Matemáticas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                disabled={loading}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', float: 'right', marginTop: '0.2rem' }}>
                {name.length}/50
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label" htmlFor="room-desc">
                Descripción (opcional)
              </label>
              <textarea
                id="room-desc"
                className="form-input"
                placeholder="Ej. Sala para repasar cálculo diferencial."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
                style={{ minHeight: '80px', resize: 'vertical' }}
                disabled={loading}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', float: 'right', marginTop: '0.2rem' }}>
                {description.length}/100
              </span>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label" htmlFor="room-privacy">
                Privacidad
              </label>
              <select
                id="room-privacy"
                className="form-input"
                value={isPrivate ? 'private' : 'public'}
                onChange={(e) => setIsPrivate(e.target.value === 'private')}
                disabled={loading}
              >
                <option value="public">Pública (Cualquiera se puede unir)</option>
                <option value="private">Privada (Requiere código de sala)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ width: 'auto', minWidth: '100px' }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: 'auto', minWidth: '120px' }}
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

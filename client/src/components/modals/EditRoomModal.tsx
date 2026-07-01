import React, { useState, useEffect } from 'react';
import { updateRoom } from '../../hooks/useRooms';
import { Room } from '../../types/room.types';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onUpdated: () => void;
}

export default function EditRoomModal({ isOpen, onClose, room, onUpdated }: EditRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const modalRef = useFocusTrap(isOpen, onClose);

  useEffect(() => {
    if (room) {
      setName(room.name);
      setDescription(room.description || '');
      setIsPrivate(room.isPrivate);
      setError('');
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await updateRoom(room.id, {
        name: trimmedName,
        description,
        isPrivate,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la sala, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar Sala</h2>
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
              <label className="form-label" htmlFor="edit-room-name">
                Nombre de la sala *
              </label>
              <input
                id="edit-room-name"
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
              <label className="form-label" htmlFor="edit-room-desc">
                Descripción (opcional)
              </label>
              <textarea
                id="edit-room-desc"
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
              <label className="form-label" htmlFor="edit-room-privacy">
                Privacidad
              </label>
              <select
                id="edit-room-privacy"
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
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

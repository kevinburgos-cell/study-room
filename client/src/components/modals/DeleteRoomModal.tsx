import React, { useState } from 'react';
import { deleteRoom } from '../../hooks/useRooms';
import { Room } from '../../types/room.types';
import { socket } from '../../socket/socket';

interface DeleteRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onDeleted: () => void;
}

export default function DeleteRoomModal({ isOpen, onClose, room, onDeleted }: DeleteRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !room) return null;

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      // Notify other users via socket
      socket.emit('delete-room', { roomId: room.id });
      
      // Perform deletion in Firestore
      await deleteRoom(room.id);
      
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar la sala, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--color-danger)', fontSize: '1.25rem' }}>Eliminar Sala</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert-box alert-danger-light" role="alert">
              ⚠️ {error}
            </div>
          )}

          <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.75rem', color: '#ffffff' }}>
            ¿Eliminar "{room.name}"?
          </p>
          
          <p style={{ color: '#fca5a5', fontSize: '0.875rem', lineHeight: '1.4' }}>
            Esta acción no se puede deshacer. Se eliminará la sala y todo su historial de mensajes.
          </p>
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
            type="button"
            className="btn-primary"
            onClick={handleDelete}
            style={{ 
              width: 'auto', 
              minWidth: '100px', 
              backgroundColor: 'var(--color-danger)', 
              borderColor: 'transparent'
            }}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

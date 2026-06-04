import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${type === 'error' ? 'toast-error' : ''}`}>
      <span style={{ fontSize: '1.2rem' }}>
        {type === 'success' ? '✅' : '❌'}
      </span>
      <span>{message}</span>
    </div>
  );
}

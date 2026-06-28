import React, { useEffect, useRef } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  durationMs?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'success', durationMs = 2000, onClose }: ToastProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs]);

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

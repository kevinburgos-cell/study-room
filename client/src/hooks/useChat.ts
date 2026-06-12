import { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket/socket';
import { useAuth } from '../contexts/AuthContext';

export interface Message {
  id: string;
  roomId: string;
  senderUid: string;
  senderUsername: string;
  senderPhotoURL: string | null;
  text: string;
  timestamp: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const parseTimestamp = (timestamp: string) => {
  const value = new Date(timestamp).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
};

export function useChat(roomId: string | undefined) {
  const { firebaseUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Fetch message history from main backend server
  const loadHistory = useCallback(async () => {
    if (!roomId || !firebaseUser) {
      setMessages([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const token = await firebaseUser.getIdToken(true);
      const response = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `Error al cargar el historial de mensajes (${response.status})`);
      }

      const data = await response.json();
      const normalized = Array.isArray(data) ? data : [];
      normalized.sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
      setMessages(normalized);
    } catch (err: any) {
      console.error('Failed to load chat history:', err);
      setError(err?.message || 'No se pudo cargar el historial. Reintentar');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, firebaseUser]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Listen for real-time messages via socket
  useEffect(() => {
    if (!roomId) return;

    const handleNewMessage = (message: Message) => {
      if (message.roomId !== roomId) return;
      setSendError(null);
      
      setMessages((prev) => {
        // Avoid duplicate messages by checking id
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
      });
    };

    const handleSocketError = (payload: { message?: string }) => {
      setSendError(payload?.message || 'No se pudo enviar. Intenta de nuevo');
    };

    socket.on('new-message', handleNewMessage);
    socket.on('error', handleSocketError);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('error', handleSocketError);
    };
  }, [roomId]);

  // Send message through socket with auth token
  const sendMessage = async (text: string) => {
    if (!roomId || !firebaseUser || !text.trim()) return;

    try {
      if (!socket.connected) {
        throw new Error('No se pudo enviar. Intenta de nuevo');
      }

      setSendError(null);
      const token = await firebaseUser.getIdToken();
      socket.emit('send-message', {
        roomId,
        text: text.trim(),
        token,
      });
    } catch (err) {
      console.error('Error sending message via socket:', err);
      setSendError('No se pudo enviar. Intenta de nuevo');
      throw new Error('No se pudo enviar. Intenta de nuevo');
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendError,
    sendMessage,
    retryLoadHistory: loadHistory,
  };
}

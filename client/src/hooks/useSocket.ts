import { useEffect, useState } from 'react';
import { socket } from '../socket/socket';
import { useAuth } from '../contexts/AuthContext';

export function useSocket(roomId: string | undefined) {
  const { firebaseUser } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showReconnectingBanner, setShowReconnectingBanner] = useState(false);
  const [showConnectedSuccess, setShowConnectedSuccess] = useState(false);

  useEffect(() => {
    if (!roomId || !firebaseUser) return;

    const connectToSocket = async () => {
      setIsConnecting(true);
      try {
        const token = await firebaseUser.getIdToken(true);

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit('join-room', { roomId, token });
      } catch (error) {
        console.error('Error getting auth token or connecting:', error);
        setIsConnecting(false);
      }
    };

    connectToSocket();

    const onConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setShowReconnectingBanner(false);
      
      // Temporary display of reconnect success
      setShowConnectedSuccess(true);
      const timer = setTimeout(() => {
        setShowConnectedSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    const onConnectError = (err: any) => {
      console.error('Socket connection error:', err);
      setIsConnecting(false);
      setShowReconnectingBanner(true);
    };

    const onReconnectAttempt = () => {
      setShowReconnectingBanner(true);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect_attempt', onReconnectAttempt);

      if (socket.connected) {
        socket.emit('leave-room', { roomId });
        socket.disconnect();
      }
      setIsConnected(false);
      setIsConnecting(false);
      setShowReconnectingBanner(false);
      setShowConnectedSuccess(false);
    };
  }, [roomId, firebaseUser]);

  return { isConnected, isConnecting, showReconnectingBanner, showConnectedSuccess };
}

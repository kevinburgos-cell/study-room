import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket/socket';
import { useAuth } from '../contexts/AuthContext';

export function useSocket(roomId: string | undefined) {
  const { firebaseUser, user } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showReconnectingBanner, setShowReconnectingBanner] = useState(false);
  const [showConnectedSuccess, setShowConnectedSuccess] = useState(false);
  const roomIdRef = useRef(roomId);
  const authTokenRef = useRef<string | null>(null);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !firebaseUser) return;

    const connectToSocket = async () => {
      setIsConnecting(true);
      try {
        const token = await firebaseUser.getIdToken(true);
        authTokenRef.current = token;

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit('join-room', {
          roomId,
          token,
          username: user?.username,
          photoURL: user?.photoURL,
        });
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

    const onDisconnect = (reason: string) => {
      console.log('[useSocket] Socket disconnected:', reason);
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

    const onReconnect = (attemptNumber: number) => {
      console.log('[useSocket] Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setIsConnecting(false);
      setShowReconnectingBanner(false);
      if (roomIdRef.current && authTokenRef.current) {
        socket.emit('join-room', {
          roomId: roomIdRef.current,
          token: authTokenRef.current,
          username: user?.username,
          photoURL: user?.photoURL,
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);

      if (socket.connected) {
        socket.emit('leave-room', { roomId });
        socket.disconnect();
      }
      setIsConnected(false);
      setIsConnecting(false);
      setShowReconnectingBanner(false);
      setShowConnectedSuccess(false);
    };
  }, [roomId, firebaseUser, user?.username, user?.photoURL]);

  return { isConnected, isConnecting, showReconnectingBanner, showConnectedSuccess };
}

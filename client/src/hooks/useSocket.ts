import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket/socket';
import { useAuth } from '../contexts/AuthContext';

export function useSocket(roomId: string | undefined) {
  const { firebaseUser } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showReconnectingBanner, setShowReconnectingBanner] = useState(false);
  const [showConnectedSuccess, setShowConnectedSuccess] = useState(false);
  const roomIdRef = useRef(roomId);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatAckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authTokenRef = useRef<string | null>(null);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (heartbeatAckTimeoutRef.current) clearTimeout(heartbeatAckTimeoutRef.current);
    };
  }, []);

  const clearHeartbeatWatchdog = () => {
    if (heartbeatAckTimeoutRef.current) {
      clearTimeout(heartbeatAckTimeoutRef.current);
      heartbeatAckTimeoutRef.current = null;
    }
  };

  const startHeartbeat = () => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

    heartbeatTimerRef.current = setInterval(() => {
      if (!socket.connected || !roomIdRef.current || !authTokenRef.current) return;

      clearHeartbeatWatchdog();
      socket.emit('heartbeat', {
        roomId: roomIdRef.current,
        uid: firebaseUser?.uid,
      });

      heartbeatAckTimeoutRef.current = setTimeout(() => {
        console.warn('[useSocket] Heartbeat ACK not received in time, reconnecting socket');
        socket.disconnect();
        socket.connect();
        if (roomIdRef.current && authTokenRef.current) {
          socket.emit('join-room', { roomId: roomIdRef.current, token: authTokenRef.current });
        }
      }, 5000);
    }, 30000);
  };

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
      startHeartbeat();
      
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
      clearHeartbeatWatchdog();
    };

    const onConnectError = (err: any) => {
      console.error('Socket connection error:', err);
      setIsConnecting(false);
      setShowReconnectingBanner(true);
    };

    const onReconnectAttempt = () => {
      setShowReconnectingBanner(true);
    };

    const onHeartbeatAck = () => {
      clearHeartbeatWatchdog();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('heartbeat-ack', onHeartbeatAck);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('heartbeat-ack', onHeartbeatAck);

      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      clearHeartbeatWatchdog();
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

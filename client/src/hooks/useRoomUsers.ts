import { useEffect, useState, useRef } from 'react';
import { socket } from '../socket/socket';
import { RoomMember } from '../types/room.types';

interface UseRoomUsersOptions {
  onUserJoined?: (username: string) => void;
  onUserLeft?: (username: string) => void;
  onError?: (message: string) => void;
}

export function useRoomUsers(options?: UseRoomUsersOptions) {
  const [onlineUsers, setOnlineUsers] = useState<RoomMember[]>([]);
  const optionsRef = useRef(options);

  // Keep options up to date without triggering useEffect
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    console.log('[useRoomUsers] Registering socket listeners for online users list');

    const onRoomUsers = (payload: { users: RoomMember[] }) => {
      console.log('[useRoomUsers] Received "room-users" list:', JSON.stringify(payload.users));
      setOnlineUsers(payload.users);
    };

    const onUserJoined = (user: RoomMember) => {
      console.log('[useRoomUsers] Received "user-joined" event for:', JSON.stringify(user));
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.uid === user.uid)) {
          console.log(`[useRoomUsers] User ${user.username} already in online list, skipping duplicate`);
          return prev;
        }
        return [...prev, user];
      });
      if (optionsRef.current?.onUserJoined) {
        optionsRef.current.onUserJoined(user.username);
      }
    };

    const onUserLeft = (user: { uid: string; username: string }) => {
      console.log('[useRoomUsers] Received "user-left" event for:', JSON.stringify(user));
      setOnlineUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      if (optionsRef.current?.onUserLeft) {
        optionsRef.current.onUserLeft(user.username);
      }
    };

    const onError = (payload: { message: string }) => {
      console.error('[useRoomUsers] Received socket "error" event:', payload.message);
      if (optionsRef.current?.onError) {
        optionsRef.current.onError(payload.message);
      }
    };

    socket.on('room-users', onRoomUsers);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('error', onError);

    return () => {
      console.log('[useRoomUsers] Cleaning up socket listeners');
      socket.off('room-users', onRoomUsers);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('error', onError);
    };
  }, []); // Run only once on mount

  return onlineUsers;
}

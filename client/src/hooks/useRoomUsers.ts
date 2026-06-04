import { useEffect, useState } from 'react';
import { socket } from '../socket/socket';
import { RoomMember } from '../types/room.types';

interface UseRoomUsersOptions {
  onUserJoined?: (username: string) => void;
  onUserLeft?: (username: string) => void;
  onError?: (message: string) => void;
}

export function useRoomUsers(options?: UseRoomUsersOptions) {
  const [onlineUsers, setOnlineUsers] = useState<RoomMember[]>([]);

  useEffect(() => {
    const onRoomUsers = (payload: { users: RoomMember[] }) => {
      setOnlineUsers(payload.users);
    };

    const onUserJoined = (user: RoomMember) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.uid === user.uid)) return prev;
        return [...prev, user];
      });
      if (options?.onUserJoined) {
        options.onUserJoined(user.username);
      }
    };

    const onUserLeft = (user: { uid: string; username: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      if (options?.onUserLeft) {
        options.onUserLeft(user.username);
      }
    };

    const onError = (payload: { message: string }) => {
      if (options?.onError) {
        options.onError(payload.message);
      }
    };

    socket.on('room-users', onRoomUsers);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('error', onError);

    return () => {
      socket.off('room-users', onRoomUsers);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('error', onError);
    };
  }, [options]);

  return onlineUsers;
}

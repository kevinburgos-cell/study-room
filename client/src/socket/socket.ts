import { io } from 'socket.io-client';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:4000';

// Initialize socket client as a singleton but with autoConnect false.
// We will manually connect/disconnect depending on active room life cycle.
export const socket = io(REALTIME_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

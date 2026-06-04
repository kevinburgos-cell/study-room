export interface ConnectedUser {
  uid: string;
  username: string;
  photoURL: string | null;
  socketId: string;
}

export interface JoinRoomPayload {
  roomId: string;
  token: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface ConnectedUser {
  uid: string;
  username: string;
  photoURL: string | null;
  socketId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
}

export interface JoinRoomPayload {
  roomId: string;
  token: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

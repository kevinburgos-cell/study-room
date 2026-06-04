import { Timestamp } from 'firebase/firestore';

export interface RoomMember {
  uid: string;
  username: string;
  photoURL: string | null;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  hostUid: string;
  hostUsername: string;
  members: RoomMember[];
  isPrivate: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

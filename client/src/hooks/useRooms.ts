import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Room, RoomMember } from '../types/room.types';

export function useRoomsList(userUid: string | undefined) {
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [guestRooms, setGuestRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userUid) {
      setMyRooms([]);
      setGuestRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allRooms: Room[] = [];
        snapshot.forEach((doc) => {
          allRooms.push({ id: doc.id, ...doc.data() } as Room);
        });

        const mine = allRooms.filter((r) => r.hostUid === userUid);
        const guest = allRooms.filter(
          (r) => r.hostUid !== userUid && r.members.some((m) => m.uid === userUid)
        );

        setMyRooms(mine);
        setGuestRooms(guest);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching rooms:', err);
        setError('No se pudieron cargar las salas, intenta de nuevo');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userUid]);

  return { myRooms, guestRooms, loading, error };
}

export async function createRoom(params: {
  name: string;
  description: string;
  isPrivate: boolean;
  host: { uid: string; username: string; photoURL: string | null };
}) {
  const name = params.name.trim();
  const description = params.description.trim();

  if (!name) {
    throw new Error('El nombre es obligatorio');
  }
  if (name.length > 50) {
    throw new Error('Máximo 50 caracteres');
  }
  if (description.length > 100) {
    throw new Error('Descripción máxima 100 caracteres');
  }

  const initialMember: RoomMember = {
    uid: params.host.uid,
    username: params.host.username,
    photoURL: params.host.photoURL,
  };

  try {
    const docRef = await addDoc(collection(db, 'rooms'), {
      name,
      description,
      isPrivate: params.isPrivate,
      hostUid: params.host.uid,
      hostUsername: params.host.username,
      members: [initialMember],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error in createRoom:', error);
    throw new Error('No se pudo crear la sala, intenta de nuevo');
  }
}

export async function updateRoom(
  roomId: string,
  params: {
    name: string;
    description: string;
    isPrivate: boolean;
  }
) {
  const name = params.name.trim();
  const description = params.description.trim();

  if (!name) {
    throw new Error('El nombre es obligatorio');
  }
  if (name.length > 50) {
    throw new Error('Máximo 50 caracteres');
  }
  if (description.length > 100) {
    throw new Error('Descripción máxima 100 caracteres');
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      name,
      description,
      isPrivate: params.isPrivate,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error in updateRoom:', error);
    throw new Error('No se pudo actualizar la sala, intenta de nuevo');
  }
}

export async function deleteRoom(roomId: string) {
  try {
    // 1. Delete all messages inside subcollection
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const msgSnapshot = await getDocs(messagesRef);
    if (!msgSnapshot.empty) {
      const batch = writeBatch(db);
      msgSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // 2. Delete the room document
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (error) {
    console.error('Error in deleteRoom:', error);
    throw new Error('No se pudo eliminar la sala, intenta de nuevo');
  }
}

export async function joinRoomWithCode(
  code: string,
  user: { uid: string; username: string; photoURL: string | null }
) {
  const roomId = code.trim();
  if (!roomId) {
    throw new Error('El código es obligatorio');
  }

  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error('No se encontró ninguna sala con ese código');
    }

    const room = roomSnap.data() as Room;
    
    // Check if user is host
    if (room.hostUid === user.uid) {
      return roomId;
    }

    // Check if user is already a member
    const isAlreadyMember = room.members.some((m) => m.uid === user.uid);
    if (isAlreadyMember) {
      return roomId;
    }

    const newMember: RoomMember = {
      uid: user.uid,
      username: user.username,
      photoURL: user.photoURL,
    };

    const updatedMembers = [...room.members, newMember];

    await updateDoc(roomRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    return roomId;
  } catch (error: any) {
    console.error('Error in joinRoomWithCode:', error);
    if (error.message === 'No se encontró ninguna sala con ese código') {
      throw error;
    }
    throw new Error('No se pudo unir a la sala, intenta de nuevo');
  }
}

export async function leaveRoom(roomId: string, userUid: string) {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return;
    }

    const room = roomSnap.data() as Room;
    const updatedMembers = room.members.filter((m) => m.uid !== userUid);

    await updateDoc(roomRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error in leaveRoom:', error);
    throw new Error('No se pudo abandonar la sala, intenta de nuevo');
  }
}

const { db, isMock } = require('../firebase');

const mockRooms = [
  {
    id: 'mock_room_1',
    name: 'Sala de Cálculo Diferencial',
    description: 'Repaso para el parcial 1',
    isPrivate: false,
    hostUid: 'mock_uid_kevin',
    hostUsername: 'KevinBurgos',
    members: [{ uid: 'mock_uid_kevin', username: 'KevinBurgos', photoURL: null }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockMessages = {
  mock_room_1: [
    {
      id: 'msg_1',
      roomId: 'mock_room_1',
      senderUid: 'mock_uid_kevin',
      senderUsername: 'KevinBurgos',
      senderPhotoURL: null,
      text: '¡Hola a todos! Bienvenidos a la sala de estudio.',
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
  ],
};

/**
 * Obtiene todas las salas del usuario (donde es creador o miembro).
 * @route GET /api/rooms
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function getRooms(req, res) {
  try {
    const userUid = req.user.uid;

    if (isMock) {
      const userRooms = mockRooms.filter(r => r.hostUid === userUid || r.members.some(m => m.uid === userUid));
      return res.json(userRooms);
    }

    const snapshot = await db.collection('rooms').orderBy('createdAt', 'desc').get();
    const rooms = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.hostUid === userUid || (data.members && data.members.some(m => m.uid === userUid))) {
        rooms.push({ id: doc.id, ...data });
      }
    });

    return res.json(rooms);
  } catch (error) {
    console.error('Error listing rooms:', error);
    return res.status(500).json({ error: 'Error interno del servidor al listar salas' });
  }
}

/**
 * Crea una nueva sala de estudio.
 * @route POST /api/rooms
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function createRoom(req, res) {
  try {
    const { name, description, isPrivate } = req.body;
    const userUid = req.user.uid;
    const username = req.user.name || req.user.email?.split('@')[0] || 'Estudiante';
    const photoURL = req.user.picture || null;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la sala es obligatorio' });
    }

    const initialMember = { uid: userUid, username, photoURL };

    if (isMock) {
      const newRoom = {
        id: `mock_room_${Date.now()}`,
        name: name.trim(),
        description: (description || '').trim(),
        hostUid: userUid,
        hostUsername: username,
        members: [initialMember],
        isPrivate: Boolean(isPrivate),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockRooms.push(newRoom);
      return res.status(201).json(newRoom);
    }

    const roomData = {
      name: name.trim(),
      description: (description || '').trim(),
      hostUid: userUid,
      hostUsername: username,
      members: [initialMember],
      isPrivate: Boolean(isPrivate),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('rooms').add(roomData);
    return res.status(201).json({ id: docRef.id, ...roomData });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ error: 'Error interno del servidor al crear la sala' });
  }
}

/**
 * Obtiene los detalles de una sala específica por su ID.
 * @route GET /api/rooms/:roomId
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function getRoomById(req, res) {
  try {
    const { roomId } = req.params;

    if (isMock) {
      const room = mockRooms.find((r) => r.id === roomId);
      if (!room) return res.status(404).json({ error: 'Sala no encontrada' });
      return res.json(room);
    }

    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    return res.json({ id: roomDoc.id, ...roomDoc.data() });
  } catch (error) {
    console.error('Error fetching room details:', error);
    return res.status(500).json({ error: 'Error interno del servidor al obtener la sala' });
  }
}

/**
 * Edita los detalles de una sala de estudio. Solo el creador puede editarla.
 * @route PUT /api/rooms/:roomId
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function updateRoom(req, res) {
  try {
    const { roomId } = req.params;
    const { name, description, isPrivate } = req.body;
    const userUid = req.user.uid;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la sala es obligatorio' });
    }

    if (isMock) {
      const roomIndex = mockRooms.findIndex((r) => r.id === roomId);
      if (roomIndex === -1) return res.status(404).json({ error: 'Sala no encontrada' });
      
      const room = mockRooms[roomIndex];
      if (room.hostUid !== userUid) {
        return res.status(403).json({ error: 'No tienes permisos para editar esta sala' });
      }

      room.name = name.trim();
      room.description = (description || '').trim();
      room.isPrivate = Boolean(isPrivate);
      room.updatedAt = new Date().toISOString();

      return res.json(room);
    }

    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    const roomData = roomDoc.data();
    if (roomData.hostUid !== userUid) {
      return res.status(403).json({ error: 'No tienes permisos para editar esta sala' });
    }

    const updateData = {
      name: name.trim(),
      description: (description || '').trim(),
      isPrivate: Boolean(isPrivate),
      updatedAt: new Date().toISOString(),
    };

    await roomRef.update(updateData);
    return res.json({ id: roomId, ...roomData, ...updateData });
  } catch (error) {
    console.error('Error updating room:', error);
    return res.status(500).json({ error: 'Error interno del servidor al editar la sala' });
  }
}

/**
 * Elimina una sala de estudio y sus mensajes asociados. Solo el creador puede eliminarla.
 * @route DELETE /api/rooms/:roomId
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function deleteRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userUid = req.user.uid;

    if (isMock) {
      const roomIndex = mockRooms.findIndex((r) => r.id === roomId);
      if (roomIndex === -1) return res.status(404).json({ error: 'Sala no encontrada' });
      
      const room = mockRooms[roomIndex];
      if (room.hostUid !== userUid) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar esta sala' });
      }

      mockRooms.splice(roomIndex, 1);
      delete mockMessages[roomId];
      return res.json({ success: true, message: 'Sala eliminada exitosamente' });
    }

    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    const roomData = roomDoc.data();
    if (roomData.hostUid !== userUid) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta sala' });
    }

    // Delete messages subcollection
    const messagesRef = roomRef.collection('messages');
    const msgSnapshot = await messagesRef.get();
    if (!msgSnapshot.empty) {
      const batch = db.batch();
      msgSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    await roomRef.delete();
    return res.json({ success: true, message: 'Sala eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return res.status(500).json({ error: 'Error interno del servidor al eliminar la sala' });
  }
}

/**
 * Une a un usuario a una sala de estudio.
 * @route POST /api/rooms/:roomId/join
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function joinRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userUid = req.user.uid;
    const username = req.user.name || req.user.email?.split('@')[0] || 'Estudiante';
    const photoURL = req.user.picture || null;

    if (isMock) {
      const room = mockRooms.find((r) => r.id === roomId);
      if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

      const isAlreadyMember = room.members.some((m) => m.uid === userUid);
      if (!isAlreadyMember) {
        room.members.push({ uid: userUid, username, photoURL });
        room.updatedAt = new Date().toISOString();
      }
      return res.json(room);
    }

    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    const roomData = roomDoc.data();
    const isAlreadyMember = roomData.members && roomData.members.some((m) => m.uid === userUid);

    if (!isAlreadyMember) {
      const newMember = { uid: userUid, username, photoURL };
      const updatedMembers = [...(roomData.members || []), newMember];

      await roomRef.update({
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      });
      roomData.members = updatedMembers;
    }

    return res.json({ id: roomId, ...roomData });
  } catch (error) {
    console.error('Error joining room:', error);
    return res.status(500).json({ error: 'Error interno del servidor al unirse a la sala' });
  }
}

/**
 * Retira a un usuario de una sala de estudio.
 * @route POST /api/rooms/:roomId/leave
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function leaveRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userUid = req.user.uid;

    if (isMock) {
      const room = mockRooms.find((r) => r.id === roomId);
      if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

      room.members = room.members.filter((m) => m.uid !== userUid);
      room.updatedAt = new Date().toISOString();
      return res.json(room);
    }

    const roomRef = db.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    const roomData = roomDoc.data();
    const updatedMembers = (roomData.members || []).filter((m) => m.uid !== userUid);

    await roomRef.update({
      members: updatedMembers,
      updatedAt: new Date().toISOString(),
    });
    roomData.members = updatedMembers;

    return res.json({ id: roomId, ...roomData });
  } catch (error) {
    console.error('Error leaving room:', error);
    return res.status(500).json({ error: 'Error interno del servidor al abandonar la sala' });
  }
}

/**
 * Obtiene el historial de mensajes de una sala específica.
 * @route GET /api/rooms/:roomId/messages
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
async function getRoomMessages(req, res) {
  try {
    const { roomId } = req.params;
    const limitVal = Math.min(parseInt(req.query.limit, 10) || 100, 100);
    const beforeVal = typeof req.query.before === 'string' ? req.query.before : null;

    if (isMock) {
      const room = mockRooms.find((r) => r.id === roomId);
      if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

      let messages = mockMessages[roomId] || [];
      if (beforeVal) {
        messages = messages.filter((message) => message.timestamp < beforeVal);
      }
      messages = messages.slice(-limitVal);
      return res.json(messages);
    }

    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    let queryRef = db
      .collection('rooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('timestamp', 'asc');

    if (beforeVal) {
      queryRef = queryRef.where('timestamp', '<', beforeVal);
    }

    queryRef = queryRef.limit(limitVal);

    const snapshot = await queryRef.get();

    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    return res.json(messages);
  } catch (error) {
    console.error('Error fetching room messages:', error);
    
    const response = {
      error: 'Error interno del servidor al obtener el historial de mensajes',
    };
    if (process.env.NODE_ENV === 'development') {
      response.details = error.message || String(error);
    }
    return res.status(500).json(response);
  }
}

module.exports = {
  getRooms,
  createRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMessages,
};

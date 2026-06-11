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

async function getRoomMessages(req, res) {
  try {
    const { roomId } = req.params;
    const beforeVal = req.query.before;
    const limitVal = Math.min(parseInt(req.query.limit, 10) || 100, 100);

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
      .orderBy('timestamp', 'desc');

    if (beforeVal) {
      const beforeDate = new Date(beforeVal);
      if (!Number.isNaN(beforeDate.getTime())) {
        queryRef = queryRef.startAfter(beforeVal);
      }
    }

    const snapshot = await queryRef.limit(limitVal).get();

    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    return res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching room messages:', error);
    return res.status(500).json({ error: 'Error interno del servidor al obtener el historial de mensajes' });
  }
}

module.exports = {
  getRoomById,
  getRoomMessages,
};

const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const {
  getRooms,
  createRoom,
  getRoomById,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMessages
} = require('../controllers/rooms.controller');

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Listar salas del usuario
 *     description: Retorna la lista de todas las salas de estudio donde el usuario autenticado es creador (host) o miembro participante.
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de salas del usuario retornado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *             example:
 *               - id: "M3JupqIXqiIqVLgw2htU"
 *                 name: "Cálculo Diferencial"
 *                 description: "Repaso de integrales"
 *                 hostUid: "abc123uid"
 *                 hostUsername: "kevinburgos"
 *                 members: [{uid: "abc123uid", username: "kevinburgos", photoURL: null}]
 *                 isPrivate: false
 *                 createdAt: "2026-06-11T18:00:00.000Z"
 *                 updatedAt: "2026-06-11T18:10:00.000Z"
 *       400:
 *         description: Parámetros inválidos.
 *         content:
 *           application/json:
 *             example:
 *               error: Parámetros de petición inválidos.
 *       401:
 *         description: No autorizado. Formato Bearer Token requerido o token inválido.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Prohibido. Sin permisos para listar estas salas.
 *         content:
 *           application/json:
 *             example:
 *               error: Acceso prohibido.
 *       404:
 *         description: Recurso no encontrado.
 *         content:
 *           application/json:
 *             example:
 *               error: No encontrado.
 *       500:
 *         description: Error interno del servidor al obtener las salas.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al listar salas
 *   post:
 *     summary: Crear sala de estudio
 *     description: Crea una nueva sala de estudio con el nombre, descripción e indicación de privacidad suministrados. El creador se añade automáticamente como miembro principal.
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre descriptivo de la sala
 *                 example: "Estudio Física Mecánica"
 *               description:
 *                 type: string
 *                 description: Resumen o descripción de la temática de la sala
 *                 example: "Repaso del tema de cinemática en dos dimensiones"
 *               isPrivate:
 *                 type: boolean
 *                 description: Define si la sala requiere código/ID directo para unirse
 *                 example: false
 *     responses:
 *       201:
 *         description: Sala creada de manera exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *             example:
 *               id: "M3JupqIXqiIqVLgw2htU"
 *               name: "Estudio Física Mecánica"
 *               description: "Repaso del tema de cinemática en dos dimensiones"
 *               hostUid: "abc123uid"
 *               hostUsername: "kevinburgos"
 *               members:
 *                 - uid: "abc123uid"
 *                   username: "kevinburgos"
 *                   photoURL: null
 *               isPrivate: false
 *               createdAt: "2026-06-11T18:00:00.000Z"
 *               updatedAt: "2026-06-11T18:00:00.000Z"
 *       400:
 *         description: Datos de entrada inválidos.
 *         content:
 *           application/json:
 *             example:
 *               error: El nombre de la sala es obligatorio
 *       401:
 *         description: No autorizado. Token ausente o expirado.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Prohibido. Sin permisos para crear salas.
 *         content:
 *           application/json:
 *             example:
 *               error: Acceso prohibido.
 *       404:
 *         description: Recurso no encontrado.
 *         content:
 *           application/json:
 *             example:
 *               error: No encontrado.
 *       500:
 *         description: Error al procesar la creación de la sala en la base de datos.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al crear la sala
 */
router.get('/', verifyToken, getRooms);
router.post('/', verifyToken, createRoom);

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Obtener sala por ID
 *     description: Obtiene la información detallada de una sala de estudio en específico usando su ID.
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: ID único de la sala a consultar
 *         schema:
 *           type: string
 *           example: "mock_room_1"
 *     responses:
 *       200:
 *         description: Sala retornada de manera correcta.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *             example:
 *               id: "mock_room_1"
 *               name: "Cálculo Diferencial"
 *               description: "Repaso para el parcial 1"
 *               hostUid: "abc123uid"
 *               hostUsername: "kevinburgos"
 *               members:
 *                 - uid: "abc123uid"
 *                   username: "kevinburgos"
 *                   photoURL: null
 *               isPrivate: false
 *               createdAt: "2026-06-11T18:00:00.000Z"
 *               updatedAt: "2026-06-11T18:10:00.000Z"
 *       400:
 *         description: ID de sala mal formateado.
 *         content:
 *           application/json:
 *             example:
 *               error: Parámetros de petición inválidos.
 *       401:
 *         description: No autorizado. Token ausente o expirado.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Sin permisos para acceder a esta sala.
 *         content:
 *           application/json:
 *             example:
 *               error: Acceso prohibido.
 *       404:
 *         description: La sala especificada no fue encontrada.
 *         content:
 *           application/json:
 *             example:
 *               error: Sala no encontrada
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al obtener la sala
 *   put:
 *     summary: Editar sala
 *     description: Actualiza el nombre, descripción y estado de privacidad de la sala. Sólo el creador (host) tiene permisos para efectuar cambios.
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: ID único de la sala a modificar
 *         schema:
 *           type: string
 *           example: "mock_room_1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Física Mecánica Avanzada"
 *               description:
 *                 type: string
 *                 example: "Ejercicios resueltos de dinámica rotacional"
 *               isPrivate:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Sala editada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *             example:
 *               id: "mock_room_1"
 *               name: "Física Mecánica Avanzada"
 *               description: "Ejercicios resueltos de dinámica rotacional"
 *               hostUid: "abc123uid"
 *               hostUsername: "kevinburgos"
 *               members:
 *                 - uid: "abc123uid"
 *                   username: "kevinburgos"
 *                   photoURL: null
 *               isPrivate: true
 *               createdAt: "2026-06-11T18:00:00.000Z"
 *               updatedAt: "2026-06-11T19:00:00.000Z"
 *       400:
 *         description: Faltan datos necesarios para la actualización.
 *         content:
 *           application/json:
 *             example:
 *               error: El nombre de la sala es obligatorio
 *       401:
 *         description: Autenticación ausente o inválida.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Acceso denegado. No eres el creador de la sala.
 *         content:
 *           application/json:
 *             example:
 *               error: No tienes permisos para editar esta sala
 *       404:
 *         description: Sala no encontrada.
 *         content:
 *           application/json:
 *             example:
 *               error: Sala no encontrada
 *       500:
 *         description: Error interno al guardar los cambios.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al editar la sala
 *   delete:
 *     summary: Eliminar sala
 *     description: Elimina de forma permanente la sala y todo su historial de mensajes asociados. Sólo disponible para el creador (host).
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: ID único de la sala a eliminar
 *         schema:
 *           type: string
 *           example: "mock_room_1"
 *     responses:
 *       200:
 *         description: Sala eliminada de forma exitosa.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sala eliminada exitosamente"
 *             example:
 *               success: true
 *               message: "Sala eliminada exitosamente"
 *       400:
 *         description: ID de sala mal formateado.
 *         content:
 *           application/json:
 *             example:
 *               error: Parámetros inválidos.
 *       401:
 *         description: Autenticación requerida.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Prohibido. El usuario actual no es el dueño de la sala.
 *         content:
 *           application/json:
 *             example:
 *               error: No tienes permisos para eliminar esta sala
 *       404:
 *         description: Sala no encontrada.
 *         content:
 *           application/json:
 *             example:
 *               error: Sala no encontrada
 *       500:
 *         description: Error del servidor al procesar el borrado.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al eliminar la sala
 */
router.get('/:roomId', verifyToken, getRoomById);
router.put('/:roomId', verifyToken, updateRoom);
router.delete('/:roomId', verifyToken, deleteRoom);

/**
 * @swagger
 * /api/rooms/{roomId}/join:
 *   post:
 *     summary: Unirse a sala
 *     description: Agrega al usuario autenticado al listado de miembros participantes de la sala de estudio.
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: ID de la sala a la que desea unirse
 *         schema:
 *           type: string
 *           example: "mock_room_1"
 *     responses:
 *       200:
 *         description: Incorporación a la sala exitosa. Retorna el objeto actualizado de la sala.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *             example:
 *               id: "mock_room_1"
 *               name: "Cálculo Diferencial"
 *               description: "Repaso para el parcial 1"
 *               hostUid: "abc123uid"
 *               hostUsername: "kevinburgos"
 *               members:
 *                 - uid: "abc123uid"
 *                   username: "kevinburgos"
 *                   photoURL: null
 *                 - uid: "def456uid"
 *                   username: "maria"
 *                   photoURL: null
 *               isPrivate: false
 *               createdAt: "2026-06-11T18:00:00.000Z"
 *               updatedAt: "2026-06-11T19:00:00.000Z"
 *       400:
 *         description: ID de sala mal formateado.
 *         content:
 *           application/json:
 *             example:
 *               error: Parámetros inválidos.
 *       401:
 *         description: Autenticación requerida.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Prohibido. Sin permisos para unirse.
 *         content:
 *           application/json:
 *             example:
 *               error: Acceso prohibido.
 *       404:
 *         description: Sala no encontrada.
 *         content:
 *           application/json:
 *             example:
 *               error: Sala no encontrada
 *       500:
 *         description: Error al procesar la unión.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al unirse a la sala
 */
router.post('/:roomId/join', verifyToken, joinRoom);

/**
 * @swagger
 * /api/rooms/{roomId}/leave:
 *   post:
 *     summary: Salir de sala
 *     description: Remueve al usuario autenticado del listado de miembros de la sala de estudio.
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: ID de la sala de la cual salir
 *         schema:
 *           type: string
 *           example: "mock_room_1"
 *     responses:
 *       200:
 *         description: Abandono de sala exitoso. Retorna la sala con el miembro removido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *             example:
 *               id: "mock_room_1"
 *               name: "Cálculo Diferencial"
 *               description: "Repaso para el parcial 1"
 *               hostUid: "abc123uid"
 *               hostUsername: "kevinburgos"
 *               members:
 *                 - uid: "abc123uid"
 *                   username: "kevinburgos"
 *                   photoURL: null
 *               isPrivate: false
 *               createdAt: "2026-06-11T18:00:00.000Z"
 *               updatedAt: "2026-06-11T19:30:00.000Z"
 *       400:
 *         description: ID de sala mal formateado.
 *         content:
 *           application/json:
 *             example:
 *               error: Parámetros inválidos.
 *       401:
 *         description: Autenticación requerida.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Sin permisos para salir de esta sala.
 *         content:
 *           application/json:
 *             example:
 *               error: Acceso prohibido.
 *       404:
 *         description: Sala no encontrada.
 *         content:
 *           application/json:
 *             example:
 *               error: Sala no encontrada
 *       500:
 *         description: Error al procesar la salida.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al abandonar la sala
 */
router.post('/:roomId/leave', verifyToken, leaveRoom);

/**
 * @swagger
 * /api/rooms/{roomId}/messages:
 *   get:
 *     summary: Obtener historial de mensajes
 *     description: Obtiene los mensajes de chat enviados en una sala. Los mensajes se pueden filtrar de manera temporal usando query params.
 *     tags: [Messages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         description: ID de la sala a consultar
 *         schema:
 *           type: string
 *           example: "mock_room_1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Límite máximo de mensajes a retornar (máx 100)
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO timestamp para paginar mensajes anteriores a esta fecha
 *     responses:
 *       200:
 *         description: Mensajes ordenados cronológicamente por timestamp.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *             example:
 *               - id: "7e7ef57c-1d52-4df3-99be-8b7c7c49a2e7"
 *                 roomId: "mock_room_1"
 *                 senderUid: "abc123uid"
 *                 senderUsername: "kevinburgos"
 *                 senderPhotoURL: null
 *                 text: "Hola, alguien entiende el ejercicio 4?"
 *                 timestamp: "2026-06-11T18:15:00.000Z"
 *       400:
 *         description: Parámetros de query inválidos (limit fuera de rango, etc.)
 *         content:
 *           application/json:
 *             example:
 *               error: Parámetros de petición inválidos.
 *       401:
 *         description: Token ausente o inválido.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
 *       403:
 *         description: Sin permisos para leer el chat de esta sala.
 *         content:
 *           application/json:
 *             example:
 *               error: Acceso prohibido.
 *       404:
 *         description: Sala no encontrada.
 *         content:
 *           application/json:
 *             example:
 *               error: Sala no encontrada
 *       500:
 *         description: Error en el servidor al recuperar el chat.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor al obtener el historial de mensajes
 */
router.get('/:roomId/messages', verifyToken, getRoomMessages);

module.exports = router;

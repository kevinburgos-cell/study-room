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
 *       401:
 *         description: No autorizado. Formato Bearer Token requerido o token inválido.
 *         content:
 *           application/json:
 *             example:
 *               error: No autorizado. Formato Bearer Token requerido.
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
 *       400:
 *         description: Datos de entrada inválidos.
 *         content:
 *           application/json:
 *             example:
 *               error: El nombre de la sala es obligatorio
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error al procesar la creación de la sala en la base de datos.
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
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: La sala especificada no fue encontrada.
 *         content:
 *           application/json:
 *             example:
 *               error: Sala no encontrada
 *       500:
 *         description: Error interno del servidor.
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
 *       400:
 *         description: Faltan datos necesarios para la actualización.
 *       401:
 *         description: Autenticación ausente o inválida.
 *       403:
 *         description: Acceso denegado. No eres el creador de la sala.
 *         content:
 *           application/json:
 *             example:
 *               error: No tienes permisos para editar esta sala
 *       404:
 *         description: Sala no encontrada.
 *       500:
 *         description: Error interno al guardar los cambios.
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
 *       401:
 *         description: Autenticación requerida.
 *       403:
 *         description: Prohibido. El usuario actual no es el dueño de la sala.
 *       404:
 *         description: Sala no encontrada.
 *       500:
 *         description: Error del servidor al procesar el borrado.
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
 *       401:
 *         description: Autenticación requerida.
 *       404:
 *         description: Sala no encontrada.
 *       500:
 *         description: Error al procesar la unión.
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
 *       401:
 *         description: Autenticación requerida.
 *       404:
 *         description: Sala no encontrada.
 *       500:
 *         description: Error al procesar la salida.
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
 *       401:
 *         description: Token ausente o inválido.
 *       404:
 *         description: Sala no encontrada.
 *       500:
 *         description: Error en el servidor al recuperar el chat.
 */
router.get('/:roomId/messages', verifyToken, getRoomMessages);

module.exports = router;

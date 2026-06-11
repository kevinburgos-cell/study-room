const express = require('express');
const router = express.Router();
const { auth, isMock } = require('../firebase');
const { getRoomById, getRoomMessages } = require('../controllers/rooms.controller');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado. Formato Bearer Token requerido.' });
    }

    const token = authHeader.split(' ')[1];
    if (isMock) {
      req.user = { uid: token };
      return next();
    }

    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Error in rooms auth middleware:', error);
    return res.status(401).json({ error: 'Token de autenticación expirado o inválido.' });
  }
}

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Obtener datos de una sala por ID
 *     description: Obtener datos de una sala por ID
 *     tags: [Salas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room completo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       401:
 *         description: No autorizado. Formato Bearer Token requerido o token inválido.
 *       404:
 *         description: Sala no encontrada
 */
router.get('/:roomId', authenticate, getRoomById);

/**
 * @swagger
 * /api/rooms/{roomId}/messages:
 *   get:
 *     summary: Obtener historial de mensajes de una sala
 *     description: Obtener historial de mensajes de una sala
 *     tags: [Salas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mensajes ordenados por timestamp ASC
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: No autorizado. Formato Bearer Token requerido o token inválido.
 *       404:
 *         description: Sala no encontrada
 */
router.get('/:roomId/messages', authenticate, getRoomMessages);

module.exports = router;

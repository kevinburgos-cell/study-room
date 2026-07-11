const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check del servidor
 *     description: Retorna el estado actual de salud de la API.
 *     tags: [General]
 *     responses:
 *       200:
 *         description: El servidor está corriendo y saludable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *       500:
 *         description: Error interno de salud del servidor.
 *         content:
 *           application/json:
 *             example:
 *               error: Error interno del servidor
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/profile
router.get('/profile', (req, res) => {
  res.json({ user: 'mock', email: 'test@example.com' });
});

module.exports = router;

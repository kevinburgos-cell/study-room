const { auth, isMock } = require('../firebase');

/**
 * Middleware to verify Firebase ID tokens.
 * Extracts the Bearer token from the Authorization header and verifies it.
 */
async function verifyToken(req, res, next) {
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
    console.error('Error in verifyToken middleware:', error);
    return res.status(401).json({ error: 'Token de autenticación expirado o inválido.' });
  }
}

module.exports = verifyToken;

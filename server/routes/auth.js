const express = require('express');
const router = express.Router();
const { auth, db, isMock } = require('../firebase');
const verifyToken = require('../middlewares/verifyToken');

// In-memory mock store for simulation if credentials are missing
const mockUsers = [];

/**
 * Helper to check if a username already exists in Firestore or Mock
 */
async function usernameExists(username) {
  const normalized = username.trim().toLowerCase();
  
  if (isMock) {
    return mockUsers.some(u => u.username.toLowerCase() === normalized);
  }

  const snapshot = await db.collection('users')
    .where('username_lowercase', '==', normalized)
    .get();
  
  return !snapshot.empty;
}

/**
 * Helper to check if an email already exists in Firestore or Mock
 */
async function emailExists(email) {
  const normalized = email.trim().toLowerCase();
  
  if (isMock) {
    return mockUsers.some(u => u.email.toLowerCase() === normalized);
  }

  const snapshot = await db.collection('users')
    .where('email', '==', normalized)
    .get();
  
  return !snapshot.empty;
}

/**
 * @swagger
 * /api/auth/check-username:
 *   post:
 *     description: Valida si un nombre de usuario ya existe antes de registrar o completar onboarding.
 *     summary: Verifica la disponibilidad de un nombre de usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario a comprobar
 *     responses:
 *       200:
 *         description: Nombre de usuario disponible o en uso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             examples:
 *               disponible:
 *                 value:
 *                   available: true
 *                   message: Nombre de usuario disponible.
 *               en_uso:
 *                 value:
 *                   available: false
 *                   message: Este nombre de usuario ya está en uso.
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             example:
 *               available: false
 *               message: El nombre de usuario debe tener al menos 3 caracteres.
 *       500:
 *         description: Error del servidor al validar nombre de usuario
 *         content:
 *           application/json:
 *             example:
 *               error: Error del servidor al validar nombre de usuario.
 */
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ 
        available: false, 
        message: 'El nombre de usuario debe tener al menos 3 caracteres.' 
      });
    }

    // Regex to allow only letters, numbers, underscores and dots
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        available: false,
        message: 'El nombre de usuario solo puede contener letras, números, puntos y guiones bajos.'
      });
    }

    const taken = await usernameExists(username);
    if (taken) {
      return res.json({ 
        available: false, 
        message: 'Este nombre de usuario ya está en uso.' 
      });
    }

    return res.json({ 
      available: true, 
      message: 'Nombre de usuario disponible.' 
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return res.status(500).json({ error: 'Error del servidor al validar nombre de usuario.' });
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     description: Registra un usuario manualmente con email y contraseña, guardándolo en Firestore.
 *     summary: Registra un usuario de forma manual (Email/Contraseña)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, name, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: kevinburgos
 *               name:
 *                 type: string
 *                 example: Kevin Burgos
 *               email:
 *                 type: string
 *                 format: email
 *                 example: kevin@ejemplo.com
 *               password:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente y persistido en Firestore
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               message: Registro exitoso.
 *               user:
 *                 uid: abc123uid
 *                 email: kevin@ejemplo.com
 *                 username: kevinburgos
 *                 photoURL: null
 *                 createdAt: '2026-05-29T12:08:29.000Z'
 *       400:
 *         description: Conflicto o campos inválidos (ej. username duplicado)
 *         content:
 *           application/json:
 *             examples:
 *               campos_faltantes:
 *                 value:
 *                   error: Por favor, completa todos los campos.
 *               password_corta:
 *                 value:
 *                   error: La contraseña debe tener al menos 6 caracteres.
 *               username_duplicado:
 *                 value:
 *                   error: El nombre de usuario ya está tomado.
 *                   code: USERNAME_DUPLICATED
 *               email_duplicado:
 *                 value:
 *                   error: El correo electrónico ya está registrado.
 *                   code: EMAIL_DUPLICATED
 *       500:
 *         description: Error del servidor al registrar usuario
 *         content:
 *           application/json:
 *             example:
 *               error: Error del servidor al registrar usuario.
 */
/**
 * Registra un nuevo usuario con email y contraseña.
 * Crea el usuario en Firebase Auth y guarda el perfil en Firestore.
 * @route POST /api/auth/register
 * @param {string} email - Correo del usuario
 * @param {string} password - Contraseña (mínimo 6 caracteres)
 * @param {string} username - Nombre de usuario único
 * @returns {object} uid, email, username, token
 */
router.post('/register', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ error: 'Por favor, completa todos los campos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Check unique username
    const usernameTaken = await usernameExists(username);
    if (usernameTaken) {
      return res.status(400).json({ 
        error: 'El nombre de usuario ya está tomado.', 
        code: 'USERNAME_DUPLICATED' 
      });
    }

    // Check unique email
    const emailTaken = await emailExists(email);
    if (emailTaken) {
      return res.status(400).json({ 
        error: 'El correo electrónico ya está registrado.', 
        code: 'EMAIL_DUPLICATED' 
      });
    }

    let uid;
    let finalUser;

    if (!isMock) {
      // 1. Create in Firebase Auth
      const firebaseUser = await auth.createUser({
        email: email.trim(),
        password: password,
        displayName: name.trim()
      });
      uid = firebaseUser.uid;

      // 2. Persist in Firestore
      finalUser = {
        uid,
        username: username.trim(),
        username_lowercase: username.trim().toLowerCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        bio: '¡Hola! Soy nuevo estudiante en StudyRoom.',
        studyGoal: '10',
        createdAt: new Date().toISOString()
      };

      await db.collection('users').doc(uid).set(finalUser);
    } else {
      // Simulation mode
      uid = 'mock_uid_' + Date.now();
      finalUser = {
        uid,
        username: username.trim(),
        username_lowercase: username.trim().toLowerCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        bio: '¡Hola! Soy nuevo estudiante en StudyRoom.',
        studyGoal: '10',
        createdAt: new Date().toISOString()
      };
      mockUsers.push(finalUser);
    }

    return res.status(201).json({
      message: 'Registro exitoso.',
      user: finalUser
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ 
      error: error.message || 'Error del servidor al registrar usuario.' 
    });
  }
});

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     description: Inicia sesión con Google o devuelve que falta completar el onboarding.
 *     summary: Inicia sesión o sincroniza una cuenta de Google Auth
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
 *     responses:
 *       200:
 *         description: Login exitoso, o indica que se requiere configurar nombre de usuario (onboarding)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 tempUser:
 *                   type: object
 *             examples:
 *               ok:
 *                 value:
 *                   status: OK
 *                   user:
 *                     uid: google_uid_123
 *                     email: kevin@ejemplo.com
 *                     username: kevinburgos
 *                     photoURL: null
 *                     createdAt: '2026-05-29T12:08:29.000Z'
 *               onboarding:
 *                 value:
 *                   status: ONBOARDING_REQUIRED
 *                   message: Se requiere configurar un nombre de usuario.
 *                   tempUser:
 *                     uid: google_uid_123
 *                     email: kevin@ejemplo.com
 *                     name: Kevin
 *       400:
 *         description: Falta el token de Google
 *         content:
 *           application/json:
 *             example:
 *               error: ID Token es requerido.
 *       401:
 *         description: Token de autenticación inválido
 *         content:
 *           application/json:
 *             example:
 *               error: Token de autenticación de Google inválido.
 *       500:
 *         description: Error del servidor al verificar Google login
 *         content:
 *           application/json:
 *             example:
 *               error: Error del servidor al verificar Google login.
 */
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID Token es requerido.' });
    }

    let uid;
    let email;
    let name;

    if (!isMock) {
      // Verify Firebase ID Token
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email;
      name = decodedToken.name || decodedToken.email.split('@')[0];

      // Check if user document exists in Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        // Return status telling client they must choose a username (Onboarding)
        return res.json({
          status: 'ONBOARDING_REQUIRED',
          message: 'Se requiere configurar un nombre de usuario.',
          tempUser: { uid, email, name }
        });
      }

      return res.json({
        status: 'OK',
        user: userDoc.data()
      });
    } else {
      // Simulation mode: Check if mock user with email exists
      // In mock, we can decode fake tokens as the uid
      uid = idToken.startsWith('mock_') ? idToken : 'mock_google_uid_' + idToken.length;
      email = idToken.includes('@') ? idToken : 'google_student@ejemplo.com';
      name = 'Estudiante Google';

      const existingUser = mockUsers.find(u => u.uid === uid || u.email === email);
      if (!existingUser) {
        return res.json({
          status: 'ONBOARDING_REQUIRED',
          message: 'Se requiere configurar un nombre de usuario.',
          tempUser: { uid, email, name }
        });
      }

      return res.json({
        status: 'OK',
        user: existingUser
      });
    }
  } catch (error) {
    console.error('Error verifying Google login:', error);
    return res.status(401).json({ error: 'Token de autenticación de Google inválido.' });
  }
});

/**
 * @swagger
 * /api/auth/google-onboard:
 *   post:
 *     description: Completa el registro iniciado con Google creando el documento de usuario en Firestore.
 *     summary: Completa el registro de Google asignando un nombre de usuario único
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken, username]
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
 *               username:
 *                 type: string
 *                 example: kevinburgos
 *     responses:
 *       200:
 *         description: Registro de Google completado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               status: OK
 *               user:
 *                 uid: google_uid_123
 *                 email: kevin@ejemplo.com
 *                 username: kevinburgos
 *                 photoURL: null
 *                 createdAt: '2026-05-29T12:08:29.000Z'
 *       400:
 *         description: Username duplicado o token inválido
 *         content:
 *           application/json:
 *             examples:
 *               faltan_datos:
 *                 value:
 *                   error: Token y nombre de usuario son requeridos.
 *               username_tomado:
 *                 value:
 *                   error: El nombre de usuario ya está tomado.
 *       401:
 *         description: Error al completar onboarding con Google
 *         content:
 *           application/json:
 *             example:
 *               error: Error al completar el onboarding con Google.
 *       500:
 *         description: Error interno al completar onboarding con Google
 *         content:
 *           application/json:
 *             example:
 *               error: Error al completar el onboarding con Google.
 */
router.post('/google-onboard', async (req, res) => {
  try {
    const { idToken, username } = req.body;

    if (!idToken || !username) {
      return res.status(400).json({ error: 'Token y nombre de usuario son requeridos.' });
    }

    // Validate username uniqueness
    const taken = await usernameExists(username);
    if (taken) {
      return res.status(400).json({ error: 'El nombre de usuario ya está tomado.' });
    }

    let uid;
    let email;
    let name;
    let finalUser;

    if (!isMock) {
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email;
      name = decodedToken.name || decodedToken.email.split('@')[0];

      // Double check if already registered
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        return res.json({ status: 'OK', user: userDoc.data() });
      }

      finalUser = {
        uid,
        username: username.trim(),
        username_lowercase: username.trim().toLowerCase(),
        name: name,
        email: email.toLowerCase(),
        bio: '¡Hola! Soy estudiante en StudyRoom con Google.',
        studyGoal: '15',
        createdAt: new Date().toISOString()
      };

      await db.collection('users').doc(uid).set(finalUser);
    } else {
      uid = idToken.startsWith('mock_') ? idToken : 'mock_google_uid_' + idToken.length;
      email = idToken.includes('@') ? idToken : 'google_student@ejemplo.com';
      name = 'Estudiante Google';

      finalUser = {
        uid,
        username: username.trim(),
        username_lowercase: username.trim().toLowerCase(),
        name: name,
        email: email.toLowerCase(),
        bio: '¡Hola! Soy estudiante en StudyRoom con Google.',
        studyGoal: '15',
        createdAt: new Date().toISOString()
      };
      mockUsers.push(finalUser);
    }

    return res.json({
      status: 'OK',
      user: finalUser
    });
  } catch (error) {
    console.error('Error completing Google onboarding:', error);
    return res.status(401).json({ error: 'Error al completar el onboarding con Google.' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     description: Obtiene el perfil del usuario autenticado usando Bearer token.
 *     summary: Obtiene el perfil del usuario autenticado actual
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Datos completos del perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               user:
 *                 uid: abc123uid
 *                 email: kevin@ejemplo.com
 *                 username: kevinburgos
 *                 photoURL: null
 *                 createdAt: '2026-05-29T12:08:29.000Z'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             examples:
 *               sin_token:
 *                 value:
 *                   error: No autorizado. Formato Bearer Token requerido.
 *               token_invalido:
 *                 value:
 *                   error: Token de autenticación expirado o inválido.
 *       404:
 *         description: Usuario no encontrado en la base de datos
 *         content:
 *           application/json:
 *             example:
 *               error: Usuario no encontrado en la base de datos.
 *       500:
 *         description: Error al obtener el perfil
 *         content:
 *           application/json:
 *             example:
 *               error: Error del servidor al obtener perfil.
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    if (!isMock) {

      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
      }

      return res.json({ user: userDoc.data() });
    } else {
      // Mock validation
      uid = token;
      const user = mockUsers.find(u => u.uid === uid || u.username === uid);
      if (!user) {
        // Return a mock default if using the standard dev experience
        const defaultMock = {
          uid: 'mock_uid_kevin',
          username: 'KevinBurgos',
          name: 'Kevin Burgos',
          email: 'kevin@ejemplo.com',
          bio: 'Estudiante de Ingeniería de Software. Apasionado por la web y la IA.',
          studyGoal: '25',
          createdAt: new Date().toISOString()
        };
        mockUsers.push(defaultMock);
        return res.json({ user: defaultMock });
      }
      return res.json({ user });
    }
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return res.status(401).json({ error: 'Token de autenticación expirado o inválido.' });
  }
});

/**
 * @swagger
 * /api/auth/profile/update:
 *   post:
 *     description: Actualiza campos del perfil del usuario autenticado.
 *     summary: Actualiza el perfil del usuario en Firestore
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kevin Burgos
 *               bio:
 *                 type: string
 *                 example: Estudiante de Ingeniería de Software.
 *               studyGoal:
 *                 type: string
 *                 example: '15'
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               user:
 *                 uid: abc123uid
 *                 email: kevin@ejemplo.com
 *                 username: kevinburgos
 *                 photoURL: null
 *                 createdAt: '2026-05-29T12:08:29.000Z'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             examples:
 *               sin_token:
 *                 value:
 *                   error: No autorizado.
 *               token_invalido:
 *                 value:
 *                   error: Error del servidor al actualizar perfil.
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             example:
 *               error: Usuario no encontrado.
 *       500:
 *         description: Error del servidor al actualizar perfil
 *         content:
 *           application/json:
 *             example:
 *               error: Error del servidor al actualizar perfil.
 */
router.post('/profile/update', verifyToken, async (req, res) => {
  try {
    const { name, bio, studyGoal } = req.body;
    const uid = req.user.uid;

    if (!isMock) {

      const updateData = {};
      if (name) updateData.name = name.trim();
      if (bio) updateData.bio = bio.trim();
      if (studyGoal) updateData.studyGoal = studyGoal.toString();

      await db.collection('users').doc(uid).update(updateData);
      
      const userDoc = await db.collection('users').doc(uid).get();
      return res.json({ success: true, user: userDoc.data() });
    } else {
      uid = token;
      const userIndex = mockUsers.findIndex(u => u.uid === uid || u.username === uid);
      if (userIndex !== -1) {
        if (name) mockUsers[userIndex].name = name.trim();
        if (bio) mockUsers[userIndex].bio = bio.trim();
        if (studyGoal) mockUsers[userIndex].studyGoal = studyGoal.toString();
        return res.json({ success: true, user: mockUsers[userIndex] });
      }
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Error del servidor al actualizar perfil.' });
  }
});

module.exports = router;

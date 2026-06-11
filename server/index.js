const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Initialize Firebase SDK side-effect
require('./firebase');

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const ALLOWED_ORIGINS = (process.env.CLIENT_URLS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudyRoom API - Sprints 0, 1, 2 y 3',
      version: '1.0.0',
      description: `Documentación oficial interactiva de la API de StudyRoom.

## SOCKET EVENTS — server-realtime:
* **Evento**: \`send-message\`
  * **Dirección**: cliente → servidor
  * **Payload**: \`{ roomId: string, text: string, token: string }\`
  * **Respuesta**: emite \`new-message\` a todos en la sala.

* **Evento**: \`new-message\`
  * **Dirección**: servidor → cliente
  * **Payload**: \`{ id: string, roomId: string, senderUid: string, senderUsername: string, senderPhotoURL: string|null, text: string, timestamp: string }\`

* **Evento**: \`delete-room\`
  * **Dirección**: cliente → servidor (Host)
  * **Payload**: \`{ roomId: string }\`
  * **Respuesta**: emite \`room-deleted\` a todos en la sala.

* **Evento**: \`room-deleted\`
  * **Dirección**: servidor → cliente
  * **Payload**: \`{ roomId: string }\`
`,
    },
    servers: [
      {
        url: PUBLIC_URL,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          description: 'Modelo de usuario almacenado en Firestore.',
          required: ['uid', 'email', 'username', 'photoURL', 'createdAt'],
          properties: {
            uid: { type: 'string', example: 'abc123uid' },
            email: { type: 'string', format: 'email', example: 'kevin@ejemplo.com' },
            username: { type: 'string', example: 'kevinburgos' },
            photoURL: { type: 'string', nullable: true, example: 'https://lh3.googleusercontent.com/a/ACg...' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-05-29T12:08:29.000Z' },
          },
        },
        RoomMember: {
          type: 'object',
          required: ['uid', 'username', 'photoURL'],
          properties: {
            uid: { type: 'string', example: 'abc123uid' },
            username: { type: 'string', example: 'kevinburgos' },
            photoURL: { type: 'string', nullable: true, example: 'https://lh3.googleusercontent.com/a/ACg...' },
          },
        },
        Room: {
          type: 'object',
          description: 'Sala de estudio almacenada en Firestore.',
          required: ['id', 'name', 'hostUid', 'hostUsername', 'members', 'isPrivate', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string', example: 'M3JupqIXqiIqVLgw2htU' },
            name: { type: 'string', example: 'Repaso de cálculo' },
            description: { type: 'string', example: 'Sala para resolver ejercicios de integrales' },
            hostUid: { type: 'string', example: 'abc123uid' },
            hostUsername: { type: 'string', example: 'kevinburgos' },
            members: {
              type: 'array',
              items: { $ref: '#/components/schemas/RoomMember' },
            },
            isPrivate: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2026-06-11T18:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-06-11T18:10:00.000Z' },
          },
        },
        Message: {
          type: 'object',
          description: 'Mensaje de chat persistido en Firestore.',
          required: ['id', 'roomId', 'senderUid', 'senderUsername', 'senderPhotoURL', 'text', 'timestamp'],
          properties: {
            id: { type: 'string', example: '7e7ef57c-1d52-4df3-99be-8b7c7c49a2e7' },
            roomId: { type: 'string', example: 'M3JupqIXqiIqVLgw2htU' },
            senderUid: { type: 'string', example: 'abc123uid' },
            senderUsername: { type: 'string', example: 'kevinburgos' },
            senderPhotoURL: { type: 'string', nullable: true, example: 'https://lh3.googleusercontent.com/a/ACg...' },
            text: { type: 'string', example: 'Hola, ¿alguien entiende el ejercicio 4?' },
            timestamp: { type: 'string', format: 'date-time', example: '2026-06-11T18:15:00.000Z' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

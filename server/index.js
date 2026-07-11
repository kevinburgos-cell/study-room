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

if (!process.env.FIREBASE_PROJECT_ID && process.env.NODE_ENV !== 'test') {
  console.error('FIREBASE_PROJECT_ID is required');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const ALLOWED_ORIGINS = (process.env.CLIENT_URLS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

const swaggerCustomCss = `
  :root {
    --sr-bg: #0b1220;
    --sr-surface: #111827;
    --sr-surface-2: #162033;
    --sr-surface-3: #1e2a44;
    --sr-border: rgba(148, 163, 184, 0.16);
    --sr-text: #e5eefc;
    --sr-muted: #9fb0cf;
    --sr-accent: #38bdf8;
    --sr-accent-2: #22c55e;
    --sr-warning: #f59e0b;
    --sr-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
  }

  html {
    background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 28%),
      radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 25%),
      linear-gradient(180deg, #09111d 0%, #0b1220 44%, #050814 100%);
  }

  body {
    background: transparent;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .swagger-ui {
    color: var(--sr-text);
  }

  .swagger-ui .topbar {
    background: linear-gradient(90deg, rgba(15, 23, 42, 0.96), rgba(17, 24, 39, 0.92));
    border-bottom: 1px solid var(--sr-border);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  }

  .swagger-ui .topbar-wrapper img {
    content: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='36' viewBox='0 0 160 36'><rect width='160' height='36' rx='12' fill='none'/><circle cx='18' cy='18' r='14' fill='%2338bdf8'/><path d='M12 18c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6Zm3.2-1.6h5.6v1.4h-5.6v-1.4Zm0 3.1h8.4v1.4h-8.4v-1.4Z' fill='white'/><text x='40' y='16' fill='white' font-family='Inter, Arial, sans-serif' font-size='14' font-weight='700'>StudyRoom API</text><text x='40' y='27' fill='%239fb0cf' font-family='Inter, Arial, sans-serif' font-size='8' font-weight='500'>Swagger documentation</text></svg>");
    width: 160px;
    height: 36px;
  }

  .swagger-ui .topbar .download-url-wrapper {
    display: none;
  }

  .swagger-ui .info {
    margin: 28px 0 20px;
    padding: 28px 28px 22px;
    background:
      linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(30, 41, 59, 0.92)),
      radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 34%);
    border: 1px solid var(--sr-border);
    border-radius: 22px;
    box-shadow: var(--sr-shadow);
    backdrop-filter: blur(12px);
  }

  .swagger-ui .info .title {
    color: #f8fbff;
    font-size: 2.1rem;
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  .swagger-ui .info p,
  .swagger-ui .info li,
  .swagger-ui .info .renderedMarkdown {
    color: var(--sr-muted);
    font-size: 15px;
    line-height: 1.7;
  }

  .swagger-ui .scheme-container {
    margin: 20px 0 28px;
    padding: 18px 20px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid var(--sr-border);
    border-radius: 18px;
    box-shadow: 0 12px 34px rgba(2, 6, 23, 0.26);
  }

  .swagger-ui .opblock-tag {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid var(--sr-border);
    border-radius: 16px;
    box-shadow: 0 8px 22px rgba(2, 6, 23, 0.18);
    margin-bottom: 10px;
  }

  .swagger-ui .opblock {
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    overflow: hidden;
    box-shadow: 0 8px 22px rgba(2, 6, 23, 0.18);
  }

  .swagger-ui .opblock.opblock-get {
    background: linear-gradient(90deg, rgba(30, 64, 175, 0.25), rgba(17, 24, 39, 0.96));
  }

  .swagger-ui .opblock.opblock-post {
    background: linear-gradient(90deg, rgba(21, 128, 61, 0.23), rgba(17, 24, 39, 0.96));
  }

  .swagger-ui .opblock.opblock-put {
    background: linear-gradient(90deg, rgba(180, 83, 9, 0.23), rgba(17, 24, 39, 0.96));
  }

  .swagger-ui .opblock.opblock-delete {
    background: linear-gradient(90deg, rgba(153, 27, 27, 0.23), rgba(17, 24, 39, 0.96));
  }

  .swagger-ui .opblock-summary {
    padding: 14px 18px;
  }

  .swagger-ui .opblock-summary-method {
    border-radius: 999px;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
  }

  .swagger-ui .btn.authorize {
    border-radius: 999px;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    border-color: rgba(56, 189, 248, 0.45);
    color: #eff6ff;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .swagger-ui .btn.authorize svg {
    fill: #38bdf8;
  }

  .swagger-ui .btn.authorize:hover {
    background: linear-gradient(135deg, #111827, #0f172a);
    border-color: rgba(34, 197, 94, 0.45);
  }

  .swagger-ui .btn {
    border-radius: 12px;
  }

  .swagger-ui section.models {
    margin-top: 28px;
    border-radius: 18px;
    border: 1px solid var(--sr-border);
    background: rgba(15, 23, 42, 0.86);
    box-shadow: var(--sr-shadow);
  }

  .swagger-ui .models h4,
  .swagger-ui .models h5 {
    color: var(--sr-text);
  }
`;

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudyRoom API - Sprints 0, 1, 2 y 3',
      version: '1.0.0',
      description: `# Welcome to StudyRoom

API docs for the StudyRoom backend and realtime socket events.

## Quick view
- REST endpoints for auth, rooms, and profile health checks.
- JWT Bearer auth for protected resources.
- Realtime chat and room events documented below.

## Socket events

### send-message
- Direction: client -> server
- Payload: \`{ roomId: string, text: string, token: string }\`
- Result: broadcasts \`new-message\` to everyone in the room

### new-message
- Direction: server -> client
- Payload: \`{ id: string, roomId: string, senderUid: string, senderUsername: string, senderPhotoURL: string | null, text: string, timestamp: string }\`

### delete-room
- Direction: client -> server
- Payload: \`{ roomId: string }\`
- Result: broadcasts \`room-deleted\` to the room

### room-deleted
- Direction: server -> client
- Payload: \`{ roomId: string }\`
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
            name: { type: 'string', example: 'Repaso de calculo' },
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
            text: { type: 'string', example: 'Hola, alguien entiende el ejercicio 4?' },
            timestamp: { type: 'string', format: 'date-time', example: '2026-06-11T18:15:00.000Z' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customSiteTitle: 'StudyRoom API Docs',
  customfavIcon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="%230ea5e9"/><path d="M18 28c0-7.7 6.3-14 14-14s14 6.3 14 14-6.3 14-14 14-14-6.3-14-14Zm8 0h12v4H26v-4Zm0 7h18v4H26v-4Z" fill="white"/></svg>',
  swaggerOptions: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    persistAuthorization: true,
    syntaxHighlight: {
      theme: 'obsidian',
    },
  },
  customCss: swaggerCustomCss,
}));

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  if (process.env.NODE_ENV === 'development') {
    return res.status(status).json({
      error: message,
      details: err.stack || err.message
    });
  }
  
  return res.status(status).json({
    error: 'Error interno del servidor'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

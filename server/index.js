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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || `http://localhost:${PORT}`;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudyRoom API - Sprints 0 y 1',
      version: '1.0.0',
      description: 'Documentación oficial interactiva de la API de StudyRoom. Cumple el criterio C4.',
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
          properties: {
            uid: { type: 'string', example: 'abc123uid' },
            username: { type: 'string', example: 'kevinburgos' },
            username_lowercase: { type: 'string', example: 'kevinburgos' },
            name: { type: 'string', example: 'Kevin Burgos' },
            email: { type: 'string', format: 'email', example: 'kevin@ejemplo.com' },
            bio: { type: 'string', example: '¡Hola! Soy nuevo estudiante en StudyRoom.' },
            studyGoal: { type: 'string', example: '10' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-05-29T12:08:29.000Z' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'name', 'email', 'password'],
          properties: {
            username: { type: 'string', example: 'kevinburgos' },
            name: { type: 'string', example: 'Kevin Burgos' },
            email: { type: 'string', format: 'email', example: 'kevin@ejemplo.com' },
            password: { type: 'string', example: '123456' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'kevin@ejemplo.com' },
            password: { type: 'string', example: '123456' },
          },
        },
        GoogleLoginRequest: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: {
              type: 'string',
              description: 'Firebase ID Token obtenido del cliente',
              example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
            },
          },
        },
        GoogleOnboardRequest: {
          type: 'object',
          required: ['idToken', 'username'],
          properties: {
            idToken: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...' },
            username: { type: 'string', example: 'kevinburgos' },
          },
        },
        ProfileUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Kevin Burgos' },
            bio: { type: 'string', example: 'Estudiante de Ingeniería de Software.' },
            studyGoal: { type: 'string', example: '15' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Registro exitoso.' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        GoogleLoginResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'OK' },
            user: { $ref: '#/components/schemas/User' },
            tempUser: {
              type: 'object',
              properties: {
                uid: { type: 'string', example: 'google_uid_123' },
                email: { type: 'string', format: 'email', example: 'kevin@ejemplo.com' },
                name: { type: 'string', example: 'Kevin' },
              },
            },
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

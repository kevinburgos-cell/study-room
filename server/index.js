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

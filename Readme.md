# 📚 StudyRoom — Salón de Estudio Colaborativo en Tiempo Real

Aplicación web colaborativa que permite a estudiantes estudiar
juntos en línea mediante chat, videollamadas y compartición
de pantalla en tiempo real.

**Proyecto Integrador I — Universidad del Valle — 2026-1**

---

## 🚀 Links en Producción

| Servicio               | URL                                               |
| ---------------------- | ------------------------------------------------- |
| 🌐 Frontend            | https://study-room-phi-ashen.vercel.app           |
| ⚙️ Backend API         | https://study-room-api-adj9.onrender.com          |
| 📄 Swagger / API Docs  | https://study-room-api-adj9.onrender.com/api-docs |
| ⚡ Backend Tiempo Real |  https://study-room-api-adj9.onrender.com/api-docs

---

## 👥 Equipo

| Nombre                          | Código    | Rol principal |
| ------------------------------- | --------- | ------------- |
| Kevin Esteban Burgos Cobo       | 202453710 | FE Lead       |
| Briwhell Jimenez Acosta         | 2358347   | BE Lead       |
| Lesli Esmith Martinez Piamba    | 2126928   | Coordinación  |


---

## 🛠️ Stack Tecnológico

| Capa                | Tecnología                                  |
| ------------------- | ------------------------------------------- |
| Frontend            | React 18 + TypeScript + Vite + Tailwind CSS |
| Autenticación       | Firebase Authentication                     |
| Base de datos       | Firestore (NoSQL)                           |
| Backend principal   | Node.js + Express + TypeScript              |
| Backend tiempo real | Node.js + Socket.io + TypeScript            |
| WebRTC              | Conexiones P2P con STUN de Google           |
| Despliegue frontend | Vercel                                      |
| Despliegue backend  | Render                                      |
| Documentación API   | Swagger (OpenAPI 3.0)                       |

---

## 📁 Estructura del Repositorio

study-room/

├── study-room/ # Frontend React + Vite

│ ├── src/

│ │ ├── pages/ # LoginPage, RegisterPage, DashboardPage, RoomPage

│ │ ├── components/ # VideoGrid, ChatPanel, MembersSidebar...

│ │ ├── hooks/ # useWebRTC, useChat, useRoomUsers...

│ │ ├── contexts/ # AuthContext

│ │ └── firebase/ # config.ts, auth.ts

│ └── vercel.json

├── server/ # Backend principal Express

│ └── src/

│ ├── routes/

│ ├── controllers/

│ └── middlewares/

└── server-realtime/ # Backend tiempo real Socket.io

└── src/

└── socket/ # roomHandler, chatHandler, webrtcHandler

---

## ⚙️ Correr el proyecto localmente

### Requisitos previos

- Node.js 18+
- Cuenta de Firebase con proyecto configurado

### 1. Clonar el repo

```bash
git clone https://github.com/kevinburgos-cell/study-room.git
cd study-room
```

### 2. Frontend

```bash
cd study-room
npm install
```

Crear archivo `.env` con:
VITE_FIREBASE_API_KEY=AIzaSyBCqpZNWCjbItlSMuvFzMmkhNIngr951Js
VITE_FIREBASE_AUTH_DOMAIN=study-roo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=study-roo
VITE_FIREBASE_STORAGE_BUCKET=study-roo.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=257886330929
VITE_FIREBASE_APP_ID=1:257886330929:web:fcd8585321e7d29445b510

```bash
npm run dev
# Corre en http://localhost:5173
```

### 3. Backend principal

```bash
cd server
npm install
```

Crear archivo `.env` con:
PORT=5000

  "project_id": "study-roo",
   "client_email": "firebase-adminsdk-fbsvc@study-roo.iam.gserviceaccount.com",
    "private_key_id": "0e88ee58a742e6a9e402ad64794a3194c95bb688",


CLIENT_URL=http://localhost:5173

```bash
npm run dev
# Corre en http://localhost:5000
# Swagger en http://localhost:5000/api-docs
```

### 4. Backend tiempo real

```bash
cd server-realtime
npm install
```

Crear archivo `.env` con:
PORT=4000

  "project_id": "study-roo",
   "client_email": "firebase-adminsdk-fbsvc@study-roo.iam.gserviceaccount.com",
    "private_key_id": "0e88ee58a742e6a9e402ad64794a3194c95bb688",

CLIENT_URL=http://localhost:5173

```bash
npm run dev
# Corre en http://localhost:4000
```

---

## ✨ Funcionalidades

- ✅ Registro e inicio de sesión (email/contraseña y Google)
- ✅ Gestión de perfil de usuario
- ✅ Crear, editar y eliminar salas de estudio
- ✅ Unirse a salas por ID
- ✅ Chat en tiempo real con historial persistente
- ✅ Videollamadas P2P con WebRTC
- ✅ Control de micrófono y cámara sincronizado
- ✅ Compartición de pantalla en tiempo real
- ✅ Accesibilidad WCAG 2.2 (ceguera total)

---

## 🔌 Eventos de Socket.io

### Sala

| Evento      | Dirección | Descripción               |
| ----------- | --------- | ------------------------- |
| join-room   | C→S       | Unirse a una sala         |
| leave-room  | C→S       | Salir de una sala         |
| room-users  | S→C       | Lista inicial de usuarios |
| user-joined | S→C       | Nuevo usuario en sala     |
| user-left   | S→C       | Usuario salió de sala     |

### Chat

| Evento       | Dirección | Descripción      |
| ------------ | --------- | ---------------- |
| send-message | C→S       | Enviar mensaje   |
| new-message  | S→C       | Mensaje recibido |

### WebRTC

| Evento               | Dirección | Descripción                   |
| -------------------- | --------- | ----------------------------- |
| webrtc-offer         | C→S→C     | Oferta SDP                    |
| webrtc-answer        | C→S→C     | Respuesta SDP                 |
| webrtc-ice-candidate | C→S→C     | Candidato ICE                 |
| media-state-changed  | C→S       | Cambio de mic/cámara/pantalla |
| peer-media-state     | S→C       | Notificar estado a otros      |

---

## ♿ Accesibilidad

La aplicación cumple con WCAG 2.2 Principio 1 (Perceptible)
enfocado en ceguera total:

- Navegación completa por teclado (TAB)
- aria-label en todos los controles interactivos
- aria-live para eventos en tiempo real de la sala
- Score Lighthouse accesibilidad ≥ 90
- Validado con axe DevTools y NVDA

---

## 📋 Docentes

- Paola Johanna Rodríguez Carrillo
- Fabián Stiven Valencia Córdoba

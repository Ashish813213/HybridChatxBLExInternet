# HybridChat Backend

## Implementation Roadmap

### 1. Project Setup
- [x] Initialize Node.js + TypeScript project
- [x] Install Express, Mongoose, Socket.io, dotenv
- [x] Configure tsconfig.json
- [x] Create .env with MongoDB URI, JWT secrets

### 2. Database & Models
- [x] Set up MongoDB connection (database.ts)
- [x] Create User model with email/username indexes
- [x] Create Message model with encrypt fields
- [x] Create Group, Channel, BluetoothSession, Token models

### 3. Authentication
- [x] Implement JWT auth middleware
- [x] Create bcrypt password hashing (12 rounds)
- [x] Build /auth/register route
- [x] Build /auth/login route
- [x] Build /auth/refresh route
- [x] Build /auth/logout route

### 4. Messaging
- [x] Create /messages/send route (internet mode)
- [x] Create /messages/sync route
- [x] Create /messages/bluetooth (metadata only)
- [x] Create /messages/nearby route
- [x] Integrate Socket.io for real-time

### 5. Groups & Channels
- [x] Build /groups CRUD routes
- [x] Build /channels CRUD routes
- [x] Implement groupPublicKey for E2EE

### 6. Security & Infrastructure
- [x] Add rate limiting (100 req/min/IP)
- [x] Implement error handling middleware
- [ ] Add libsignal for E2EE key exchange
- [ ] Set up Docker, CI/CD (GitHub Actions)

---

## 📂 File Structure

```text
/backend
├── src/
│   ├── app.ts                 # Express Setup, Middlewares, Routes binding
│   ├── server.ts              # HTTP Server entry point, Socket.io attachment
│   ├── config/
│   │   └── database.ts        # MongoDB Connection Logic
│   ├── controllers/           # Route handlers
│   │   ├── auth.controller.ts
│   │   ├── message.controller.ts
│   │   ├── group.controller.ts
│   │   └── channel.controller.ts
│   ├── middlewares/           # Custom Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rate-limiter.ts
│   ├── models/                # Mongoose Schema Definitions
│   │   ├── User.ts
│   │   ├── Message.ts
│   │   ├── Group.ts
│   │   ├── Channel.ts
│   │   ├── BluetoothSession.ts
│   │   └── Token.ts
│   ├── routes/                # API Route Definitions
│   │   ├── auth.routes.ts
│   │   ├── message.routes.ts
│   │   ├── group.routes.ts
│   │   └── channel.routes.ts
│   ├── sockets/               # WebSocket Events
│   │   └── index.ts
│   └── utils/                 # Utility functions (JWT, bcrypt)
├── .env
├── tsconfig.json
└── package.json
```

---

## 🛣️ API Routes

### A. Authentication (`/auth`)
- `POST /auth/register` - Register new user (Auth: No)
- `POST /auth/login` - Login user (Auth: No)
- `POST /auth/refresh` - Refresh JWT token (Auth: Yes)
- `POST /auth/logout` - Logout user (Auth: Yes)

### B. Messaging (`/messages`)
- `POST /messages/send` - Send internet message (Auth: Yes)
- `GET /messages/sync` - Sync messages (Auth: Yes)
- `POST /messages/bluetooth` - Log Bluetooth metadata (Auth: Yes)
- `GET /messages/nearby` - List Bluetooth-available users (Auth: Yes)

### C. Groups & Channels
- `POST /groups` - Create group (Auth: Yes)
- `GET /groups/:id/messages` - Get group messages (Auth: Yes)
- `POST /channels` - Create broadcast channel (Auth: Yes)
- `POST /channels/:id/subscribe` - Subscribe to channel (Auth: Yes)
- `GET /channels/:id/messages` - Get channel messages (Auth: Yes)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hybridchat
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d
```
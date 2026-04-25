# HybridChat Backend

HybridChat is a secure, hybrid messaging app backend that supports personal DMs, group chats, and broadcast channels. The mobile frontends prioritize offline Bluetooth messaging locally, while this backend manages data routing across the internet, encrypted message storage, user availability states, and group/channel configurations.

## Architecture & Tech Stack

- **Runtime Environment:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (using Mongoose, MongoDB Atlas for cloud)
- **Real-time Engine:** Socket.io
- **Security:** End-to-End Encryption (E2EE) with Signal Protocol / libsignal for key management, JSON Web Tokens (JWT) with refresh tokens for authentication, and bcrypt (12 rounds) for password hashing.
- **Hosting / DevOps (Planned):** AWS EC2 or Google Cloud Run, GitHub Actions for CI/CD, Sentry/Prometheus for Monitoring, Docker.

---

## 📂 File Structure

The project follows a feature-based MVC architecture:

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
│   │   ├── auth.middleware.ts # JWT Validation
│   │   ├── error.middleware.ts# Global Error Handling
│   │   └── rate-limiter.ts    # Rate Limiting (100 req/min/IP)
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
│   ├── sockets/               # WebSocket Events and Management
│   │   └── index.ts
│   └── utils/                 # Utility functions (Encryption helpers)
├── .env                       # Environment Variables
├── tsconfig.json              # TypeScript Configuration
└── package.json               # Dependencies and Scripts
```

---

## 🗄️ Database Schemas & Indexes (MongoDB)

### 1. Users
- **Fields:** `_id`: ObjectId, `username`: String, `email`: String, `passwordHash`: String, `publicKey`: String, `lastSeen`: Date, `bluetoothMac`: String, `isOnline`: Boolean, `deviceToken`: String (For push)
- **Indexes:** `email: 1` (Unique), `username: 1` (Unique)
- **Notes:** publicKey used for E2E encryption key exchange.

### 2. Messages
- **Fields:** `_id`: ObjectId, `senderId`: ObjectId, `receiverId`: ObjectId, `groupId`: ObjectId, `channelId`: ObjectId, `content`: String, `timestamp`: Date, `mode`: String (`"bluetooth"`/`"internet"`), `isEncrypted`: Boolean, `metadata`: Object
- **Indexes:** `senderId: 1`, `receiverId: 1`, `timestamp: 1`
- **Notes:** content is encrypted; metadata for Bluetooth messages only.

### 3. Groups
- **Fields:** `_id`: ObjectId, `name`: String, `adminId`: ObjectId, `members`: [ObjectId], `createdAt`: Date, `groupPublicKey`: String
- **Indexes:** `name: 1`, `adminId: 1`
- **Notes:** groupPublicKey for group message encryption.

### 4. Channels (Broadcasts)
- **Fields:** `_id`: ObjectId, `name`: String, `adminId`: ObjectId, `subscribers`: [ObjectId], `createdAt`: Date, `isPublic`: Boolean
- **Indexes:** `name: 1`
- **Notes:** Broadcast channels can be public or private.

### 5. BluetoothSessions
- **Fields:** `_id`: ObjectId, `userId1`: ObjectId, `userId2`: ObjectId, `lastConnected`: Date, `sessionKey`: String, `metadata`: Object
- **Indexes:** `userId1: 1`, `userId2: 1`
- **Notes:** sessionKey for Bluetooth message encryption.

### 6. Tokens
- **Fields:** `_id`: ObjectId, `userId`: ObjectId, `token`: String, `expiresAt`: Date, `createdAt`: Date
- **Indexes:** `userId: 1`, `token: 1`
- **Notes:** JWT refresh tokens.

---

## 🛣️ API Routes

### A. Authentication routes (`/auth`)
- `POST /auth/register` : Register a new user. (Auth: No)
  - **Body:** `{username, email, password, publicKey, bluetoothMac}`
  - **Response:** `{user, token}`
- `POST /auth/login` : Login user. (Auth: No)
  - **Body:** `{email, password}`
  - **Response:** `{user, token}`
- `POST /auth/refresh` : Refresh JWT short-lived token. (Auth: Yes)
  - **Body:** `{token}`
  - **Response:** `{token}`
- `POST /auth/logout` : Invalidate JWT. (Auth: Yes)
  - **Response:** `{success: true}`

### B. Messaging routes (`/messages`)
- `POST /messages/send` : Send an internet message. (Auth: Yes)
  - **Body:** `{receiverId, groupId, channelId, content, mode}`
  - **Response:** `{message, success: true}`
- `GET /messages/sync` : Sync messages for a user. (Auth: Yes)
  - **Response:** `{messages: [Message]}`
- `POST /messages/bluetooth`: Log Bluetooth message metadata. (Auth: Yes)
  - **Body:** `{receiverId, messageId, timestamp, metadata}`
  - **Response:** `{success: true}`
- `GET /messages/nearby` : List Bluetooth-available users. (Auth: Yes)
  - **Response:** `{users: [User]}`

### C. Groups & Channels routes
- `POST /groups` : Create a group. (Auth: Yes)
  - **Body:** `{name, members: [userId]}`
  - **Response:** `{group}`
- `GET /groups/:id/messages` : Retrieve group messages. (Auth: Yes)
  - **Response:** `{messages: [Message]}`
- `POST /channels` : Create a broadcast channel. (Auth: Yes)
  - **Body:** `{name, isPublic}`
  - **Response:** `{channel}`
- `POST /channels/:id/subscribe`: Subscribe to an existing channel. (Auth: Yes)
  - **Response:** `{channel}`
- `GET /channels/:id/messages` : View channel's message history. (Auth: Yes)
  - **Response:** `{messages: [Message]}`

---

## 🛡️ Middleware Architecture

1. **Authentication (JWT) Middleware** (`auth.middleware.ts`):
   - Extracts and verifies JWT from headers.
   - Rejects unauthorized requests with 401.

2. **Rate Limiting Middleware** (`rate-limiter.ts`):
   - Applies strict rate limiting as per PRD: **100 requests/minute/IP**.

3. **Validation Middlewares**:
   - Schema validation to ensure payloads identically match the expected definitions for routes (like validating `bluetoothMac`, `publicKey`, etc).

4. **Error Handling Middleware** (`error.middleware.ts`):
   - Catches server errors preventing node process crashes.

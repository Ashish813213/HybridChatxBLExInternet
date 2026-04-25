# HybridChat Web Client

A Next.js web client for HybridChat messaging application. Acts as a synchronized internet client (like WhatsApp Web) - does NOT support Bluetooth. For native Bluetooth experience, use the Android app.

---

## Features

| Feature | Status | Description |
|---------|-------|-------------|
| Personal DMs | ✓ | 1:1 encrypted chat between users |
| Group Chats | ✓ | Multi-user conversations |
| Broadcast Channels | ✓ | One-to-many messaging |
| Internet Messaging | ✓ | Real-time via Socket.io |
| User Authentication | ✓ | JWT with refresh tokens |
| Message Sync | ✓ | Sync on reconnection |

---

## Tech Stack

- **Framework:** Next.js 14 (JSX)
- **Styling:** Tailwind CSS
- **State:** React Context API
- **Real-time:** Socket.io-client
- **HTTP:** Axios with interceptors

---

## File Structure

```text
/web
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.js
│   │   │   ├── GlassCard.js
│   │   │   └── Input.js
│   │   ├── chat/
│   │   │   ├── ChatInput.js
│   │   │   └── MessageBubble.js
│   │   └── navigation/
│   │       ├── ChatList.js
│   │       └── Sidebar.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── hooks/
│   │   └── useSocket.js
│   ├── pages/
│   │   ├── _app.js
│   │   ├── index.js
│   │   ├── login.js
│   │   ├── register.js
│   │   └── dashboard.js
│   ├── services/
│   │   └── api.js
│   └── styles/
│       └── globals.css
├── next.config.js
├── tailwind.config.js
├── package.json
└── postcss.config.js
```

---

## API Routes (Connected to Backend)

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh JWT token (auto via interceptor)
- `POST /auth/logout` - Logout user

### Messaging (`/messages`)
- `POST /messages/send` - Send message
- `GET /messages/sync` - Sync all messages
- `GET /messages/nearby` - List online users

### Groups (`/groups`)
- `GET /groups` - Get user's groups
- `POST /groups` - Create group
- `GET /groups/:id/messages` - Get group messages

### Channels (`/channels`)
- `GET /channels` - Get all channels
- `POST /channels` - Create channel
- `POST /channels/:id/subscribe` - Subscribe to channel
- `GET /channels/:id/messages` - Get channel messages

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

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Implementation Status

### 1. Project Setup
- [x] Next.js + Tailwind CSS configured

### 2. Authentication
- [x] Login/Register pages
- [x] AuthContext with token management
- [x] Axios interceptor for token refresh

### 3. Core UI
- [x] Dashboard with sidebar navigation
- [x] Chat list with conversations
- [x] Real-time message bubbles
- [x] Socket.io connection

### 4. Features
- [x] Send/receive messages
- [x] Create/view groups
- [x] Create/subscribe channels
- [x] Message synchronization
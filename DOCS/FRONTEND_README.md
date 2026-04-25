# HybridChat Web Client (WhatsApp Web Style)

This folder contains the **Web Frontend** for HybridChat.
*Note: Due to browser limitations with hardware, the web client acts purely as a synchronized internet client (similar to WhatsApp Web). It does NOT support direct Bluetooth device scanning. For the native Bluetooth experience, please see the Android application.*

---

## 🎯 Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Personal DMs | P0 | 1:1 encrypted chat between users |
| Group Chats | P0 | Multi-user encrypted conversations |
| Broadcast Channels | P1 | One-to-many messaging |
| Internet Messaging | P0 | Messages via server |
| User Availability | P0 | UI indicates user is online |
| Secure Authentication | P0 | JWT with refresh tokens |
| Message Sync | P0 | Sync messages on reconnection |

---

## 🛠 Tech Stack

- **Framework:** React.js / Next.js (JSX)
- **Styling:** Tailwind CSS
- **State Management:** React Context API / Zustand
- **Animations:** Framer Motion
- **Real-time Engine:** `socket.io-client`
- **HTTP Client:** Axios

---

## 📂 File Structure

```text
/web
├── src/
│   ├── components/
│   │   ├── common/           # Button, Input, GlassCard
│   │   ├── chat/             # MessageBubble, ChatInput
│   │   └── navigation/        # Sidebar, ChatList
│   ├── context/              # AuthContext
│   ├── hooks/
│   │   └── useSocket.js
│   ├── pages/
│   │   ├── index.js         # Dashboard
│   │   ├── login.js
│   │   └── register.js
│   ├── services/
│   │   └── api.js         # Axios instance
│   └── styles/
│       └── globals.css      # Tailwind
├── package.json
└── next.config.js
```

---

## 🛣️ API Routes (Backend Integration)

### A. Authentication (`/auth`)
- `POST /auth/register` - Register new user (Auth: No)
- `POST /auth/login` - Login user (Auth: No)
- `POST /auth/refresh` - Refresh JWT token (Auth: Yes)
- `POST /auth/logout` - Logout user (Auth: Yes)

### B. Messaging (`/messages`)
- `POST /messages/send` - Send message (Auth: Yes)
- `GET /messages/sync` - Sync messages (Auth: Yes)
- `GET /messages/nearby` - List online users (Auth: Yes)

### C. Groups & Channels
- `POST /groups` - Create group (Auth: Yes)
- `GET /groups/:id/messages` - Get group messages (Auth: Yes)
- `POST /channels` - Create channel (Auth: Yes)
- `POST /channels/:id/subscribe` - Subscribe (Auth: Yes)

---

## 🎨 UI/UX Design System

| Element | Color |
|---------|-------|
| Success/Online | `#B5E18B` & `#F0FFC2` |
| Accents/Alerts | `#FF9A86` & `#FFB399` |
| Backgrounds/Cards | `#FFD6A6`, `#FFF0BE`, `#EAE6BC` |
| Text/Headers | `#28396C` |

---

## 🚀 Implementation Roadmap

### 1. Project Setup
- [x] Initialize Next.js project with JSX
- [x] Install dependencies (Tailwind, socket.io-client, axios)
- [x] Configure Tailwind CSS

### 2. Authentication
- [x] Build Login page
- [x] Build Register page
- [x] Implement AuthContext for token management
- [x] Create axios interceptor for token refresh

### 3. Core UI
- [x] Build Home/Dashboard with chat list
- [x] Build Chat screen with message bubbles
- [x] Implement Socket.io connection

### 4. Features
- [ ] Add message sending/receiving
- [ ] Add message syncing
- [ ] Build Groups screen
- [ ] Build Channels screen

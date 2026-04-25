# HybridChat Native Android Client

This application is the primary native client for the HybridChat ecosystem. It leverages native Android capabilities to perform background Bluetooth scanning, secure RFCOMM socket communication, and seamlessly interoperates with the Node.js backend.

---

## 🛠 Tech Stack

- **Language:** Kotlin
- **Architecture:** MVVM (Model-View-ViewModel) + Clean Architecture
- **UI Framework:** Jetpack Compose (Declarative UI)
- **Networking:** Retrofit2 for REST APIs, OkHttp, `socket.io-client` for real-time internet messaging.
- **Local Database:** Room database (for offline message caching, offline queues, and E2EE keys).
- **Hardware Integrations:** Android Bluetooth / Bluetooth Low Energy (BLE) APIs.
- **Encryption:** Native signal protocol Java bindings (`libsignal-protocol-java`) for full E2EE.

---

## 🎯 Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Personal DMs | P0 | 1:1 encrypted chat between users |
| Group Chats | P0 | Multi-user encrypted conversations |
| Broadcast Channels | P1 | One-to-many messaging |
| Bluetooth Messaging | P0 | Direct device-to-device messaging via RFCOMM |
| Internet Messaging | P0 | Messages via server when out of Bluetooth range |
| User Availability | P0 | UI indicates if user is available via Bluetooth or internet |
| End-to-End Encryption | P0 | Signal Protocol - keys never leave user devices |
| Secure Authentication | P0 | JWT with refresh tokens |
| Message Sync | P0 | Sync messages when switching Bluetooth/Internet modes |
| Push Notifications | P1 | Firebase Cloud Messaging |

---

## 📂 Project Structure

```text
/app
├── src/main/java/com/hybridchat/
│   ├── di/                    # Dependency Injection (Hilt/Dagger)
│   ├── data/
│   │   ├── local/             # Room DB Entities (Messages, Keys, Bluetooth Sessions)
│   │   ├── remote/            # Retrofit API definitions correlating to backend routes
│   │   └── repository/        # Clean Arch repository implementations
│   ├── domain/
│   │   ├── models/
│   │   └── use_cases/         # Business logic (e.g., SwitchToInternetUseCase)
│   ├── presentation/
│   │   ├── theme/             # Compose Colors, Typography, Shapes
│   │   ├── screens/           # UI Screens (Chat, Home, Login)
│   │   └── viewmodels/        # State managers integrating domain use-cases
│   ├── bluetooth/             # Core Bluetooth Logic
│   │   ├── Scanner.kt         # Discovers nearby MAC addresses
│   │   └── SocketManager.kt   # Creates direct peer-to-peer RFCOMM connections
│   ├── crypto/                # Signal Protocol Integrations
│   └── utils/                 # Helpers
├── build.gradle.kts
└── AndroidManifest.xml        # Requires BLUETOOTH, BLUETOOTH_ADMIN, ACCESS_FINE_LOCATION
```

---

## 🛣️ API Routes (Backend Integration)

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

## 🎨 UI/UX Design System

The Jetpack Compose UI strictly mirrors the unified HybridChat design system:

| Element | Color |
|---------|-------|
| Success (Bluetooth Active) | `#B5E18B` & `#F0FFC2` |
| Accents/Alerts | `#FF9A86` & `#FFB399` |
| Backgrounds/Cards | `#FFD6A6`, `#FFF0BE`, `#EAE6BC` |
| Text/Headers | `#28396C` |

*Features smooth Compose animations for navigating between offline and online states and glassmorphism-inspired UI components like floating chat cards.*

---

## 🚀 Implementation Roadmap

### Phase 1: Core Features
- [ ] Initialize Kotlin project with Gradle
- [ ] Set up Retrofit interfaces for /auth routes
- [ ] Implement JWT token storage (EncryptedSharedPreferences)
- [ ] Build Login/Register screens

### Phase 2: Messaging
- [ ] Implement /messages routes with Retrofit
- [ ] Set up Socket.io client for real-time
- [ ] Build Home (Chat List) screen
- [ ] Build Chat screen with message bubbles

### Phase 3: Bluetooth
- [ ] Implement BluetoothScanner for device discovery
- [ ] Implement SocketManager for RFCOMM connections
- [ ] Add Bluetooth fallback to Internet mode
- [ ] Implement message sync on reconnection

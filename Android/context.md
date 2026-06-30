# HybridChat Android - Project Context

> Generated: 2026-06-30 | Package: `com.hybridchat` | Build: `BUILD SUCCESSFUL`

## 1. Overview

HybridChat Android is a **Kotlin/Compose** messaging app that connects to the existing Node.js/Express backend at `backend/`. It supports:

- **Internet messaging** via REST API + WebSocket (Socket.IO)
- **Bluetooth messaging** via RFCOMM (direct device-to-device, no server)
- **Group chats** with invite codes
- **Broadcast channels** with admin-only posting
- **Media upload** (images/documents) via Cloudinary-backed backend
- **Real-time notifications** via Socket.IO

## 2. Architecture

```
com.hybridchat/
├── MainActivity.kt                    # Entry point, permissions, Compose root
├── bluetooth/                         # Device-to-device Bluetooth RFCOMM
│   ├── BluetoothScanner.kt            # BT device discovery via BroadcastReceiver
│   └── BluetoothSocketManager.kt      # Server/client socket threads, send/receive
├── data/
│   ├── model/                         # Data classes matching backend JSON
│   │   ├── AuthModels.kt              # Register/Login/Token DTOs
│   │   ├── MessageModels.kt           # Message, Conversation, Reaction, Upload DTOs
│   │   ├── GroupModels.kt             # Group, invite code DTOs
│   │   ├── ChannelModels.kt           # Channel, subscribe, reaction DTOs
│   │   └── ApiResponse.kt             # ApiError, SuccessResponse
│   ├── remote/
│   │   ├── ApiService.kt              # Retrofit interface (20+ endpoints)
│   │   ├── ApiClient.kt               # Singleton: OkHttp + JWT interceptor + Retrofit
│   │   ├── TokenManager.kt            # SharedPreferences: token/refresh/userId storage
│   │   └── SocketManager.kt           # Socket.IO client: connect, events, emit
│   └── repository/
│       ├── AuthRepository.kt           # Register, login, refresh, logout
│       ├── ChatRepository.kt           # Messages, search, upload, sync
│       ├── GroupRepository.kt          # Create/join/messages
│       └── ChannelRepository.kt        # Create/subscribe/messages/react
├── presentation/
│   ├── navigation/
│   │   └── AppNavigation.kt           # NavHost: auth guard, routes, socket lifecycle
│   ├── screens/
│   │   ├── BluetoothScreen.kt         # BT scan + chat UI
│   │   ├── auth/
│   │   │   ├── LoginScreen.kt         # Email/password login
│   │   │   └── RegisterScreen.kt      # Username/email/password register
│   │   ├── home/
│   │   │   └── HomeScreen.kt          # Bottom nav (5 tabs): Chats/Groups/Channels/BT/Settings
│   │   ├── chat/
│   │   │   ├── ChatListScreen.kt      # Conversation list + user search
│   │   │   └── ChatScreen.kt          # Message bubbles + input + image picker
│   │   ├── group/
│   │   │   └── GroupListScreen.kt     # Group list + create/join dialogs
│   │   ├── channel/
│   │   │   └── ChannelListScreen.kt   # Channel list + create dialog + subscribe
│   │   └── settings/
│   │       └── SettingsScreen.kt      # Profile info + logout
│   └── viewmodels/
│       ├── AuthViewModel.kt           # Login state, token init, socket bootstrap
│       ├── ChatViewModel.kt           # Conversations, messages, search, upload
│       ├── GroupViewModel.kt          # Groups CRUD, join by code
│       ├── ChannelViewModel.kt        # Channels CRUD, subscribe, reactions
│       └── BluetoothViewModel.kt      # Wraps BT scanner + socket manager
└── ui/theme/
    ├── Color.kt                       # HybridChat color palette
    ├── Theme.kt                       # Material3 light/dark schemes
    └── Type.kt                        # Typography definitions
```

## 3. Tech Stack

| Layer | Library | Version | Purpose |
|-------|---------|---------|---------|
| UI | Jetpack Compose + Material3 | BOM 2026.02.01 | Composable UI |
| Navigation | Navigation Compose | 2.7.5 | Screen routing |
| ViewModel | Lifecycle ViewModel Compose | 2.6.1 | State management |
| HTTP | Retrofit + OkHttp + Gson | 2.9.0 / 4.12.0 | REST API calls |
| WebSocket | socket.io-client-java | 2.1.0 | Real-time events |
| Image | Coil Compose | 2.5.0 | Async image loading |
| Bluetooth | Android Bluetooth API | API 31+ | RFCOMM sockets |
| Kotlin | Kotlin | 2.2.10 | Language |
| AGP | Android Gradle Plugin | 9.2.0 | Build system |

## 4. Backend Connection

- **Base URL (emulator):** `http://10.0.2.2:5000` (configured in `BuildConfig.API_BASE_URL`)
- **Base URL (release):** `https://api.hybridchat.com`
- **Auth:** JWT Bearer token in `Authorization` header (OkHttp interceptor)
- **WebSocket:** Socket.IO with `auth: { token }` handshake
- **Cleartext:** Allowed via `android:usesCleartextTraffic="true"` for localhost dev

### API Endpoints Used

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Refresh JWT |
| POST | `/auth/logout` | Yes | Logout |
| POST | `/messages/send` | Yes | Send message (DM/group/channel) |
| GET | `/messages/sync` | Yes | Sync all messages |
| GET | `/messages/conversations` | Yes | Get conversation list |
| GET | `/messages/search?q=` | Yes | Search users |
| GET | `/messages/nearby` | Yes | Get online users (BT) |
| POST | `/messages/bluetooth` | Yes | Log BT message metadata |
| POST | `/messages/upload-image` | Yes | Upload image (multipart) |
| POST | `/messages/upload-document` | Yes | Upload document (multipart) |
| POST | `/groups` | Yes | Create group |
| GET | `/groups` | Yes | List user's groups |
| POST | `/groups/join` | Yes | Join by invite code |
| GET | `/groups/:id/messages` | Yes | Get group messages |
| POST | `/groups/:id/members` | Yes | Add member |
| POST | `/channels` | Yes | Create channel |
| GET | `/channels` | Yes | List channels |
| POST | `/channels/:id/subscribe` | Yes | Subscribe to channel |
| GET | `/channels/:id/messages` | Yes | Get channel messages |
| POST | `/channels/:id/messages/:msgId/react` | Yes | React to message |

### Socket.IO Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `connection` | Server | — | User joins `user:{id}` room |
| `join_group` | Client→Server | `groupId` | Join `group:{id}` room (with membership check) |
| `join_channel` | Client→Server | `channelId` | Join `channel:{id}` room (with subscription check) |
| `leave_group` | Client→Server | `groupId` | Leave group room |
| `leave_channel` | Client→Server | `channelId` | Leave channel room |
| `new_message` | Server→Client | `Message` | Real-time incoming message |
| `channel_reaction_updated` | Server→Client | `{messageId, reactions}` | Reaction update |

## 5. Bluetooth Architecture

```
Device A (Server)              Device B (Client)
       │                              │
       │  AcceptThread                │  ConnectThread
       │  listenUsingInsecureRfcomm   │  createRfcommSocketToServiceRecord
       │         ◄──── accept() ──────│  socket.connect()
       │                              │
       │  ConnectedThread             │  ConnectedThread
       │  mmInStream / mmOutStream    │  mmInStream / mmOutStream
       │  ◄──── read(mmBuffer) ───────│  write(bytes)
       │  ──── write(bytes) ─────────►│  read(mmBuffer)
```

- **UUID:** `UUID.randomUUID()` per app install (not hardcoded)
- **Buffer:** 4096 bytes per read
- **Thread safety:** `synchronized` blocks on state/message access
- **Callbacks:** `onStateChange` / `onMessageReceived` lambdas for ViewModel reactivity
- **Flow:** BluetoothScanner exposes `StateFlow<Set<BluetoothDevice>>` for Compose

## 6. Navigation Flow

```
AppNavigation()
  ├─ isLoggedIn == false → LoginScreen
  │     └─ Navigate to → RegisterScreen → back to LoginScreen
  ├─ isLoggedIn == true → HomeScreen (bottom nav)
  │     ├─ Tab: CHATS → ChatListScreen → ChatScreen (DM)
  │     ├─ Tab: GROUPS → GroupListScreen → ChatScreen (Group)
  │     ├─ Tab: CHANNELS → ChannelListScreen → ChatScreen (Channel)
  │     ├─ Tab: BLUETOOTH → BluetoothScreen
  │     └─ Tab: SETTINGS → SettingsScreen → Logout
```

## 7. Key Patterns

- **Singleton API client:** `ApiClient.init(tokenManager)` in `AuthViewModel.init`
- **Singleton Socket:** `SocketManager()` created in `AppNavigation`, shared via remember
- **Repository pattern:** Repositories wrap Retrofit calls, return `Result<T>`
- **ViewModel state:** `MutableStateFlow<UiState>` collected via `collectAsState()`
- **No DI framework:** Manual dependency injection via constructor params
- **Token storage:** `SharedPreferences` via `TokenManager`

## 8. Permissions

| Permission | Purpose | Required |
|------------|---------|----------|
| `INTERNET` | REST + Socket.IO | Yes |
| `ACCESS_NETWORK_STATE` | Network status | Yes |
| `BLUETOOTH_SCAN` | Discover devices | Android 12+ |
| `BLUETOOTH_CONNECT` | Pair/connect | Android 12+ |
| `BLUETOOTH_ADVERTISE` | Accept connections | Android 12+ |
| `BLUETOOTH` / `BLUETOOTH_ADMIN` | Legacy BT | Android < 12 |
| `ACCESS_FINE_LOCATION` | BT discovery | Required by BT stack |
| `READ_MEDIA_IMAGES` | Pick images | Android 13+ |

## 9. Build Configuration

- **Min SDK:** 31 (Android 12)
- **Target/Compile SDK:** 35
- **JDK:** 17 (set in `gradle.properties`)
- **Kotlin:** 2.2.10
- **Build config fields:**
  - Debug: `API_BASE_URL = "http://10.0.2.2:5000"`
  - Release: `API_BASE_URL = "https://api.hybridchat.com"`

## 10. Known Warnings (Non-blocking)

| Warning | File | Fix |
|---------|------|-----|
| `BluetoothAdapter.getDefaultAdapter()` deprecated | BluetoothScanner, BluetoothSocketManager | Use `BluetoothManager.adapter` |
| `getParcelableExtra()` deprecated | BluetoothScanner:34 | Use typed API |
| `Icons.Filled.Send` deprecated | ChatScreen:121 | Use `Icons.AutoMirrored.Filled.Send` |
| `Icons.Filled.Chat` deprecated | HomeScreen:37 | Use `Icons.AutoMirrored.Filled.Chat` |

## 11. How to Run

```bash
# 1. Start backend
cd ../backend && npm run dev

# 2. Build Android (from Android/ directory)
.\gradlew.bat assembleDebug

# 3. Install on emulator/device
.\gradlew.bat installDebug

# Or run directly from Android Studio with Shift+F10
```

Emulator maps `10.0.2.2` to host `localhost`, so backend at `:5000` is accessible.
For physical device, change `API_BASE_URL` in `build.gradle.kts` to your machine's IP.

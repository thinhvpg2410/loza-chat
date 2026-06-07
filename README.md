# Loza Chat

A production-grade, full-stack real-time messaging platform built with modern web and mobile technologies.

| Layer | Stack |
|---|---|
| **Backend** | NestJS · Prisma · PostgreSQL · Socket.IO · Firebase Admin |
| **Web** | Next.js 14 (App Router) · TypeScript |
| **Mobile** | Expo · React Native · Nativewind · Zustand · React Hook Form |
| **Infrastructure** | Docker · Nginx · GitHub Actions CI/CD |

## Codebase Metrics

| | Count |
|---|---|
| Backend source files | 161 |
| Mobile source files | 182 |
| Web source files | 153 |
| REST API endpoints | ~144 |
| WebSocket events | 14 |
| Database models | 22 |
| NestJS services | 31 |
| NestJS controllers | 12 |
| Mobile screens | 34 |
| Web pages | 14 |

## Features

**Messaging**
- 1:1 and group conversations with real-time delivery
- Typing indicators, delivery receipts, read receipts
- Message reactions, mentions, sticker packs
- Media/file attachments (S3-compatible or mock storage)
- Spam rate limiting per conversation

**Calls**
- WebRTC peer-to-peer voice/video calls with TURN server support
- Full signaling lifecycle: initiate → offer/answer → ICE candidates → end
- Push notifications for incoming calls when app is backgrounded (Firebase FCM)
- Call message recorded with duration and final status

**Auth & Security**
- Phone number registration with OTP verification
- JWT access/refresh tokens with device/session tracking
- QR code web login flow approved from a trusted mobile device
- Rate-limited OTP, throttled API endpoints

**Social**
- Friend requests, friendships, block list
- Group lifecycle: creation, member roles, join requests, audit logs
- User search and profile management

## High-Level Architecture

```
Mobile (React Native/Expo)
Web (Next.js)
        │
        ├── REST API ──── NestJS (apps/api)
        │                     ├── 13 domain modules
        │                     ├── Prisma ORM → PostgreSQL
        │                     ├── JWT Auth (Passport)
        │                     └── AWS S3 / mock storage
        │
        └── WebSocket ─── Socket.IO Gateway
                              ├── Real-time messaging
                              ├── Presence & typing
                              └── WebRTC call signaling
```

## WebSocket Events (14)

| Direction | Event | Description |
|---|---|---|
| Client → Server | `conversation:join` | Join a conversation room |
| Client → Server | `message:send` | Send a message |
| Client → Server | `message:seen` | Mark message as read |
| Client → Server | `message:delivered` | Acknowledge delivery |
| Client → Server | `typing:start` / `typing:stop` | Typing indicator |
| Client → Server | `presence:heartbeat` | Online presence ping |
| Client → Server | `call:initiate` / `call:offer` | Start a call |
| Client → Server | `call:answer` / `call:answer_sdp` | Accept call + SDP exchange |
| Client → Server | `call:ice_candidate` | ICE negotiation |
| Client → Server | `call:end` / `call:leave` | Terminate call |

## Database Schema (22 Models)

`User` · `UserDevice` · `RefreshToken` · `OtpRequest` · `QrLoginSession`
`Friendship` · `FriendRequest` · `Block`
`Conversation` · `ConversationMember` · `ConversationSpamRateLimit`
`Message` · `MessageMention` · `MessageReaction` · `MessageUserHidden`
`Attachment` · `UploadSession`
`GroupJoinRequest` · `GroupAuditLog`
`StickerPack` · `Sticker` · `UserRecentSticker`

## Backend Modules (`apps/api/src/modules`)

| Module | Responsibility |
|---|---|
| `auth` | Register/login, OTP, forgot-password, QR web login |
| `users` | Profile, search, avatar upload |
| `friends` | Request/accept/reject/cancel |
| `blocks` | Block/unblock users |
| `conversations` | Direct/group listing, spam rate limiting |
| `messages` | Send, history, reactions, mentions, read/delivered, call messages |
| `groups` | Lifecycle, roles, join requests, audit logs |
| `realtime` | Socket auth, room management, typing/message/call events |
| `uploads` | Upload session init/complete, constraints |
| `storage` | Mock storage + S3-compatible (AWS SDK) |
| `sessions` + `devices` | Active session control, FCM push token management |
| `stickers` | Packs, recent usage |

## Mobile Stack (`apps/mobile`)

| Concern | Library |
|---|---|
| Routing | Expo Router (file-based) |
| State | Zustand |
| Styling | Nativewind (Tailwind for RN) |
| Forms | React Hook Form + Yup |
| Animations | React Native Reanimated |
| Real-time | socket.io-client |
| Calls | react-native-webrtc |
| Notifications | expo-notifications |
| Media | expo-image, expo-av, expo-camera, expo-image-picker |
| HTTP | Axios |

## User Flows

### Auth
1. Phone number login/register → OTP verification
2. JWT tokens issued, device session tracked
3. New device requires OTP before trust
4. Web supports QR login approved from a trusted mobile device

### Chat
1. REST: load conversation list + message history
2. Socket.IO: join room, send/receive messages and typing events
3. Server persists and emits room-scoped events
4. Read/delivered state synced via REST + socket

### Call
1. Caller sends `call:initiate` via Socket.IO
2. Server pushes FCM notification if callee is backgrounded
3. WebRTC offer/answer + ICE candidates exchanged through signaling
4. On hang-up, call duration and status saved as a message

### Upload
1. `POST /uploads/init` → presigned URL returned
2. Client uploads directly to storage
3. `PATCH /uploads/:id/complete` → message sent with attachment metadata

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 15+
- Docker + Docker Compose (optional)

## Project Structure

```text
apps/
  api/      # NestJS backend
  web/      # Next.js frontend
  mobile/   # Expo React Native app
```

## 1) Run API (`apps/api`)

```bash
cd apps/api
npm install
cp .env.example .env
```

Required `.env` values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Min 32-char secret |
| `JWT_REFRESH_SECRET` | Min 32-char secret |
| `TURN_SERVER_URL` | TURN server for WebRTC (optional) |
| `TURN_USERNAME` | TURN credentials (optional) |
| `TURN_CREDENTIAL` | TURN credentials (optional) |

```bash
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## 2) Run Web (`apps/web`)

```bash
cd apps/web
npm install
```

`.env.local`:

```env
LOZA_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_QR_LOGIN_URL_PREFIX=mobile://qr-login?session=
```

```bash
npm run dev
```

Optional: `LOZA_AUTH_BYPASS=1` for dev-only auth guard bypass.

## 3) Run Mobile (`apps/mobile`)

```bash
cd apps/mobile
npm install
cp .env.example .env
```

`.env`:

```env
EXPO_PUBLIC_USE_API_MOCK=false
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

```bash
npm run start
```

Notes:
- For real devices, replace `localhost` with your machine's LAN IP.
- `EXPO_PUBLIC_SOCKET_URL` defaults to `EXPO_PUBLIC_API_URL` when empty.
- Mock mode disables QR login, calls, and push notifications.

## 4) Run with Docker Compose

```bash
docker compose up -d
```

Starts: `postgres`, `api`, `nginx` (ports 80/443).

Override via environment or `.env`:

```env
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
TURN_SERVER_URL=...
CORS_ORIGIN=https://yourdomain.com
```

## Deployment

Automated via GitHub Actions on push to `main`:

1. SSH into production server
2. `git pull origin main`
3. `docker compose up -d --build --remove-orphans api nginx`

Required GitHub secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PORT`.

## Useful Commands

```bash
# API
cd apps/api
npm run lint
npm run test
npm run test:e2e
npm run build
npm run start:prod

# Web
cd apps/web && npm run lint

# Mobile
cd apps/mobile && npm run lint
```

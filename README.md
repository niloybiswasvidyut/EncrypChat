# EncrypChat

Realtime chat application architecture using Next.js App Router (frontend + backend), MongoDB, Tailwind CSS, shadcn-style UI primitives, Firebase, and Pusher.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- MongoDB + Mongoose
- Tailwind CSS
- shadcn-style component structure (`src/components/ui`)
- Pusher (realtime transport)
- Firebase (storage-ready client bootstrap)
- Cloudinary (attachment hosting)
- JWT auth + bcrypt password hashing
- AES-256-GCM message encryption helper

## Project Structure

```text
encrypchat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.js
│   │   │   │   ├── login/route.js
│   │   │   │   └── recover/
│   │   │   │       ├── request/route.js
│   │   │   │       └── reset/route.js
│   │   │   ├── chat/
│   │   │   │   ├── conversations/route.js
│   │   │   │   ├── messages/route.js
│   │   │   │   └── groups/route.js
│   │   │   ├── upload/route.js
│   │   │   └── socket/route.js
│   │   ├── login/page.js
│   │   ├── register/page.js
│   │   ├── recover/page.js
│   │   ├── chat/page.js
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   └── input.jsx
│   │   ├── ChatBox.js
│   │   ├── Sidebar.js
│   │   └── MessageInput.js
│   ├── hooks/
│   │   ├── useChat.js
│   │   └── useSocket.js
│   ├── lib/
│   │   ├── mongodb.js
│   │   ├── encryption.js
│   │   ├── auth.js
│   │   ├── validators.js
│   │   ├── pusher.js
│   │   ├── firebase.js
│   │   └── cn.js
│   └── models/
│       ├── User.js
│       ├── Conversation.js
│       ├── Message.js
│       └── PasswordResetToken.js
├── public/
├── .env.local
├── .env.example
└── README.md
```

## Architecture Overview

### 1) Authentication and Account Security

- `POST /api/auth/register`: creates user, bcrypt-hashes password, stores encrypted password copy (as requested).
- `POST /api/auth/login`: verifies bcrypt hash and returns JWT.
- `POST /api/auth/recover/request`: issues time-limited reset token (30 minutes).
- `POST /api/auth/recover/reset`: validates token and rotates password hash + encrypted password.

### 2) Messaging Domain

- `Conversation` model supports:
	- direct chat (`type: direct`)
	- group chat (`type: group` + `admins`)
- `Message` model stores encrypted body and optional file attachments.
- `POST /api/chat/messages` encrypts plaintext before write.
- `GET /api/chat/messages` decrypts ciphertext for client output.

### 3) Realtime Layer

- `Pusher` broadcasts `new-message` events on `conversation-{id}` channels.
- Client hook `useSocket` subscribes and appends live messages.
- `socket.io` package is installed for future custom server migration if needed.

### 4) File/Attachment Flow

- `POST /api/upload` accepts multipart `file` payload.
- Uploads to Cloudinary when keys exist.
- Returns file metadata for message attachment list.

### 5) Frontend UI Flow

- `/register`, `/login`, `/recover` pages handle account lifecycle.
- `/chat` renders:
	- conversation sidebar
	- message timeline
	- input composer with file picker
- hooks:
	- `useChat` for fetch/send state
	- `useSocket` for realtime subscription

## Installation and Run

1. Install dependencies:

```bash
npm install
```

2. Configure environment values:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Important Notes

- Password encryption in addition to hashing is included because it was requested, but for production security posture, storing decryptable password material is generally discouraged.
- Realtime is fully functional when Pusher keys are configured.
- Attachments need Cloudinary keys for hosted URLs.

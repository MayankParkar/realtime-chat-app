# Realtime Chat App

A full-stack, production-deployed real-time chat application — built as a WhatsApp/Slack-style clone with rooms, direct real-time messaging, typing indicators, and live presence tracking. Built end-to-end from schema design through a live deployment, with a particular focus on the systems-design patterns that come up constantly in backend interviews: WebSocket scaling, presence via TTL, and transactional data integrity.

**Live demo:** [realtime-chat-app-black-ten.vercel.app](https://realtime-chat-app-black-ten.vercel.app)

---

## Why this project

"Design WhatsApp" or "design a chat system" is one of the most common system design interview questions at companies like Meta, Google, and Amazon. Rather than just being able to talk about the theory, this project implements the actual mechanics — including the parts that are easy to describe but easy to get subtly wrong, like horizontal scaling of WebSocket connections and resilient presence tracking.

## The interview talking point

> Our chat system uses Redis Pub/Sub so that if User A is connected to Server 1 and User B is connected to Server 3, their messages still route correctly — this is how WhatsApp scales WebSocket connections across thousands of servers.

This isn't just a line — it's proven in this repo. Two independent Node.js server processes were run side by side locally, and a message sent by a client connected to port 4000 was confirmed to arrive on a client connected to a completely separate process on port 4001, purely via the Redis adapter, with no shared memory between the two processes.

---

## Features

- **Real-time messaging** — instant bidirectional delivery via WebSockets (Socket.io), with full message history persisted to Postgres
- **Rooms** — create rooms, invite others via a shareable room ID, join existing rooms
- **Typing indicators** — debounced "user is typing…" events, excluding the sender
- **Presence system** — online/offline status via a Redis heartbeat + TTL pattern, resilient to ungraceful disconnects (crashes, dropped connections) without any manual cleanup code
- **Horizontal scaling** — Redis Pub/Sub adapter allows the WebSocket layer to broadcast correctly across multiple independent server processes
- **Authentication** — email/password (bcrypt + JWT) and Google OAuth (Google Identity Services, with automatic account linking/merging by email)
- **Full deployment** — live on Railway (API + Postgres + Redis) and Vercel (React client)

---

## Architecture

```
React (Vite) ──HTTP/WS──▶ Express + Socket.io ──▶ PostgreSQL (persistence)
   (Vercel)                    (Railway)      └──▶ Redis (Pub/Sub + presence)
```

**Why Redis Pub/Sub matters here:** a single Node process keeps Socket.io's room membership in local memory — broadcasting works because `io.to(room).emit(...)` can see every connected socket. The moment you run more than one server instance behind a load balancer, that breaks: a server has no way to reach a socket connected to a *different* process. Every server instance in this project subscribes to the same Redis Pub/Sub channel, so a message published from any instance is fanned out to all instances, each of which then delivers it to its own locally-connected clients.

**Why presence uses a TTL pattern, not a boolean column:** a naive `is_online` flag flipped on connect/disconnect breaks the moment a client disconnects ungracefully (closed laptop, dropped network, crashed tab) — nothing ever flips it back. Instead, each connected client sets a Redis key (`presence:<userId>`) with a short expiry and refreshes it via a periodic heartbeat. If the heartbeats stop for any reason, Redis deletes the key automatically — no manual cleanup, no stuck "online" states.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, Socket.io-client |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL (with `pgcrypto` for UUID generation) |
| Cache / Pub-Sub | Redis (`ioredis`, `@socket.io/redis-adapter`) |
| Auth | JWT, bcrypt, Google Identity Services (`google-auth-library`) |
| Infra | Docker Compose (local dev), Railway (API + DBs), Vercel (client) |

---

## Database schema

Four tables, each design decision made deliberately rather than defaulted:

- **`users`** — UUID primary keys (not sequential integers, to avoid leaking user counts/enumeration), unique email/username, nullable `password_hash` and `google_id` to support both auth methods on the same table.
- **`rooms`** — a single `is_direct_message` boolean lets one table represent both group rooms and 1-on-1 DMs, rather than maintaining two separate systems (mirrors how Slack models this internally).
- **`room_members`** — a composite primary key on `(room_id, user_id)` makes duplicate memberships structurally impossible, with an additional index on `user_id` alone to serve the reverse "what rooms is this user in" query pattern.
- **`messages`** — a composite index on `(room_id, created_at DESC)` is what makes "give me the last 50 messages in this room" fast at scale — Postgres can walk the index in the exact order needed instead of scanning and sorting at query time.

Foreign keys are deliberately inconsistent in cascade behavior where it matters: deleting a user `SET NULL`s their old messages (so conversation history isn't destroyed) but `CASCADE`s their room memberships (a membership row is meaningless without the user).

---

## Running locally

### Prerequisites
- Node.js, npm
- Docker + Docker Compose

### 1. Clone and install

```bash
git clone https://github.com/MayankParkar/realtime-chat-app.git
cd realtime-chat-app
```

### 2. Start Postgres and Redis

```bash
docker compose up -d
```

### 3. Set up the server

```bash
cd server
npm install
cp .env.example .env   # fill in your own values — see below
docker exec -i chat_postgres psql -U chatuser -d chatdb < db/schema.sql
docker exec -i chat_postgres psql -U chatuser -d chatdb < db/migrations/001_add_google_auth.sql
npm run dev
```

### 4. Set up the client

```bash
cd ../client
npm install
cp .env.example .env   # fill in your own values — see below
npm run dev
```

Visit `http://localhost:5173`.

### Environment variables

**`server/.env`**
```
PORT=4000
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatdb
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random 32+ byte hex string>
GOOGLE_CLIENT_ID=<your Google OAuth client ID>
CLIENT_URL=http://localhost:5173
```

**`client/.env`**
```
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=<your Google OAuth client ID>
```

---

## Proving the scaling claim yourself

Run two server instances on different ports against the same Postgres/Redis:

```bash
# terminal 1
npm run dev

# terminal 2
SERVER_PORT=4001 npx nodemon index.js
```

Connect one Socket.io client to `:4000` and another to `:4001`, join the same room on both, and send a message from the first. Without the Redis adapter, the second client never receives it. With it enabled (as in this repo), both clients receive the message in real time, proving the broadcast crosses the process boundary correctly.

---

## Deployment

- **Backend + databases:** Railway (Node app, PostgreSQL, Redis — all in one project, connected via Railway's internal networking)
- **Frontend:** Vercel (Vite build, environment-configured to point at the Railway API)

CORS is explicitly locked to the deployed frontend origin in production rather than left open.

---

## License

MIT

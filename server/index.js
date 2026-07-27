require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const pool = require('./db/pool');

const app = express();
app.use(cors());
app.use(express.json());

const presenceRoutes = require('./routes/presence');
app.use('/presence', presenceRoutes);

const roomRoutes = require('./routes/rooms');
app.use('/rooms', roomRoutes);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const { createAdapter } = require('@socket.io/redis-adapter');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // we'll lock this down later
});

// Redis adapter needs its own pub and sub clients — Redis connections
// used for Pub/Sub can't also be used for regular commands
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Redis client (plain connection for now, Pub/Sub comes later)

// Basic health check route
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await pubClient.ping();
    res.json({ status: 'ok', postgres: 'connected', redis: 'connected' });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ status: 'error', message: err.message || String(err) });
  }
});
const jwt = require('jsonwebtoken');

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

// Socket.io connection handler
const PRESENCE_TTL_SECONDS = 30;

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}, userId: ${socket.userId}`);

  // Mark user online immediately on connect
  pubClient.set(`presence:${socket.userId}`, '1', 'EX', PRESENCE_TTL_SECONDS);

  socket.on('heartbeat', () => {
    // Refresh the TTL so the key doesn't expire while the client is still active
    pubClient.set(`presence:${socket.userId}`, '1', 'EX', PRESENCE_TTL_SECONDS);
  });

  socket.on('join-room', async (roomId) => {
    try {
      const check = await pool.query(
        'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, socket.userId]
      );

      if (check.rows.length === 0) {
        socket.emit('error', { message: 'not a member of this room' });
        return;
      }

      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    } catch (err) {
      console.error('join-room error:', err);
      socket.emit('error', { message: 'failed to join room' });
    }
  });

  socket.on('send-message', async ({ roomId, content }) => {
    try {
      if (!roomId || !content || !content.trim()) {
        socket.emit('error', { message: 'roomId and content are required' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO messages (room_id, sender_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, room_id, sender_id, content, created_at`,
        [roomId, socket.userId, content]
      );

      const message = result.rows[0];
      io.to(roomId).emit('receive-message', message);
    } catch (err) {
      console.error('send-message error:', err);
      socket.emit('error', { message: 'failed to send message' });
    }
  });
  socket.on('typing-start', ({ roomId }) => {
    // Broadcast to everyone else in the room EXCEPT the sender
    socket.to(roomId).emit('user-typing', { userId: socket.userId, roomId });
  });

  socket.on('typing-stop', ({ roomId }) => {
    socket.to(roomId).emit('user-stopped-typing', { userId: socket.userId, roomId });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}, userId: ${socket.userId}`);
    // Note: we deliberately do NOT delete the presence key here.
    // If the same user has another tab/device connected, we don't want
    // to mark them offline just because ONE socket disconnected.
    // We let the TTL expire naturally if no heartbeats come in.
  });
});

const PORT = process.env.SERVER_PORT || process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

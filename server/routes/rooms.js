const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes in this file require a logged-in user
router.use(authMiddleware);

// POST /rooms — create a room, creator auto-joins
router.post('/', async (req, res) => {
    const { name, isDirectMessage = false } = req.body;
    const userId = req.userId;

    if (!name) {
        return res.status(400).json({ error: 'room name is required' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const roomResult = await client.query(
            `INSERT INTO rooms (name, is_direct_message, created_by)
            VALUES ($1, $2, $3)
            RETURNING id, name, is_direct_message, created_at`,
            [name, isDirectMessage, userId]
        );
        const room = roomResult.rows[0];

        await client.query(
            `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)`,
                           [room.id, userId]
        );

        await client.query('COMMIT');
        res.status(201).json({ room });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create room error:', err);
        res.status(500).json({ error: 'internal server error' });
    } finally {
        client.release();
    }
});

// POST /rooms/:roomId/join — join an existing room
router.post('/:roomId/join', async (req, res) => {
    const { roomId } = req.params;
    const userId = req.userId;

    try {
        const roomCheck = await pool.query('SELECT id FROM rooms WHERE id = $1', [roomId]);
        if (roomCheck.rows.length === 0) {
            return res.status(404).json({ error: 'room not found' });
        }

        await pool.query(
            `INSERT INTO room_members (room_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (room_id, user_id) DO NOTHING`,
                         [roomId, userId]
        );

        res.json({ message: 'joined room', roomId });
    } catch (err) {
        console.error('Join room error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /rooms/my — list rooms the logged-in user belongs to
router.get('/my', async (req, res) => {
    const userId = req.userId;

    try {
        const result = await pool.query(
            `SELECT r.id, r.name, r.is_direct_message, r.created_at
            FROM rooms r
            JOIN room_members rm ON rm.room_id = r.id
            WHERE rm.user_id = $1
            ORDER BY r.created_at DESC`,
            [userId]
        );

        res.json({ rooms: result.rows });
    } catch (err) {
        console.error('List rooms error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /rooms/:roomId/messages — fetch message history for a room
router.get('/:roomId/messages', async (req, res) => {
    const { roomId } = req.params;
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 50;

    try {
        // Confirm the requester is actually a member before showing them the history
        const membership = await pool.query(
            'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
            [roomId, userId]
        );

        if (membership.rows.length === 0) {
            return res.status(403).json({ error: 'not a member of this room' });
        }

        const result = await pool.query(
            `SELECT m.id, m.room_id, m.sender_id, m.content, m.created_at, u.username AS sender_username
            FROM messages m
            LEFT JOIN users u ON u.id = m.sender_id
            WHERE m.room_id = $1
            ORDER BY m.created_at DESC
            LIMIT $2`,
            [roomId, limit]
        );

        // Reverse so the client gets oldest-first (natural reading order for a chat log)
        const messages = result.rows.reverse();

        res.json({ messages });
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

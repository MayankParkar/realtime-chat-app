const express = require('express');
const Redis = require('ioredis');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL);

router.use(authMiddleware);

// GET /presence/:userId — check if a specific user is online
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const exists = await redis.exists(`presence:${userId}`);
        res.json({ userId, online: exists === 1 });
    } catch (err) {
        console.error('Presence check error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;

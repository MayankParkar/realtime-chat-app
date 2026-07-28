const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /auth/register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'username, email, and password are required' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, created_at`,
            [username, email, passwordHash]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user, token });
    } catch (err) {
        if (err.code === '23505') {
            // Postgres unique_violation
            return res.status(409).json({ error: 'username or email already taken' });
        }
        console.error('Register error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: { id: user.id, username: user.username, email: user.email },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST /auth/google — verify a Google ID token, create or log in the user
router.post('/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
    }

    try {
        // Verify the token is genuinely from Google and hasn't been tampered with
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // Check if this Google account is already linked to a user
        let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
        let user = result.rows[0];

        if (!user) {
            // No existing link — check if the email is already registered via password signup
            result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            user = result.rows[0];

            if (user) {
                // Existing password-based account with this email — link the Google ID to it
                const updateResult = await pool.query(
                    'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING id, username, email, created_at',
                    [googleId, user.id]
                );
                user = updateResult.rows[0];
            } else {
                // Brand new user — derive a username from their email, ensure it doesn't collide
                let baseUsername = email.split('@')[0];
                let username = baseUsername;
                let suffix = 1;

                while (true) {
                    const check = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
                    if (check.rows.length === 0) break;
                    username = `${baseUsername}${suffix}`;
                    suffix++;
                }

                const insertResult = await pool.query(
                    `INSERT INTO users (username, email, google_id)
                    VALUES ($1, $2, $3)
                    RETURNING id, username, email, created_at`,
                    [username, email, googleId]
                );
                user = insertResult.rows[0];
            }
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: { id: user.id, username: user.username, email: user.email },
            token
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(401).json({ error: 'invalid Google token' });
    }
});

module.exports = router;

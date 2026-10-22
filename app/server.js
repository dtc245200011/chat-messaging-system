'use strict';

const path = require('node:path');
const http = require('node:http');
const express = require('express');
const { Pool } = require('pg');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT || 3000);

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres_db',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
});

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function positiveId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function handleError(res, operation, err) {
    console.error(`${operation} failed:`, err.message);
    res.status(500).json({ error: 'Internal server error' });
}

async function isRoomMember(roomId, userId) {
    const result = await pool.query(
        `SELECT 1
         FROM room_members
         WHERE room_id = $1 AND user_id = $2`,
        [roomId, userId]
    );
    return result.rowCount > 0;
}

// Health check: verifies both the application and PostgreSQL connection.
app.get('/healthz', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'ok' });
    } catch (err) {
        handleError(res, 'Health check', err);
    }
});

// Register a demo user or update that user's display name.
app.post('/api/users', async (req, res) => {
    const username = typeof req.body?.username === 'string'
        ? req.body.username.trim().toLowerCase()
        : '';
    const displayName = typeof req.body?.displayName === 'string'
        ? req.body.displayName.trim()
        : '';

    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
        return res.status(400).json({
            error: 'Username must contain 3-32 letters, numbers or underscores.'
        });
    }

    if (displayName.length < 1 || displayName.length > 80) {
        return res.status(400).json({
            error: 'Display name must contain 1-80 characters.'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO users (username, display_name)
             VALUES ($1, $2)
             ON CONFLICT (username)
             DO UPDATE SET display_name = EXCLUDED.display_name
             RETURNING id, username, display_name, created_at`,
            [username, displayName]
        );

        res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        handleError(res, 'Create user', err);
    }
});

// List chat rooms.
app.get('/api/rooms', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.name, r.created_at,
                    u.display_name AS created_by,
                    COUNT(rm.user_id)::int AS member_count
             FROM rooms r
             LEFT JOIN users u ON u.id = r.created_by
             LEFT JOIN room_members rm ON rm.room_id = r.id
             GROUP BY r.id, u.display_name
             ORDER BY r.created_at DESC, r.id DESC`
        );

        res.json({ rooms: result.rows });
    } catch (err) {
        handleError(res, 'List rooms', err);
    }
});

// Create a room and automatically add its creator as a member.
app.post('/api/rooms', async (req, res) => {
    const name = typeof req.body?.name === 'string'
        ? req.body.name.trim()
        : '';
    const userId = positiveId(req.body?.userId);

    if (name.length < 1 || name.length > 80) {
        return res.status(400).json({
            error: 'Room name must contain 1-80 characters.'
        });
    }

    if (!userId) {
        return res.status(400).json({ error: 'A valid userId is required.' });
    }

    let client;

    try {
        client = await pool.connect();
        await client.query('BEGIN');

        const roomResult = await client.query(
            `INSERT INTO rooms (name, created_by)
             VALUES ($1, $2)
             RETURNING id, name, created_by, created_at`,
            [name, userId]
        );

        const room = roomResult.rows[0];

        await client.query(
            `INSERT INTO room_members (room_id, user_id)
             VALUES ($1, $2)`,
            [room.id, userId]
        );

        await client.query('COMMIT');
        res.status(201).json({ room });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK').catch(() => {});
        }

        if (err.code === '23503') {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Room name already exists.' });
        }

        handleError(res, 'Create room', err);
    } finally {
        if (client) client.release();
    }
});

// Join an existing room.
app.post('/api/rooms/:roomId/join', async (req, res) => {
    const roomId = positiveId(req.params.roomId);
    const userId = positiveId(req.body?.userId);

    if (!roomId || !userId) {
        return res.status(400).json({
            error: 'Valid roomId and userId are required.'
        });
    }

    try {
        await pool.query(
            `INSERT INTO room_members (room_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (room_id, user_id) DO NOTHING`,
            [roomId, userId]
        );

        res.json({ joined: true, roomId, userId });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(404).json({
                error: 'Room or user not found.'
            });
        }
        handleError(res, 'Join room', err);
    }
});

// Get the latest 100 messages, oldest to newest.
app.get('/api/rooms/:roomId/messages', async (req, res) => {
    const roomId = positiveId(req.params.roomId);
    const userId = positiveId(req.query.userId);

    if (!roomId || !userId) {
        return res.status(400).json({
            error: 'Valid roomId and userId are required.'
        });
    }

    try {
        if (!(await isRoomMember(roomId, userId))) {
            return res.status(403).json({ error: 'Join the room first.' });
        }

        const result = await pool.query(
            `SELECT m.id, m.room_id, m.user_id,
                    u.username, u.display_name,
                    m.content, m.created_at
             FROM messages m
             JOIN users u ON u.id = m.user_id
             WHERE m.room_id = $1
             ORDER BY m.created_at DESC, m.id DESC
             LIMIT 100`,
            [roomId]
        );

        res.json({ messages: result.rows.reverse() });
    } catch (err) {
        handleError(res, 'Get messages', err);
    }
});

// Save a message before broadcasting it to room members.
app.post('/api/rooms/:roomId/messages', async (req, res) => {
    const roomId = positiveId(req.params.roomId);
    const userId = positiveId(req.body?.userId);
    const content = typeof req.body?.content === 'string'
        ? req.body.content.trim()
        : '';

    if (!roomId || !userId) {
        return res.status(400).json({
            error: 'Valid roomId and userId are required.'
        });
    }

    if (content.length < 1 || content.length > 2000) {
        return res.status(400).json({
            error: 'Message must contain 1-2000 characters.'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO messages (room_id, user_id, content)
             SELECT $1, rm.user_id, $3
             FROM room_members rm
             WHERE rm.room_id = $1 AND rm.user_id = $2
             RETURNING id, room_id, user_id, content, created_at`,
            [roomId, userId, content]
        );

        if (result.rowCount === 0) {
            return res.status(403).json({
                error: 'Join the room before sending messages.'
            });
        }

        const saved = result.rows[0];
        const userResult = await pool.query(
            'SELECT username, display_name FROM users WHERE id = $1',
            [saved.user_id]
        );

        const message = {
            ...saved,
            username: userResult.rows[0].username,
            display_name: userResult.rows[0].display_name
        };

        io.to(`room:${roomId}`).emit('message:new', message);
        res.status(201).json({ message });
    } catch (err) {
        handleError(res, 'Send message', err);
    }
});

// A socket can join a room only after membership is verified.
io.on('connection', (socket) => {
    socket.on('room:join', async (payload, acknowledge) => {
        const reply = typeof acknowledge === 'function'
            ? acknowledge
            : () => {};

        const roomId = positiveId(payload?.roomId);
        const userId = positiveId(payload?.userId);

        if (!roomId || !userId) {
            return reply({ ok: false, error: 'Invalid room or user.' });
        }

        try {
            if (!(await isRoomMember(roomId, userId))) {
                return reply({
                    ok: false,
                    error: 'Join the room before connecting.'
                });
            }

            await socket.join(`room:${roomId}`);
            reply({ ok: true });
        } catch (err) {
            console.error('Socket room join failed:', err.message);
            reply({ ok: false, error: 'Unable to join room.' });
        }
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    console.error('Request failed:', err.message);
    res.status(err.status === 400 ? 400 : 500).json({
        error: err.status === 400 ? 'Invalid request body.' : 'Internal server error'
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Chat server listening on port ${PORT}`);
});

async function shutdown() {
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

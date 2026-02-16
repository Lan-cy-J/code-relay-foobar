require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'super-secret-key-123';

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('DB connection error:', err);
        return;
    }
    console.log('Connected to database');
});


/* ---------- REGISTER ---------- */
app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;

    db.query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, password],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const userId = result.insertId;

            // create default workspace
            db.query(
                "INSERT INTO workspaces (name, description, owner_id) VALUES (?, ?, ?)",
                [`${username}'s Workspace`, "Default workspace", userId]
            );

            const token = jwt.sign(
                { id: userId, username, email },
                JWT_SECRET
            );

            res.json({
                token,
                user: { id: userId, username, email }
            });
        }
    );
});


/* ---------- LOGIN ---------- */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!results.length) return res.status(401).json({ error: "User not found" });

            const user = results[0];

            if (user.password_hash !== password) {
                return res.status(401).json({ error: "Wrong password" });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email },
                JWT_SECRET
            );

            res.json({
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        }
    );
});


/* ---------- AUTH CHECK ---------- */
app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        db.query(
            "SELECT id, username, email FROM users WHERE id = ?",
            [decoded.id],
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results[0]);
            }
        );
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
});


/* ---------- GET WORKSPACES ---------- */
app.get('/api/workspaces', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });

    try {
        const token = authHeader.split(' ')[1];
        const user = jwt.verify(token, JWT_SECRET);

        db.query(
            "SELECT * FROM workspaces WHERE owner_id = ? ORDER BY created_at DESC",
            [user.id],
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            }
        );
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

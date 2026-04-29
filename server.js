const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const DB_PATH = path.join(__dirname, 'database', 'users.json');

// Initialize database
if (!fs.existsSync(path.join(__dirname, 'database'))) {
    fs.mkdirSync(path.join(__dirname, 'database'));
}
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

function readUsers() {
    const data = fs.readFileSync(DB_PATH);
    return JSON.parse(data);
}

function writeUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

// Register user
app.post('/api/register', (req, res) => {
    const { email, fullName, picture, baseUsername, domainUsername, password } = req.body;
    const users = readUsers();
    const existing = users.find(u => u.email === email);
    
    if (existing) {
        return res.json({ success: true, message: 'User already exists' });
    }
    
    const newUser = {
        email,
        fullName,
        picture,
        baseUsername,
        domainUsername,
        password: password ? Buffer.from(password).toString('base64') : '',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeUsers(users);
    res.json({ success: true, user: { ...newUser, password: undefined } });
});

// Set password
app.post('/api/set-password', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
        return res.json({ success: false, message: 'User not found' });
    }
    
    users[userIndex].password = Buffer.from(password).toString('base64');
    writeUsers(users);
    
    const userData = { ...users[userIndex], password: undefined };
    res.json({ success: true, user: userData });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        return res.json({ success: false, message: 'User not found' });
    }
    
    const hasPassword = user.password && user.password.length > 0;
    
    if (password && user.password) {
        const decodedPassword = Buffer.from(user.password, 'base64').toString();
        if (decodedPassword === password) {
            const { password: _, ...userWithoutPassword } = user;
            return res.json({ success: true, user: userWithoutPassword, hasPassword: true });
        } else {
            return res.json({ success: false, message: 'Wrong password' });
        }
    }
    
    res.json({ success: true, hasPassword: hasPassword });
});

// API endpoint untuk bot
app.get('/api/zero2/:username', (req, res) => {
    const { username } = req.params;
    const apiKey = req.headers['x-api-key'];
    
    res.json({
        status: 'success',
        message: `Welcome to ZeroTwo API for ${username}`,
        timestamp: new Date().toISOString(),
        data: {
            username: username,
            endpoint: `/api/zero2/${username}`,
            docs: 'Gunakan API Key untuk akses bot WA/Telegram'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
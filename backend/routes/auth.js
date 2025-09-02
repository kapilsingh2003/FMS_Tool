const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Utility: Load users
const loadUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
};

// Utility: Save users
const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { username, name, password, role, email, department, team } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const newUser = {
    id: Date.now(),
    username,
    name,
    password, // ⚠️ Store hashed in production!
    role,
    email,
    department,
    team,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  res.json({ success: true, user: newUser });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  res.json({ success: true, user });
});

module.exports = router;

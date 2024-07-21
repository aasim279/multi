const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));
app.use(express.static('public'));

// Helper function to read and write user data
const readUsers = () => {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data || '[]');
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Middleware to protect routes
const redirectToLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    next();
  }
};

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/main', redirectToLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.post('/signup', (req, res) => {
  const { name, mobile, username, password } = req.body;
  const users = readUsers();

  if (users.find((user) => user.username === username)) {
    return res.status(400).send('User already exists');
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).send('Invalid mobile number');
  }

  users.push({ name, mobile, username, password });
  writeUsers(users);

  res.status(201).send('User signed up successfully');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find((user) => user.username === username && user.password === password);

  if (!user) {
    return res.status(400).send('Invalid username or password');
  }

  req.session.userId = user.username;
  res.redirect('/main');
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Unable to log out');
    }
    res.redirect('/login');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

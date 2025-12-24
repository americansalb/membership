require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./db');
const migrate = require('./db/migrate');

const app = express();
const PORT = process.env.PORT || 3000;

// Run migrations on startup
migrate().catch(console.error);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Adjust for development
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Auth routes
app.use('/auth', require('./routes/auth'));

// API routes
app.use('/api/v1', require('./routes/api'));

// Dev API routes (platform admin)
app.use('/api/v1/dev', require('./routes/dev'));

// Page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Developer admin routes
app.get('/dev', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dev', 'index.html'));
});

app.get('/dev/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dev', 'login.html'));
});

app.get('/dev/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dev', 'index.html'));
});

// Organization-specific portal routes (/p/orgslug)
app.get('/p/:orgSlug/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'login.html'));
});

app.get('/p/:orgSlug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

app.get('/p/:orgSlug/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

// Generic portal routes (redirect to org-specific if known)
app.get('/portal/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'login.html'));
});

app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

app.get('/portal/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`VillageKeep running on port ${PORT}`);
});

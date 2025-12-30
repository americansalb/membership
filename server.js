require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const migrate = require('./db/migrate');
const runSeeds = require('./db/seed');
const { initializeSocket } = require('./lib/socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.io
const io = initializeSocket(server);

// Make io available to routes
app.set('io', io);

// Run migrations and seeds on startup
migrate()
  .then(() => runSeeds())
  .catch(console.error);

// Trust proxy (needed for Render/Heroku to get correct client IP)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Adjust for development
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit login attempts
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 posts per minute
  message: { error: 'Posting too fast, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/signup', authLimiter);

// Make rate limiters available to routes
app.set('postLimiter', postLimiter);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Community routes (member-facing: forums, messages, notifications)
app.use('/api/v1/community', require('./routes/community'));

// CEU routes (admin + member portal)
app.use('/api/v1/ceu', require('./routes/ceu'));

// Credentials routes (credential-based CEU system)
app.use('/api/v1/credentials', require('./routes/credentials'));

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

server.listen(PORT, () => {
  console.log(`VillageKeep running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

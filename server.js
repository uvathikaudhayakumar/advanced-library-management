require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { RedisStore } = require('connect-redis');
const flash = require('connect-flash');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const { Server } = require('socket.io');

const cache = require('./utils/cache');

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/advanced_library';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection notice:', err.message);
  });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Logging & Parsing
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));

// CORS configuration for Render backend to Netlify frontend communication
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://librarybs.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session Store with Redis & MongoStore fallback
let sessionStore = null;
const redisClient = cache.getClient();

if (cache.getStatus() && redisClient) {
  try {
    sessionStore = new RedisStore({ client: redisClient, prefix: 'lms:session:' });
    console.log('Active session store: Redis');
  } catch (err) {
    console.warn('RedisStore init failed, falling back to MongoStore:', err.message);
  }
}

if (!sessionStore) {
  sessionStore = MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
    ttl: 60 * 60 * 8
  });
  console.log('Active session store: MongoStore');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'advanced-lms-secure-key-2026',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

// Flash messages (MUST be immediately after session and before routes)
app.use(flash());

// Global locals & Flash handling
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  
  // Extract connect-flash or session flash
  const flashErr = req.flash ? req.flash('error') : [];
  const flashSucc = req.flash ? req.flash('success') : [];
  const flashInfo = req.flash ? req.flash('info') : [];
  res.locals.flash = flashErr[0] || flashSucc[0] || flashInfo[0] || req.session.flash || null;
  delete req.session.flash;

  res.locals.money = n => `₹${Number(n || 0).toFixed(2)}`;
  req.io = io;
  next();
});

// --- ROUTES ---

// Health Check Endpoint (Required for Render deployment)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: cache.getStatus() ? 'connected' : 'fallback_mode',
    mode: 'full_database',
    timestamp: new Date().toISOString()
  });
});

// JSON REST API
app.use('/api', require('./routes/api'));

// Excel Import & Export
app.use('/admin/excel', require('./routes/excel'));

// Web Routes
app.use('/', require('./routes/auth'));
app.use('/student', require('./routes/student'));
app.use('/admin', require('./routes/admin'));

// Error Handlers
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.status(404).render('error', { title: 'Page not found', message: 'The page you requested does not exist.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ success: false, message: err.message });
  }
  res.status(500).render('error', {
    title: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An internal error occurred. Please try again.' : err.message
  });
});

// Real-time Socket.IO Connection Handler
io.on('connection', (socket) => {
  socket.on('join:student', (studentId) => {
    socket.join(`student:${studentId}`);
  });
  socket.on('disconnect', () => {});
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`LibraryOS backend running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is currently occupied by another process. Set PORT in .env or free the port.`);
  } else {
    console.error('Server error:', err.message);
  }
});

module.exports = { app, server };

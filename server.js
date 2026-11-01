
require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { RedisStore } = require('connect-redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Database configuration
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/advanced_library';

const REDIS_URL =
  process.env.REDIS_URL ||
  'redis://127.0.0.1:6379';

const PORT = process.env.PORT || 3000;

// Redis client
const redisClient = createClient({
  url: REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});

// Start application
async function startServer() {
  try {

    // 1. Connect MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    // 2. Connect Redis
    await redisClient.connect();
    console.log('Redis connected');

    // 3. View configuration
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // 4. Middleware
    app.use(morgan('dev'));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    app.use(express.static(
      path.join(__dirname, 'public')
    ));

    // 5. Redis session storage
    app.use(session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'lms:session:'
      }),

      secret:
        process.env.SESSION_SECRET ||
        'development-secret-change-me',

      resave: false,
      saveUninitialized: false,

      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
      }
    }));

    // 6. Local application variables
    app.use((req, res, next) => {
      res.locals.currentUser = req.session.user || null;
      res.locals.flash = req.session.flash || null;

      delete req.session.flash;

      res.locals.money = n =>
        `₹${Number(n || 0).toFixed(2)}`;

      next();
    });

    // 7. Socket.IO integration
    app.use((req, res, next) => {
      req.io = io;
      next();
    });

    io.on('connection', socket => {
      console.log(
        'Dashboard client connected:',
        socket.id
      );
    });

    // 8. Application routes
    app.use('/', require('./routes/auth'));
    app.use('/student', require('./routes/student'));
    app.use('/admin', require('./routes/admin'));

    // 9. 404 handler
    app.use((req, res) => {
      res.status(404).render('error', {
        title: 'Page not found',
        message: 'The page you requested does not exist.'
      });
    });

    // 10. Error handler
    app.use((err, req, res, next) => {
      console.error(err);

      res.status(500).render('error', {
        title: 'Something went wrong',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Please try again later.'
            : err.message
      });
    });

    // 11. Start HTTP server
    server.listen(PORT, () => {
      console.log(
        `Library app running at http://localhost:${PORT}`
      );
    });

  } catch (err) {
    console.error(
      'Application startup failed:',
      err.message
    );

    process.exit(1);
  }
}

startServer();

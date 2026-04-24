#!/usr/bin/env node

/**
 * ✅ WORKING BACKEND SERVER - Express + MongoDB + Firebase
 * This file replaces backend/server.js
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ STEP 1: LOAD ENVIRONMENT VARIABLES FIRST
console.log('🔧 Loading environment variables...');
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('⚠️  .env not found:', result.error.message);
} else {
  console.log('✅ .env loaded successfully');
}

// ✅ STEP 2: VALIDATE REQUIRED VARIABLES
const requiredVars = ['JWT_SECRET', 'MONGO_URI'];
const missingVars = requiredVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing env variables:', missingVars.join(', '));
  console.error('Please add them to backend/.env');
  process.exit(1);
}

// ✅ STEP 3: INITIALIZE DATABASE
console.log('🔌 Connecting to MongoDB...');
let dbConnected = false;
try {
  await import('./config/db.js');
  dbConnected = true;
  console.log('✅ MongoDB connected');
} catch (err) {
  console.error('❌ MongoDB connection error:', err.message);
  // Don't exit - backend can run without DB for testing
}

// ✅ STEP 4: INITIALIZE FIREBASE
console.log('🔥 Initializing Firebase Admin SDK...');
let firebaseInitialized = false;
try {
  await import('./config/firebase.js');
  firebaseInitialized = true;
  console.log('✅ Firebase initialized');
} catch (err) {
  console.error('❌ Firebase init error:', err.message);
  // Firebase might not be needed for all endpoints
}

// ✅ STEP 5: IMPORT ROUTES
console.log('📚 Loading routes...');
const { default: authRoutes } = await import('./routes/authRoutes.js');
const { default: expenseRoutes } = await import('./routes/expenseRoutes.js');

// ✅ STEP 6: CREATE EXPRESS APP
const app = express();

// ✅ STEP 7: CORS MIDDLEWARE
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl requests or mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}));

// ✅ STEP 8: BODY PARSER MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ STEP 9: REQUEST LOGGING MIDDLEWARE
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// ✅ STEP 10: API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// ✅ STEP 11: HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: dbConnected ? '✅ Connected' : '❌ Not Connected',
      firebase: firebaseInitialized ? '✅ Initialized' : '⚠️  Not Initialized',
    },
  });
});

// ✅ STEP 12: TEST ENDPOINT
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
  });
});

// ✅ STEP 13: 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    availableEndpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/google',
      'GET /api/auth/me',
      'PUT /api/auth/theme',
      'GET /api/expenses',
      'POST /api/expenses',
      'PUT /api/expenses/:id',
      'DELETE /api/expenses/:id',
      'GET /api/health',
      'GET /api/test',
    ],
  });
});

// ✅ STEP 14: ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ✅ STEP 15: START SERVER
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ✅ BACKEND RUNNING SUCCESSFULLY ✅    ║
╠════════════════════════════════════════╣
║ 🌐 Server: http://localhost:${PORT}         ║
║ 📡 API Base: http://localhost:${PORT}/api    ║
║ 🔌 MongoDB: ${dbConnected ? '✅ Connected' : '❌ Not Connected   '}║
║ 🔥 Firebase: ${firebaseInitialized ? '✅ Ready' : '⚠️  Check Config  '}║
║ 🚀 Environment: ${process.env.NODE_ENV || 'development'}       ║
╚════════════════════════════════════════╝

📝 API ENDPOINTS:
  ✅ GET  /api/health          (Check backend status)
  ✅ GET  /api/test            (Test connectivity)
  ✅ POST /api/auth/register   (User registration)
  ✅ POST /api/auth/login      (User login)
  ✅ POST /api/auth/google     (Google Sign-In)
  ✅ GET  /api/auth/me         (Get current user)
  ✅ GET  /api/expenses        (Get all expenses)
  ✅ POST /api/expenses        (Create expense)

🔧 DEBUGGING:
  • Check /api/health to verify backend
  • Check /api/test to verify connectivity
  • Frontend should send requests to: http://localhost:${PORT}/api
`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

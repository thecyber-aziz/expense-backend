#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ STEP 1: LOAD ENVIRONMENT VARIABLES
console.log('🔧 Loading environment variables...');
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('⚠️  .env not found:', result.error.message);
} else {
  console.log('✅ .env loaded successfully');
}

// ✅ STEP 2: VALIDATE REQUIRED VARIABLES
const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingVars = requiredVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing env variables:', missingVars.join(', '));
  process.exit(1);
}

// ✅ STEP 3: CONNECT TO DATABASE — FIXED
console.log('🔌 Connecting to MongoDB...');
let dbConnected = false;
try {
  const { default: connectDB } = await import('./config/db.js'); // ✅ FIXED
  await connectDB();                                              // ✅ FIXED
  dbConnected = true;
  console.log('✅ MongoDB ready');
} catch (err) {
  console.error('❌ MongoDB failed:', err.message);
  console.error('🚫 Server will NOT start without database connection');
  process.exit(1); // ✅ FIXED: stop server if DB fails, don't run blindly
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

// ✅ STEP 8: BODY PARSER
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ STEP 9: REQUEST LOGGING
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// ✅ STEP 10: ROUTES
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
  });
});

// ✅ STEP 14: ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ✅ STEP 15: START SERVER
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ✅ BACKEND RUNNING SUCCESSFULLY ✅    ║
╠════════════════════════════════════════╣
║ 🌐 Server:   http://localhost:${PORT}       ║
║ 📡 API Base: http://localhost:${PORT}/api   ║
║ 🔌 MongoDB:  ✅ Connected               ║
║ 🔥 Firebase: ${firebaseInitialized ? '✅ Ready   ' : '⚠️  Check Config'}             ║
╚════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
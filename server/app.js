
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDb, { isConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import interviewSessionRoutes from './routes/interviewSessionRoutes.js';
import learningLabRoutes from './routes/learningLabRoutes.js';

dotenv.config({ quiet: true });

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();

const PRODUCTION_ORIGINS = [
  'https://road2-dev.vercel.app',
  'https://road2-dev-0a9s.vercel.app',
];

const LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
];

const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const staticOrigins = [...new Set([...LOCAL_ORIGINS, ...PRODUCTION_ORIGINS, ...envOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, health checks, curl)
    if (!origin) return callback(null, true);
    // Allow if in the explicit allowlist
    if (staticOrigins.includes(origin)) return callback(null, true);
    // Allow Vercel preview deployments
    if (origin.startsWith('https://') && origin.endsWith('.vercel.app')) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '50mb' }));

/**
 * Middleware to ensure database connection is established before processing requests.
 * This is critical for serverless environments where connection must be ready before queries.
 */
app.use(async (req, res, next) => {
  // Skip DB check for root health check
  if (req.path === '/') {
    return next();
  }

  // If not connected, attempt to connect (or await existing connection attempt)
  if (!isConnected()) {
    try {
      await connectDb();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] DB connection failed for ${req.method} ${req.path}:`, error.message);
      return res.status(503).json({
        success: false,
        message: 'Database service temporarily unavailable. Please try again shortly.',
      });
    }
  }

  next();
});

app.get("/", (req, res) => {
    res.send({message: "API is running..."});
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/interview-sessions', interviewSessionRoutes);
app.use('/api/learning-lab', learningLabRoutes);

export default app;

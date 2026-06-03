
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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

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

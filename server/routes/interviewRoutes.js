import express from 'express';
import auth, { optionalAuth } from '../middleware/auth.js';
import { generateInterview, respondToInterview } from '../controllers/interviewController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const interviewLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: 'Too many interview generation requests. Please try again shortly.',
});

router.post('/generate', optionalAuth, interviewLimiter, generateInterview);
router.post('/respond', optionalAuth, interviewLimiter, respondToInterview);

export default router;

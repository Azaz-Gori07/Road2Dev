import express from 'express';
import auth from '../middleware/auth.js';
import { generateInterview, respondToInterview } from '../controllers/interviewController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const interviewLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: 'Too many interview generation requests. Please try again shortly.',
});

router.post('/generate', auth, interviewLimiter, generateInterview);
router.post('/respond', auth, interviewLimiter, respondToInterview);

export default router;

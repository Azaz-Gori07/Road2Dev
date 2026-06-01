import express from 'express';
import { generateInterview, respondToInterview } from '../controllers/interviewController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const interviewLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
});

router.post('/generate', interviewLimiter, generateInterview);
router.post('/respond', interviewLimiter, respondToInterview);

export default router;

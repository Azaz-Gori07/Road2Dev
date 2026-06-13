import express from 'express';
import auth, { optionalAuth } from '../middleware/auth.js';
import { generateInterview, respondToInterview } from '../controllers/interviewController.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/generate', optionalAuth, aiLimiter, generateInterview);
router.post('/respond', optionalAuth, aiLimiter, respondToInterview);

export default router;

import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { synthesizeSpeech, getTtsStatus, transcribeSpeech } from '../controllers/ttsController.js';

const router = express.Router();

// Rate limiter to prevent abuse of TTS endpoints
const ttsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 40,
  message: 'Too many text-to-speech requests. Please try again shortly.',
});

// POST /api/tts - Synthesize text to speech
router.post('/', optionalAuth, ttsLimiter, synthesizeSpeech);

// POST /api/tts/transcribe - Transcribe speech to text
router.post('/transcribe', optionalAuth, ttsLimiter, transcribeSpeech);

// GET /api/tts/status - Check if NVIDIA TTS is active on the server
router.get('/status', getTtsStatus);

export default router;

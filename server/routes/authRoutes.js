import express from 'express';
import auth from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  zenuxsLogin,
  getProfile,
  updateProfile,
  verifyToken,
} from '../controllers/authController.js';
import {
  sendOtp,
  verifyOtp,
  resendOtp,
} from '../controllers/otpController.js';

const router = express.Router();

const authLimiter = createRateLimiter({
  windowMs: 10 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

// ── Local Auth ──
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// ── OTP Registration ──
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);

// ── Zenuxs OAuth ──
router.post('/zenuxs', authLimiter, zenuxsLogin);

// ── Profile (requires auth) ──
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

// ── Legacy endpoints ──
router.post('/verify', verifyToken);

export default router;

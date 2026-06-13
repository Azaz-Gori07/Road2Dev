import express from 'express';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  zenuxsLogin,
  getProfile,
  updateProfile,
  verifyToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from '../controllers/authController.js';
import {
  sendOtp,
  verifyOtp,
  resendOtp,
} from '../controllers/otpController.js';

const router = express.Router();

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

// ── Refresh Token Management ──
router.post('/refresh', authLimiter, refreshAccessToken);
router.post('/revoke', authLimiter, revokeRefreshToken);
router.post('/revoke-all', auth, revokeAllRefreshTokens);

// ── Password Reset ──
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// ── Email Verification ──
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', auth, resendVerification);

// ── Legacy endpoints ──
router.post('/verify', authLimiter, verifyToken);

export default router;

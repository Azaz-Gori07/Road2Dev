import express from 'express';
import auth from '../middleware/auth.js';
import {
  register,
  login,
  zenuxsLogin,
  getProfile,
  updateProfile,
  verifyToken,
  syncUserProfile,
} from '../controllers/authController.js';
import {
  sendOtp,
  verifyOtp,
  resendOtp,
} from '../controllers/otpController.js';

const router = express.Router();

// ── Local Auth ──
router.post('/register', register);
router.post('/login', login);

// ── OTP Registration ──
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// ── Zenuxs OAuth ──
router.post('/zenuxs', zenuxsLogin);

// ── Profile (requires auth) ──
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

// ── Legacy endpoints ──
router.post('/verify', verifyToken);
router.post('/sync', syncUserProfile);

export default router;

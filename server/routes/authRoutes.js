import express from 'express';
import { verifyToken, syncUserProfile } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/verify - Verify an OAuth token
router.post('/verify', verifyToken);

// POST /api/auth/sync - Sync user profile from OAuth
router.post('/sync', syncUserProfile);

export default router;
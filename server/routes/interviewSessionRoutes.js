import express from 'express';
import auth from '../middleware/auth.js';
import { draftLimiter, publishLimiter } from '../middleware/rateLimiter.js';
import {
  createInterviewSession,
  getInterviewSession,
  getInterviewSessions,
  updateInterviewSession,
  deleteInterviewSession,
} from '../controllers/interviewSessionController.js';

const router = express.Router();

router.use(auth);

router.get('/', getInterviewSessions);
router.post('/', draftLimiter, createInterviewSession);
router.get('/:id', getInterviewSession);
router.put('/:id', draftLimiter, updateInterviewSession);
router.delete('/:id', publishLimiter, deleteInterviewSession);

export default router;

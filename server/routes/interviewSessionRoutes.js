import express from 'express';
import auth from '../middleware/auth.js';
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
router.post('/', createInterviewSession);
router.get('/:id', getInterviewSession);
router.put('/:id', updateInterviewSession);
router.delete('/:id', deleteInterviewSession);

export default router;

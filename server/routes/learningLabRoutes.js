import express from 'express';
import auth from '../middleware/auth.js';
import {
  getLearningSessions,
  getLearningSession,
  createLearningSession,
  sendChatMessage,
  runSandboxCode,
  submitSandboxCode,
  ingestProject,
  startProjectDefense,
  submitProjectDefenseAnswer,
  getCareerCoachRoadmap,
  updateLearningSession,
  getTimelineEvents,
  getSandboxHistory,
  getLearningAnalytics,
  getRecommendations,
  archiveLearningSession,
  deleteLearningSession
} from '../controllers/learningLabController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const learningLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});

router.use(auth);

router.get('/sessions', getLearningSessions);
router.get('/session/:id', getLearningSession);
router.post('/session', learningLimiter, createLearningSession);
router.put('/session/:id', learningLimiter, updateLearningSession);
router.post('/session/:id/chat', learningLimiter, sendChatMessage);
router.post('/playground/run', learningLimiter, runSandboxCode);
router.post('/session/:id/playground/submit', learningLimiter, submitSandboxCode);
router.post('/project/ingest', learningLimiter, ingestProject);
router.post('/session/:id/project/start-defense', learningLimiter, startProjectDefense);
router.post('/session/:id/project/defense', learningLimiter, submitProjectDefenseAnswer);
router.post('/career-coach', learningLimiter, getCareerCoachRoadmap);

// New history, memory & analytics endpoints
router.get('/timeline', getTimelineEvents);
router.get('/sandbox-history', getSandboxHistory);
router.get('/analytics', getLearningAnalytics);
router.get('/recommendations', getRecommendations);
router.post('/session/:id/archive', learningLimiter, archiveLearningSession);
router.delete('/session/:id', learningLimiter, deleteLearningSession);

export default router;

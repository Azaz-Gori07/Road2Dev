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
  deleteLearningSession,
  createLearningPathFromRecommendation,
  getUnifiedDashboard
} from '../controllers/learningLabController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const learningLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});

const readLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

router.use(auth);

router.get('/sessions', readLimiter, getLearningSessions);
router.get('/session/:id', readLimiter, getLearningSession);
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
router.get('/timeline', readLimiter, getTimelineEvents);
router.get('/sandbox-history', readLimiter, getSandboxHistory);
router.get('/analytics', readLimiter, getLearningAnalytics);
router.get('/recommendations', readLimiter, getRecommendations);
router.post('/create-learning-path', learningLimiter, createLearningPathFromRecommendation);
router.get('/unified-dashboard', readLimiter, getUnifiedDashboard);
router.post('/session/:id/archive', learningLimiter, archiveLearningSession);
router.delete('/session/:id', learningLimiter, deleteLearningSession);

export default router;

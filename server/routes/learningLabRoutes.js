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
import { createRateLimiter, aiLimiter, draftLimiter, publishLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const readLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

router.use(auth);

router.get('/sessions', readLimiter, getLearningSessions);
router.get('/session/:id', readLimiter, getLearningSession);
router.post('/session', draftLimiter, createLearningSession);
router.put('/session/:id', draftLimiter, updateLearningSession);
router.post('/session/:id/chat', aiLimiter, sendChatMessage);
router.post('/playground/run', aiLimiter, runSandboxCode);
router.post('/session/:id/playground/submit', aiLimiter, submitSandboxCode);
router.post('/project/ingest', aiLimiter, ingestProject);
router.post('/session/:id/project/start-defense', aiLimiter, startProjectDefense);
router.post('/session/:id/project/defense', aiLimiter, submitProjectDefenseAnswer);
router.post('/career-coach', aiLimiter, getCareerCoachRoadmap);

// New history, memory & analytics endpoints
router.get('/timeline', readLimiter, getTimelineEvents);
router.get('/sandbox-history', readLimiter, getSandboxHistory);
router.get('/analytics', readLimiter, getLearningAnalytics);
router.get('/recommendations', readLimiter, getRecommendations);
router.post('/create-learning-path', aiLimiter, createLearningPathFromRecommendation);
router.get('/unified-dashboard', readLimiter, getUnifiedDashboard);
router.post('/session/:id/archive', publishLimiter, archiveLearningSession);
router.delete('/session/:id', publishLimiter, deleteLearningSession);

export default router;

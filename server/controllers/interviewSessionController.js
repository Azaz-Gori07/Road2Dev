import {
  createSession,
  getSessionById,
  listSessionsForUser,
  updateSession,
  deleteSession,
} from '../services/interviewSessionService.js';

const VALID_STATUS = new Set(['draft', 'incomplete', 'active', 'completed', 'archived', 'in_progress', 'abandoned']);

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const sanitizePayload = (payload = {}) => {
  const updates = {};

  if (payload.title !== undefined) updates.title = cleanText(payload.title);
  if (payload.field !== undefined) updates.field = cleanText(payload.field);
  if (payload.stack !== undefined) updates.stack = cleanText(payload.stack);
  if (payload.experience !== undefined) updates.experience = cleanText(payload.experience);
  if (payload.type !== undefined) updates.type = cleanText(payload.type);
  if (payload.status !== undefined && VALID_STATUS.has(cleanText(payload.status))) {
    updates.status = cleanText(payload.status);
  }
  if (payload.score !== undefined && typeof payload.score === 'number') {
    updates.score = payload.score;
  }
  if (payload.messages !== undefined && Array.isArray(payload.messages)) {
    updates.messages = payload.messages;
  }
  if (payload.feedback !== undefined) {
    updates.feedback = cleanText(payload.feedback);
  }
  if (payload.questions !== undefined && Array.isArray(payload.questions)) {
    updates.questions = payload.questions;
  }
  if (payload.tips !== undefined && Array.isArray(payload.tips)) {
    updates.tips = payload.tips;
  }
  if (payload.currentQuestionIndex !== undefined && typeof payload.currentQuestionIndex === 'number') {
    updates.currentQuestionIndex = payload.currentQuestionIndex;
  }
  if (payload.totalQuestions !== undefined && typeof payload.totalQuestions === 'number') {
    updates.totalQuestions = payload.totalQuestions;
  }
  if (payload.completedQuestions !== undefined && typeof payload.completedQuestions === 'number') {
    updates.completedQuestions = payload.completedQuestions;
  }
  if (payload.skippedQuestions !== undefined && typeof payload.skippedQuestions === 'number') {
    updates.skippedQuestions = payload.skippedQuestions;
  }
  if (payload.timerState !== undefined && typeof payload.timerState === 'number') {
    updates.timerState = payload.timerState;
  }
  if (payload.difficulty !== undefined) {
    updates.difficulty = cleanText(payload.difficulty);
  }

  return updates;
};

const validateCreatePayload = (payload = {}) => {
  const field = cleanText(payload.field);
  const experience = cleanText(payload.experience);
  const type = cleanText(payload.type);
  const title = payload.title ? cleanText(payload.title) : 'Interview Session';

  if (!field) {
    return { error: 'Field is required for interview session.' };
  }

  if (!experience) {
    return { error: 'Experience is required for interview session.' };
  }

  if (!type) {
    return { error: 'Type is required for interview session.' };
  }

  return {
    value: {
      title,
      field,
      stack: cleanText(payload.stack),
      experience,
      type,
      status: VALID_STATUS.has(cleanText(payload.status)) ? cleanText(payload.status) : 'draft',
      score: typeof payload.score === 'number' ? payload.score : 0,
      messages: Array.isArray(payload.messages) ? payload.messages : [],
      feedback: cleanText(payload.feedback),
      questions: Array.isArray(payload.questions) ? payload.questions : [],
      tips: Array.isArray(payload.tips) ? payload.tips : [],
      currentQuestionIndex: typeof payload.currentQuestionIndex === 'number' ? payload.currentQuestionIndex : 0,
      totalQuestions: typeof payload.totalQuestions === 'number' ? payload.totalQuestions : 0,
      completedQuestions: typeof payload.completedQuestions === 'number' ? payload.completedQuestions : 0,
      skippedQuestions: typeof payload.skippedQuestions === 'number' ? payload.skippedQuestions : 0,
      timerState: typeof payload.timerState === 'number' ? payload.timerState : 0,
      difficulty: payload.difficulty ? cleanText(payload.difficulty) : 'Medium',
    },
  };
};

export const createInterviewSession = async (req, res) => {
  const validation = validateCreatePayload(req.body);

  if (validation.error) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  try {
    const session = await createSession(req.user._id, validation.value);
    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Create interview session failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to create interview session.' });
  }
};

export const getInterviewSession = async (req, res) => {
  try {
    const session = await getSessionById(req.params.id, req.user._id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.error('Fetch interview session failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to fetch interview session.' });
  }
};

export const getInterviewSessions = async (req, res) => {
  try {
    const sessions = await listSessionsForUser(req.user._id);
    return res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error('List interview sessions failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to list interview sessions.' });
  }
};

export const updateInterviewSession = async (req, res) => {
  const updates = sanitizePayload(req.body);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
  }

  try {
    const updated = await updateSession(req.params.id, req.user._id, updates);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Interview session not found or not owned by user.' });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update interview session failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to update interview session.' });
  }
};

export const deleteInterviewSession = async (req, res) => {
  try {
    const removed = await deleteSession(req.params.id, req.user._id);

    if (!removed) {
      return res.status(404).json({ success: false, message: 'Interview session not found or not owned by user.' });
    }

    return res.status(200).json({ success: true, message: 'Interview session deleted.' });
  } catch (error) {
    console.error('Delete interview session failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to delete interview session.' });
  }
};

import { generateInterviewSession, evaluateResponseAndNext } from '../services/interviewAiService.js';
import InterviewSession from '../models/InterviewSession.js';

const MAX_FIELD_LENGTH = 80;
const MAX_STACK_LENGTH = 80;
const VALID_EXPERIENCE = new Set(['fresher', 'junior', 'mid', 'senior']);
const VALID_INTERVIEW_TYPES = new Set(['technical', 'hr', 'behavioral', 'system-design', 'mixed']);

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const validateRequestBody = (body = {}) => {
  const field = cleanText(body.field);
  const stack = cleanText(body.stack);
  const experienceLevel = cleanText(body.experienceLevel);
  const interviewType = cleanText(body.interviewType);

  if (!field || field.length > MAX_FIELD_LENGTH) {
    return { error: 'A valid field/domain is required.' };
  }

  if (stack.length > MAX_STACK_LENGTH) {
    return { error: 'Selected stack is too long.' };
  }

  if (!VALID_EXPERIENCE.has(experienceLevel)) {
    return { error: 'A valid experience level is required.' };
  }

  if (!VALID_INTERVIEW_TYPES.has(interviewType)) {
    return { error: 'A valid interview type is required.' };
  }

  return {
    value: {
      field,
      stack,
      experienceLevel,
      interviewType,
    },
  };
};

export const generateInterview = async (req, res) => {
  const validation = validateRequestBody(req.body);

  if (validation.error) {
    return res.status(400).json({
      success: false,
      message: validation.error,
    });
  }

  try {
    const interview = await generateInterviewSession(validation.value);

    return res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    console.error('Interview generation failed:', error.message);

    return res.status(statusCode).json({
      success: false,
      message: error.publicMessage || 'Interview generation failed. Please try again later.',
    });
  }
};

export const respondToInterview = async (req, res) => {
  const field = cleanText(req.body.field);
  const stack = cleanText(req.body.stack);
  const experienceLevel = cleanText(req.body.experienceLevel);
  const interviewType = cleanText(req.body.interviewType);
  const messages = req.body.messages;
  const currentSessionId = req.body.sessionId ? cleanText(req.body.sessionId) : null;

  if (!field) {
    return res.status(400).json({ success: false, message: 'A valid field/domain is required.' });
  }

  if (!VALID_EXPERIENCE.has(experienceLevel)) {
    return res.status(400).json({ success: false, message: 'A valid experience level is required.' });
  }

  if (!VALID_INTERVIEW_TYPES.has(interviewType)) {
    return res.status(400).json({ success: false, message: 'A valid interview type is required.' });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'Messages conversation history is required.' });
  }

  try {
    let previousSummaries = [];
    if (req.user && req.user._id) {
      const query = {
        userId: req.user._id,
        field: field,
        status: 'completed',
      };
      if (currentSessionId) {
        query._id = { $ne: currentSessionId };
      }

      const previousSessions = await InterviewSession.find(query)
        .sort({ createdAt: -1 })
        .limit(3)
        .select('score messages createdAt');

      previousSummaries = previousSessions.map((session) => {
        const summaryMsg = session.messages.find((m) => m.type === 'summary');
        return {
          date: session.createdAt,
          overallScore: session.score,
          strengths: summaryMsg?.summary?.strengths || [],
          weaknesses: summaryMsg?.summary?.weaknesses || [],
          recommendedTopics: summaryMsg?.summary?.recommendedTopics || [],
          skillsPerformance: summaryMsg?.summary?.skillsPerformance || [],
          coveragePercentage: summaryMsg?.summary?.coveragePercentage || 0,
        };
      });
    }

    const candidateName = req.user ? req.user.name : 'Candidate';

    const evaluation = await evaluateResponseAndNext({
      field,
      stack,
      experienceLevel,
      interviewType,
      messages,
      previousSummaries,
      candidateName,
    });

    return res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error('Interview response evaluation failed:', error.message);
    return res.status(statusCode).json({
      success: false,
      message: error.publicMessage || 'Interview evaluation failed. Please try again later.',
    });
  }
};

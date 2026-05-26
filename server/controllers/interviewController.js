import { generateInterviewSession } from '../services/interviewAiService.js';

const MAX_FIELD_LENGTH = 80;
const MAX_STACK_LENGTH = 80;
const VALID_EXPERIENCE = new Set(['fresher', 'junior', 'mid', 'senior']);
const VALID_INTERVIEW_TYPES = new Set(['technical', 'hr', 'behavioral', 'mixed']);

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

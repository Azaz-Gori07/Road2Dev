import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    role: { type: String, required: true },
    type: { type: String, required: true },
    text: { type: String, default: '' },
    question: {
      question: String,
      difficulty: String,
      expectedFocus: String,
      followUps: [String],
    },
    analysis: {
      correctness: String,
      technicalDepth: String,
      communication: String,
      missingPoints: String,
      confidence: String,
    },
    improvedAnswer: { type: String, default: '' },
    tips: { type: [String], default: [] },
    score: {
      accuracy: Number,
      technical: Number,
      communication: Number,
      confidence: Number,
    },
    summary: {
      overallScore: Number,
      completed: Number,
      totalQuestions: Number,
      strengths: [String],
      weaknesses: [String],
      recommendedTopics: [String],
      readiness: String,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, default: 'Interview Session' },
    field: { type: String, required: true, trim: true },
    stack: { type: String, trim: true, default: '' },
    experience: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'incomplete', 'active', 'completed', 'archived', 'in_progress', 'abandoned'],
      default: 'draft',
    },
    score: { type: Number, default: 0 },
    messages: { type: [messageSchema], default: [] },
    feedback: { type: String, trim: true, default: '' },
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    tips: { type: [String], default: [] },
    currentQuestionIndex: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    completedQuestions: { type: Number, default: 0 },
    skippedQuestions: { type: Number, default: 0 },
    timerState: { type: Number, default: 0 },
    difficulty: { type: String, default: 'Medium' },
  },
  {
    timestamps: true,
  }
);

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
export default InterviewSession;

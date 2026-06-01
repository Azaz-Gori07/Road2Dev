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
      scoringJustification: String,
      coveredSkills: [String],
      strongSkills: [String],
      weakSkills: [String],
      skillsPerformance: [{
        skill: String,
        status: { type: String, enum: ['mastered', 'average', 'weak', 'not_assessed'], default: 'not_assessed' },
        confidence: String,
        evidence: String,
      }],
      coveragePercentage: { type: Number, default: 0 },
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
      technicalScore: Number,
      communicationScore: Number,
      problemSolvingScore: Number,
      confidenceScore: Number,
      completed: Number,
      totalQuestions: Number,
      strengths: [String],
      weaknesses: [String],
      recommendedTopics: [String],
      readiness: String,
      marketReadiness: String,
      learningRoadmap: [String],
      closingMessage: String,
      hiringRecommendation: {
        recommendation: { type: String, enum: ['Strong Hire', 'Hire', 'Borderline', 'Not Yet Ready'], default: 'Borderline' },
        confidence: String,
        strengths: [String],
        weaknesses: [String],
        hiring_rationale: String,
      },
      skillsPerformance: [{
        skill: String,
        status: { type: String, enum: ['mastered', 'average', 'weak', 'not_assessed'], default: 'not_assessed' },
        confidence: String,
        evidence: String,
      }],
      coveragePercentage: { type: Number, default: 0 },
      marketReadinessMatrix: {
        internship: { type: String, default: 'Not Assessed' },
        junior: { type: String, default: 'Not Assessed' },
        midLevel: { type: String, default: 'Not Assessed' },
        senior: { type: String, default: 'Not Assessed' }
      },
      timePhasedLearningPlan: {
        immediate: [String],
        next30Days: [String],
        next90Days: [String]
      }
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

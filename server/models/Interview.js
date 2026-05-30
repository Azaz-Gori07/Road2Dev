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
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const analyticsSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
    readinessLevel: { type: String, default: 'Needs more practice' },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    improvementSuggestions: { type: [String], default: [] },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, default: 'Interview Practice Session' },
    field: { type: String, required: true, trim: true },
    stack: { type: String, trim: true, default: '' },
    interviewType: { type: String, required: true, trim: true },
    experienceLevel: { type: String, required: true, trim: true },
    interviewSession: { type: mongoose.Schema.Types.Mixed, default: {} },
    messages: { type: [messageSchema], default: [] },
    analytics: { type: analyticsSchema, default: () => ({}) },
    scores: {
      overall: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
    },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true },
    durationSeconds: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;

import mongoose from 'mongoose';

const sandboxSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learningSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSession', required: true },
  challengeTitle: { type: String, required: true }, // e.g. "Private Counter Challenge"
  code: { type: String, required: true },
  stdout: { type: String, default: '' },
  error: { type: String, default: '' },
  passed: { type: Boolean, required: true },
  feedback: { type: String, default: '' },
  scores: {
    conceptUnderstanding: { type: Number, default: 0 },
    codingAbility: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    codeQuality: { type: Number, default: 0 },
    projectReadiness: { type: Number, default: 0 },
    interviewReadiness: { type: Number, default: 0 }
  },
  mode: { type: String, enum: ['practice', 'challenge', 'assessment'], default: 'challenge' },
  attemptNumber: { type: Number, default: 1 }
}, {
  timestamps: true
});

const SandboxSubmission = mongoose.model('SandboxSubmission', sandboxSubmissionSchema);
export default SandboxSubmission;

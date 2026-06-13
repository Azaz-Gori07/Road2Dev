import mongoose from 'mongoose';

const mentorMemorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true }, // e.g. "JavaScript Closures"
  conceptUnderstanding: { type: Number, default: 0 },
  codingAbility: { type: Number, default: 0 },
  problemSolving: { type: Number, default: 0 },
  projectUsage: { type: Number, default: 0 },
  interviewReadiness: { type: Number, default: 0 },
  mastery: { type: Number, default: 0 },
  attemptCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  lastReviewDate: { type: Date, default: Date.now },
  evidenceCounts: {
    sandbox: { type: Number, default: 0 },
    interview: { type: Number, default: 0 },
    defense: { type: Number, default: 0 }
  },
  sources: [{
    refType: { type: String, required: true }, // e.g., 'SandboxSubmission', 'InterviewSession', 'LearningSession'
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    source: { type: String, required: true }, // e.g., 'sandbox_passed', 'interview_completed', 'project_defense_completed'
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

mentorMemorySchema.index({ userId: 1, topic: 1 }, { unique: true });
mentorMemorySchema.index({ userId: 1 });

const MentorMemory = mongoose.model('MentorMemory', mentorMemorySchema);
export default MentorMemory;

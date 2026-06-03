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
  lastReviewDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const MentorMemory = mongoose.model('MentorMemory', mentorMemorySchema);
export default MentorMemory;

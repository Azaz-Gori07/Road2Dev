import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learningSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningSession', default: null },
  action: { type: String, required: true }, // e.g. "Started", "Completed", "Passed", "Failed", "Retried"
  topic: { type: String, required: true }, // e.g. "JavaScript Closures"
  detail: { type: String, default: '' }, // e.g. "Counter Challenge", "Understanding Check"
  status: { type: String, default: 'active' }, // e.g. "completed", "failed", "passed", "started"
}, {
  timestamps: true
});

timelineEventSchema.index({ userId: 1, createdAt: -1 });
timelineEventSchema.index({ action: 1 });

const TimelineEvent = mongoose.model('TimelineEvent', timelineEventSchema);
export default TimelineEvent;

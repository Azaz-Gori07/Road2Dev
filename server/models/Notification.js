import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['learning', 'interview', 'system'], default: 'learning' },
  title: { type: String, required: true },
  detail: { type: String, default: '' },
  read: { type: Boolean, default: false },
  refType: { type: String, default: '' },
  refId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

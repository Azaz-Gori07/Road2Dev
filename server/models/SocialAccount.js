import mongoose from 'mongoose';

const socialAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true, enum: ['zenuxs', 'google', 'github'] },
  providerId: { type: String, required: true },
  email: { type: String, default: '' },
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  accessToken: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
}, {
  timestamps: true,
});

socialAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });
socialAccountSchema.index({ userId: 1 });

const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);
export default SocialAccount;

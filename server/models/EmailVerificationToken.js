import mongoose from 'mongoose';
import crypto from 'crypto';

const emailVerificationTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

emailVerificationTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(40).toString('hex');
};

emailVerificationTokenSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

emailVerificationTokenSchema.statics.createForUser = async function (userId, ttlMinutes = 1440) {
  const token = this.generateToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await this.create({
    userId,
    tokenHash: this.hashToken(token),
    expiresAt,
  });

  return { token, expiresAt };
};

emailVerificationTokenSchema.statics.findValid = async function (token) {
  const tokenHash = this.hashToken(token);
  return this.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
};

emailVerificationTokenSchema.statics.markUsed = async function (token) {
  const tokenHash = this.hashToken(token);
  return this.updateOne(
    { tokenHash, usedAt: null },
    { $set: { usedAt: new Date() } }
  );
};

const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
export default EmailVerificationToken;

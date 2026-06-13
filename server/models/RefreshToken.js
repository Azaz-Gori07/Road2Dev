import mongoose from 'mongoose';
import crypto from 'crypto';

const refreshTokenSchema = new mongoose.Schema({
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
  family: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  replacedBy: {
    type: String,
    default: null,
  },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

refreshTokenSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

refreshTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(48).toString('hex');
};

refreshTokenSchema.statics.createForUser = async function (userId, ttlDays = 30) {
  const token = this.generateToken();
  const family = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await this.create({
    userId,
    tokenHash: this.hashToken(token),
    family,
    expiresAt,
  });

  return { token, expiresAt };
};

refreshTokenSchema.statics.findValid = async function (token) {
  const tokenHash = this.hashToken(token);
  return this.findOne({
    tokenHash,
    revokedAt: null,
    replacedBy: null,
    expiresAt: { $gt: new Date() },
  });
};

refreshTokenSchema.statics.rotate = async function (oldToken, ttlDays = 30) {
  const tokenHash = this.hashToken(oldToken);
  const existing = await this.findOne({
    tokenHash,
    revokedAt: null,
    replacedBy: null,
    expiresAt: { $gt: new Date() },
  });

  if (!existing) return null;

  const newToken = this.generateToken();
  const newTokenHash = this.hashToken(newToken);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await this.create({
    userId: existing.userId,
    tokenHash: newTokenHash,
    family: existing.family,
    expiresAt,
  });

  existing.replacedBy = newTokenHash;
  await existing.save();

  return { token: newToken, expiresAt, userId: existing.userId };
};

refreshTokenSchema.statics.revoke = async function (token) {
  const tokenHash = this.hashToken(token);
  await this.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

refreshTokenSchema.statics.revokeAllForUser = async function (userId, exceptToken) {
  const query = { userId, revokedAt: null };
  if (exceptToken) {
    const exceptHash = this.hashToken(exceptToken);
    query.tokenHash = { $ne: exceptHash };
  }
  await this.updateMany(query, { $set: { revokedAt: new Date() } });
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;

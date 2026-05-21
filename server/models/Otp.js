import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  name: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    default: '',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
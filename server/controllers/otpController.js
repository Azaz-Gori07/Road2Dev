import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/mailer.js';
import jwt from 'jsonwebtoken';
import { success, error } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Helper: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Generate 6-digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Helper: Hash OTP for storage (never store plaintext)
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * POST /api/auth/send-otp
 * Send OTP to email for registration
 */
export const sendOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return error(res, { message: 'Name, email, and password are required', status: 400 });
    }

    if (password.length < 6) {
      return error(res, { message: 'Password must be at least 6 characters', status: 400 });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, { message: 'An account with this email already exists', status: 400 });
    }

    // Delete any previous OTPs for this email
    await Otp.deleteMany({ email });

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await Otp.create({
      email,
      otp: hashOtp(otp),
      name,
      password: hashedPassword,
      expiresAt,
    });

    // Send OTP email
    const sent = await sendOtpEmail(email, otp);

    if (!sent) {
      // If email sending fails, still save OTP but warn
      console.warn('OTP email could not be sent. Check EMAIL_USER/EMAIL_PASS in .env');
    }

    return success(res, { message: 'OTP sent successfully to your email', data: { email } });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    if (error.code === 11000) {
      return error(res, { message: 'An account with this email already exists', status: 400 });
    }
    return error(res, { message: 'Failed to send OTP. Please try again.', status: 500 });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and create user account
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return error(res, { message: 'Email and OTP are required', status: 400 });
    }

    // Find the OTP record
    const otpRecord = await Otp.findOne({ email, verified: false });

    if (!otpRecord) {
      return error(res, { message: 'No OTP found. Please request a new one.', status: 400 });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return error(res, { message: 'OTP has expired. Please request a new one.', status: 400 });
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return error(res, { message: 'Too many failed attempts. Please request a new OTP.', status: 400 });
    }

    // Verify OTP
    if (otpRecord.otp !== hashOtp(otp)) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return error(res, { message: 'Invalid OTP. Please try again.', status: 400 });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Create the user
    const user = await User.create({
      name: otpRecord.name,
      email: otpRecord.email,
      password: otpRecord.password,
      authProvider: 'local',
      emailVerified: true,
    });

    // Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);

    return success(res, { message: 'Account created successfully', data: { token, user: user.toJSON() }, status: 201 });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    if (error.code === 11000) {
      return error(res, { message: 'An account with this email already exists', status: 400 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return error(res, { message: messages.join('. '), status: 400 });
    }
    return error(res, { message: 'Verification failed. Please try again.', status: 500 });
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend OTP to email
 */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, { message: 'Email is required', status: 400 });
    }

    // Find existing OTP record
    const otpRecord = await Otp.findOne({ email, verified: false });

    if (!otpRecord) {
      return error(res, { message: 'No pending registration found. Please start again.', status: 400 });
    }

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    otpRecord.otp = hashOtp(otp);
    otpRecord.expiresAt = expiresAt;
    otpRecord.attempts = 0;
    await otpRecord.save();

    // Send OTP email
    await sendOtpEmail(email, otp);

    return success(res, { message: 'OTP resent successfully', data: { email } });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    return error(res, { message: 'Failed to resend OTP. Please try again.', status: 500 });
  }
};
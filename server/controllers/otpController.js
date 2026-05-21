import Otp from '../models/Otp.js';
import User from '../models/User.js';
import { sendOtpEmail } from '../utils/mailer.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Helper: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Generate 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/auth/send-otp
 * Send OTP to email for registration
 */
export const sendOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Delete any previous OTPs for this email
    await Otp.deleteMany({ email });

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.create({
      email,
      otp,
      name,
      password,
      expiresAt,
    });

    // Send OTP email
    const sent = await sendOtpEmail(email, otp);

    if (!sent) {
      // If email sending fails, still save OTP but warn
      console.warn('OTP email could not be sent. Check EMAIL_USER/EMAIL_PASS in .env');
    }

    res.json({
      message: 'OTP sent successfully to your email',
      email,
      // In development, send OTP in response for testing
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
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
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find the OTP record
    const otpRecord = await Otp.findOne({ email, verified: false });

    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
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
    });

    // Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('. ') });
    }
    res.status(500).json({ error: 'Verification failed. Please try again.' });
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
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find existing OTP record
    const otpRecord = await Otp.findOne({ email, verified: false });

    if (!otpRecord) {
      return res.status(400).json({ error: 'No pending registration found. Please start again.' });
    }

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    otpRecord.otp = otp;
    otpRecord.expiresAt = expiresAt;
    otpRecord.attempts = 0;
    await otpRecord.save();

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.json({
      message: 'OTP resent successfully',
      email,
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
  }
};
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/mailer.js';
import { success, error } from '../utils/response.js';

const AUTH_SERVER = 'https://api.auth.zenuxs.in';
const JWT_SECRET = process.env.JWT_SECRET;

// Helper: Generate JWT access token (short-lived)
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' });
};

// Helper: Generate refresh token (long-lived, stored in DB)
const generateRefreshToken = async (userId) => {
  return RefreshToken.createForUser(userId, 30);
};

/* ═══════════════════════════════════════════════════
   LOCAL AUTH (Email / Password)
   ═══════════════════════════════════════════════════ */

/**
 * POST /api/auth/register
 * Register a new user with email & password
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return error(res, { message: 'Name, email, and password are required', status: 400 });
    }

    if (password.length < 6) {
      return error(res, { message: 'Password must be at least 6 characters', status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, { message: 'An account with this email already exists', status: 400 });
    }

    const user = await User.create({ name, email, password, authProvider: 'local', emailVerified: false });
    const token = generateToken(user._id);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user._id);

    const { token: verificationToken } = await EmailVerificationToken.createForUser(user._id, 1440);
    sendVerificationEmail(email, verificationToken, user.name).catch(() => {});

    return success(res, {
      message: 'Registration successful',
      data: {
        token,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
        user: user.toJSON(),
      },
      status: 201,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    console.error('Full error:', err);
    if (err.code === 11000) {
      return error(res, { message: 'An account with this email already exists', status: 400 });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return error(res, { message: messages.join('. '), status: 400 });
    }
    if (err.name === 'MongooseError' || err.name === 'MongoServerSelectionError') {
      return error(res, { message: 'Database connection error. Please check your MongoDB connection.', status: 500 });
    }
    return error(res, { message: 'Registration failed. Please try again.', status: 500 });
  }
};

/**
 * POST /api/auth/login
 * Login with email & password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, { message: 'Email and password are required', status: 400 });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return error(res, { message: 'Invalid email or password', status: 401 });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, { message: 'Invalid email or password', status: 401 });
    }

    const token = generateToken(user._id);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user._id);

    return success(res, {
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return error(res, { message: 'Login failed. Please try again.', status: 500 });
  }
};

/* ═══════════════════════════════════════════════════
   ZENUXS OAUTH INTEGRATION
   ═══════════════════════════════════════════════════ */

/**
 * POST /api/auth/zenuxs
 * Login/Register via Zenuxs OAuth token
 */
export const zenuxsLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return error(res, { message: 'Token is required', status: 400 });
    }

    // Verify token and fetch user info from Zenuxs in one call
    let userRes;
    try {
      userRes = await axios.get(`${AUTH_SERVER}/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        return error(res, { message: 'Invalid or expired token', status: 401 });
      }
      throw err;
    }

    const zenuxsUser = userRes.data;
    const email = zenuxsUser.email || zenuxsUser.preferred_username;

    if (!email) {
      return error(res, { message: 'Could not retrieve email from OAuth provider', status: 400 });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // Update auth provider info if previously local
      if (user.authProvider === 'local') {
        user.authProvider = 'zenuxs';
        user.zenuxsId = zenuxsUser.sub || zenuxsUser.id;
        await user.save();
      }
    } else {
      // Create new user from Zenuxs data
      user = await User.create({
        name: zenuxsUser.name || zenuxsUser.preferred_username || email.split('@')[0],
        email,
        password: `zenuxs_${Date.now()}_${Math.random().toString(36).slice(2)}`, // random password
        authProvider: 'zenuxs',
        zenuxsId: zenuxsUser.sub || zenuxsUser.id,
        headline: zenuxsUser.headline || 'Full Stack Developer',
        emailVerified: true,
      });
    }

    const accessToken = generateToken(user._id);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user._id);

    return success(res, {
      message: 'OAuth login successful',
      data: {
        token: accessToken,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    console.error('Zenuxs login error:', err.message);
    return error(res, { message: 'OAuth login failed. Please try again.', status: 500 });
  }
};

/* ═══════════════════════════════════════════════════
   PROFILE
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/auth/profile
 * Get the authenticated user's profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return error(res, { message: 'User not found', status: 404 });
    }
    return success(res, {
      message: 'Profile retrieved',
      data: { user: user.toJSON() },
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    return error(res, { message: 'Failed to fetch profile', status: 500 });
  }
};

/**
 * PUT /api/auth/profile
 * Update the authenticated user's profile
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'headline', 'location', 'bio', 'stack',
      'expLevel', 'focus', 'language', 'avatar',
      'emailNotifications', 'publicProfile', 'communicationMode', 'interviewLanguage',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return error(res, { message: 'User not found', status: 404 });
    }

    return success(res, {
      message: 'Profile updated successfully',
      data: { user: user.toJSON() },
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return error(res, { message: messages.join('. '), status: 400 });
    }
    return error(res, { message: 'Failed to update profile', status: 500 });
  }
};

/* ═══════════════════════════════════════════════════
   REFRESH TOKEN MANAGEMENT
   ═══════════════════════════════════════════════════ */

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token for a new access + refresh token pair
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, { message: 'Refresh token is required', status: 400 });
    }

    const rotated = await RefreshToken.rotate(refreshToken, 30);

    if (!rotated) {
      return error(res, { message: 'Invalid or expired refresh token', status: 401 });
    }

    const accessToken = generateToken(rotated.userId);

    return success(res, {
      message: 'Token refreshed successfully',
      data: {
        token: accessToken,
        refreshToken: rotated.token,
        refreshTokenExpiresAt: rotated.expiresAt,
      },
    });
  } catch (err) {
    console.error('Refresh token error:', err.message);
    return error(res, { message: 'Failed to refresh token', status: 500 });
  }
};

/**
 * POST /api/auth/revoke
 * Revoke a specific refresh token (e.g. on logout)
 */
export const revokeRefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, { message: 'Refresh token is required', status: 400 });
    }

    await RefreshToken.revoke(refreshToken);

    return success(res, { message: 'Token revoked successfully' });
  } catch (err) {
    console.error('Revoke token error:', err.message);
    return error(res, { message: 'Failed to revoke token', status: 500 });
  }
};

/**
 * POST /api/auth/revoke-all
 * Revoke all refresh tokens for the authenticated user
 * Useful for password reset or security concerns
 */
export const revokeAllRefreshTokens = async (req, res) => {
  try {
    const { exceptToken } = req.body;

    await RefreshToken.revokeAllForUser(req.user._id, exceptToken);

    return success(res, { message: 'All tokens revoked successfully' });
  } catch (err) {
    console.error('Revoke all tokens error:', err.message);
    return error(res, { message: 'Failed to revoke tokens', status: 500 });
  }
};

/* ═══════════════════════════════════════════════════
   PASSWORD RESET
   ═══════════════════════════════════════════════════ */

/**
 * POST /api/auth/forgot-password
 * Send a password reset email with a time-limited token
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, { message: 'Email is required', status: 400 });
    }

    const user = await User.findOne({ email });

    // Always return 200 to prevent email enumeration
    if (!user || user.authProvider !== 'local') {
      return success(res, { message: 'If the email exists, a reset link has been sent.' });
    }

    const { token, expiresAt } = await PasswordResetToken.createForUser(user._id, 15);

    const sent = await sendPasswordResetEmail(email, token, user.name);

    if (!sent) {
      return error(res, { message: 'Failed to send reset email. Please try again later.', status: 500 });
    }

    return success(res, {
      message: 'If the email exists, a reset link has been sent.',
      data: { expiresAt },
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return error(res, { message: 'Failed to process request. Please try again.', status: 500 });
  }
};

/**
 * POST /api/auth/reset-password
 * Validate reset token and update password, revoking all existing sessions
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return error(res, { message: 'Token and new password are required', status: 400 });
    }

    if (password.length < 6) {
      return error(res, { message: 'Password must be at least 6 characters', status: 400 });
    }

    const resetDoc = await PasswordResetToken.findValid(token);

    if (!resetDoc) {
      return error(res, { message: 'Invalid or expired reset token', status: 400 });
    }

    const user = await User.findById(resetDoc.userId).select('+password');
    if (!user) {
      return error(res, { message: 'User not found', status: 400 });
    }

    user.password = password;
    await user.save();

    await PasswordResetToken.markUsed(token);

    await RefreshToken.revokeAllForUser(user._id);

    const accessToken = generateToken(user._id);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(user._id);

    return success(res, {
      message: 'Password reset successful',
      data: {
        token: accessToken,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
        user: user.toJSON(),
      },
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return error(res, { message: messages.join('. '), status: 400 });
    }
    return error(res, { message: 'Failed to reset password. Please try again.', status: 500 });
  }
};

/* ═══════════════════════════════════════════════════
   EMAIL VERIFICATION
   ═══════════════════════════════════════════════════ */

/**
 * POST /api/auth/verify-email
 * Verify email using a token sent to the user's email
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return error(res, { message: 'Verification token is required', status: 400 });
    }

    const verificationDoc = await EmailVerificationToken.findValid(token);

    if (!verificationDoc) {
      return error(res, { message: 'Invalid or expired verification token', status: 400 });
    }

    const user = await User.findById(verificationDoc.userId);
    if (!user) {
      return error(res, { message: 'User not found', status: 400 });
    }

    user.emailVerified = true;
    await user.save();

    await EmailVerificationToken.markUsed(token);

    return success(res, {
      message: 'Email verified successfully',
      data: { user: user.toJSON() },
    });
  } catch (err) {
    console.error('Verify email error:', err.message);
    return error(res, { message: 'Failed to verify email. Please try again.', status: 500 });
  }
};

/**
 * POST /api/auth/resend-verification
 * Resend the email verification token
 * Requires authentication so only the logged-in user can resend
 */
export const resendVerification = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return error(res, { message: 'Authentication required', status: 401 });
    }

    if (user.emailVerified) {
      return error(res, { message: 'Email is already verified', status: 400 });
    }

    const { token, expiresAt } = await EmailVerificationToken.createForUser(user._id, 1440);

    const sent = await sendVerificationEmail(user.email, token, user.name);

    if (!sent) {
      return error(res, { message: 'Failed to send verification email. Please try again later.', status: 500 });
    }

    return success(res, {
      message: 'Verification email sent successfully',
      data: { expiresAt },
    });
  } catch (err) {
    console.error('Resend verification error:', err.message);
    return error(res, { message: 'Failed to resend verification email. Please try again.', status: 500 });
  }
};

/* ═══════════════════════════════════════════════════
   LEGACY: Zenuxs token verification & sync (kept for backward compatibility)
   ═══════════════════════════════════════════════════ */

export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return error(res, { message: 'Token is required', status: 400 });
    }

    let userInfo = null;
    let active = false;
    try {
      const userRes = await axios.get(`${AUTH_SERVER}/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      userInfo = userRes.data;
      active = true;
    } catch (err) {
      // Invalid or expired token
    }

    return success(res, {
      message: 'Token verification completed',
      data: { active, user: userInfo },
    });
  } catch (err) {
    console.error('Token verification error:', err.message);
    return error(res, { message: 'Failed to verify token', status: 500 });
  }
};

export const syncUserProfile = async (req, res) => {
  try {
    const { token, userInfo } = req.body;

    if (!token || !userInfo) {
      return error(res, { message: 'Token and userInfo are required', status: 400 });
    }

    try {
      await axios.get(`${AUTH_SERVER}/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      return error(res, { message: 'Invalid or expired token', status: 401 });
    }

    return success(res, {
      message: 'User profile synced successfully',
      data: { user: userInfo },
    });
  } catch (err) {
    console.error('Profile sync error:', err.message);
    return error(res, { message: 'Failed to sync profile', status: 500 });
  }
};

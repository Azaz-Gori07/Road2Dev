import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';

const AUTH_SERVER = 'https://api.auth.zenuxs.in';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Helper: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
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
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, authProvider: 'local' });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error.message);
    console.error('Full error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('. ') });
    }
    if (error.name === 'MongooseError' || error.name === 'MongoServerSelectionError') {
      return res.status(500).json({ error: 'Database connection error. Please check your MongoDB connection.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
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
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
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
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify the token with Zenuxs server
    const verifyRes = await axios.post(`${AUTH_SERVER}/oauth/introspect`, { token }, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!verifyRes.data?.active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user info from Zenuxs
    const userRes = await axios.get(`${AUTH_SERVER}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const zenuxsUser = userRes.data;
    const email = zenuxsUser.email || zenuxsUser.preferred_username;

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from OAuth provider' });
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
      });
    }

    const jwtToken = generateToken(user._id);

    res.json({
      token: jwtToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Zenuxs login error:', error.message);
    res.status(500).json({ error: 'OAuth login failed. Please try again.' });
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
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
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
      'emailNotifications', 'publicProfile',
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('. ') });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/* ═══════════════════════════════════════════════════
   LEGACY: Zenuxs token verification & sync (kept for backward compatibility)
   ═══════════════════════════════════════════════════ */

export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const response = await axios.post(`${AUTH_SERVER}/oauth/introspect`, { token }, {
      headers: { 'Content-Type': 'application/json' },
    });

    let userInfo = null;
    if (response.data?.active) {
      const userRes = await axios.get(`${AUTH_SERVER}/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      userInfo = userRes.data;
    }

    res.json({
      active: response.data?.active ?? false,
      user: userInfo,
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(500).json({ error: 'Failed to verify token' });
  }
};

export const syncUserProfile = async (req, res) => {
  try {
    const { token, userInfo } = req.body;

    if (!token || !userInfo) {
      return res.status(400).json({ error: 'Token and userInfo are required' });
    }

    const verifyRes = await axios.post(`${AUTH_SERVER}/oauth/introspect`, { token }, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!verifyRes.data?.active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    res.json({
      message: 'User profile synced successfully',
      user: userInfo,
    });
  } catch (error) {
    console.error('Profile sync error:', error.message);
    res.status(500).json({ error: 'Failed to sync profile' });
  }
};
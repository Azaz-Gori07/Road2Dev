import axios from 'axios';

const AUTH_SERVER = 'https://api.auth.zenuxs.in';

/**
 * Verify a token with the Zenuxs OAuth server
 */
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const response = await axios.post(`${AUTH_SERVER}/oauth/introspect`, {
      token,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    // Optionally, fetch user info if token is active
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

/**
 * Store/update user profile in your database after OAuth login
 */
export const syncUserProfile = async (req, res) => {
  try {
    const { token, userInfo } = req.body;

    if (!token || !userInfo) {
      return res.status(400).json({ error: 'Token and userInfo are required' });
    }

    // Verify the token first
    const verifyRes = await axios.post(`${AUTH_SERVER}/oauth/introspect`, {
      token,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!verifyRes.data?.active) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Here you would save/update the user in your MongoDB database
    // For now we just return the user info
    res.json({
      message: 'User profile synced successfully',
      user: userInfo,
    });
  } catch (error) {
    console.error('Profile sync error:', error.message);
    res.status(500).json({ error: 'Failed to sync profile' });
  }
};
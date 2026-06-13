import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { error } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, { message: 'Authentication required. No token provided.', status: 401 });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return error(res, { message: 'User not found. Token is invalid.', status: 401 });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return error(res, { message: 'Invalid token', status: 401 });
    }
    if (err.name === 'TokenExpiredError') {
      return error(res, { message: 'Token has expired', status: 401 });
    }
    return error(res, { message: 'Authentication failed', status: 500 });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return error(res, { message: 'Invalid token', status: 401 });
    }
    if (err.name === 'TokenExpiredError') {
      return error(res, { message: 'Token has expired', status: 401 });
    }
    next();
  }
};

export default auth;
export { optionalAuth };
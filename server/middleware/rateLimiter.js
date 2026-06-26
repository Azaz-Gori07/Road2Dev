import { error } from '../utils/response.js';

export const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 8,
  keyGenerator = (req) => req.ip || 'anonymous',
  message = 'Too many requests. Please try again shortly.',
} = {}) => {
  const buckets = new Map();

  const cleanupBuckets = () => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.startedAt > windowMs) {
        buckets.delete(key);
      }
    }
  };

  return (req, res, next) => {
    // Bypass rate limiting in development to prevent HMR/double-rendering lockouts
    if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_RATE_LIMIT) {
      return next();
    }

    cleanupBuckets();

    const key = keyGenerator(req);
    const now = Date.now();
    const existingBucket = buckets.get(key);
    const bucket =
      existingBucket && now - existingBucket.startedAt <= windowMs
        ? existingBucket
        : { count: 0, startedAt: now };

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      const retryAfter = Math.ceil((bucket.startedAt + windowMs - now) / 1000);

      return error(res, { message, status: 429 });
    }

    return next();
  };
};

export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again later.',
});

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many AI requests. Please wait before sending more.',
});

export const draftLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many saves. Please slow down.',
});

export const publishLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many publish actions. Please slow down.',
});

export const notifLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many notification requests. Please slow down.',
});

// Per-user daily AI request cap store
const dailyAiUsage = new Map();

const getDailyKey = (req) => {
  const userId = req.user?._id || req.ip || 'anonymous';
  const today = new Date().toISOString().slice(0, 10);
  return `${today}:${userId}`;
};

export const dailyAiLimiter = (req, res, next) => {
  const key = getDailyKey(req);
  const now = Date.now();
  const windowStart = now - 86400000;

  // Clean old entries
  for (const [k, v] of dailyAiUsage.entries()) {
    if (v.timestamp < windowStart) dailyAiUsage.delete(k);
  }

  const entry = dailyAiUsage.get(key) || { count: 0, timestamp: now };
  entry.count += 1;
  entry.timestamp = now;
  dailyAiUsage.set(key, entry);

  const DAILY_LIMIT = 50;
  if (entry.count > DAILY_LIMIT) {
    return error(res, { message: 'Daily AI request limit reached. Please try again tomorrow.', status: 429 });
  }

  next();
};

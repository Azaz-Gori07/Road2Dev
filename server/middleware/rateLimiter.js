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
  windowMs: 15 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many AI requests. Please wait before sending more.',
});

export const draftLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Too many saves. Please slow down.',
});

export const publishLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Too many publish actions. Please slow down.',
});

export const notifLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Too many notification requests. Please slow down.',
});

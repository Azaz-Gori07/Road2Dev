const buckets = new Map();

const cleanupBuckets = (windowMs) => {
  const now = Date.now();

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.startedAt > windowMs) {
      buckets.delete(key);
    }
  }
};

export const createRateLimiter = ({
  windowMs = 60 * 1000,
  maxRequests = 8,
  keyGenerator = (req) => req.ip || 'anonymous',
} = {}) => {
  return (req, res, next) => {
    cleanupBuckets(windowMs);

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

      return res.status(429).json({
        success: false,
        message: 'Too many interview generation requests. Please try again shortly.',
        retryAfter,
      });
    }

    return next();
  };
};

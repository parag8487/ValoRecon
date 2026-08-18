import { Request, Response, NextFunction } from 'express';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export function createRateLimiter(options: { windowMs: number; max: number; keyPrefix?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    // In test environment, skip rate limiting
    if (process.env.VALORECON_TEST === '1') {
      return next();
    }

    const ip = req.ip || '127.0.0.1';
    const key = `${options.keyPrefix || 'global'}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 1, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        error: {
          code: 'VR-RATE-LIMITED',
          message: 'Too many requests, please try again later.',
          requestId: req.id,
          retryable: true
        }
      });
      return;
    }

    next();
  };
}

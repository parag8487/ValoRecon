import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getConfig } from '../config';

export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createAuthMiddleware(getExpectedToken: () => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Open endpoints (health & capabilities)
    const p = req.path;
    const orig = req.originalUrl ? req.originalUrl.split('?')[0] : '';
    if (p === '/health' || p === '/capabilities' || p === '/api/health' || p === '/api/capabilities' ||
        orig === '/health' || orig === '/capabilities' || orig === '/api/health' || orig === '/api/capabilities') {
      return next();
    }

    // Token bootstrap endpoint handling
    if (req.path === '/auth/token') {
      const config = getConfig();
      if (!config.devBootstrap) {
        res.status(403).json({
          error: {
            code: 'VR-AUTH-403',
            message: 'Token bootstrap endpoint is disabled in production',
            requestId: req.id,
            retryable: false
          }
        });
        return;
      }
      return next();
    }

    const token = req.headers['x-valorecon-token'] as string | undefined;
    const expectedToken = getExpectedToken();

    if (!token || !timingSafeEqual(token, expectedToken)) {
      res.status(401).json({
        error: {
          code: 'VR-AUTH-401',
          message: 'Unauthorized: missing or invalid x-valorecon-token header',
          requestId: req.id,
          retryable: false
        }
      });
      return;
    }

    next();
  };
}

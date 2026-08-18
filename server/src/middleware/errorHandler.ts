import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../logger';

const logger = createLogger('errorHandler');

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'VR-REQUEST-400',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      requestId: req.id,
      retryable: false
    }
  });
}

export function errorHandlerMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
  const code = err.code || (status === 400 ? 'VR-VALIDATION-400' : (status === 401 ? 'VR-AUTH-401' : (status === 403 ? 'VR-AUTH-403' : 'VR-INTERNAL-500')));
  const message = err.message || 'Internal server error';

  logger.error('Unhandled request error', message, {
    requestId: req.id,
    errorCode: code,
    data: { status, path: req.originalUrl, method: req.method }
  });

  if (res.headersSent) {
    return;
  }

  res.status(status).json({
    error: {
      code,
      message,
      requestId: req.id,
      retryable: status >= 500
    }
  });
}

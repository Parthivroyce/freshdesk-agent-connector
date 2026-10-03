import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const reqId = req.id || 'unknown';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, {
        requestId: reqId,
        errorCode: err.code,
        durationMs: req.startTime ? Date.now() - req.startTime : undefined,
      });
    }

    if (err.retryAfterSeconds) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
    }

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Handle generic / unexpected errors
  logger.error(err?.message || 'Unhandled internal error', {
    requestId: reqId,
    errorCode: 'INTERNAL_ERROR',
    durationMs: req.startTime ? Date.now() - req.startTime : undefined,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.',
      retryable: true,
    },
  });
}

// src/shared/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      code: err.code,
      status: err.statusCode,
      message: err.message,
    });
    return;
  }

  logger.error({ err: err.message, stack: err.stack, path: req.path }, 'Unexpected error');
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    status: 500,
    message: 'Internal server error',
  });
}

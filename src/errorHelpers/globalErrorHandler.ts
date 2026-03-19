// File: src/errorHelpers/globalErrorHandler.ts
import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: unknown;
}

const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || 'An unexpected error occurred';

  const errorResponse: ErrorResponse = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err;
  }

  return res.status(statusCode).json(errorResponse);
};

export default globalErrorHandler;

// File: src/errorHelpers/notFound.ts
import { Request, Response, NextFunction } from 'express';

const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

export default notFoundHandler;

// server/src/module/project/project.validation.ts
import { Request, Response, NextFunction } from 'express';

export const validateCreateProject = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const { title, userId } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'title is required.' });
  }
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ success: false, message: 'userId is required.' });
  }
  next();
};

export const validateUpdateProject = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const { title, description } = req.body;
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ success: false, message: 'title must be a non-empty string.' });
  }
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ success: false, message: 'description must be a string.' });
  }
  next();
};

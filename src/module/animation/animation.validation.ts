// server/src/module/animation/animation.validation.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Validates POST /animations/generate request body.
 */
export const validateGenerateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const { prompt, projectId, userId, provider, model } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res
      .status(400)
      .json({ success: false, message: 'Prompt is required and must be a non-empty string.' });
  }

  if (prompt.trim().length < 10) {
    return res
      .status(400)
      .json({ success: false, message: 'Prompt must be at least 10 characters long.' });
  }

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return res
      .status(400)
      .json({ success: false, message: 'projectId is required.' });
  }

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res
      .status(400)
      .json({ success: false, message: 'userId is required.' });
  }

  if (!provider || typeof provider !== 'string' || provider.trim() === '') {
    return res
      .status(400)
      .json({ success: false, message: 'provider is required (e.g. "gemini", "groq").' });
  }

  if (!model || typeof model !== 'string' || model.trim() === '') {
    return res
      .status(400)
      .json({ success: false, message: 'model is required.' });
  }

  next();
};

/**
 * Validates that :jobId path param is present.
 */
export const validateJobIdParam = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const { jobId } = req.params;
  if (!jobId || jobId.trim() === '') {
    return res
      .status(400)
      .json({ success: false, message: 'jobId parameter is required.' });
  }
  next();
};

/**
 * Validates that :projectId path param is present.
 */
export const validateProjectIdParam = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const { projectId } = req.params;
  if (!projectId || projectId.trim() === '') {
    return res
      .status(400)
      .json({ success: false, message: 'projectId parameter is required.' });
  }
  next();
};

// server/src/module/animation/animation.route.ts
import { Router } from 'express';
import {
  generateAnimation,
  getJob,
  getProjectJobs,
  getUserJobs,
  regenerateAnimation,
  deleteAnimation,
} from './animation.controller';
import {
  validateGenerateRequest,
  validateJobIdParam,
  validateProjectIdParam,
} from './animation.validation';

const animationRouter = Router();

// POST /api/animations/generate — Create a new animation job
animationRouter.post('/generate', validateGenerateRequest, generateAnimation);

// GET /api/animations/project/:projectId — List all jobs for a project
// NOTE: Must be ABOVE /:jobId to prevent "project" being parsed as a jobId
animationRouter.get('/project/:projectId', validateProjectIdParam, getProjectJobs);

// GET /api/animations/user/:userId — List all jobs for a user
// NOTE: Must be ABOVE /:jobId to prevent "user" being parsed as a jobId
animationRouter.get('/user/:userId', getUserJobs);

// GET /api/animations/:jobId — Get a single job by ID
animationRouter.get('/:jobId', validateJobIdParam, getJob);

// PATCH /api/animations/:jobId/regenerate — Regenerate from original prompt
animationRouter.patch('/:jobId/regenerate', validateJobIdParam, regenerateAnimation);

// DELETE /api/animations/:jobId — Delete a job and its Cloudinary asset
animationRouter.delete('/:jobId', validateJobIdParam, deleteAnimation);

export default animationRouter;

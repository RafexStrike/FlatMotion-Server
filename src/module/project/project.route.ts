// server/src/module/project/project.route.ts
import { Router } from 'express';
import {
  createProjectHandler,
  getUserProjectsHandler,
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from './project.controller';
import { validateCreateProject, validateUpdateProject } from './project.validation';

const projectRouter = Router();

// POST /api/projects — Create a new project
projectRouter.post('/', validateCreateProject, createProjectHandler);

// GET /api/projects/user/:userId — List all projects for a user
projectRouter.get('/user/:userId', getUserProjectsHandler);

// GET /api/projects/:projectId — Get a single project
projectRouter.get('/:projectId', getProjectHandler);

// PATCH /api/projects/:projectId — Update a project
projectRouter.patch('/:projectId', validateUpdateProject, updateProjectHandler);

// DELETE /api/projects/:projectId — Delete a project
projectRouter.delete('/:projectId', deleteProjectHandler);

export default projectRouter;

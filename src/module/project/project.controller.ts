// server/src/module/project/project.controller.ts
import { Request, Response } from 'express';
import {
  createProject,
  getProjectsByUser,
  getProjectById,
  updateProject,
  deleteProject,
} from './project.service';

export const createProjectHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, description, userId } = req.body;
    const project = await createProject({ title, description, userId });
    return res.status(201).json({ success: true, message: 'Project created.', data: project });
  } catch (err: any) {
    console.error('[ProjectController] createProject error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Failed to create project.', data: null });
  }
};

export const getUserProjectsHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const projects = await getProjectsByUser(userId);
    return res.status(200).json({ success: true, message: `Found ${projects.length} project(s).`, data: projects });
  } catch (err: any) {
    console.error('[ProjectController] getUserProjects error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Failed to list projects.', data: null });
  }
};

export const getProjectHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const project = await getProjectById(projectId);
    if (!project) return res.status(404).json({ success: false, message: `Project ${projectId} not found.`, data: null });
    return res.status(200).json({ success: true, message: 'Project retrieved.', data: project });
  } catch (err: any) {
    console.error('[ProjectController] getProject error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Failed to get project.', data: null });
  }
};

export const updateProjectHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;
    const project = await updateProject(projectId, { title, description });
    return res.status(200).json({ success: true, message: 'Project updated.', data: project });
  } catch (err: any) {
    console.error('[ProjectController] updateProject error:', err.message);
    const code = err.message?.includes('not found') ? 404 : 500;
    return res.status(code).json({ success: false, message: err.message || 'Failed to update project.', data: null });
  }
};

export const deleteProjectHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    await deleteProject(projectId);
    return res.status(200).json({ success: true, message: `Project ${projectId} deleted.`, data: null });
  } catch (err: any) {
    console.error('[ProjectController] deleteProject error:', err.message);
    const code = err.message?.includes('not found') ? 404 : 500;
    return res.status(code).json({ success: false, message: err.message || 'Failed to delete project.', data: null });
  }
};

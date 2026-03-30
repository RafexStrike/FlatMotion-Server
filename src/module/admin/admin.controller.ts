import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';

const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await adminService.getAllProjects();
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await adminService.deleteUser(id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await adminService.deleteProject(id);
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const adminController = {
  getStats,
  getUsers,
  getProjects,
  deleteUser,
  deleteProject
};

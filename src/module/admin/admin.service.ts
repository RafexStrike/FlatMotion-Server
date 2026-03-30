import { prisma } from '../../lib/prisma';

const getDashboardStats = async () => {
  const [totalUsers, totalProjects, totalAnimations, recentUsers, recentProjects, recentAnimations] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.animationJob.count(),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.project.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true, email: true } } } }),
    prisma.animationJob.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true, email: true } }, project: { select: { title: true } } } }),
  ]);

  const uptime = process.uptime();

  return {
    totalUsers,
    totalProjects,
    totalAnimations,
    recentUsers,
    recentProjects,
    recentAnimations,
    uptime, // in seconds
    healthStatus: 'Healthy',
    serverStartTime: new Date(Date.now() - uptime * 1000).toISOString()
  };
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { projects: true, animationJobs: true }
      }
    }
  });
};

const getAllProjects = async () => {
  return prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true }
      },
      _count: {
        select: { animations: true }
      }
    }
  });
};

const deleteUser = async (id: string) => {
  return prisma.user.delete({
    where: { id }
  });
};

const deleteProject = async (id: string) => {
  return prisma.project.delete({
    where: { id }
  });
};

export const adminService = {
  getDashboardStats,
  getAllUsers,
  getAllProjects,
  deleteUser,
  deleteProject
};

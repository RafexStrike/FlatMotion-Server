// server/src/module/project/project.service.ts
import { prisma } from '../../lib/prisma';
import { ProjectData, CreateProjectRequest, UpdateProjectRequest } from './project.interface';

export const createProject = async (data: CreateProjectRequest): Promise<ProjectData> => {
  console.log(`[ProjectService] Creating project for user=${data.userId}`);
  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      userId: data.userId,
    },
  });
  console.log(`[ProjectService] Project created: ${project.id}`);
  return project;
};

export const getProjectsByUser = async (userId: string): Promise<ProjectData[]> => {
  console.log(`[ProjectService] Listing projects for user=${userId}`);
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProjectById = async (projectId: string): Promise<ProjectData | null> => {
  console.log(`[ProjectService] Fetching project: ${projectId}`);
  return prisma.project.findUnique({ where: { id: projectId } });
};

export const updateProject = async (
  projectId: string,
  data: UpdateProjectRequest
): Promise<ProjectData> => {
  console.log(`[ProjectService] Updating project: ${projectId}`);
  return prisma.project.update({
    where: { id: projectId },
    data: { ...data, updatedAt: new Date() },
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  console.log(`[ProjectService] Deleting project: ${projectId}`);
  await prisma.project.delete({ where: { id: projectId } });
  console.log(`[ProjectService] Project deleted: ${projectId}`);
};

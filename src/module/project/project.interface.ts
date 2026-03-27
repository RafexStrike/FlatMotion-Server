// server/src/module/project/project.interface.ts

export interface ProjectData {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  userId: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
}

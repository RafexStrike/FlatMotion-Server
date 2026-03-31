// server/src/module/animation/animation.service.ts
import { prisma } from '../../lib/prisma';
import { deleteVideo } from '../../lib/cloudinary';
import { AnimationJobData, AnimationStatus, WorkerUpdateFields } from './animation.interface';

/** How long (in days) before a rendered video expires */
const VIDEO_EXPIRY_DAYS = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapStatus = (job: any): AnimationJobData => {
  // Auto-detect expiry
  let status: AnimationStatus = job.status as AnimationStatus;
  if (
    status === 'done' &&
    job.expiresAt &&
    new Date(job.expiresAt) < new Date()
  ) {
    status = 'expired';
  }
  return { ...job, status };
};

// ─── Core CRUD ────────────────────────────────────────────────────────────────

/**
 * Creates a new AnimationJob record with status=pending.
 */
export const createJob = async (data: {
  userId: string;
  projectId: string;
  prompt: string;
  provider: string;
  model: string;
}): Promise<AnimationJobData> => {
  console.log(`[AnimationService] Creating job for user=${data.userId} project=${data.projectId}`);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + VIDEO_EXPIRY_DAYS);

  const job = await prisma.animationJob.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      prompt: data.prompt,
      provider: data.provider,
      model: data.model,
      status: 'pending',
      expiresAt,
    },
  });

  console.log(`[AnimationService] Job created: ${job.id}`);
  return mapStatus(job);
};

/**
 * Retrieves a single job by ID, with expiry detection.
 */
export const getJobById = async (jobId: string): Promise<AnimationJobData | null> => {
  console.log(`[AnimationService] Fetching job: ${jobId}`);
  const job = await prisma.animationJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  return mapStatus(job);
};

/**
 * Lists all jobs for a given project, newest first.
 */
export const getJobsByProject = async (projectId: string): Promise<AnimationJobData[]> => {
  console.log(`[AnimationService] Listing jobs for project: ${projectId}`);
  const jobs = await prisma.animationJob.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  return jobs.map(mapStatus);
};

/**
 * Lists all jobs for a given user across all projects, newest first.
 */
export const getJobsByUser = async (userId: string): Promise<AnimationJobData[]> => {
  console.log(`[AnimationService] Listing jobs for user: ${userId}`);
  const jobs = await prisma.animationJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return jobs.map(mapStatus);
};

/**
 * Updates job fields (status + any other fields).
 */
export const updateJob = async (
  jobId: string,
  fields: WorkerUpdateFields
): Promise<AnimationJobData> => {
  console.log(`[AnimationService] Updating job ${jobId}:`, JSON.stringify(fields));
  const job = await prisma.animationJob.update({
    where: { id: jobId },
    data: {
      ...fields,
      updatedAt: new Date(),
    },
  });
  return mapStatus(job);
};

/**
 * Clones the prompt from an existing job and creates a new job (for regeneration).
 */
export const regenerateJob = async (
  jobId: string,
  overrides?: { provider?: string; model?: string }
): Promise<AnimationJobData> => {
  console.log(`[AnimationService] Regenerating from job: ${jobId}`);
  const original = await prisma.animationJob.findUnique({ where: { id: jobId } });
  if (!original) throw new Error(`Job ${jobId} not found`);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + VIDEO_EXPIRY_DAYS);

  const newJob = await prisma.animationJob.create({
    data: {
      userId: original.userId,
      projectId: original.projectId,
      prompt: original.prompt,
      provider: overrides?.provider ?? original.provider,
      model: overrides?.model ?? original.model,
      status: 'pending',
      expiresAt,
    },
  });

  console.log(`[AnimationService] Regeneration job created: ${newJob.id}`);
  return mapStatus(newJob);
};

/**
 * Deletes a job record and optionally its Cloudinary asset.
 */
export const deleteJob = async (jobId: string): Promise<void> => {
  console.log(`[AnimationService] Deleting job: ${jobId}`);
  const job = await prisma.animationJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job ${jobId} not found`);

  // Clean up Cloudinary asset if it exists
  if (job.cloudinaryId) {
    try {
      await deleteVideo(job.cloudinaryId);
    } catch (err: any) {
      console.warn(`[AnimationService] Cloudinary delete failed for ${job.cloudinaryId}:`, err.message);
    }
  }

  await prisma.animationJob.delete({ where: { id: jobId } });
  console.log(`[AnimationService] Job deleted: ${jobId}`);
};

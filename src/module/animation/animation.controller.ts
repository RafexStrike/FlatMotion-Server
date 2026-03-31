// server/src/module/animation/animation.controller.ts
import { Request, Response } from 'express';
import {
  createJob,
  getJobById,
  getJobsByProject,
  getJobsByUser,
  regenerateJob,
  deleteJob,
} from './animation.service';
import { processAnimationJob } from './animation.worker';

// ─── POST /animations/generate ────────────────────────────────────────────────

export const generateAnimation = async (req: Request, res: Response): Promise<any> => {
  try {
    const { prompt, projectId, userId, provider, model, apiKey } = req.body;

    console.log(`[AnimationController] Generate request from user=${userId} project=${projectId} provider=${provider}`);

    // Create the job record immediately
    const job = await createJob({ userId, projectId, prompt, provider, model });

    console.log(`[AnimationController] Job created: ${job.id} — launching pipeline async`);

    // Fire-and-forget: process in background
    processAnimationJob(job.id, prompt, provider, model, apiKey).catch((err) => {
      console.error(`[AnimationController] Unhandled worker error for job ${job.id}:`, err.message);
    });

    return res.status(202).json({
      success: true,
      message: 'Animation job created and processing started.',
      data: job,
    });
  } catch (err: any) {
    console.error('[AnimationController] generateAnimation error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create animation job.',
      data: null,
    });
  }
};

// ─── GET /animations/:jobId ───────────────────────────────────────────────────

export const getJob = async (req: Request, res: Response): Promise<any> => {
  try {
    const { jobId } = req.params;
    console.log(`[AnimationController] Get job: ${jobId}`);

    const job = await getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job ${jobId} not found.`,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job retrieved successfully.',
      data: job,
    });
  } catch (err: any) {
    console.error('[AnimationController] getJob error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve job.',
      data: null,
    });
  }
};

// ─── GET /animations/project/:projectId ───────────────────────────────────────

export const getProjectJobs = async (req: Request, res: Response): Promise<any> => {
  try {
    const { projectId } = req.params;
    console.log(`[AnimationController] Listing jobs for project: ${projectId}`);

    const jobs = await getJobsByProject(projectId);

    return res.status(200).json({
      success: true,
      message: `Found ${jobs.length} job(s) for project ${projectId}.`,
      data: jobs,
    });
  } catch (err: any) {
    console.error('[AnimationController] getProjectJobs error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to list project jobs.',
      data: null,
    });
  }
};

// ─── GET /animations/user/:userId ──────────────────────────────────────────

export const getUserJobs = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    console.log(`[AnimationController] Listing jobs for user: ${userId}`);

    const jobs = await getJobsByUser(userId);

    return res.status(200).json({
      success: true,
      message: `Found ${jobs.length} job(s) for user ${userId}.`,
      data: jobs,
    });
  } catch (err: any) {
    console.error('[AnimationController] getUserJobs error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to list user jobs.',
      data: null,
    });
  }
};

// ─── PATCH /animations/:jobId/regenerate ──────────────────────────────────────

export const regenerateAnimation = async (req: Request, res: Response): Promise<any> => {
  try {
    const { jobId } = req.params;
    const { provider, model, apiKey } = req.body;

    console.log(`[AnimationController] Regenerate job: ${jobId}`);

    const newJob = await regenerateJob(jobId, { provider, model });

    console.log(`[AnimationController] Regeneration job created: ${newJob.id} — launching pipeline async`);

    processAnimationJob(newJob.id, newJob.prompt, newJob.provider, newJob.model, apiKey).catch(
      (err) => {
        console.error(`[AnimationController] Unhandled worker error for regen job ${newJob.id}:`, err.message);
      }
    );

    return res.status(202).json({
      success: true,
      message: 'Regeneration started. A new job has been created.',
      data: newJob,
    });
  } catch (err: any) {
    console.error('[AnimationController] regenerateAnimation error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to regenerate animation.',
      data: null,
    });
  }
};

// ─── DELETE /animations/:jobId ────────────────────────────────────────────────

export const deleteAnimation = async (req: Request, res: Response): Promise<any> => {
  try {
    const { jobId } = req.params;
    console.log(`[AnimationController] Delete job: ${jobId}`);

    await deleteJob(jobId);

    return res.status(200).json({
      success: true,
      message: `Job ${jobId} deleted successfully.`,
      data: null,
    });
  } catch (err: any) {
    console.error('[AnimationController] deleteAnimation error:', err.message);
    const statusCode = err.message?.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to delete job.',
      data: null,
    });
  }
};

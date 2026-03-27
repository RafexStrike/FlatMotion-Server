// server/src/module/animation/animation.interface.ts

export type AnimationStatus =
  | 'pending'
  | 'processing'
  | 'generating_code'
  | 'rendering'
  | 'uploading'
  | 'done'
  | 'failed'
  | 'expired';

// ─── Request Types ────────────────────────────────────────────────────────────

export interface GenerateAnimationRequest {
  prompt: string;
  projectId: string;
  userId: string;
  provider: string;
  model: string;
  /** Optional: client-supplied API key. Falls back to server env var. */
  apiKey?: string;
}

export interface RegenerateAnimationRequest {
  jobId: string;
  userId: string;
  /** Optional: override provider/model for regeneration */
  provider?: string;
  model?: string;
  apiKey?: string;
}

// ─── DB Model Shape ───────────────────────────────────────────────────────────

export interface AnimationJobData {
  id: string;
  userId: string;
  projectId: string;
  prompt: string;
  provider: string;
  model: string;
  status: AnimationStatus;
  generatedCode: string | null;
  videoUrl: string | null;
  cloudinaryId: string | null;
  errorMessage: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Response Types ────────────────────────────────────────────────────────────

export interface AnimationJobResponse {
  success: boolean;
  message: string;
  data: AnimationJobData | null;
}

export interface AnimationJobListResponse {
  success: boolean;
  message: string;
  data: AnimationJobData[];
}

// ─── Worker Types ──────────────────────────────────────────────────────────────

export interface WorkerUpdateFields {
  status?: AnimationStatus;
  generatedCode?: string;
  videoUrl?: string;
  cloudinaryId?: string;
  errorMessage?: string;
  expiresAt?: Date;
}

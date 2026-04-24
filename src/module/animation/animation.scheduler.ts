// server/src/module/animation/animation.scheduler.ts
/**
 * Animation Cleanup Scheduler
 * Runs cleanup of expired animations at regular intervals
 */

import cron from 'node-cron';
import { cleanupExpiredAnimations } from './animation.cleanup';

let cleanupTaskStarted = false;

/**
 * Starts the cleanup scheduler
 * Runs every 20 minutes by default (can be adjusted)
 */
export const startCleanupScheduler = (): void => {
  if (cleanupTaskStarted) {
    console.warn('[AnimationScheduler] Cleanup scheduler is already running');
    return;
  }

  console.log('[AnimationScheduler] Starting expired animation cleanup scheduler...');

  // Schedule cleanup to run every 20 minutes
  // Cron pattern: "0 */20 * * * *" means every 20 minutes
  // You can adjust the interval as needed:
  // "0 */30 * * * *" = every 30 minutes (recommended for prod)
  // "0 */10 * * * *" = every 10 minutes (more aggressive)
  // "0 0 * * *" = once daily at midnight
  
  const cleanupTask = cron.schedule('0 */20 * * * *', async () => {
    console.log('[AnimationScheduler] Running scheduled cleanup of expired animations...');
    try {
      const result = await cleanupExpiredAnimations();
      console.log(
        `[AnimationScheduler] Cleanup completed - Processed: ${result.processed}, Deleted: ${result.deleted}, Skipped: ${result.skipped}, Failed: ${result.failed}`
      );
    } catch (error: any) {
      console.error('[AnimationScheduler] Cleanup failed:', error.message);
      // Log the error but don't crash the scheduler
    }
  });

  cleanupTaskStarted = true;
  console.log('[AnimationScheduler] Cleanup scheduler started successfully');

  // Optionally: Stop task gracefully on process exit
  process.on('SIGTERM', () => {
    console.log('[AnimationScheduler] Stopping cleanup scheduler on SIGTERM');
    cleanupTask.stop();
  });

  process.on('SIGINT', () => {
    console.log('[AnimationScheduler] Stopping cleanup scheduler on SIGINT');
    cleanupTask.stop();
  });
};

/**
 * Stop the cleanup scheduler (useful for testing)
 */
export const stopCleanupScheduler = (): void => {
  console.log('[AnimationScheduler] Cleanup scheduler stopped');
  cleanupTaskStarted = false;
};

/**
 * Manually trigger cleanup (useful for testing or admin endpoints)
 */
export const triggerCleanupNow = async (): Promise<any> => {
  console.log('[AnimationScheduler] Manually triggering cleanup...');
  try {
    const result = await cleanupExpiredAnimations();
    console.log('[AnimationScheduler] Manual cleanup completed:', result);
    return result;
  } catch (error: any) {
    console.error('[AnimationScheduler] Manual cleanup failed:', error.message);
    throw error;
  }
};

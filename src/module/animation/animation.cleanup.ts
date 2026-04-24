// server/src/module/animation/animation.cleanup.ts
import { prisma } from '../../lib/prisma';
import { deleteVideo } from '../../lib/cloudinary';

/** Demo user ID - their videos must NEVER be deleted */
const DEMO_USER_ID = 'uOV3bb3PxcUN9TEv5xOHwvflXVzk5FH9';

/**
 * Cleanup Service: Automatically deletes expired animation videos
 * - Queries animations where expiresAt < now
 * - Skips demo user animations entirely
 * - For normal users: deletes from Cloudinary and marks as expired in DB
 */

export const cleanupExpiredAnimations = async (): Promise<{ processed: number; deleted: number; skipped: number; failed: number }> => {
  console.log('[AnimationCleanup] Starting cleanup of expired animations...');

  let processed = 0;
  let deleted = 0;
  let skipped = 0;
  let failed = 0;

  const now = new Date();

  try {
    // ─── STEP 1: Query all expired animations with user relation ────────────
    const expiredAnimations = await prisma.animationJob.findMany({
      where: {
        expiresAt: {
          lt: now, // expiresAt < now
        },
        status: {
          not: 'expired', // Don't re-process already expired ones
        },
      },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`[AnimationCleanup] Found ${expiredAnimations.length} expired animation(s)`);

    // ─── STEP 2: Process each expired animation ─────────────────────────────
    for (const animation of expiredAnimations) {
      processed++;

      const userId = animation.project.user.id;
      const isDemo = userId === DEMO_USER_ID;

      if (isDemo) {
        console.log(`[AnimationCleanup] Skipping demo user animation (${animation.id})`);
        skipped++;
        continue;
      }

      try {
        // Delete from Cloudinary if it exists
        if (animation.cloudinaryId) {
          try {
            console.log(`[AnimationCleanup] Deleting Cloudinary asset: ${animation.cloudinaryId}`);
            await deleteVideo(animation.cloudinaryId);
          } catch (err: any) {
            console.warn(
              `[AnimationCleanup] Failed to delete from Cloudinary (${animation.cloudinaryId}):`,
              err.message
            );
            // Don't fail the entire operation - continue with DB update
          }
        }

        // Mark as expired in DB
        await prisma.animationJob.update({
          where: { id: animation.id },
          data: {
            status: 'expired',
            updatedAt: new Date(),
          },
        });

        console.log(`[AnimationCleanup] Marked animation as expired: ${animation.id}`);
        deleted++;
      } catch (err: any) {
        console.error(`[AnimationCleanup] Error processing animation ${animation.id}:`, err.message);
        failed++;
      }
    }

    console.log(
      `[AnimationCleanup] Cleanup complete. Processed: ${processed}, Deleted: ${deleted}, Skipped: ${skipped}, Failed: ${failed}`
    );

    return { processed, deleted, skipped, failed };
  } catch (err: any) {
    console.error('[AnimationCleanup] Fatal error during cleanup:', err.message);
    throw err;
  }
};

/**
 * Filters animations for display in API responses.
 * For NORMAL users: removes expired animations
 * For DEMO user: returns all animations
 */
export const filterExpiredAnimations = (
  animations: any[],
  userId: string
): any[] => {
  // Demo user always gets all animations
  if (userId === DEMO_USER_ID) {
    return animations;
  }

  // Normal users: filter out expired animations
  return animations.filter((anim) => anim.status !== 'expired');
};

/**
 * Check if a user is the demo user
 */
export const isDemoUser = (userId: string): boolean => {
  return userId === DEMO_USER_ID;
};

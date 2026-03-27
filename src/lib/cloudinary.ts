// server/src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
}

/**
 * Uploads a local video file to Cloudinary.
 * Returns the secure URL and public_id for storage.
 */
export const uploadVideo = (filePath: string, folder = 'animation-jobs'): Promise<CloudinaryUploadResult> => {
  console.log(`[Cloudinary] Uploading video from: ${filePath}`);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        resource_type: 'video',
        folder,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          console.error('[Cloudinary] Upload failed:', error);
          return reject(new Error(error?.message || 'Cloudinary upload returned no result'));
        }
        console.log(`[Cloudinary] Upload succeeded: ${result.secure_url}`);
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
  });
};

/**
 * Deletes a Cloudinary asset by its public_id.
 */
export const deleteVideo = (publicId: string): Promise<void> => {
  console.log(`[Cloudinary] Deleting asset: ${publicId}`);

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: 'video' }, (error, result) => {
      if (error) {
        console.error('[Cloudinary] Delete failed:', error);
        return reject(new Error(error.message));
      }
      console.log(`[Cloudinary] Delete result:`, result);
      resolve();
    });
  });
};

export default cloudinary;

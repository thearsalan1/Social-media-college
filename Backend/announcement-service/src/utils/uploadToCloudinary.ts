import cloudinary from "../config/cloudinary.js";
import { logger } from "../config/logger.js";

export function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result!.secure_url,
          publicId: result!.public_id,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function uploadMultipleImages(
  files: Express.Multer.File[],
  folder: string,
): Promise<{ url: string; publicId: string }[]> {
  if (files.length > 5) {
    throw new Error("Maximum 5 images allowed");
  }
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, folder),
  );
  return Promise.all(uploadPromises);
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    if (!publicId) {
      throw new Error("Public id needed to delete post");
    }
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error("Error in deleting from cloudinary ", error);
  }
}

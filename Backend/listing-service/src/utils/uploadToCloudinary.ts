import cloudinary from "../config/cloudinary.js";

export function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        quality: "auto",      
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function uploadMultipleImages(files: Express.Multer.File[], folder: string): Promise<string[]> {
  if (files.length > 5) {
    throw new Error("Maximum 5 images allowed");
  }
  const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, folder));
  return Promise.all(uploadPromises);
}
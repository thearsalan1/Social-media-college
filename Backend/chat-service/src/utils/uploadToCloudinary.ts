import cloudinary from "../config/cloudinary.js";

export function uploadSingleImage(buffer: Buffer): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "chat-messages",
        quality: "auto",
        fetch_format: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result!.secure_url, publicId: result!.public_id });
      }
    );
    stream.end(buffer);
  });
}
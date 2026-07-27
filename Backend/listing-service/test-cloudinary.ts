import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.uploader.upload("https://picsum.photos/200")
  .then((res) => console.log("✅ Upload success:", res.secure_url))
  .catch((err) => console.log("❌ Upload error:", JSON.stringify(err, null, 2)));

cloudinary.api.ping()
  .then((res) => console.log("✅ Success:", res))
  .catch((err) => console.log("❌ Full Error:", JSON.stringify(err, null, 2)));
import multer from "multer";

const storage = multer.memoryStorage();

export const uploadChatImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB — spec ke hisaab se
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only jpeg, jpg, png, webp are allowed"));
    }
  },
});

import multer from "multer";
const storage = multer.memoryStorage();
export const uploadCSV = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only csv files are allowded"));
    }
  },
});

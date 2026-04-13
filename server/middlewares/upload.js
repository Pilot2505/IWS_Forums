import multer from "multer";
import path from "path";
import fs from "fs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // limit uploads to 5MB
const allowedImageMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

// Ensure upload directories exist
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Create image upload handler
export function createUploadHandler(folder) {
  const uploadDir = `uploads/${folder}`;
  ensureDirectoryExists(uploadDir);
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const safeExtension = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueName}${safeExtension}`);
    },
  });

  return multer({ 
    storage,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
      if (!allowedImageMimeTypes.has(file.mimetype)) {
        return cb(new Error("Invalid image format"), false);
      }

      cb(null, true);
    }
  });
}

// Default avatar uploader
const avatarUploadDir = "uploads/avatars";
ensureDirectoryExists(avatarUploadDir);

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`; // CHANGED: safer filename
    cb(null, `${uniqueName}${safeExtension}`);
  },
});

export const upload = multer({ storage: avatarStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      return cb(new Error("Invalid avatar format"), false);
    }

    cb(null, true);
  }
});

export const withMulter400 = (middleware) => (req, res, next) => {
  middleware(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 5MB."
          : err.message || "Invalid file upload";

      return res.status(400).json({ error: message }); // clean 400 for multer failures
    }

    next();
  });
};
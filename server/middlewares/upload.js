import multer from "multer";
import path from "path";
import fs from "fs";

// Create image upload handler
export function createUploadHandler(folder) {
  const uploadDir = `public/${folder}`;

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueName + path.extname(file.originalname));
    },
  });

  return multer({ 
    storage,
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'image') {
        // Allow images
        const allowedMimes = [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/gif'
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid image format'), false);
        }
      } else {
        // Allow all for avatars
        cb(null, true);
      }
    }
  });
}

// Default avatar uploader
const avatarUploadDir = "public/avatars";

if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });
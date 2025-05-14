// config/multer.config.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storagePaths = {
  doctor: 'public/uploads/doctors',
  patient: 'public/uploads/patients'
};

// Create directories if they don't exist
Object.values(storagePaths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Disk storage configuration
const doctorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storagePaths.doctor);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.match(/(jpeg|jpg|png|gif|webp|pdf)$/i)) {
    return cb(new Error('Only image and PDF files are allowed!'), false);
  }
  cb(null, true);
};

export const uploadDoctorFiles = multer({
  storage: doctorStorage, // or memoryStorage() if you prefer
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 7 // matches your route
  }
});

// Error handling middleware (use after Multer)
export const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};
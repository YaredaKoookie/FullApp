// config/multer.config.js
import multer from 'multer';
import fs from "fs"

const storagePaths  = {
    doctor: "public/uploads/doctors",
    patient: "public/uploads/patients"
}

Object.values(storagePaths).forEach(dir => {
    if(!fs.existsSync(dir))
        fs.mkdirSync(dir, {recursive: true})
});

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.match(/(jpeg|jpg|png|gif|webp)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};




export const uploadImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});
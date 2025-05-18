import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import env from "./env.config";
import ServerError from "../utils/ServerError";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadImageCloud = async (imagePath, folder) => {
  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    transformation: { width: 500, height: 500, crop: "fill", gravity: "face" },
    folder: folder || "DAP",
  };

  try {
    const result = await cloudinary.uploader.upload(imagePath, options);
    fs.unlink(imagePath, (error) => {
      if (error) console.log("unable to delete a disk file");
    });
    console.log("cloudinary upload result", result);
    return result;
  } catch (error) {
    console.log("cloudinary upload error", error);
    throw ServerError.internal("Unable to upload image");
  }
};

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Image deletion failed");
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${crypto
      .randomUUID()
      .toString("hex")}-${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  console.log("mimetype", file.mimetype);
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, and JPG images are allowed"), false);
  }
  cb(null, true);
};

export const upload = multer({ storage, fileFilter });

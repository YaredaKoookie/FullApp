import { Router } from "express";
import { validate } from "../../validations";
import {
    patientChains,
} from "../../validations/chains";
import {
    patientController
} from "../../controllers";

import { isProfileCompleted } from "../../middlewares/auth.middleware";
import { uploadImage } from "../../config/multer.config";
import { upload } from "../../config/cloudinary.config";

const router = Router();

const parseFormDataJsonFields = (fields = []) => {
    return (req, res, next) => {
      try {
        fields.forEach(field => {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = JSON.parse(req.body[field]);
          }
        });
        next();
      } catch (error) {
        res.status(400).json({ error: `Invalid ${field} format` });
      }
    };
};

router.post(
    "/",
    upload.single("profileImage"),
    parseFormDataJsonFields(["emergencyContact", "location"]),
    validate(patientChains.validateProfileCreation),
    patientController.createPatientProfile
);

router.use(isProfileCompleted);

router.put(
    "/image",
    upload.single("profileImage"),
    patientController.uploadPatientProfileImage
);

router.put(
    "/",
    uploadImage.single("profileImage"),
    validate(patientChains.validatePatientUpdate),
    patientController.updateProfile
);


router.get("/", patientController.getProfile);

export default router;
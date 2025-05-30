import { Router } from "express";
import {
  validateRequest,
  validateParams,
  validateQuery,
} from "../middlewares/validateRequest.js";
import { upload } from "../config/cloudinary.config.js";
import {
  addDoctorValidation,
  updateDoctorValidation,
  doctorIdValidation,
  toggleDoctorStatusValidation,
  listDoctorsValidation,
} from "../validations/doctor.validation.js";
import * as adminController from "../controllers/Admin/admin.controller.js";

const router = Router();

router.get(
  "/doctors",
  validateQuery(listDoctorsValidation),
  adminController.listDoctors
);

router.post(
  "/doctors",
  // validateRequest(addDoctorValidation),
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "boardCertificationsDocument", maxCount: 1 },
    { name: "educationDocument", maxCount: 1 },
  ]),
  adminController.addNewDoctor
);

router.get(
  "/doctors/:id",
  validateParams(doctorIdValidation),
  adminController.getDoctorForEdit
);

router.put(
  "/doctors/:id",
  validateParams(doctorIdValidation),
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "boardCertificationsDocument", maxCount: 1 },
    { name: "educationDocument", maxCount: 1 },
  ]),
  validateRequest(updateDoctorValidation),
  adminController.updateDoctor
);

router.delete(
  "/doctors/:id",
  validateParams(doctorIdValidation),
  adminController.deleteDoctor
);

router.patch(
  "/doctors/:id/status",
  validateParams(doctorIdValidation),
  validateRequest(toggleDoctorStatusValidation),
  adminController.toggleDoctorStatus
);

router.get(
  "/doctors/:id/profile",
  validateParams(doctorIdValidation),
  adminController.viewDoctorProfile
);

router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUserDetails);
router.put("/users/:id", adminController.updateUser);
router.patch("/users/:id/status", adminController.toggleUserStatus);
router.delete("/users/:id", adminController.deleteUser);

// Appointment management (read-only for admin)
router.get("/appointments", adminController.listAppointments); // List all appointments
router.get("/appointments/:id", adminController.getAppointmentDetails); // View appointment details

router.get("/banks", adminController.getBanks)
export default router;

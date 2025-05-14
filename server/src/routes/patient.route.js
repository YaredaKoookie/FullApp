import { Router } from "express";
import { validate } from "../validations";
import {
  appointmentChains,
  doctorChains,
  patientChains,
} from "../validations/chains";
import {
  appointmentController,
  patientController,
  reviewController,
} from "../controllers";
import {
  validateCreateReview,
  validateUpdateReview,
} from "../validations/chains/review.chain";
import { isPatient, isProfileCompleted } from "../middlewares/auth.middleware";
import { uploadImage } from "../config/multer.config";
import { getDoctorAvailability } from "../controllers/appointment.controller";

const router = Router();

router.post(
  "/profile",
  uploadImage.single("profileImage"),
  validate(patientChains.validatePatientCreation),
  patientController.createPatientProfile
);
router.get("/doctors/:doctorId/availability", getDoctorAvailability);

router.use(isProfileCompleted);

router.get("/me", patientController.getProfile);

router.post(
  "/profileImage",
  uploadImage.single("profileImage"),
  patientController.uploadPatientProfileImage
);

router.put(
  "/edit",
  uploadImage.single("profileImage"),
  validate(patientChains.validatePatientUpdate),
  patientController.updateProfile
);

router.get(
  "/doctors",
  validate(doctorChains.validateGetDoctor),
  patientController.getApprovedDoctors
);

router.get("/doctors/:doctorId", patientController.getApprovedDoctorById);

router.post(
  "/review",
  validate(validateCreateReview),
  reviewController.createReview
);

router.put(
  "/reviews/:reviewId",
  validate(validateUpdateReview),
  reviewController.updateReview
);

router.delete("/reviews/:reviewId", reviewController.deleteReview);

// router.get('/patient/chats', auth, isPatient, chatController.getChats);
// router.post('/patient/upload-record', auth, isPatient, patientController.uploadMedicalRecord); // NEW
// router.get('/patient/transactions', auth, isPatient, patientController.getTransactionHistory); // NEW

//*############# Appointment related routes #############

router.post(
  "/appointments/:doctorId/book",
  validate(appointmentChains.validateAppointmentCreation),
  appointmentController.requestAppointment
);
router.get(
  "/appointments",
  validate(appointmentChains.validateGetAppointments),
  appointmentController.getPatientAppointments
);

router.put(
  "/appointments/:appointmentId/cancel",
  validate(appointmentChains.validateCancelAppointment),
  appointmentController.patientCancelAppointment
);

// router.get("/appointments",
//     validate(appointmentChains.validateGetAppointmentByStatus),
//     patientController.getPatientAppointments
// );

// router.put(
//     '/appointments/:appointmentId/cancel',
//     validate(appointmentChains.validateCancelAppointment),
//     patientController.cancelAppointment
// );

//* ############ appointment related routes ends here ##############

export default router;

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
  paymentController,
  reviewController,
} from "../controllers";
import {
  validateCreateReview,
  validateUpdateReview,
} from "../validations/chains/review.chain";
import { isPatient, isProfileCompleted } from "../middlewares/auth.middleware";
import { uploadImage } from "../config/multer.config";
import { upload } from "../config/cloudinary.config";

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
  "/profile",
  upload.single("profileImage"),
  parseFormDataJsonFields(["emergencyContact", "location"]),
  validate(patientChains.validateProfileCreation),
  patientController.createPatientProfile
);



router.use(isProfileCompleted);


router.put(
  "/profile/image",
  upload.single("profileImage"),
  patientController.uploadPatientProfileImage
);

router.put(
  "/profile",
  uploadImage.single("profileImage"),
  validate(patientChains.validatePatientUpdate),
  patientController.updateProfile
);

router.get("/profile", patientController.getProfile);

router.get(
  "/doctors",
  validate(doctorChains.validateGetDoctor),
  patientController.getApprovedDoctors
);


router.get(
  "/doctors/statistics",
  validate(patientChains.validateGetDoctorStatistics),
  patientController.getDoctorStatistics 
)

router.get("/doctors/:doctorId", patientController.getApprovedDoctorById);


// ############# review related routes #################### //

router.get("/doctors/:doctorId/can-review", reviewController.canReviewDoctor);

router.get("/doctors/:doctorId/reviews", reviewController.getReviews);

router.post(
  "/doctors/:doctorId/review",
  validate(validateCreateReview),
  reviewController.createReview
);

router.put(
  "/reviews/:reviewId",
  validate(validateUpdateReview),
  reviewController.updateReview
);

router.delete("/reviews/:reviewId", reviewController.deleteReview);

//*############# Appointment related routes #############

router.post(
  "/appointments/:doctorId/book",
  validate(appointmentChains.validateAppointmentCreation),
  appointmentController.requestAppointment
);

router.get("/appointments/search", appointmentController.searchAppointments)

router.get(
  "/appointments",
  validate(appointmentChains.validateGetAppointments),
  appointmentController.getPatientAppointments
);

router.get(
  "/appointments/:appointmentId",
  appointmentController.getAppointmentById
);

router.get(
  "/payments",
  paymentController.getPayments
)

router.put(
  "/appointments/:appointmentId/cancel",
  validate(appointmentChains.validateCancelAppointment),
  appointmentController.patientCancelAppointment
);

router.post(
  "/appointments/:appointmentId/reschedule",
  validate(appointmentChains.validateRequestSchedule),
  appointmentController.requestAppointmentReschedule
)

router.put(
  "/appointments/:appointmentId/reschedule/:action", 
  validate(appointmentChains.validateRespondToReschedule),
  appointmentController.respondToReschedule
)

//* ############ appointment related routes ends here ##############

export default router;


// router.get('/patient/chats', auth, isPatient, chatController.getChats);
// router.post('/patient/upload-record', auth, isPatient, patientController.uploadMedicalRecord); // NEW
// router.get('/patient/transactions', auth, isPatient, patientController.getTransactionHistory); // NEW

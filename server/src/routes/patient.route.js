import {Router} from "express";
import {validate} from "../validations"
import { appointmentChains, doctorChains, patientChains } from "../validations/chains";
import { patientController, reviewController } from "../controllers";
import { validateCreateReview, validateUpdateReview } from "../validations/chains/review.chain";

const router = Router();


router.post(
    "/profile",
    validate(patientChains.validatePatientCreation),
    patientController.createPatientProfile
)

router.get(
    "/me",
    patientController.getProfile
)

router.put(
    "/edit",
    validate(patientChains.validatePatientUpdate),
    patientController.updateProfile,
)

router.post('/appointments/:doctorId/book', validate(appointmentChains.validateAppointmentCreation), patientController.bookAppointment);

router.get("/appointments", 
    validate(appointmentChains.validateGetAppointmentByStatus),
    patientController.getPatientAppointments
);

router.put(
    '/appointments/:appointmentId/cancel', 
    validate(appointmentChains.validateCancelAppointment),
    patientController.cancelAppointment
); 

router.get(
    '/doctors',
   validate(doctorChains.validateGetDoctor),
   patientController.getApprovedDoctors
)

router.get(
    "/doctors/:doctorId",
    patientController.getApprovedDoctorById
)

router.post("/review", validate(validateCreateReview), reviewController.createReview)
router.put("/reviews/:reviewId", validate(validateUpdateReview), reviewController.updateReview);
router.delete("/reviews/:reviewId", reviewController.deleteReview);


// router.get('/patient/chats', auth, isPatient, chatController.getChats);
// router.post('/patient/upload-record', auth, isPatient, patientController.uploadMedicalRecord); // NEW
// router.get('/patient/transactions', auth, isPatient, patientController.getTransactionHistory); // NEW


export default router;
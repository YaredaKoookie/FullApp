import {Router} from "express";
import {validate} from "../validations"
import { appointmentChains, patientChains } from "../validations/chains";
import { patientController } from "../controllers";

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



// router.get('/patient/doctors', auth, isPatient, doctorController.getAllApprovedDoctors);
// router.get('/patient/doctors/:id', auth, isPatient, doctorController.getDoctorById);
// router.get('/patient/chats', auth, isPatient, chatController.getChats);
// router.post('/patient/feedback/:doctorId', auth, isPatient, patientController.giveFeedback);
// router.post('/patient/upload-record', auth, isPatient, patientController.uploadMedicalRecord); // NEW
// router.get('/patient/transactions', auth, isPatient, patientController.getTransactionHistory); // NEW


export default router;
import { Router } from "express";
import profileRoutes from "./profile.route";
import appointmentRoutes from "./appointments.route";
import doctorRoutes from "./doctor.route";
import reviewRoutes from "./review.route";
import paymentRoutes from "./payment.route";
import { isPatient, isProfileCompleted } from "../../middlewares/auth.middleware";
import { getPatientOverview } from "../../controllers/patient/patient.controller";
import medicalHistoryRoutes from "./medicalHistory.route";

const router = Router();

// Overview route
router.get("/overview", isPatient, isProfileCompleted, getPatientOverview);
router.use("/medical-history", isPatient, isProfileCompleted, medicalHistoryRoutes);
router.use("/profile", isPatient,profileRoutes);
router.use("/appointments", isPatient, isProfileCompleted, appointmentRoutes);
router.use("/doctors", doctorRoutes)
router.use("/reviews", isPatient, reviewRoutes);
router.use("/payments", isPatient, isProfileCompleted, paymentRoutes);


export default router;


// router.get('/patient/chats', auth, isPatient, chatController.getChats);
// router.post('/patient/upload-record', auth, isPatient, patientController.uploadMedicalRecord); // NEW
// router.get('/patient/transactions', auth, isPatient, patientController.getTransactionHistory); // NEW

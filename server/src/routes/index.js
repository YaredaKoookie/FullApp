import {Router} from "express"
import authRoutes from "./auth.route";
import doctorRoutes from "./doctor.route";
import patientRoutes from "./patient.route";
import paymentRoutes from "./payment.route";
import { isPatient ,isAdmin ,isDoctor} from "../middlewares/auth.middleware";
import medicalHistoryRoutes from './medicalHistory.route'; 
import adminRoutes from './admin.routes'

const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", isDoctor ,doctorRoutes);
router.use("/medical-history", medicalHistoryRoutes);
router.use("/patient", isPatient, patientRoutes);
router.use("/payment", paymentRoutes);
router.use("/admin", isAdmin, adminRoutes)

export default router;
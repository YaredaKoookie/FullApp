import {Router} from "express"
import authRoutes from "./auth.route";
import doctorRoutes from "./doctor.route";
import patientRoutes from "./patient.route";
import paymentRoutes from "./payment.route";
import { isPatient } from "../middlewares/auth.middleware";
import scheduleRoutes from './schedule.route' 
import adminRoutes from './admin.routes'
const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patient", isPatient, patientRoutes);
router.use("/payment", paymentRoutes);
router.use("/schedule", scheduleRoutes)
router.use("/admin", adminRoutes)


export default router;
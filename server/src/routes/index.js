import {Router} from "express"
import authRoutes from "./auth.route";
import doctorRoutes from "./doctor.route";
import patientRoutes from "./patient.route";
import PaymentRoutes from "./transaction.routes";
import { isPatient, isProfileCompleted } from "../middlewares/auth.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patient", isPatient, patientRoutes);
router.use("/payment", PaymentRoutes);

export default router;
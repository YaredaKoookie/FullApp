import {Router} from "express"
import authRoutes from "./auth.route";
import doctorRoutes from "./doctor.route";
import patientRoutes from "./patient.route";
import { isPatient } from "../middlewares/auth.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patient", isPatient, patientRoutes);

export default router;
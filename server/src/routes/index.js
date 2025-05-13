import {Router} from "express"
import authRoutes from "./auth.route";
import doctorRoutes from "./doctor.route";
import patientRoutes from "./patient.route";
import { isPatient, isProfileCompleted } from "../middlewares/auth.middleware";
import scheduleRoutes from './schedule.route' 
const router = Router();

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patient", isPatient, patientRoutes);
router.use("/schedule", scheduleRoutes)


export default router;
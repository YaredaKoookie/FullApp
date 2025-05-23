import {Router} from "express"
import authRoutes from "./auth.route";
import doctorRoutes from "./doctor.route";
import patientRoutes from "./patient";
import { isAdmin, isPatient ,isDoctor} from "../middlewares/auth.middleware";
import adminRoutes from './admin.routes'
import videoCallRoutes from './videoCall.route'
const router = Router();

router.use("/auth", authRoutes);

router.use("/doctors",isDoctor, doctorRoutes);

router.use("/patient", isPatient, patientRoutes);

router.use("/video", videoCallRoutes);

router.use("/admin", isAdmin, adminRoutes);

export default router;
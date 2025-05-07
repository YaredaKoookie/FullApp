import {Router} from "express"
import authRoutes from "./auth.route";
import patientRoutes from "./patient.route";
import { isPatient } from "../middlewares/auth.middleware";

const router = Router();

router.use("/auth", authRoutes);
router.use("/patient", (req, res, next) => {
  console.log("patient profile completion", req.body);
    next();
}, isPatient, patientRoutes)


export default router;
import {Router} from "express"
import authRoutes from "./auth.route";
import doctorRoutes from "./doctor.route";


const router = Router();



router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);

export default router;
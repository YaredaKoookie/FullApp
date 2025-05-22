import { Router } from "express";
import { getVideoToken } from "../controllers/videoCall.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/token", verifyJWT, getVideoToken);

export default router;

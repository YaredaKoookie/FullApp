import {Router} from "express";
import {validate} from "../validations"
import { patientChains } from "../validations/chains";
import { patientController } from "../controllers";

const router = Router();


router.post(
    "/profile",
    validate(patientChains.validatePatientCreation),
    patientController.createPatientProfile
)

router.get(
    "/me",
    patientController.getProfile
)



export default router;
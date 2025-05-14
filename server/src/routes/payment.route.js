import {Router} from "express";
import { paymentChains, validate } from "../validations";
import { paymentController } from "../controllers";
import { authMiddleware, verifyChapaSignature } from "../middlewares";

const {isPatient, isProfileCompleted, verifyJWT} = authMiddleware;
const router = Router();

router.post(
    '/initiate/:appointmentId', 
    isPatient, 
    isProfileCompleted,
    validate(paymentChains.validateInitiatePayment),
    paymentController.initiatePayment
)

router.post(
    "/:paymentId/initialize",
    isPatient,
    validate(paymentChains.validateInitializePayment),
    paymentController.initializeChapaPayment
)

router.post(
    '/payment/refund',
    verifyJWT,
    validate(paymentChains.validateRefundRequest),
    paymentController.processRefund
)

router.get(
    '/chapa/callback', 
    // validate(paymentChains.validateChapaCallback),
    paymentController.verifyChapaCallback
)

router.post(
    '/chapa/webhook', 
    // verifyChapaSignature, 
    paymentController.verifyChapaCallback
)

export default router;
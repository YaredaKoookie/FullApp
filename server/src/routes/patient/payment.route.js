import {Router} from "express";
import { paymentChains, validate } from "../../validations";
import { paymentController } from "../../controllers";
import { authMiddleware, verifyChapaSignature } from "../../middlewares";

const {isPatient, isProfileCompleted, verifyJWT} = authMiddleware;

const router = Router();

router.post(
    '/appointments/:appointmentId', 
    isPatient, 
    isProfileCompleted,
    validate(paymentChains.validateInitiatePayment),
    paymentController.initiatePayment
)

router.post(
    "/:paymentId",
    isPatient,
    validate(paymentChains.validateInitializePayment),
    paymentController.initializeChapaPayment
)

router.get(
    "/",
    paymentController.getPayments
  )

router.post(
    '/refund',
    verifyJWT,
    validate(paymentChains.validateRefundRequest),
    paymentController.processRefund
)

router.get(
    '/chapa/callback', 
    paymentController.verifyChapaCallback
)

router.post(
    '/chapa/webhook', 
    verifyChapaSignature, 
    paymentController.handleChapaWebhook
)

export default router;
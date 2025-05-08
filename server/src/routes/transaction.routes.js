import {Router} from "express"
import {paymentController} from "../controllers"
const router = Router();
import {isPatient} from '../middlewares/auth.middleware';

 
router.post('/payment/:appointmentId/initiate', isPatient, paymentController.initiatePayment);
router.get('/payment/status/:appointmentId', isPatient, paymentController.getPaymentStatus);
router.post('/payment/:appointmentId/refund', paymentController.processRefund); //isAdmin


export default router
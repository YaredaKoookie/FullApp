import express from 'express';
const router = express.Router();

import { isAdmin } from '../middlewares/auth.middleware';
import { adminController } from '../controllers/index.js';
import { withdrawController } from '../controllers/index.js';

router.get(
  '/doctor/',
  isAdmin,
//   authorizePermissions('admin'),
  adminController.getAllDoctors
);

router.get(
  '/doctor/:doctorId',
  isAdmin,
//   authorizePermissions('admin'),
  adminController.getDoctorById
);

router.patch(
  '/doctor/:doctorId/approve',
  isAdmin,
//   authorizePermissions('admin'),
  adminController.approveDoctor
);

router.patch(
  '/doctor/:doctorId/reject',
  isAdmin,
//   authorizePermissions('admin'),
  adminController.rejectDoctor
);


// Admin routes
router.get('/patient', isAdmin, adminController.getAllPatients);
router.get('/patient/:id', isAdmin, adminController.getPatientById);
router.patch('/patient/:id/toggle-status', isAdmin, adminController.togglePatientStatus);



router.get('/payments', isAdmin, withdrawController.getAllPayments);
router.get('/payments/:id', isAdmin, withdrawController.getPaymentDetails);
// router.get('/payments/summary' ,isAdmin , withdrawController.getAllPayments)


router.get('/getWithdraw', isAdmin, withdrawController.getAllWithdrawals);
router.patch('/withdraw/:doctorId/approve', isAdmin, withdrawController.approveWithdrawal);
router.patch('/withdraw/:doctorId/reject', isAdmin, withdrawController.rejectWithdrawal);

export default router;
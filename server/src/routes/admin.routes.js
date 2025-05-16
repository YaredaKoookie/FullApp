import express from 'express';
const router = express.Router();

import {isDoctor } from '../middlewares/auth.middleware';
import { adminController } from '../controllers/index.js';
import { withdrawController } from '../controllers/index.js';

router.get(
  '/doctors/',
  isDoctor,
//   authorizePermissions('admin'),
  adminController.getAllDoctors
);

router.get(
  '/doctors/:id',
  isDoctor,
//   authorizePermissions('admin'),
  adminController.getDoctorById
);

router.patch(
  '/doctors/:id/approve',
  isDoctor,
//   authorizePermissions('admin'),
  adminController.approveDoctor
);

router.patch(
  '/doctors/:id/reject',
  isDoctor,
//   authorizePermissions('admin'),
  adminController.rejectDoctor
);


// Admin routes
router.get('/patient', isDoctor, adminController.getAllPatients);
router.get('/patient/:id', isDoctor, adminController.getPatientById);
router.patch('/patient/:id/toggle-status', isDoctor, adminController.togglePatientStatus);



router.get('/payments', isDoctor, withdrawController.getAllPayments);
router.get('/payments/:id', isDoctor, withdrawController.getPaymentDetails);
// router.get('/payments/summary' ,isDoctor , withdrawController.getAllPayments)


router.get('/withdraw', isDoctor, withdrawController.getAllWithdrawals);
router.patch('/withdraw/:id/approve', isDoctor, withdrawController.approveWithdrawal);
router.patch('/withdraw/:id/reject', isDoctor, withdrawController.rejectWithdrawal);

export default router;
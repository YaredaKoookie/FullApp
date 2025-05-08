const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const isDoctor = require('../middlewares/isDoctor');
const isPatient = require('../middlewares/isPatient');
const isAdmin = require('../middlewares/isAdmin');

// AUTH ROUTES
router.post('/auth/register', authController.register);
router.post('/auth/google', authController.googleLogin);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', auth, authController.getMe);
router.put('/auth/verify-email/:token', authController.verifyEmail);

// PROFILE COMPLETION
router.put('/patient/profile/complete', auth, isPatient, patientController.completeProfile);
router.get('/patient/profile/me', auth, isPatient, patientController.getProfile);
router.put('/doctor/profile/complete', auth, isDoctor, doctorController.completeProfile);
router.get('/doctor/profile/me', auth, isDoctor, doctorController.getProfile);

// DOCTOR PUBLIC
router.get('/doctors', doctorController.getAllApprovedDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);

// DOCTOR PROTECTED
router.put('/doctor/profile/edit', auth, isDoctor, doctorController.editProfile);
router.delete('/doctor/delete-account', auth, isDoctor, doctorController.deleteAccount);
router.get('/doctor/appointments', auth, isDoctor, doctorController.getAppointments);
router.put('/doctor/appointments/:id/approve', auth, isDoctor, doctorController.approveAppointment);
router.put('/doctor/appointments/:id/decline', auth, isDoctor, doctorController.declineAppointment);
router.put('/doctor/appointments/:id/mark-complete', auth, isDoctor, doctorController.markComplete);
router.put('/doctor/appointments/:id/cancel', auth, isDoctor, doctorController.cancelAppointment); 

router.post('/doctor/availability', auth, isDoctor, doctorController.setAvailability); 
router.get('/doctor/availability', auth, isDoctor, doctorController.getAvailability); 


router.get('/doctor/chats', auth, isDoctor, chatController.getChats);
router.post('/doctor/withdrawal/request', auth, isDoctor, doctorController.requestWithdrawal);
router.get('/doctor/earnings', auth, isDoctor, doctorController.getEarnings);
router.get('/doctor/transactions', auth, isDoctor, doctorController.getTransactionHistory); 
router.post('/doctor/appointment/:id/notes', auth, isDoctor, doctorController.addNotes); 




// PATIENT PROTECTED
router.get('/patient/doctors', auth, isPatient, doctorController.getAllApprovedDoctors);
router.get('/patient/doctors/:id', auth, isPatient, doctorController.getDoctorById);
router.post('/patient/appointments/:doctorId/book', auth, isPatient, patientController.bookAppointment);
router.get('/patient/appointments', auth, isPatient, patientController.getAppointments);
router.put('/patient/appointments/:id/cancel', auth, isPatient, patientController.cancelAppointment); 
router.get('/patient/chats', auth, isPatient, chatController.getChats);
router.post('/patient/feedback/:doctorId', auth, isPatient, patientController.giveFeedback);
router.post('/patient/upload-record', auth, isPatient, patientController.uploadMedicalRecord); 
router.get('/patient/transactions', auth, isPatient, patientController.getTransactionHistory); 

// CHAT & VIDEO (Both roles)
router.get('/chat/:appointmentId', auth, chatController.getMessages);
router.post('/chat/:appointmentId/message', auth, chatController.sendMessage);
router.post('/chat/:appointmentId/video-token', auth, chatController.getVideoCallToken);
router.post('/chat/:appointmentId/upload', auth, chatController.uploadFile); // NEW
router.get('/chat/:appointmentId/status', auth, chatController.getChatStatus); // NEW: typing/seen/online

// PAYMENTS
router.post('/payment/:appointmentId/initiate', auth, isPatient, paymentController.initiatePayment);
router.get('/payment/status/:appointmentId', auth, isPatient, paymentController.getPaymentStatus);
router.post('/payment/:appointmentId/refund', auth, isAdmin, paymentController.processRefund); // NEW





// ADMIN ROUTES
router.get('/admin/doctors', auth, isAdmin, adminController.getAllDoctors);
router.put('/admin/doctors/:id/approve', auth, isAdmin, adminController.approveDoctor);
router.delete('/admin/doctors/:id', auth, isAdmin, adminController.deleteDoctor);
router.get('/admin/patients', auth, isAdmin, adminController.getAllPatients);
router.delete('/admin/patients/:id', auth, isAdmin, adminController.deletePatient);
router.get('/admin/appointments', auth, isAdmin, adminController.getAllAppointments);
router.put('/admin/appointments/:id/mark-finished', auth, isAdmin, adminController.markAppointmentFinished);
router.get('/admin/withdrawals', auth, isAdmin, adminController.getAllWithdrawals);
router.put('/admin/withdrawals/:id/approve', auth, isAdmin, adminController.approveWithdrawal);


// ✅ Admin Stats
router.get('/admin/stats/users', auth, isAdmin, adminController.getUserStats); // NEW
router.get('/admin/stats/appointments', auth, isAdmin, adminController.getAppointmentStats); // NEW
router.get('/admin/stats/revenue', auth, isAdmin, adminController.getRevenueStats); // NEW

module.exports = router;

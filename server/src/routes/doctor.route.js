import {isDoctor} from '../middlewares/auth.middleware';
import {doctorController} from '../controllers';

import {Router} from "express"
import { validate } from '../validations';
import { validateDoctorProfile } from '../validations/chains/doctor.chain';
import { doctorEditProfileValidation } from '../validations/chains/editdoctor.chain';

const router = Router();

// DOCTOR PUBLIC
router.get('/all_doctors', doctorController.getAllApprovedDoctors);
router.get('/doctor/:id', doctorController.getDoctorById);

router.put('/profile/complete', isDoctor,  validate(validateDoctorProfile), doctorController.completeProfile);
router.get('/profile/me', isDoctor, doctorController.getProfile);


// DOCTOR PROTECTED
router.put('/profile/edit', isDoctor, validate(doctorEditProfileValidation), doctorController.editProfile);
router.delete('/delete-account', isDoctor, doctorController.deleteAccount);
router.get('/appointments', isDoctor, doctorController.getAppointments);

// router.put('/appointments/:id/decline', isDoctor, doctorController.declineAppointment);
// router.put('/appointments/:id/mark-complete', isDoctor, doctorController.markComplete);
// router.put('/appointments/:id/cancel', isDoctor, doctorController.cancelAppointment); 
// router.post('/availability', isDoctor, doctorController.setAvailability); 
// router.get('/availability', isDoctor, doctorController.getAvailability);
// router.get('/chats', isDoctor, chatController.getChats);
// router.post('/withdrawal/request', isDoctor, doctorController.requestWithdrawal);
// router.get('/earnings', isDoctor, doctorController.getEarnings);
// router.get('/transactions', isDoctor, doctorController.getTransactionHistory); 
// router.post('/appointment/:id/notes', isDoctor, doctorController.addNotes); 











export default router

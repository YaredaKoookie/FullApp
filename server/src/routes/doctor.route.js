import {isDoctor } from '../middlewares/auth.middleware';
import {doctorController, reviewController} from '../controllers';

import {Router} from "express"
import { validate } from '../validations';
import { completeProfileValidation } from '../validations/chains/doctor.chain';
import { doctorEditProfileValidation } from '../validations/chains/editdoctor.chain';

const router = Router();

// DOCTOR PUBLIC
router.get('/all_doctors', doctorController.getAllApprovedDoctors);
router.get('/doctor/:id', doctorController.getDoctorById);

// complete the doctor profile page
router.post('/profile/complete', isDoctor,  validate(completeProfileValidation), doctorController.completeProfile);
// router.post('/upload', isDoctor, doctorController.getProfile);
router.get("/profile/me", isDoctor, doctorController.getCurrentDoctor);

// schedule time
// router.get('/:id/getSchedule', isDoctor, doctorController.getSchedule);
// router.put('/:id/setSchedule', isDoctor, doctorController.setSchedule);

////////////////////////////



































































//////////////////////////
// DOCTOR PROTECTED
router.put('/profile/edit', isDoctor, validate(doctorEditProfileValidation), doctorController.editProfile);
router.delete('/delete-account', isDoctor, doctorController.deleteAccount);
router.get('/appointments', isDoctor, doctorController.getAppointments);
router.put('/appointments/:id/confirm', isDoctor, doctorController.approveAppointment);
router.put('/appointments/:id/cancel', isDoctor, doctorController.declineAppointment);
router.put('/appointments/:id/mark-complete', isDoctor, doctorController.markComplete);
router.put('/appointments/:id/decline', isDoctor, doctorController.cancelAppointment); 
router.post('/setAvailability', isDoctor, doctorController.setAvailability); 
router.get('/availability', isDoctor, doctorController.getAvailability);



// router.get('/chats', isDoctor, chatController.getChats);
// router.post('/withdrawal/request', isDoctor, doctorController.requestWithdrawal);
// router.get('/earnings', isDoctor, doctorController.getEarnings);
// router.get('/transactions', isDoctor, doctorController.getTransactionHistory); 
// router.post('/appointment/:id/notes', isDoctor, doctorController.addNotes); 


// optional 
// doctor must add prescription optional features add by the doctor the the patient can see his prescription 
// add note when the patient make appointment he can add note about his clinical status
// mkdir a side 


router.get("/doctor/:doctorId/reviews/", reviewController.getReviews);

export default router

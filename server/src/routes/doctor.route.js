import {isDoctor } from '../middlewares/auth.middleware';
import {doctorController, doctorPatient, reviewController} from '../controllers';

import {Router} from "express"
import { validate } from '../validations';
import { completeProfileValidation } from '../validations/chains/doctor.chain';
import { handleMulterErrors, uploadDoctorFiles } from '../config/MultiFile';
import { uploadImage, uploadImages } from '../config/multer.config';

const router = Router();

const parseJsonFields = (fieldsToParse = []) => (req, res, next) => {
  try {
    fieldsToParse.forEach(field => {
      if (req.body[field]) {
        req.body[field] = JSON.parse(req.body[field]);
      }
    });
    next();
  } catch (err) {
    next(new Error("Invalid JSON in multipart/form field"));
  }
};
// profile Complete
router.post('/profile/complete', isDoctor, uploadDoctorFiles.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "nationalIdFront", maxCount: 1 },
    { name: "nationalIdBack", maxCount: 1 },
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
    { name: "boardCertificationsDocument", maxCount: 1 },
    { name: "educationDocument", maxCount: 1 },
  ]) ,handleMulterErrors, parseJsonFields(["qualifications", "hospitalAddress", "languages"]), 
  doctorController.completeProfile);
router.get("/profile/me",isDoctor, doctorController.getCurrentDoctor);

// Update doctor profile
router.put(
  "/profile/upload",
  isDoctor,
  uploadImage.single("profilePhoto"),
  doctorController.uploadDoctorProfileImage
)
router.put('/profile/update' , isDoctor , doctorController.updateDoctorProfile)  //unfinished





// GET /api/patients - List all patients (with pagination/filter)
router.get('/patient', isDoctor , doctorPatient.getDoctorPatients);
// GET /api/patients/:id - Get single patient details
router.get('/patient/:id', isDoctor , doctorPatient.getPatientById);
// GET /api/patients/:id/medical-history - Get medical history
router.get('/patient/:id/medical-history', isDoctor , doctorPatient.getMedicalHistory);
// GET /api/patients/:id/consultations - Get consultations
router.get('/patient/:id/consultations', isDoctor , doctorPatient.getConsultations);
// GET /api/patients/:id/prescriptions - Get prescriptions
router.get('/patient/:id/prescriptions', isDoctor , doctorPatient.getPrescriptions);
// POST /api/patients/:id/consultations - Create new consultation
router.post('/patient/:id/consultations', isDoctor , doctorPatient.createConsultation);
// POST /api/patients/:id/prescriptions - Create new prescription
router.post('/patient/:id/prescriptions', isDoctor , doctorPatient.createPrescription);






























































//////////////////////////
// DOCTOR PROTECTED
// router.put('/profile/edit', isDoctor, validate(doctorEditProfileValidation), doctorController.editProfile);
// router.delete('/delete-account', isDoctor, doctorController.deleteAccount);
// router.get('/appointments', isDoctor, doctorController.getAppointments);
// router.put('/appointments/:id/confirm', isDoctor, doctorController.approveAppointment);
// router.put('/appointments/:id/cancel', isDoctor, doctorController.declineAppointment);
// router.put('/appointments/:id/mark-complete', isDoctor, doctorController.markComplete);
// router.put('/appointments/:id/decline', isDoctor, doctorController.cancelAppointment); 
// router.post('/setAvailability', isDoctor, doctorController.setAvailability); 
// router.get('/availability', isDoctor, doctorController.getAvailability);



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

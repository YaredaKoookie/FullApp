import {Router} from "express"
import * as appointmentDoctorController from '../controllers/doctor/doctorApppointments.controller';
import * as doctorPatientController from '../controllers/doctor/doctorPatients';
import * as scheduleController from '../controllers/doctor/doctorScheduleController';
import * as doctorController from '../controllers/doctor/doctorMain.controller';
import * as doctorReviewController from '../controllers/doctor/doctorReviewController';
import * as medicalRecordController from '../controllers/doctor/medicalRecord.controller';
import { upload } from '../config/cloudinary.config';

const router = Router();


// Profile Routes
router.get('/profile', doctorController.getCurrentDoctor);
router.put('/profile', 
  upload.single('profilePhoto'),
  doctorController.updateProfile
);
router.get('/profile/view', doctorController.getDoctorProfileView);
router.get('/profile/view/:doctorId', doctorController.getDoctorProfileViewById);

// Appointment Routes
router.get('/appointments', appointmentDoctorController.getAppointments);
router.get('/appointments/stats', appointmentDoctorController.getAppointmentStats);
router.post('/appointments/:id/accept', appointmentDoctorController.acceptAppointment);
router.post('/appointments/:id/reject', appointmentDoctorController.rejectAppointment);
router.post('/appointments/:id/reschedule', appointmentDoctorController.rescheduleAppointment);
router.post('/appointments/:id/cancel', appointmentDoctorController.cancelAppointment);

// Patient Routes
router.get('/patients', doctorPatientController.getPatients);
router.get('/patients/:id', doctorPatientController.getPatientDetails);
router.get('/patients/:id/history', doctorPatientController.getPatientHistory);
router.get('/patients/:id/medical-history', doctorPatientController.getPatientMedicalHistory);
router.get('/patients/:id/notes', doctorPatientController.getPatientNotes);
router.post('/patients/:id/notes', doctorPatientController.addPatientNote);
router.post('/patients/:id/video-call', doctorPatientController.initiateVideoCall);

// Schedule Routes
router.get('/:doctorId/schedule', scheduleController.getSchedule);
router.post('/:doctorId/schedule', scheduleController.createSchedule);
router.put('/:doctorId/schedule', scheduleController.updateSchedule);
router.get('/:doctorId/schedule/analytics', scheduleController.getScheduleAnalytics);
router.put('/:doctorId/schedule/recurring', scheduleController.updateRecurringSchedule);
router.put('/:doctorId/schedule/breaks', scheduleController.updateBreakSettings);

router.post('/:doctorId/schedule/slots/generate', scheduleController.generateSlots);
router.get('/:doctorId/schedule/slots', scheduleController.getSlots);
router.delete('/:doctorId/schedule/slots/:slotId', scheduleController.deleteSlot);

router.post('/:doctorId/schedule/blocked', scheduleController.addBlockedSlot);
router.get('/:doctorId/schedule/blocked', scheduleController.getBlockedSlots);
router.delete('/:doctorId/schedule/blocked/:slotId', scheduleController.removeBlockedSlot);

router.get('/:doctorId/reviews', doctorReviewController.getReviews);

// Medical Record Routes
// router.post('/medical-records', medicalRecordController.createMedicalRecord);
// router.get('/medical-records/patient/:patientId', medicalRecordController.getPatientRecords);
// router.get('/medical-records/:recordId', medicalRecordController.getRecordById);
// router.post('/medical-records/:recordId/clinical-notes', medicalRecordController.addClinicalNote);
// router.post('/medical-records/:recordId/diagnoses', medicalRecordController.addDiagnosis);
// router.post('/medical-records/:recordId/prescriptions', medicalRecordController.addPrescription);
// router.post('/medical-records/:recordId/lab-results', medicalRecordController.addLabResult);
// router.post('/medical-records/:recordId/imaging-reports', medicalRecordController.addImagingReport);
// router.post('/medical-records/:recordId/procedures', medicalRecordController.addProcedure);
// router.post('/medical-records/:recordId/hospitalizations', medicalRecordController.addHospitalization);
// router.post('/medical-records/:recordId/vital-signs', medicalRecordController.addVitalSigns);
// router.post('/medical-records/:recordId/immunizations', medicalRecordController.addImmunization);
// router.get('/medical-records/search/diagnosis', medicalRecordController.searchByDiagnosis);

export default router

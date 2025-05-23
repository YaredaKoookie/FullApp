import express from 'express';
import {
    createMedicalRecordValidations,
    getPatientRecordsValidations,
    getRecordByIdValidations,
    addClinicalNoteValidations,
    addDiagnosisValidations,
    updateDiagnosisStatusValidations,
    addPrescriptionValidations,
    addLabResultValidations,
    addImagingReportValidations,
    addProcedureValidations,
    addHospitalizationValidations,
    addVitalSignsValidations,
    addImmunizationValidations,
    searchByDiagnosisValidations,
    getPatientTimelineValidations
} from '../../validations/chains/medicalRecord.chain.js';
import medicalRecordController from '../controllers/medicalRecord.controller.js';
import { validate } from '../../validations/index.js';
import { isDoctor } from "../../middlewares/auth.middleware.js"

const router = express.Router();

router.use(isDoctor);

// Create a new medical record (Doctor only)
router.post(
    '/',
    validate(createMedicalRecordValidations),
    medicalRecordController.createMedicalRecord
);

// Get all medical records for a patient
router.get(
    '/patient/:patientId',
    validate(getPatientRecordsValidations),
    medicalRecordController.getPatientRecords
);

// Get single medical record by ID
router.get(
    '/:recordId',
    validate(getRecordByIdValidations),
    medicalRecordController.getRecordById
);

// Add clinical note to a record (Doctor only)
router.post(
    '/:recordId/clinical-notes',
    validate(addClinicalNoteValidations),
    medicalRecordController.addClinicalNote
);

// Add diagnosis to a record (Doctor only)
router.post(
    '/:recordId/diagnoses',
    validate(addDiagnosisValidations),
    medicalRecordController.addDiagnosis
);

// Update diagnosis status (Doctor only)
router.patch(
    '/:recordId/diagnoses/:diagnosisId/status',
    validate(updateDiagnosisStatusValidations),
    medicalRecordController.updateDiagnosisStatus
);

// Add prescription to a record (Doctor only)
router.post(
    '/:recordId/prescriptions',
    validate(addPrescriptionValidations),
    medicalRecordController.addPrescription
);

// Add lab result to a record (Doctor/System only)
router.post(
    '/:recordId/lab-results',
    validate(addLabResultValidations),
    medicalRecordController.addLabResult
);

// Add imaging report to a record (Doctor/System only)
router.post(
    '/:recordId/imaging-reports',
    validate(addImagingReportValidations),
    medicalRecordController.addImagingReport
);

// Add procedure to a record (Doctor only)
router.post(
    '/:recordId/procedures',
    validate(addProcedureValidations),
    medicalRecordController.addProcedure
);

// Add hospitalization to a record (Doctor only)
router.post(
    '/:recordId/hospitalizations',
    validate(addHospitalizationValidations),
    medicalRecordController.addHospitalization
);

// Add vital signs to a record (Doctor/System only)
router.post(
    '/:recordId/vital-signs',
    validate(addVitalSignsValidations),
    medicalRecordController.addVitalSigns
);

// Add immunization to a record (Doctor/System only)
router.post(
    '/:recordId/immunizations',
    validate(addImmunizationValidations),
    medicalRecordController.addImmunization
);

// Search medical records by diagnosis (Doctor only)
router.get(
    '/search/diagnosis',
    validate(searchByDiagnosisValidations),
    medicalRecordController.searchByDiagnosis
);

// Get patient timeline (Doctor or Patient for their own records)
router.get(
    '/patient/:patientId/timeline',
    validate(getPatientTimelineValidations),
    medicalRecordController.getPatientTimeline
);

export default router;
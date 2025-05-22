import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

export const createMedicalRecordValidations = [
  body('patient')
    .notEmpty().withMessage('Patient ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid patient ID format'),
  
  body('appointment')
    .notEmpty().withMessage('Appointment ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid appointment ID format'),
  
  body('clinicalNotes').optional().isArray().withMessage('Clinical notes must be an array'),
  body('clinicalNotes.*.note').if(body('clinicalNotes').exists()).notEmpty().withMessage('Clinical note content is required'),
  
  body('diagnoses').optional().isArray().withMessage('Diagnoses must be an array'),
  body('diagnoses.*.name').if(body('diagnoses').exists()).notEmpty().withMessage('Diagnosis name is required'),
  body('diagnoses.*.status').if(body('diagnoses').exists()).isIn(['Active', 'Resolved', 'In Remission', 'Chronic']).withMessage('Invalid diagnosis status'),
  body('diagnoses.*.diagnosisDate').if(body('diagnoses').exists()).optional().isISO8601().withMessage('Invalid diagnosis date format'),
  body('diagnoses.*.resolvedDate').if(body('diagnoses').exists()).optional().isISO8601().withMessage('Invalid resolved date format'),
  
  body('prescriptions').optional().isArray().withMessage('Prescriptions must be an array'),
  body('prescriptions.*.medication').if(body('prescriptions').exists()).notEmpty().withMessage('Medication name is required'),
  
  body('labResults').optional().isArray().withMessage('Lab results must be an array'),
  body('labResults.*.testName').if(body('labResults').exists()).notEmpty().withMessage('Test name is required'),
  body('labResults.*.result').if(body('labResults').exists()).notEmpty().withMessage('Test result is required'),
  
  body('imagingReports').optional().isArray().withMessage('Imaging reports must be an array'),
  body('imagingReports.*.type').if(body('imagingReports').exists()).notEmpty().withMessage('Imaging type is required'),
  
  body('procedures').optional().isArray().withMessage('Procedures must be an array'),
  body('procedures.*.name').if(body('procedures').exists()).notEmpty().withMessage('Procedure name is required'),
  body('procedures.*.date').if(body('procedures').exists()).notEmpty().withMessage('Procedure date is required').isISO8601().withMessage('Invalid procedure date format'),
  
  body('hospitalizations').optional().isArray().withMessage('Hospitalizations must be an array'),
  body('hospitalizations.*.reason').if(body('hospitalizations').exists()).notEmpty().withMessage('Hospitalization reason is required'),
  body('hospitalizations.*.admissionDate').if(body('hospitalizations').exists()).notEmpty().withMessage('Admission date is required').isISO8601().withMessage('Invalid admission date format'),
  
  body('vitalSigns').optional().isArray().withMessage('Vital signs must be an array'),
  
  body('immunizations').optional().isArray().withMessage('Immunizations must be an array'),
  body('immunizations.*.vaccine').if(body('immunizations').exists()).notEmpty().withMessage('Vaccine name is required'),
  body('immunizations.*.date').if(body('immunizations').exists()).notEmpty().withMessage('Vaccination date is required').isISO8601().withMessage('Invalid vaccination date format'),
];

export const getPatientRecordsValidations = [
  param('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid patient ID format')
];

export const getRecordByIdValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format')
];

export const addClinicalNoteValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('note')
    .notEmpty().withMessage('Note content is required')
    .isString().withMessage('Note must be a string')
    .trim().isLength({ min: 5 }).withMessage('Note must be at least 5 characters long')
];

export const addDiagnosisValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('name')
    .notEmpty().withMessage('Diagnosis name is required')
    .isString().withMessage('Diagnosis name must be a string')
    .trim().isLength({ min: 3 }).withMessage('Diagnosis name must be at least 3 characters long'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Resolved', 'In Remission', 'Chronic']).withMessage('Invalid diagnosis status'),
  
  body('diagnosisDate')
    .optional()
    .isISO8601().withMessage('Invalid diagnosis date format'),
  
  body('resolvedDate')
    .optional()
    .isISO8601().withMessage('Invalid resolved date format'),
  
  body('code')
    .optional()
    .isString().withMessage('Diagnosis code must be a string'),
  
  body('notes')
    .optional()
    .isString().withMessage('Diagnosis notes must be a string')
];

export const updateDiagnosisStatusValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  param('diagnosisId')
    .notEmpty().withMessage('Diagnosis ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid diagnosis ID format'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Active', 'Resolved', 'In Remission', 'Chronic']).withMessage('Invalid diagnosis status')
];

export const addPrescriptionValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('medication')
    .notEmpty().withMessage('Medication name is required')
    .isString().withMessage('Medication name must be a string'),
  
  body('dosage')
    .optional()
    .isString().withMessage('Dosage must be a string'),
  
  body('frequency')
    .optional()
    .isString().withMessage('Frequency must be a string'),
  
  body('route')
    .optional()
    .isString().withMessage('Route must be a string'),
  
  body('duration')
    .optional()
    .isString().withMessage('Duration must be a string'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
];

export const addLabResultValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('testName')
    .notEmpty().withMessage('Test name is required')
    .isString().withMessage('Test name must be a string'),
  
  body('result')
    .notEmpty().withMessage('Test result is required')
    .isString().withMessage('Test result must be a string'),
  
  body('units')
    .optional()
    .isString().withMessage('Units must be a string'),
  
  body('referenceRange')
    .optional()
    .isString().withMessage('Reference range must be a string'),
  
  body('comments')
    .optional()
    .isString().withMessage('Comments must be a string')
];

export const addImagingReportValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('type')
    .notEmpty().withMessage('Imaging type is required')
    .isString().withMessage('Imaging type must be a string'),
  
  body('findings')
    .optional()
    .isString().withMessage('Findings must be a string'),
  
  body('impression')
    .optional()
    .isString().withMessage('Impression must be a string'),
  
  body('reportUrl')
    .optional()
    .isURL().withMessage('Report URL must be a valid URL')
];

export const addProcedureValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('name')
    .notEmpty().withMessage('Procedure name is required')
    .isString().withMessage('Procedure name must be a string'),
  
  body('date')
    .notEmpty().withMessage('Procedure date is required')
    .isISO8601().withMessage('Invalid procedure date format'),
  
  body('outcome')
    .optional()
    .isString().withMessage('Outcome must be a string'),
  
  body('hospital')
    .optional()
    .isString().withMessage('Hospital name must be a string'),
  
  body('surgeon')
    .optional()
    .isString().withMessage('Surgeon name must be a string'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
];

export const addHospitalizationValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('reason')
    .notEmpty().withMessage('Hospitalization reason is required')
    .isString().withMessage('Reason must be a string'),
  
  body('admissionDate')
    .notEmpty().withMessage('Admission date is required')
    .isISO8601().withMessage('Invalid admission date format'),
  
  body('dischargeDate')
    .optional()
    .isISO8601().withMessage('Invalid discharge date format'),
  
  body('hospitalName')
    .optional()
    .isString().withMessage('Hospital name must be a string'),
  
  body('dischargeSummary')
    .optional()
    .isString().withMessage('Discharge summary must be a string')
];

export const addVitalSignsValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('bloodPressure')
    .optional()
    .isString().withMessage('Blood pressure must be a string'),
  
  body('heartRate')
    .optional()
    .isInt({ min: 20, max: 250 }).withMessage('Heart rate must be between 20 and 250'),
  
  body('respiratoryRate')
    .optional()
    .isInt({ min: 5, max: 60 }).withMessage('Respiratory rate must be between 5 and 60'),
  
  body('temperature')
    .optional()
    .isFloat({ min: 30, max: 45 }).withMessage('Temperature must be between 30°C and 45°C'),
  
  body('oxygenSaturation')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Oxygen saturation must be between 0% and 100%')
];

export const addImmunizationValidations = [
  param('recordId')
    .notEmpty().withMessage('Record ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid record ID format'),
  
  body('vaccine')
    .notEmpty().withMessage('Vaccine name is required')
    .isString().withMessage('Vaccine name must be a string'),
  
  body('date')
    .notEmpty().withMessage('Vaccination date is required')
    .isISO8601().withMessage('Invalid vaccination date format'),
  
  body('lotNumber')
    .optional()
    .isString().withMessage('Lot number must be a string'),
  
  body('site')
    .optional()
    .isString().withMessage('Site must be a string'),
  
  body('manufacturer')
    .optional()
    .isString().withMessage('Manufacturer must be a string'),
  
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
];

export const searchByDiagnosisValidations = [
  query('diagnosis')
    .notEmpty().withMessage('Diagnosis name is required')
    .isString().withMessage('Diagnosis must be a string')
    .trim().isLength({ min: 3 }).withMessage('Diagnosis search term must be at least 3 characters')
];

export const getPatientTimelineValidations = [
  param('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid patient ID format')
];
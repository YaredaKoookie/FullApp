import { api } from '../api';

export const medicalRecordAPI = {
  // Create a new medical record
  create: async (patientId, data) => {
    const response = await api.post(`/medical-records`, {
      patient: patientId,
      ...data
    });
    return response;
  },

  // Get all medical records for a patient
  getPatientRecords: async (patientId) => {
    const response = await api.get(`/medical-records/patient/${patientId}`);
    return response;
  },

  // Get a single medical record by ID
  getRecordById: async (recordId) => {
    const response = await api.get(`/medical-records/${recordId}`);
    return response;
  },

  // Add clinical note to a record
  addClinicalNote: async (recordId, note) => {
    const response = await api.post(`/medical-records/${recordId}/clinical-notes`, { note });
    return response;
  },

  // Add diagnosis to a record
  addDiagnosis: async (recordId, diagnosis) => {
    const response = await api.post(`/medical-records/${recordId}/diagnoses`, diagnosis);
    return response;
  },

  // Add prescription to a record
  addPrescription: async (recordId, prescription) => {
    const response = await api.post(`/medical-records/${recordId}/prescriptions`, prescription);
    return response;
  },

  // Add lab result to a record
  addLabResult: async (recordId, labResult) => {
    const response = await api.post(`/medical-records/${recordId}/lab-results`, labResult);
    return response;
  },

  // Add imaging report to a record
  addImagingReport: async (recordId, imagingReport) => {
    const response = await api.post(`/medical-records/${recordId}/imaging-reports`, imagingReport);
    return response;
  },

  // Add procedure to a record
  addProcedure: async (recordId, procedure) => {
    const response = await api.post(`/medical-records/${recordId}/procedures`, procedure);
    return response;
  },

  // Add hospitalization to a record
  addHospitalization: async (recordId, hospitalization) => {
    const response = await api.post(`/medical-records/${recordId}/hospitalizations`, hospitalization);
    return response;
  },

  // Add vital signs to a record
  addVitalSigns: async (recordId, vitalSigns) => {
    const response = await api.post(`/medical-records/${recordId}/vital-signs`, vitalSigns);
    return response;
  },

  // Add immunization to a record
  addImmunization: async (recordId, immunization) => {
    const response = await api.post(`/medical-records/${recordId}/immunizations`, immunization);
    return response;
  },

  // Search records by diagnosis
  searchByDiagnosis: async (diagnosis) => {
    const response = await api.get(`/medical-records/search/diagnosis?diagnosis=${diagnosis}`);
    return response;
  }
}; 
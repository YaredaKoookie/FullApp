import { authAPI } from './auth';
import { patientAPI } from './patient';
import { doctorAPI } from './doctor';
import { appointmentAPI } from './appointment';
import { medicalRecordAPI } from './medicalRecord';

export const adminAPI = {
  auth: authAPI,
  patients: patientAPI,
  doctor: doctorAPI,
  appointments: appointmentAPI,
  medicalRecords: medicalRecordAPI
}; 
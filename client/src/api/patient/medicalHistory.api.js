import { endpoints } from '../endpoints';
import apiClient from "../apiClient"

/**
 * Get complete medical history for the patient
 * @returns {Promise<Object>} Medical history data
 */
export const getMedicalHistory = () => {
    return apiClient.get(endpoints.patient.medicalHisotry.base());
};

/**
 * Get health summary with key metrics and active issues
 * @returns {Promise<Object>} Health summary data
 */
export const getHealthSummary = () => {
    return apiClient.get(endpoints.patient.medicalHisotry.summary());
};

/**
 * Get medication history timeline
 * @returns {Promise<Array>} Medication timeline data
 */
export const getMedicationTimeline = () => {
    return apiClient.get(endpoints.patient.medicalHisotry.timeline.medications());
};

/**
 * Get hospitalization timeline
 * @returns {Promise<Array>} Hospitalization timeline data
 */
export const getHospitalizationTimeline = () => {
    return apiClient.get(endpoints.patient.medicalHisotry.timeline.hospitalizations());
};

/**
 * Get immunization history
 * @returns {Promise<Array>} Immunization history data
 */
export const getImmunizationHistory = () => {
    return apiClient.get(endpoints.patient.medicalHisotry.immunizations());
};

/**
 * Get family history records
 * @returns {Promise<Array>} Family history data
 */
export const getFamilyHistory = () => {
    return apiClient.get(endpoints.patient.medicalHisotry.familyHistory.base());
};

/**
 * Add new family history record
 * @param {Object} data - Family history record data
 * @param {string} data.relation - Relation to the patient
 * @param {string} data.condition - Medical condition
 * @param {number} data.ageAtDiagnosis - Age at diagnosis
 * @param {boolean} data.deceased - Whether the relative is deceased
 * @returns {Promise<Object>} Created family history record
 */
export const addFamilyHistory = (data) => {
    return apiClient.post(endpoints.patient.medicalHisotry.familyHistory.base(), data);
};

/**
 * Update family history record
 * @param {string} recordId - ID of the family history record
 * @param {Object} data - Updated family history data
 * @returns {Promise<Object>} Updated family history record
 */
export const updateFamilyHistory = (recordId, data) => {
    return apiClient.put(endpoints.patient.medicalHisotry.familyHistory.byId(recordId), data);
};

/**
 * Delete family history record
 * @param {string} recordId - ID of the family history record
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteFamilyHistory = (recordId) => {
    return apiClient.delete(endpoints.patient.medicalHisotry.familyHistory.byId(recordId));
};

/**
 * Get genetic risk report based on family history
 * @returns {Promise<Object>} Genetic risk report data
 */
export const getGeneticRiskReport = () => {
    return apiClient.get(endpoints.patient.medicalHisotry.familyHistory.geneticRisk());
};

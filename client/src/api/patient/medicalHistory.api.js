import { endpoints } from '../endpoints';
import apiClient from "../apiClient"

/**
 * Get complete medical history for the patient
 * @returns {Promise<Object>} Medical history data
 */
export const getMedicalHistory = () => {
    return apiClient.get(endpoints.patient.medicalHistory.base());
};

export const createMedicalHistory = (data) => {
    return apiClient.post(endpoints.patient.medicalHistory.base(), data);
};

/**
 * Get health summary with key metrics and active issues
 * @returns {Promise<Object>} Health summary data
 */
export const getHealthSummary = () => {
    return apiClient.get(endpoints.patient.medicalHistory.summary());
};

/**
 * Get medication history timeline
 * @returns {Promise<Array>} Medication timeline data
 */
export const getMedicationTimeline = () => {
    return apiClient.get(endpoints.patient.medicalHistory.timeline.medications());
};

/**
 * Get hospitalization timeline
 * @returns {Promise<Array>} Hospitalization timeline data
 */
export const getHospitalizationTimeline = () => {
    return apiClient.get(endpoints.patient.medicalHistory.timeline.hospitalizations());
};

/**
 * Get immunization history
 * @returns {Promise<Array>} Immunization history data
 */
export const getImmunizationHistory = () => {
    return apiClient.get(endpoints.patient.medicalHistory.immunizations());
};

/**
 * Get family history records
 * @returns {Promise<Array>} Family history data
 */
export const getFamilyHistory = () => {
    return apiClient.get(endpoints.patient.medicalHistory.familyHistory.base());
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
    return apiClient.post(endpoints.patient.medicalHistory.familyHistory.base(), data);
};

/**
 * Update family history record
 * @param {string} recordId - ID of the family history record
 * @param {Object} data - Updated family history data
 * @returns {Promise<Object>} Updated family history record
 */
export const updateFamilyHistory = (recordId, data) => {
    return apiClient.put(endpoints.patient.medicalHistory.familyHistory.byId(recordId), data);
};

/**
 * Delete family history record
 * @param {string} recordId - ID of the family history record
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteFamilyHistory = (recordId) => {
    return apiClient.delete(endpoints.patient.medicalHistory.familyHistory.byId(recordId));
};

/**
 * Get genetic risk report based on family history
 * @returns {Promise<Object>} Genetic risk report data
 */
export const getGeneticRiskReport = () => {
    return apiClient.get(endpoints.patient.medicalHistory.familyHistory.geneticRisk());
};


export const addAllergy = (data) => {
    return apiClient.post(endpoints.patient.medicalHistory.allergies.base(), data);
};

export const updateAllergy = (allergyId, data) => {
    return apiClient.put(endpoints.patient.medicalHistory.allergies.byId(allergyId), data);
};

export const deleteAllergy = (allergyId) => {
    return apiClient.delete(endpoints.patient.medicalHistory.allergies.byId(allergyId));
};

// export const updateAllergy = (allergyId, data) => {
//     return apiClient.put(endpoints.patient.medicalHistory.allergies(allergyId), data);
// };

export const addMedication = (data) => {
    return apiClient.post(endpoints.patient.medicalHistory.medications.base(), data);
};

export const updateMedication = (medicationId, data) => {
    return apiClient.put(endpoints.patient.medicalHistory.medications.byId(medicationId), data);
};

export const discontinueMedication = (medicationId, data) => {
    console.log("data api", data)
    return apiClient.post(endpoints.patient.medicalHistory.medications.discontinue(medicationId), {
        reasonStopped: data.reasonStopped,
        endDate: data.endDate
    });
};


export const addMedicalCondition = (data) => {
    return apiClient.post(endpoints.patient.medicalHistory.conditions.base(), data);
}

export const updateMedicalCondition = (conditionId, data) => {
    return apiClient.put(endpoints.patient.medicalHistory.conditions.byId(conditionId), data);
}


export const addImunization = (data) => {
    return apiClient.post(endpoints.patient.medicalHistory.immunizations.base(), data);
}

export const updateImmunization = (immunizationId, data) => {
    return apiClient.put(endpoints.patient.medicalHistory.immunizations.byId(immunizationId), data);
}

export const deleteImmunization = (immunizationId) => {
    return apiClient.delete(endpoints.patient.medicalHistory.immunizations.byId(immunizationId));
}

export const addSurgery = (data) => {       
    return apiClient.post(endpoints.patient.medicalHistory.surgeries.base(), data);
}

export const updateSurgery = (surgeryId, data) => {
    return apiClient.put(endpoints.patient.medicalHistory.surgeries.byId(surgeryId), data);
}

export const addHospitalization = (data) => {
    return apiClient.post(endpoints.patient.medicalHistory.hospitalizations.base(), data);
}

export const updateHospitalization = (hospitalizationId, data) => {
    return apiClient.put(endpoints.patient.medicalHistory.hospitalizations.byId(hospitalizationId), data);
}

export const deleteHospitalization = (hospitalizationId) => {
    return apiClient.delete(endpoints.patient.medicalHistory.hospitalizations.byId(hospitalizationId));
}
    
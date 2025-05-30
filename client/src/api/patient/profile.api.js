import apiClient from "../apiClient";
import { endpoints } from "../endpoints";

const {profile} = endpoints.patient;

export const updatePatientProfileImage = async (data) => {
    return await apiClient.put(profile.image(), data, {
        headers: {
            'Content-Type': "multipart/form-data"
        }
    });
};

export const updatePatientProfile = async (data) => {
    return await apiClient.put(profile.base(), data, {
        headers: {
            'Content-Type': "multipart/form-data"
        }
    });
};

export const getPatientProfile = async () => {
    return await apiClient.get(profile.base());
}

export const addEmergencyContact = async (data) => {
    return await apiClient.post(profile.emergencyContact.base(), data)
}

export const updateEmergencyContact = async (contactId, data) => {
    return await apiClient.put(profile.emergencyContact.byId(contactId), data)
}

export const deleteEmergencyContact = async (contactId) => {
    return await apiClient.delete(profile.emergencyContact.byId(contactId))
}

export const addInsurance = async (data) => {
    return await apiClient.post(profile.insurance.base(), data)
}

export const updateInsurance = async (contactId, data) => {
    return await apiClient.put(profile.insurance.byId(contactId), data)
}

export const deleteInsurance = async (contactId) => {
    return await apiClient.delete(profile.insurance.byId(contactId))
}
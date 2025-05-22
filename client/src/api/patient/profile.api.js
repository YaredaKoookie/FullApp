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
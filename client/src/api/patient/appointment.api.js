import apiClient from "../apiClient"
import { endpoints } from "../endpoints";

const {appointments} = endpoints.patient;

export const getPatientAppointments = async () => {
    return await apiClient.get(appointments.base());
};

export const getPatientAppointmentById = async (id) => {
    return await apiClient.get(appointments.byId(id));
};

export const searchPatientAppointments = async (params) => {
    return await apiClient.get(appointments.search(), { params });
};

export const cancelAppointment = async (id, data) => {
    return await apiClient.put(appointments.cancel(id), data);
};

export const bookAppointment = async (doctorId, data) => {
    return await apiClient.post(appointments.book(doctorId), data)
}
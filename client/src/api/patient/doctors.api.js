import apiClient from "../apiClient"
import { endpoints } from "../endpoints"

export const getDoctors = (params) => {
    return apiClient.get(endpoints.patient.doctors.base(), {
        params
    })
}

export const getDoctorsStatistics = () => {
    return apiClient.get(endpoints.patient.doctors.statistics())
}

export const getDoctorById = (id) => {
    return apiClient.get(endpoints.patient.doctors.byId(id))
}

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryClient";
import { getPatientAppointmentById, searchPatientAppointments } from "./appointment.api"

const {appointments: appointmentQueryKeys} = queryKeys.patient;

export const useGetAppointmentById = (id) => {
    return useQuery({
        queryFn: () => getPatientAppointmentById(id),
        queryKey: appointmentQueryKeys.byId(id),
    })
}

export const useSearchAppointments = (params) => {
    return useQuery({
        queryFn: () => searchPatientAppointments(params),
        queryKey: appointmentQueryKeys.byId(id),
    })
}
import { useMutation, useQueryClient} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { bookAppointment, cancelAppointment } from "./appointment.api";
import { queryKeys } from "../queryClient";

const {appointments: appointmentQueryKeys} = queryKeys.patient

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => cancelAppointment(id),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: appointmentQueryKeys.list()})
       toast.success(response.message || "Appointment has been cancelled");
    },
  });
};

export const useBookAppointment = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (doctorId, data) => bookAppointment(doctorId, data),
      onError: (error) => {
          toast.error(error.message);
      },
      onSuccess: (response) => {
         queryClient.invalidateQueries({queryKey: appointmentQueryKeys.list()})
         toast.success(response.message || "Appointment has been booked successfully");
      },
    });
  };
import { cancelAppointment} from "@/lib/api";
import { useMutation, useQueryClient} from "@tanstack/react-query";
import { toast } from "react-toastify";

const useCancelAppointment = (getAppointmentById) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => cancelAppointment(id),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: ["appointments", getAppointmentById]})
       toast.success(response.message || "Profile has been updated successfully");
    },
  });
};

export default useCancelAppointment;

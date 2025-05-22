import { getAppointmentById } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetAppointmentById = (id) => {    
    return useQuery({
      queryFn: () => getAppointmentById(id),
      queryKey: ['appointments', id],
    })
}

export default useGetAppointmentById;
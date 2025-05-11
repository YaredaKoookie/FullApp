import { getAppointments } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetPatientAppointments = () => {    
    return useQuery({
      queryFn: getAppointments,
      queryKey: ['appointments'],
    })
}

export default useGetPatientAppointments;
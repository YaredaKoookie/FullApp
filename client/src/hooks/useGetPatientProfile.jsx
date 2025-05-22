import { getPatientProfile } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetPatientProfile = () => {    
    return useQuery({
      queryFn: getPatientProfile,
      queryKey: ['patient', "profile"],
    })
}

export default useGetPatientProfile;
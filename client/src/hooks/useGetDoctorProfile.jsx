import { getDoctorProfile } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetDoctorProfile = () => {    
    return useQuery({
      queryFn: getDoctorProfile,
      queryKey: ['doctor', "profile"],
    })
}

export default useGetDoctorProfile;
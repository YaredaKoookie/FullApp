import { getDoctorProfile } from "@/lib/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const useGetDoctorProfile = () => {    
    return useQuery({
      queryFn: getDoctorProfile,
      queryKey: ['doctor', "profile"],
      placeholderData: keepPreviousData
    })
}

export default useGetDoctorProfile;
import { useQuery } from "@tanstack/react-query";
import { getPatientProfile } from "./profile.api";
import { queryKeys } from "../queryClient";

export const useGetPatientProfile = () => {    
    return useQuery({
      queryFn: getPatientProfile,
      queryKey: queryKeys.patient.profile(),
    })
}

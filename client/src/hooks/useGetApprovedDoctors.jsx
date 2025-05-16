import { getApprovedDoctors, getDoctorStatistics } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetApprovedDoctors = () => {
  return useQuery({
    queryFn: (query) => getApprovedDoctors(query),
    queryKey: ["doctors"],
    retry: false,
  });
};

export const useGetDoctorsStatistics = () => {
  return useQuery({
    queryFn: getDoctorStatistics,
    queryKey: ["doctors", "statics"],
    retry: false,
    staleTime: Infinity,
  });
};

export default useGetApprovedDoctors;

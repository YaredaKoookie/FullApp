import { getApprovedDoctors } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetApprovedDoctors = () => {    
    return useQuery({
      queryFn: getApprovedDoctors,
      queryKey: ['appointments'],
      retry: false,
    })
}

export default useGetApprovedDoctors;
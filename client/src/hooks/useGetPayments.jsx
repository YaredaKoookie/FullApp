import { getPayments } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetPayments = () => {    
    return useQuery({
      queryFn: getPayments,
      queryKey: ['patient', "payments"],
    })
}

export default useGetPayments;
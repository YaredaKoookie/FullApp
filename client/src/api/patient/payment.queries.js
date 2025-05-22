import { useQuery } from "@tanstack/react-query";
import { getPayments } from "./payment.api";
import { queryKeys } from "../queryClient";

export const useGetPayments = () => {    
    return useQuery({
      queryFn: getPayments,
      queryKey: queryKeys.patient.payments.list(),
    })
}
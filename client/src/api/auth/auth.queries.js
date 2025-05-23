import { useQuery } from "@tanstack/react-query";
import { getUser } from "./auth.api";
import { queryKeys } from "../queryClient";

export const useGetUser = () => {    
    return useQuery({
      queryFn: () => getUser(localStorage.getItem("token")),
      queryKey: queryKeys.auth.me(),
      retry: false,
    })
}

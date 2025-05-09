import { getUser } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const useGetUser = () => {    
    return useQuery({
      queryFn: getUser,
      queryKey: ['user', 'me'],
      retry: false,
    })
}

export default useGetUser;
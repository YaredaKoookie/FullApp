import { useAuth } from "@/context/AuthContext";
import { emailVerify } from "@/lib/api";
import { useMutation} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const useEmailVerify = () => {
  const {login} = useAuth();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (token) => emailVerify(token),
    onError: (error) => {
      toast.error(error.message);
      navigate("/auth/login");
    },
    onSuccess: (response) => {
       const {user, accessToken} = response.data;
       login(accessToken, user);
       toast.success("You have logged in successfully");
    }
  });
};

export default useEmailVerify;

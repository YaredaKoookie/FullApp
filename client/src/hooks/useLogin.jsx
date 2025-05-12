import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {login as loginUser} from "@/lib/api";

const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { login} = useAuth();

  return useMutation({
    mutationFn: (data) => loginUser(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
      console.log(response);
      const { accessToken, user } = response.data;

      queryClient.invalidateQueries(["user", "me"]);
      queryClient.invalidateQueries(["user", "profile"]);
      
      login(accessToken, user);
      toast.success("You have Successfully logged in")
      console.log("profileCompletion")
      const redirectTo =
        user.role === "patient"
          ? "/patient/dashboard"
          : user.role === "doctor"
          ? "/profileCompletion"
          : "/";
      navigate(redirectTo);
    },
  });
};

export default useLogin;

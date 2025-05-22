import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {googleTokenSignIn} from "@/lib/api";

const useGoogleSignIn = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { login} = useAuth();

  return useMutation({
    mutationFn: (data) => googleTokenSignIn(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
      const { accessToken, user } = response.data;

      queryClient.invalidateQueries(["user", "me"]);
      queryClient.invalidateQueries(["user", "profile"]);
      
      login(accessToken, user);
      toast.success("You have Successfully logged in")
      
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

export default useGoogleSignIn;

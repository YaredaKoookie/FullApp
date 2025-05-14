import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login as loginUser } from "@/lib/api";

const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuth();

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
      toast.success("You have Successfully logged in");
      if (user?.role === "patient") {
        <Navigate to="/patient/dashboard" />;
      } else if (user?.role === "doctor") {
        <Navigate to="/doctor/complete-profile" />;
      } else {
        <Navigate to="/" />;
      }
    },
  });
};

export default useLogin;

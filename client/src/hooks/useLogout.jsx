import { useAuth } from "@/context/AuthContext"
import { logout } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const useLogout = () => {
    const {logout: logoutUser} = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
          logoutUser(); 
          toast.success("You have logged out successfully")
          navigate("/");
        }
    })
}

export default useLogout;
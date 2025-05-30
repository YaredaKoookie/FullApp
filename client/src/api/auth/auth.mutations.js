import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { emailVerify, googleTokenSignIn, login, logout, magicLinkCallback, magicLinkSignIn, register } from "./auth.api";
import { queryKeys } from "../queryClient";

export const useEmailVerify = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (token) => emailVerify(token),
        onError: (error) => {
            toast.error(error.message);
            navigate("/auth/login");
        },
        onSuccess: (response) => {
            const { user, accessToken } = response.data;
            login(accessToken, user);
            toast.success("You have logged in successfully");
        }
    });
}

export const useLogin = () => {
    const queryClient = useQueryClient();
    const { login: loginUser } = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data) => login(data),
        onError: (error) => {
            toast.error(error.message);
        },
        onSuccess: (response) => {
            console.log("role", response.role);
            const { accessToken, user } = response.data;

            queryClient.invalidateQueries(["user", "me"]);
            queryClient.invalidateQueries(["user", "profile"]);

            loginUser(accessToken, user);
            toast.success("You have Successfully logged in");
            navigate("/");
        },
    });
};

export const useLogout = () => {
    const { logout: logoutUser } = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: logout,
        onSuccess: () => {
            logoutUser();
            navigate("/");
            toast.success("You have logged out successfully")
        }
    })
}


export const useRegister = () => {
    return useMutation({
        mutationFn: data => register(data),
        onSuccess: (response) => {
            toast.success(response.message || "Verification link has been sent to your email");
        }
    })
}


export const useMagicLinkSignIn = () => {

    return useMutation({
        mutationFn: (data) => magicLinkSignIn(data),
        onError: (error) => {
            toast.error(error.message);
        },
        onSuccess: (response) => {
            toast.success(response.message || "Magic link has been sent to your email");
        },
    });
};

export const useMagicLinkCallback = () => {
    return useMutation({
      mutationFn: (token) => magicLinkCallback(token),
    });
};


export const useGoogleSignIn = () => {
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
  
        queryClient.invalidateQueries(queryKeys.auth.me());
        queryClient.invalidateQueries(queryKeys.patient.profile());
        
        login(accessToken, user);
        toast.success("You have Successfully logged in")
        
        const redirectTo = "/";
        navigate(redirectTo);
      },
    });
  };
  
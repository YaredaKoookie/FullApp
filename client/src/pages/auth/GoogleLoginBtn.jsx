import apiClient from "@/api/apiClient";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const GoogleLoginBtn = ({ role }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const googleMutation = useMutation({
    mutationFn: async (data) =>
      await apiClient.post("/auth/google/token/callback", data),
  });
  // google login

  const handleGoogleLogin = async (response) => {
    try {
      const result = await googleMutation.mutateAsync({
        idToken: response.credential,
        state: { role },
      });
      const { accessToken, user } = result.data;
      login(accessToken, user);
      navigate("/");
      console.log(user);
      toast.success("Successfully Logged In");
    } catch (error) {
      console.log("error", error);
      toast.error(googleMutation.error?.message || "Something went wrong");
    }
  };
  return (
    <>
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => console.error("Login Failed")}
        useOneTap
        size="large"
      />
    </>
  );
};

export default GoogleLoginBtn;

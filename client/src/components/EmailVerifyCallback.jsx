import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../api/apiClient";
import { toast } from "react-toastify";

const EmailVerifyCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: (token) => apiClient.post("/auth/email/verify", { token }),
    onSuccess: (data) => {
      if (data?.data?.accessToken) {
        toast.success("Successfully Logged In");
        navigate("/"); // Redirect to the home page after successful verification
      } else {
        toast.error("Verification failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Error verifying magic link:", error);
      toast.error(
        error?.response?.data?.message || error.message || "Verification failed"
      );
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      console.error("Verification token is missing");
      toast.error("Verification token is missing.");
      navigate("/");
      return;
    }

    mutate(token);
  }, [location.search, navigate, mutate]);

  return <div>Verifying your email...</div>;
};

export default EmailVerifyCallback;

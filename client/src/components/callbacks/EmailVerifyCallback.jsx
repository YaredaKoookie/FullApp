import { useEmailVerify } from "@api/auth";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const EmailVerifyCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { mutate } = useEmailVerify();

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

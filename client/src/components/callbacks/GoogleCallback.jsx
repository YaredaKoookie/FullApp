import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from '@api/apiClient';

const GoogleCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sendGoogleCallback = async () => {
      const queryParams = new URLSearchParams(location.search);
      const code = queryParams.get("code");
      const state = queryParams.get("state");

      if (code && state) {
        try {
          const response = await apiClient.post("/auth/google/callback",{
              code,
              state,
            }
          );
          // Handle success (e.g., save token, redirect)
          console.log("Response:", response.data);
          navigate("/"); // Redirect to a dashboard or another page
        } catch (error) {
          console.error("Error sending Google callback:", error);
          // Handle error (e.g., show error message)
        }
      } else {
        console.error("Missing code or state in callback URL");
      }
    };

    sendGoogleCallback();
  }, [location, navigate]);

  return <div>Processing Google callback...</div>;
};

export default GoogleCallback;

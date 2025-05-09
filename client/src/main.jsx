import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import router from "./routes";
import queryClient from "./lib/queryClient";

import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <RouterProvider
            future={{ v7_startTransition: true }}
            router={router}
          />
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
    <ToastContainer />
  </StrictMode>
);

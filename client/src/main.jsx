import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "@/components/ui/Provider";
import { QueryClientProvider } from "@tanstack/react-query";
import router from "./routes";
import queryClient from "./lib/queryClient";

import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Theme } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider>
      <Theme appearance="light">
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
      </Theme>
    </Provider>
  </StrictMode>
);

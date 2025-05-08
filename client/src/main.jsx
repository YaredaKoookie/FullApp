import { Provider } from "@/components/ui/provider";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import queryClient from "./api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Provider>
          <AuthProvider>
            <GoogleOAuthProvider clientId="857513872449-4cg2tirv3d9gp41t9543bml2sipmjm45.apps.googleusercontent.com">
              <App />
            </GoogleOAuthProvider>
          </AuthProvider>
        </Provider>
      </QueryClientProvider>
      <ToastContainer />
    </BrowserRouter>
  </React.StrictMode>
);

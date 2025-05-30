// components/auth/DashboardRedirect.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const DashboardRedirect = () => {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  if (user?.role === 'patient') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/auth/login" replace />;
};
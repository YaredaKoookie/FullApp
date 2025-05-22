import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const AdminProfileRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!user?.role === "admin") {
    return (
      <Navigate to="/" state={{ from: location }} replace />
    );
  }
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }
    if (user.role !== "admin") {
      return <Navigate to="/" replace />;
    }

  return <Outlet />;
};

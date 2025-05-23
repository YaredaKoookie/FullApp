import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const DoctorProfileRoute = ({children}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div>Loading...</div>;

  if (user.isProfileCompleted && user.role === "doctor") {
    return (
      <Navigate to="/doctor/dashboard" state={{ from: location }} replace />
    );
  }

  return children || <Outlet />;
};

export const DoctorProtectedRoute = ({children}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div>Loading...</div>;

  if (!user?.isProfileCompleted && user?.role === "doctor") {
    return (
      <Navigate
        to="/doctor/complete-profile"
        state={{ from: location }}
        replace
      />
    );
  }
  return children || <Outlet />;
};

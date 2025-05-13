import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const DoctorProfileRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div>Loading...</div>;

  if (user?.isProfileCompleted) {
    return (
      <Navigate to="/doctor/dashboard" state={{ from: location }} replace />
    );
  }

  return <Outlet />;
};

export const DoctorProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div>Loading...</div>;

  if (!user?.isProfileCompleted) {
    return (
      <Navigate
        to="/doctor/complete-profile"
        state={{ from: location }}
        replace
      />
    );
  }
  return <Outlet />;
};

import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // example context
import LoadingSpinner  from '@/components/Loading';

export default function AppProtector({ allowedRoles, children }) {
  const { user, isLoading } = useAuth();

    if (isLoading) {
      return <LoadingSpinner />;
    }

  if (!user || !allowedRoles.includes(user.role)) {
    console.log(user);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
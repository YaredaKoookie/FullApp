// components/protected-route.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner  from '@/components/Loading';


const ProtectedRoute = ({ 
  role, 
  redirectPath = '/auth/login',
  children
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log("user", user);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login with return location
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If roles are specified but user doesn't have required role
  if (role && role !== user.role) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and has required role (if specified)
  return children || <Outlet />;
};

export default ProtectedRoute;
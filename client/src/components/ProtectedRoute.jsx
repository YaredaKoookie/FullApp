import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/Loading';

const ProtectedRoute = ({
  role = "patient",
  redirectPath = '/auth/login',
  skipProfileCheck = false, // Add this new prop
  children
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

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

  // Skip profile check for certain routes (like complete-profile)
  if (!skipProfileCheck) {
    // Redirect to complete profile if not completed
    if (!user.isProfileCompleted && !location.pathname.includes('complete-profile')) {
      return <Navigate to={`/${user.role}/complete-profile`} replace />;
    }

    // Redirect away from complete-profile if already completed
    if (user.isProfileCompleted && location.pathname.includes('complete-profile')) {
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    }
  }

  // If authenticated and has required role (if specified)
  return children || <Outlet />;
};

export default ProtectedRoute;
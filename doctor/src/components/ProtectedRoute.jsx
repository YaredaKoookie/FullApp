import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoadingUser } = useAuth();
  const location = useLocation();

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}; 
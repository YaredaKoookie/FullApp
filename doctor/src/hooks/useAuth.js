import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../lib/api';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query for current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await adminAPI.auth.getCurrentUser();
      return response.data.data.user;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!localStorage.getItem('accessToken'), // Only run query if token exists
  });

  // Check if user is a doctor
  const isDoctor = user?.role === 'doctor';

  // Login mutation
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (credentials) => {
      const response = await adminAPI.auth.login(credentials);
      const { accessToken, user } = response.data.data;
      
      // Verify the logged in user is a doctor
      if (user.role !== 'doctor') {
        throw new Error('Access denied. Only doctors can access this portal.');
      }
      
      localStorage.setItem('accessToken', accessToken);
      return user;
    },
    onSuccess: () => {
      toast.success('Login successful!');
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      localStorage.removeItem('accessToken');
      toast.error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
    },
  });

  // Logout mutation
  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      try {
        await adminAPI.auth.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Always remove token and clear cache regardless of API response
        localStorage.removeItem('accessToken');
        queryClient.clear(); // Clear all queries from cache
      }
    },
    onSuccess: () => {
      toast.success('Logged out successfully');
      // Force a hard redirect to login page
      window.location.href = '/login';
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Logout failed. Please try again.');
      // Still remove token and redirect on error
      localStorage.removeItem('accessToken');
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  // Password reset request mutation
  const { mutate: requestPasswordReset, isPending: isRequestingReset } = useMutation({
    mutationFn: (email) => adminAPI.auth.requestPasswordReset(email),
    onSuccess: () => {
      toast.success('Password reset instructions sent to your email');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to request password reset');
    },
  });

  // Reset password mutation
  const { mutate: resetPassword, isPending: isResettingPassword } = useMutation({
    mutationFn: (data) => adminAPI.auth.resetPassword(data),
    onSuccess: () => {
      toast.success('Password reset successful');
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  return {
    user,
    isLoadingUser,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    isLoggingIn,
    isLoggingOut,
    isRequestingReset,
    isResettingPassword,
    isDoctor,
    isAuthenticated: !!user && isDoctor,
  };
}; 
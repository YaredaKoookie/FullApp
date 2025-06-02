import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../lib/api';
import { toast } from 'react-hot-toast';
import { useCallback } from 'react';

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

  // Check if user is an admin
  const isAdmin = user?.role === 'admin';

  // Login mutation
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: async (credentials) => {
      const response = await adminAPI.auth.login(credentials);
      const { accessToken, user } = response.data.data;
      
      // Verify the logged in user is an admin
      if (user.role !== 'admin') {
        throw new Error('Access denied. Only admins can access this portal.');
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
  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('adminToken');
      await adminAPI.post('/auth/logout');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if the API call fails
      navigate('/login');
    }
  }, [navigate]);

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
    isLoggingOut: false,
    isRequestingReset,
    isResettingPassword,
    isAdmin,
    isAuthenticated: !!user && isAdmin,
  };
}; 
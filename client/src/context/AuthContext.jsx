import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useGetUser from '@/hooks/useGetUser';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: response, isError, isSuccess } = useGetUser();

  useEffect(() => {
    if (response?.data?.user) {
      const {user} = response.data;
      setUser(user);
      setIsLoading(false);
    } else if (isError) {
      setUser(null);
      setIsLoading(false);
    }
  }, [response, isSuccess, isError]);

  const login = (accessToken, userData) => {
    if(accessToken){
        localStorage.setItem("token", accessToken);
    }
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    queryClient.resetQueries();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
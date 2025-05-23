// context/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetUser } from '@api/auth';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  const { data: response, isError, isSuccess, isLoading: isUserLoading } = useGetUser();
  const [isLoading, setIsLoading] = useState(isUserLoading);


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
    queryClient.clear();
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
import Loading from '@/components/Loading';
import React, { createContext, useState, useContext, useEffect } from 'react';
import useGetUser from '@/hooks/useGetUser';

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const {data: response, isLoading} = useGetUser();

    useEffect(() => {
        if(response?.data?.user){
            setUser(response.data.user);
        }
    }, [response]);

    const login = (accessToken, userData) => {
        localStorage.setItem("token", accessToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    const value = {
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    if(isLoading)
        return <Loading />

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

import React, { createContext, useState, useContext } from 'react';

// Create AuthContext
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isUserFetching, setIsUserFetching] = useState(false);
    console.log(setIsUserFetching)
    const login = (accessToken, user) => {
      setUser(user);
      localStorage.setItem("token", accessToken);
    }

    const logout = () => {
        setUser(null);
        localStorage.removeItem("token");
    };

    const value = {
        user, 
        isUserFetching, 
        login, 
        logout,
        isAuthenticated: !!user,
    }


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};

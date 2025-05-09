import React from "react";
import { useAuth } from "@/context/AuthContext";
import { logout } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import {Outlet} from "react-router-dom";
import Navbar from "@/components/Navbar";

const App = () => {
  const { user, logout: logoutUser } = useAuth();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => logoutUser()
 })

 console.log(user);

  return (
     <div className="h-screen">
      <Navbar />
      <Outlet />
     </div>    
  );
};

export default App;

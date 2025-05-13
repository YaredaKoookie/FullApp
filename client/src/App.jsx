import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import useLogout from "./hooks/useLogout";

const App = () => {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  return (
    <div className="h-screen">
      <Navbar />
      {user ? (
        <button onClick={logoutMutation.mutate}>
          {logoutMutation.isPending ? "Loading..." : "Logout"}
        </button>
      ) : (
        <Link to="auth/login">Login</Link>
      )}
      <Outlet />
    </div>
  );
};

export default App;

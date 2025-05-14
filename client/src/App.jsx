import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

const App = () => {
  return (
    <div className="h-screen">
      <div className="header">
        <Navbar />
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};

export default App;

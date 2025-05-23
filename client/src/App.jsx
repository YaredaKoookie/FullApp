import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

const AGORA_APP_ID = "8ceca28f81924e2a80f574fa427a8dcb";


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

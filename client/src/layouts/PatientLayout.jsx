import React from "react";
import { Outlet } from "react-router-dom";
import PatientNavbar from "../components/Navbar/PatientNavbar";

const PatientLayout = () => {
  return (
    <>
      <PatientNavbar />
      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </>
  );
};

export default PatientLayout;

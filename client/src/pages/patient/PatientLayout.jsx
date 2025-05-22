import { Outlet } from "react-router-dom";
import PatientSideBar from "./PatientSideBar";
import { useState } from "react";
import IsProfileCompleted from "@/components/IsProfileCompleted";

const PatientLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState();
  const sideBarWidth = !isCollapsed ? 320 : 80;

  return (
      <div className="flex">
        <aside
          style={{ width: sideBarWidth + "px" }}
          className={`fixed top-0 bottom-0 transition-all duration-300 ease-in-out`}
        >
          <PatientSideBar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </aside>
        <section
          style={{
            width: `calc(100% - ${sideBarWidth}px)`,
            marginLeft: sideBarWidth + "px",
          }}
          className="h-screen overflow-auto bg-gray-100 transition-all duration-300 ease-in-out"
        >
          <Outlet />
        </section>
      </div>
  );
};

export default PatientLayout;

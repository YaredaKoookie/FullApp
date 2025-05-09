import { Outlet } from "react-router-dom";
import PatientSideBar from "./PatientSideBar";

const PatientLayout = () => {
  return (
    <div className="flex">
      <aside className="fixed top-0 bottom-0 w-[320px]">
        <PatientSideBar />
      </aside>
      <section className="ml-[320px] w-[calc(100%-320px)] h-screen overflow-auto">
        <Outlet />
      </section>
    </div>
  );
};

export default PatientLayout;

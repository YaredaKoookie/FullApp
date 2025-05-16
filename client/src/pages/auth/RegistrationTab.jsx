import Register from "./Register";
import EmailSign from "./EmailSign";
import { useSearchParams, Navigate } from "react-router-dom";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

const RegistrationTab = () => {
  const [params] = useSearchParams();
  const role = params.get("role");

  if (!role || (role !== "doctor" && role !== "patient")) {
    return <Navigate to="/auth/select-role" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
        <TabGroup className="min-w-lg">
          <TabList className="flex items-center bg-gray-100 rounded-t-lg p-2.5">
            <Tab className="w-full p-4 data-selected:bg-gray-200 rounded-md">Register</Tab>
            <Tab className="w-full p-4 data-selected:bg-gray-200 rounded-md">Continue With Email</Tab>
          </TabList>
          <TabPanels className="w-full">
            <TabPanel>
              <Register role={role} />
            </TabPanel>
            <TabPanel>
              <EmailSign role={role} />
            </TabPanel>
          </TabPanels>
        </TabGroup>
    </div>
  );
};

export default RegistrationTab;

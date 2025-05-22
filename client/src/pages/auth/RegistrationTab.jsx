import Register from "./Register";
import EmailSign from "./EmailSign";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

const RegistrationTab = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
        <TabGroup className="min-w-lg">
          <TabList className="flex items-center bg-gray-100 rounded-t-lg p-2.5">
            <Tab className="w-full p-4 data-selected:bg-gray-200 rounded-md">Register</Tab>
            <Tab className="w-full p-4 data-selected:bg-gray-200 rounded-md">Continue With Email</Tab>
          </TabList>
          <TabPanels className="w-full">
            <TabPanel>
              <Register role={"patient"} />
            </TabPanel>
            <TabPanel>
              <EmailSign role={"patient"} />
            </TabPanel>
          </TabPanels>
        </TabGroup>
    </div>
  );
};

export default RegistrationTab;

import { Tabs, Card, Stack } from "@chakra-ui/react";
import Register from "./Register";
import EmailSign from "./EmailSign";
import { useSearchParams } from "react-router-dom";
import {Navigate} from "react-router-dom"

const RegistrationTab = () => {
  const [params] = useSearchParams();
  const role = params.get("role");


  if (!role || (role !== "doctor" && role !== "patient")) {
    return <Navigate to="/select-role" replace />;
  }


  return (
    <Stack minHeight="100vh" flexDirection="row" alignItems={"center"} justifyContent={"center"}>
      <Card.Root md={{minWidth: 540}} sm={{minWidth: 320}}>
        <Tabs.Root variant="enclosed" fitted defaultValue="full-register">
          <Tabs.List>
            <Tabs.Trigger value="full-register">Full Register</Tabs.Trigger>
            <Tabs.Trigger value="email-register">Email Regsiter</Tabs.Trigger>
          </Tabs.List>
          <Card.Body sm={{p:1}} lg={{p: 5}} >
            <Tabs.Content value="full-register">
              <Register role={role} />
            </Tabs.Content>
            <Tabs.Content value="email-register">
              <EmailSign role={role} />
            </Tabs.Content>
          </Card.Body>
        </Tabs.Root>
      </Card.Root>
    </Stack>
  );
};

export default RegistrationTab;

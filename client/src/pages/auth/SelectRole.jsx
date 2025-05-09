import React, { useState } from "react";
import { Heart, Stethoscope } from "lucide-react"; // Correct Lucide icons
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const SelectRole = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    setSelectedRole(role);
  };

  const handleProceed = () => {
    if (!selectedRole) return; // Do nothing if no role is selected
    navigate(`/auth/register?role=${selectedRole}`);
  };

  return (
    <Stack minHeight="100vh" flexDir="column" alignItems={"center"} justifyContent={"center"}> 
      <Box w="full" maxW="md" p={6} rounded="lg" shadow="lg">
        <Heading as="h1" size="lg" textAlign="center" mb={6}>
          Select Your Role
        </Heading>

        <Flex justify="space-around" mb={6}>
          {/* Doctor Card */}
          <Stack
            w="40"
            h="40"
            d="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            p={4}
            borderWidth="1px"
            rounded="lg"
            shadow="lg"
            cursor="pointer"
            transition="all 0.3s ease-in-out"
            transform={selectedRole === "doctor" ? "scale(1.05)" : "scale(1)"}
            bg={selectedRole === "doctor" ? "blue.100" : "transparent"}
            borderColor={selectedRole === "doctor" ? "blue.500" : "gray.300"}
            onClick={() => handleSelectRole("doctor")}
          >
            <Stethoscope className="text-4xl" color="blue" />
            <Text fontSize="lg" fontWeight="semibold" mt={2}>
              Doctor
            </Text>
          </Stack>

          {/* Patient Card */}
          <Stack
            w="40"
            h="40"
            d="flex"
            flexDir="column"
            alignItems="center"
            justifyContent="center"
            p={4}
            borderWidth="1px"
            rounded="lg"
            shadow="lg"
            cursor="pointer"
            transition="all 0.3s ease-in-out"
            transform={selectedRole === "patient" ? "scale(1.05)" : "scale(1)"}
            bg={selectedRole === "patient" ? "green.100" : "transparent"}
            borderColor={selectedRole === "patient" ? "green.500" : "gray.300"}
            onClick={() => handleSelectRole("patient")}
          >
            <Heart className="text-4xl" color="green" />
            <Text fontSize="lg" fontWeight="semibold" mt={2}>
              Patient
            </Text>
          </Stack>
        </Flex>

        <Button
          w="full"
          py={3}
          colorScheme="blue"
          onClick={handleProceed}
          disabled={!selectedRole}
        >
          Proceed to Registration
        </Button>

        {/* Information Text */}
        <Center mt={4}>
          <Text textAlign="center">
            Choose your role to get started. You will be able to switch your
            role later if needed.
          </Text>
        </Center>
      </Box>
    </Stack>
  );
};

export default SelectRole;

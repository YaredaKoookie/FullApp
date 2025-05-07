import { Box, Button, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { Link, useRouteError } from "react-router-dom";

const ErrorBoundary = () => {
  const error = useRouteError();
  let title = error?.statusText || error?.name
  let message = error?.error?.message || error?.message;

  console.log(error);

  if (error.status === 404) {
    message = "Page not found";
  }

  return (
    <Stack fontFamily={"Quicksand"} alignItems="center" justifyContent="center" minH={"100vh"}>
      <Box maxW={"lg"} p={12} bg={"gray.800"} borderRadius={6}>
        <Text mb={8} fontSize={38} textTransform={"capitalize"}>
          {title || "Something Went Wrong"}
        </Text>
        <Text color="gray.300" mb={8}>{message}. Click the button below to go back to the home page. </Text>
        <Button as={Link} to="/" variant="solid">Back to Home Page</Button>
      </Box>
    </Stack>
  );
};

export default ErrorBoundary;

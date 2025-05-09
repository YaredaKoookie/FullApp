import { Box, Button, Heading, Highlight, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { Link, useRouteError } from "react-router-dom";

const ErrorBoundary = () => {
  const error = useRouteError();
  let title = error?.statusText || error?.name;
  let message = error?.error?.message || error?.message;

  console.log(error);

  if (error.status === 404) {
    message = "Page not found";
  }

  return (
    <Stack
      fontFamily={"Quicksand"}
      alignItems="center"
      justifyContent="center"
      minH={"100vh"}
    >
      <Box maxW={"xl"} shadow="lg" p={12} maxH={500} overflow={"auto"} borderRadius={6}>
        <Heading color="red.300" mb={8} fontSize={38} textTransform={"capitalize"}>
          {title || "Something Went Wrong"}
        </Heading>
        <Text  mb={8}>
          {message}. Click the button below to go back to the home page.
        </Text>
        {import.meta.env.DEV  && <Text p={3}>{error?.stack || error?.error?.stack}</Text>}
        <Button as={Link} to="/" mt={8} variant="solid">
          Back to Home Page
        </Button>
      </Box>
    </Stack>
  );
};

export default ErrorBoundary;

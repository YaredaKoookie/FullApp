import {
  Field,
  Input,
  Card,
  Button,
  Stack,
  Text,
  Link,
} from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import GoogleLoginBtn from "./GoogleLoginBtn";
import useLogin from "@/hooks/useLogin";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const loginMutation = useLogin();

  const onSubmit = async (data) => {
    await loginMutation.mutateAsync(data);
  };


  return (
    <Stack
      minHeight={"100vh"}
      flexDirection="row"
      alignItems="center"
      justifyContent={"center"}
    >
      <Card.Root
        sm={{ minWidth: 240 }}
        md={{ minWidth: 540 }}
        onSubmit={handleSubmit(onSubmit)}
        as="form"
      >
        <Card.Header>
          <Card.Title>Login</Card.Title>
        </Card.Header>
        <Card.Body>
          <Field.Root mb={3} invalid={errors.email}>
            <Field.Label>Email</Field.Label>
            <Input
              placeholder="me@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
            />
            <Field.ErrorText>
              {errors.email && errors.email.message}
            </Field.ErrorText>
          </Field.Root>

          <Field.Root mb={3} invalid={errors.password}>
            <Field.Label>Password</Field.Label>
            <PasswordInput
              {...register("password", { required: "Password is required" })}
            />
            <Field.ErrorText>
              {errors.password && errors.password.message}
            </Field.ErrorText>
          </Field.Root>
          <Button type="submit" loading={loginMutation.isPending}>
            Login
          </Button>
        </Card.Body>
        <Stack
          p={2}
          px={6}
          gap={5}
          mb={2}
          flexDirection="row"
          alignItems={"center"}
        >
          <div style={{ height: 2, background: "#efefef", flexGrow: 1 }}></div>
          <Text color={"#aaa"}>or</Text>
          <div style={{ height: 2, background: "#efefef", flexGrow: 1 }}></div>
        </Stack>
        <Card.Footer flexDirection={"column"}>
          <Stack width="100%" mb={4}>
            <GoogleLoginBtn />
          </Stack>
          <Text color="gray.500" fontSize="sm">
            No account yet?{" "}
            <Link variant="underline" as={RouterLink} to="/auth/select-role">
              Register
            </Link>
          </Text>
        </Card.Footer>
      </Card.Root>
    </Stack>
  );
};

export default Login;

import { Field, Input, Card, Button, Stack, Text } from "@chakra-ui/react";
import { PasswordInput } from "@/components/ui/password-input";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import GoogleLoginBtn from "./GoogleLoginBtn";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { login } = useAuth();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data) => apiClient.post("/auth/login", data),
  });

  // direct login
  const onSubmit = async (data) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      const { accessToken, user } = result.data;
      login(accessToken, user);
      toast.success("Successfully Logged In");
      navigate("/");
    } catch(error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };
  return (
    <Stack minHeight={"100vh"} flexDirection="row" alignItems="center" justifyContent={"center"}>
      <Card.Root sm={{minWidth: 240}} md={{minWidth: 540}} onSubmit={handleSubmit(onSubmit)} as="form">
        <Card.Header>Login</Card.Header>
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
        <Card.Footer>
          <Stack width="100%">
            <GoogleLoginBtn />
          </Stack>
        </Card.Footer>
      </Card.Root>
    </Stack>
  );
};

export default Login;

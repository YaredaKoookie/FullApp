import {
  Field,
  Input,
  Stack,
  Card,
  Button,
  Text,
  Fieldset,
} from "@chakra-ui/react";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import { useForm } from "react-hook-form";
import apiClient from "@/api/apiClient";
import { toast } from "react-toastify";
import { useMutation } from "@tanstack/react-query";
import GoogleLoginBtn from "./GoogleLoginBtn";

const checkPasswordStrength = (password) => {
  let strengthValue = 0;
  let message = "Weak";

  if (password.length >= 8) strengthValue++;
  if (/[A-Z]/.test(password)) strengthValue++;
  if (/[0-9]/.test(password)) strengthValue++;
  if (/[@$!%*?&#]/.test(password)) strengthValue++;

  switch (strengthValue) {
    case 1:
      message = "Very Weak";
      break;
    case 2:
      message = "Weak";
      break;
    case 3:
      message = "Moderate";
      break;
    case 4:
      message = "Strong";
      break;
    default:
      message = "Very Weak";
  }

  return { message, strengthValue };
};

const Register = ({ role }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const registerMutation = useMutation({
    mutationFn: async (data) => await apiClient.post("/auth/register", data),
  });

  const loginWithPassword = async (formData) => {
    try {
      await registerMutation.mutateAsync({ ...formData, role });
      toast.success("Email verification has been sent");
    } catch {
      toast.error(registerMutation.error.message);
    }
  };
  return (
    <Card.Root
      onSubmit={handleSubmit(loginWithPassword)}
      as="form"
      width="100%"
      border={"none"}
    >
      <Card.Body>
        <Fieldset.Root>
          <Field.Root invalid={errors.email}>
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

          <Field.Root invalid={errors.password}>
            <Field.Label>Password</Field.Label>
            <Stack width="100%">
              <PasswordInput
                {...register("password", { required: "Password is required" })}
              />
              <PasswordStrengthMeter
                value={
                  checkPasswordStrength(watch("password") || "").strengthValue
                }
              />
            </Stack>
            <Field.ErrorText>
              {errors.password && errors.password.message}
            </Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={errors.confirmPassword}>
            <Field.Label>Confirm Password</Field.Label>
            <PasswordInput
              {...register("confirmPassword", {
                required: "Confirm Password is required",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
            />
            <Field.ErrorText>
              {errors.confirmPassword && errors.confirmPassword.message}
            </Field.ErrorText>
          </Field.Root>
          <Button loading={registerMutation.isPending} type="submit">
            Register
          </Button>
        </Fieldset.Root>
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
          <GoogleLoginBtn role={role} />
        </Stack>
      </Card.Footer>
    </Card.Root>
  );
};

export default Register;

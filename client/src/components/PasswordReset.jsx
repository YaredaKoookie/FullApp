import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient"; // Adjust the import path as needed
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { Button, Field, Fieldset, Text, Stack, Card } from "@chakra-ui/react";
import { PasswordInput } from "./ui/password-input";
import { useMutation } from "@tanstack/react-query";

const PasswordReset = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const location = useLocation();
  const navigate = useNavigate();
  const changePasswordMutation = useMutation({
    mutationFn: (data) => apiClient.post("/auth/password-reset/confirm", data),
  });

  // Extract token from URL
  const getTokenFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get("token");
  };

  const changePassword = async ({ password }) => {
    const token = getTokenFromUrl();
    console.log("password", password);

    if (!token) {
      return;
    }

    try {
      await changePasswordMutation.mutateAsync("/auth/password-reset/confirm", {
        token,
        password,
      });
      toast.success("Password has been reset successfully"); // Corrected to success
      setTimeout(() => navigate("/login"), 1000); // Redirect to login after 1 second
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
      console.log(err);
    }
  };

  console.log(watch("password"), errors);

  return (
    <Stack minHeight="100vh" flexDir="column" alignItems="center" justifyContent={"center"}>
      {changePasswordMutation.isSuccess ? (
        <Text>Password Has been changed successfully</Text>
      ) : (
        <Card.Root as="form" onSubmit={handleSubmit(changePassword)} sm={{minWidth: 280}} md={{minWidth: 450}}>
          <Card.Header>
            <Card.Title>Change Password</Card.Title>
          </Card.Header>
          <Card.Body>
            <Fieldset.Root>
              <Field.Root invalid={errors.password}>
                <Field.Label>New Password</Field.Label>
                <PasswordInput {...register("password", { required: "New Password is required" })} />
                <Field.ErrorText>{errors.password && errors.password.message}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={errors.confirmPassword && watch("password")}>
                <Field.Label>Confirm Password</Field.Label>
                <PasswordInput
                  {...register("confirmPassword", {
                    required: true,
                    validate: (value) => value === watch("password") || "Didn't match with the password",
                  })}
                />
                <Field.ErrorText>{errors.confirmPassword && errors.confirmPassword.message}</Field.ErrorText>
              </Field.Root>
              <Button colorPalette={"teal"} loadingText="Please wait..." loading={changePasswordMutation.isPending} type="submit">Submit</Button>
            </Fieldset.Root>
          </Card.Body>
        </Card.Root>
      )}
    </Stack>
  );
};

export default PasswordReset;

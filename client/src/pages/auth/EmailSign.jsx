import {
  Field,
  Input,
  Card,
  Button,
  Fieldset,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import useMagicLinkSignIn from "@/hooks/useMagicLinkSignIn";

const EmailSign = ({ role }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const magicLinkMutation = useMagicLinkSignIn();

  const onSubmit = async (data) => {
    await magicLinkMutation.mutateAsync({ ...data, role });
  };

  return (
    <Card.Root onSubmit={handleSubmit(onSubmit)} as="form" border="none">
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
          <Button loading={magicLinkMutation.isPending} type="submit">
            Send Magic Link
          </Button>
        </Fieldset.Root>
      </Card.Body>
    </Card.Root>
  );
};

export default EmailSign;

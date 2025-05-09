import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import GoogleLoginBtn from "./GoogleLoginBtn";
import useRegister from "@/hooks/useRegister";

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

const PasswordStrengthMeter = ({ value }) => {
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
      <div
        className={`${strengthColors[value - 1] || "bg-red-500"} h-2.5 rounded-full`}
        style={{ width: `${(value / 4) * 100}%` }}
      ></div>
    </div>
  );
};

const Register = ({ role }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const registerMutation = useRegister();

  const loginWithPassword = async (formData) => {
    await registerMutation.mutateAsync({ ...formData, role });
  };

  return (
    <form
      onSubmit={handleSubmit(loginWithPassword)}
      className="w-full bg-white rounded-lg shadow-md p-6"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative mt-1">
            <input
              id="email"
              type="email"
              placeholder="me@example.com"
              className={`block w-full rounded-md border ${
                errors.email
                  ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500"
                  : "border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              } p-2`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
            )}
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type="password"
              className={`block w-full rounded-md border ${
                errors.password
                  ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500"
                  : "border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              } p-2`}
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
            )}
          </div>
          <PasswordStrengthMeter
            value={checkPasswordStrength(watch("password") || "").strengthValue}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="relative mt-1">
            <input
              id="confirmPassword"
              type="password"
              className={`block w-full rounded-md border ${
                errors.confirmPassword
                  ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500"
                  : "border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              } p-2`}
              {...register("confirmPassword", {
                required: "Confirm Password is required",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
            )}
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className={`flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            registerMutation.isPending ? "opacity-70" : ""
          }`}
        >
          {registerMutation.isPending ? (
            <span className="flex items-center">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </span>
          ) : (
            "Register"
          )}
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">or</span>
        </div>
      </div>

      <div className="mb-4">
        <GoogleLoginBtn role={role} />
      </div>

      <div className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <RouterLink
          to="/auth/login"
          className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
        >
          Login
        </RouterLink>
      </div>
    </form>
  );
};

export default Register;
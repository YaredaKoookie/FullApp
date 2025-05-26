import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import GoogleLoginBtn from "./GoogleLoginBtn";
import { useRegister } from "@api/auth";

const checkPasswordStrength = (password) => {
  if (!password) return { message: "", strengthValue: 0 };
  
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
      message = "";
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
  
  const strengthWidths = ["25%", "50%", "75%", "100%"];
  
  return (
    <div className="mt-2 space-y-1">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${strengthColors[value - 1] || "bg-gray-200"} h-2 rounded-full transition-all duration-300`}
          style={{ width: strengthWidths[value - 1] || "0%" }}
        ></div>
      </div>
      {value > 0 && (
        <p className={`text-xs ${
          value === 1 ? "text-red-500" : 
          value === 2 ? "text-orange-500" : 
          value === 3 ? "text-yellow-500" : 
          "text-green-500"
        }`}>
          Strength: {checkPasswordStrength("").message}
        </p>
      )}
    </div>
  );
};

const Register = ({ role = "patient" }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  const onSubmit = async (formData) => {
    await registerMutation.mutateAsync({ ...formData, role });
  };

  const password = watch("password");
  const passwordStrength = checkPasswordStrength(password);

  return (
    <div className="flex overflow-hidden bg-pattern min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full animate-slide max-w-md rounded-2xl bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl sm:min-w-[480px]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-gray-600">Join us today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="me@example.com"
                className={`block w-full rounded-lg border-2 p-3 transition-all ${
                  errors.email
                    ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                }`}
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`block w-full rounded-lg border-2 p-3 transition-all ${
                  errors.password
                    ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                }`}
                {...register("password", { 
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters"
                  }
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {password && (
              <PasswordStrengthMeter value={passwordStrength.strengthValue} />
            )}
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              Password must contain at least 8 characters, including uppercase, number, and special character.
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`block w-full rounded-lg border-2 p-3 transition-all ${
                  errors.confirmPassword
                    ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                }`}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === watch("password") || "Passwords do not match",
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className={`flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              registerMutation.isPending ? "opacity-80" : "hover:shadow-lg"
            }`}
          >
            {registerMutation.isPending ? (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Register"
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">or sign up with</span>
            </div>
          </div>

          <div className="mb-4">
            <GoogleLoginBtn role={role} />
          </div>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <RouterLink
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
            >
              Sign in
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
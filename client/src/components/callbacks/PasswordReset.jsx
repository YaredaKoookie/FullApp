import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "@api/apiClient";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

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

  const getTokenFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get("token");
  };

  const changePassword = async ({ password }) => {
    const token = getTokenFromUrl();

    if (!token) {
      toast.error("Invalid password reset link");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        token,
        password,
      });
      toast.success("Password has been reset successfully");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "An error occurred");
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {changePasswordMutation.isSuccess ? (
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-green-600">
            Password Changed
          </h2>
          <p className="text-gray-600">
            Your password has been updated successfully. Redirecting to login...
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(changePassword)}
          className="w-full max-w-md rounded-lg bg-white p-8 shadow-md"
        >
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Change Password
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
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
                  {...register("password", {
                    required: "New Password is required",
                  })}
                />
                {errors.password && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <AlertTriangle
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
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
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === watch("password") || "Passwords don't match",
                  })}
                />
                {errors.confirmPassword && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <AlertTriangle
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className={`flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                changePasswordMutation.isPending ? "opacity-70" : ""
              }`}
            >
              {changePasswordMutation.isPending ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PasswordReset;
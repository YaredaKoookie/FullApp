import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import GoogleLoginBtn from "./GoogleLoginBtn";
import useLogin from "@/hooks/useLogin";
import { MarsStrokeIcon } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl sm:min-w-[540px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative mt-1">
              <input
                id="email"
                type="email"
                placeholder="me@example.com"
                className={`block w-full rounded-md border ${errors.email ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500" : "border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"} p-2`}
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
                  <MarsStrokeIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type="password"
                className={`block w-full rounded-md border ${errors.password ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500" : "border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"} p-2`}
                {...register("password", { required: "Password is required" })}
              />
              {errors.password && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <MarsStrokeIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className={`flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loginMutation.isPending ? "opacity-70" : ""}`}
          >
            {loginMutation.isPending ? (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <div className="mb-4">
            <GoogleLoginBtn />
          </div>

          <div className="text-center text-sm text-gray-500">
            No account yet?{" "}
            <RouterLink
              to="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
            >
              Register
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
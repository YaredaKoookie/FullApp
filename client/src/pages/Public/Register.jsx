import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Mail,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [activeTab, setActiveTab] = useState("full");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickEmailTouched, setQuickEmailTouched] = useState(false);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&#]/.test(password)) strength++;
    return strength;
  };

  // React Query mutations
  const quickRegisterMutation = useMutation((email) =>
    axios.post("/api/quick-register", { email })
  );

  const fullRegisterMutation = useMutation((data) =>
    axios.post("/api/full-register", data)
  );

  const googleSignInMutation = useMutation(() =>
    axios.post("/api/google-sign-in")
  );

  const handleFullSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return;

    fullRegisterMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          alert("Full registration successful!");
        },
        onError: () => {
          alert("Full registration failed.");
        },
      }
    );
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    setQuickEmailTouched(true);
    if (!validateEmail(quickEmail)) return;

    quickRegisterMutation.mutate(quickEmail, {
      onSuccess: () => {
        alert("Quick registration successful!");
      },
      onError: () => {
        alert("Quick registration failed.");
      },
    });
  };

  const handleGoogleSignIn = () => {
    googleSignInMutation.mutate(null, {
      onSuccess: () => {
        alert("Google sign-in successful!");
      },
      onError: () => {
        alert("Google sign-in failed.");
      },
    });
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-6 bg-white rounded-xl shadow-lg space-y-6">
        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 py-2 text-center font-semibold ${
              activeTab === "full"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("full")}
          >
            Full Registration
          </button>
          <button
            className={`flex-1 py-2 text-center font-semibold ${
              activeTab === "quick"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("quick")}
          >
            Quick Email Registration
          </button>
        </div>

        {activeTab === "full" && (
          <form onSubmit={handleFullSubmit} className="space-y-4">
            <button
              type="button"
              className="w-full flex items-center justify-center border rounded-md py-2 hover:bg-gray-100"
              onClick={handleGoogleSignIn}
              disabled={googleSignInMutation.isLoading}
            >
              {googleSignInMutation.isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" /> Sign in with Google
                </>
              )}
            </button>

            <div className="relative">
              <input
                type="email"
                className="w-full border p-2 rounded-md focus:outline-none focus:ring-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute right-3 top-3 text-gray-400" />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border p-2 rounded-md"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {showPassword ? (
                <EyeOff
                  className="absolute right-3 top-3 cursor-pointer"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <Eye
                  className="absolute right-3 top-3 cursor-pointer"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>

            <div className="h-2 w-full bg-gray-200 rounded">
              <div
                className={`h-full rounded transition-all ${
                  passwordStrength() === 1
                    ? "bg-red-500 w-1/4"
                    : passwordStrength() === 2
                    ? "bg-yellow-500 w-2/4"
                    : passwordStrength() === 3
                    ? "bg-blue-500 w-3/4"
                    : passwordStrength() === 4
                    ? "bg-green-500 w-full"
                    : "w-0"
                }`}
              ></div>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full border p-2 rounded-md"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {showConfirmPassword ? (
                <EyeOff
                  className="absolute right-3 top-3 cursor-pointer"
                  onClick={() => setShowConfirmPassword(false)}
                />
              ) : (
                <Eye
                  className="absolute right-3 top-3 cursor-pointer"
                  onClick={() => setShowConfirmPassword(true)}
                />
              )}
            </div>

            {confirmPassword && confirmPassword !== password && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" /> Passwords do not match
              </p>
            )}

            {confirmPassword && confirmPassword === password && (
              <p className="text-sm text-green-500 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Passwords match
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center"
              disabled={fullRegisterMutation.isLoading}
            >
              {fullRegisterMutation.isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Register"
              )}
            </button>

            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 underline">
                Login
              </Link>
            </p>
          </form>
        )}

        {activeTab === "quick" && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                className={`w-full border p-2 rounded-md focus:outline-none ${
                  quickEmailTouched && !validateEmail(quickEmail)
                    ? "border-red-500"
                    : quickEmailTouched && validateEmail(quickEmail)
                    ? "border-green-500"
                    : ""
                }`}
                placeholder="Email"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                onBlur={() => setQuickEmailTouched(true)}
              />
              <Mail className="absolute right-3 top-3 text-gray-400" />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center"
              disabled={quickRegisterMutation.isLoading}
            >
              {quickRegisterMutation.isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Register"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;

import { useState } from "react";
import {
  Mail,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const [activeTab, setActiveTab] = useState("full");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickEmail, setQuickEmail] = useState("");

  const handleFullSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 2000);
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
            >
              <Mail className="w-4 h-4 mr-2" /> Sign in with Google
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
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Register"
              )}
            </button>

            <p className="text-sm text-center text-gray-600">
              I don't have account?{" "}
              <Link to="/register" className="text-blue-600 underline">
                Register
              </Link>
            </p>
          </form>
        )}

        {activeTab === "quick" && (
          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                className="w-full border p-2 rounded-md focus:outline-none"
                placeholder="Email"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
              />
              <Mail className="absolute right-3 top-3 text-gray-400" />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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

export default Login;

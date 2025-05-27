import { useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  HeartPulse,
  Home,
  LayoutDashboardIcon,
  LogIn,
  LogOut,
  LucideLayoutDashboard,
  Menu as MenuIcon,
  MessageCircle,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useLogout } from "@api/auth";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const publicLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About", icon: HeartPulse },
  { to: "/contact", label: "Contact", icon: MessageCircle },
  // {user ? to="/patient/dashboard" : to="/auth/login", label: "Dashboard", icon: LayoutDashboardIcon },
  // { to: "/patient/dashboard", label: "dashboard", icon: LucideLayoutDashboard },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const logout = useLogout();
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <a to="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CureLogic
            </span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {publicLinks.map((link) => {
            return (
              <NavLink  className={({isActive}) => `flex items-center space-x-2 hover:text-blue-600 transition-colors ${isActive ? "text-blue-600 font-semibold" : "text-gray-700"}`} to={link.to}>
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
              </NavLink>
            );
          })}
          {user && (
            <NavLink
              className={({ isActive }) =>
                `flex items-center space-x-2 hover:text-blue-600 transition-colors ${
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700"
                }`
              }
              to="/patient/dashboard"
            >
              <LucideLayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
          )}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {!user ? (
            <>
              <Link
                to="/auth/login"
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all"
              >
                Get Started
              </Link>
            </>
          ) : (
            <button onClick={logout.mutate} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all">
              Logout
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 bg-white border-t border-gray-100">
              {publicLinks.map((link) => {
                return (
                 <NavLink  className={({isActive}) => `flex items-center space-x-2 hover:text-blue-600 transition-colors ${isActive ? "text-blue-600 font-semibold" : "text-gray-700"}`} to={link.to}>
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
              </NavLink>
                );
              })}
              <div className="pt-4 space-y-3 flex flex-col text-center">
                {!user ? (
                  <>
                    <Link
                      to="/auth/login"
                      className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth/register"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all"
                    >
                      Get Started
                    </Link>
                  </>
                ) : (
                  <button onClick={logout} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all">
                    Logout
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

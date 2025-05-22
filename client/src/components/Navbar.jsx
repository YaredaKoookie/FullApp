import { useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  HeartPulse,
  Home,
  LayoutDashboardIcon,
  LogIn,
  LogOut,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import useLogout from "@/hooks/useLogout";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const logout = useLogout();
  // console.log(user);
  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between border-b border-gray-200 py-6 lg:border-none">
          {/* Logo and Home Link */}
          <div className="flex items-center">
            <Link to="/">
              <div className="flex items-center space-x-2">
                <HeartPulse className="text-blue-600 h-8 w-8" />
                <span className="text-2xl font-bold text-blue-800">
                  CureLogic
                </span>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-10">
            <Link
              to="/"
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 flex items-center"
            >
              <Home className="h-5 w-5 mr-1" />
              Home
            </Link>
            {user ? (
              <Link
                to={user.role === "patient" ? "/patient/dashboard" : user.role === "doctor" ? "/doctor/dashboard" : user.role === "admin" ? "admin/dashboard" : ""}
                className="text-sm font-medium text-gray-900 hover:text-indigo-600 flex items-center"
              >
                <LayoutDashboardIcon className="h-5 w-5 mr-1" />
                Dashboard
              </Link>
            ) : (
              ""
            )}
            {user ? (
              <button
                onClick={logout.mutate}
                disabled={logout.isPending}
                className="flex items-center text-sm font-medium text-gray-900 hover:text-indigo-600"
              >
                <LogOut className="h-5 w-5 mr-1" />
                {logout.isPending ? "Loading..." : "Logout"}
              </button>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center text-sm font-medium text-gray-900 hover:text-indigo-600"
              >
                <LogIn className="h-5 w-5 mr-1" />
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <Transition
          show={mobileMenuOpen}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="absolute inset-x-0 top-0 origin-top-right transform p-2 transition lg:hidden z-50">
            <div className="divide-y-2 divide-gray-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="px-5 pt-5 pb-6">
                <div className="flex items-center justify-between">
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">YL</span>
                    </div>
                  </Link>
                  <div className="-mr-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md p-2 text-gray-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  <nav className="grid gap-y-4">
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center rounded-md p-3 text-base font-medium text-gray-900 hover:bg-gray-50"
                    >
                      <Home className="h-5 w-5 mr-3" />
                      Home
                    </Link>

                    {user ? (
                      <>
                        <Link
                          to="/patient/dashboard"
                          className="flex items-center rounded-md p-3 text-base font-medium text-gray-900 hover:bg-gray-50 w-full"
                        >
                          <LayoutDashboardIcon className="h-5 w-5 mr-3" />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            logout.mutate(); // Properly invoke the logout function
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center rounded-md p-3 text-base font-medium text-gray-900 hover:bg-gray-50 w-full"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Logout
                        </button>

                      </>
                    ) : (
                      <Link
                        to="/auth/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center rounded-md p-3 text-base font-medium text-gray-900 hover:bg-gray-50"
                      >
                        <LogIn className="h-5 w-5 mr-3" />
                        Login
                      </Link>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </nav>
    </header>
  );
};

export default Navbar;

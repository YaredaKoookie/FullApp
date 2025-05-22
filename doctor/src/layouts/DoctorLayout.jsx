import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Calendar,
  User,
  Star,
  Bell,
} from 'lucide-react';
import { FaHome, FaCalendarAlt, FaUserInjured } from 'react-icons/fa';

export const DoctorLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FaHome },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Appointments', href: '/appointments', icon: FaCalendarAlt },
    { name: 'Patients', href: '/patients', icon: FaUserInjured },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Reviews', href: '/reviews', icon: Star },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">CureLogic</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`lg:pl-64 flex flex-col min-h-screen`}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 rounded-full bg-white p-1 hover:bg-gray-50 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.email?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="hidden text-sm font-medium text-gray-700 sm:block">
                  {user?.email}
                </span>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}; 
import adminLinks from "@/constants/adminLinks";
import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, HomeIcon, ArrowLeftCircle } from "lucide-react";
import React from "react";
import { NavLink, useLocation, Link } from "react-router-dom";

const AdminSideBar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { user } = useAuth()
  console.log("yse" ,user);
  return (
    <div className="h-screen bg-gradient-to-b from-indigo-50 to-white p-6 w-full relative">
      {/* Header with Collapse Button */}
      <div
        className={`flex items-center ${
          isCollapsed ? "justify-center" : "justify-between"
        } mb-12 transition-all duration-300`}
      >
        <h2
          className={`text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent transition-opacity ease-in-out ${
            isCollapsed ? "hidden" : ""
          }`}
        >
          Doctor Portal
        </h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-full hover:bg-indigo-100 transition-colors ${
            isCollapsed ? "mx-auto" : ""
          }`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`w-5 h-5 text-indigo-600 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation Links */}
      <ul className="space-y-2">
        {/* Back to Home */}
        <li>
          <NavLink
            to="/"
            className={({ isActive }) => `
              flex items-center 
              ${isCollapsed ? "justify-center p-3" : "px-4 py-3"} 
              rounded-xl 
              transition-all 
              duration-200 
              group
              ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 active"
                  : "hover:bg-indigo-50 text-gray-600 hover:text-indigo-600"
              }
            `}
          >
            <ArrowLeftCircle className="w-5 h-5 text-indigo-500 group-[.active]:text-white" />
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium">Back to Home</span>
            )}
          </NavLink>
        </li>

        {/* Doctor Dashboard Links */}
        {adminLinks.map(({ icon: LinkIcon, url, name, id }) => (
          <li key={id}>
            <NavLink
              to={url}
              className={({ isActive }) => `
                flex items-center 
                ${isCollapsed ? "justify-center p-3" : "px-4 py-3"} 
                rounded-xl 
                transition-all 
                duration-200 
                group
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 active"
                    : "hover:bg-indigo-50 text-gray-600 hover:text-indigo-600"
                }
              `}
            >
              <span
                className={`group-[.active]:text-white text-indigo-500 transition-colors ${
                  isCollapsed ? "" : "mr-3"
                }`}
              >
                <LinkIcon className="w-5 h-5" />
              </span>
              {!isCollapsed && (
                <span className="font-medium text-sm transition-opacity">
                  {name}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* User Profile (when expanded) */}
      {!isCollapsed && (
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <img src={user.email} alt="avatar" />
            </div>
            <div className="overflow-hidden">
              {/* <p className="font-medium text-sm truncate">{`http://localhost:3000/${user.avatar}`}</p> */}
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSideBar;

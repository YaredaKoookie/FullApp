import React from "react";
import {
  CalendarDays,
  DollarSign,
  Bell,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchDashboardData = async () => {
  const res = await axios.get("/api/doctor/dashboard-summary"); // Your API endpoint
  return res.data;
};

const DoctorDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["doctorDashboard"],
    queryFn: fetchDashboardData,
  });

  if (isLoading)
    return (
      <div className="p-6 text-center text-indigo-600 font-medium">
        Loading dashboard...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-500 font-medium">
        Error loading dashboard data.
      </div>
    );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">Doctor Dashboard</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Appointments"
          value={data?.appointmentsToday || 0}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <StatCard
          title="Upcoming Schedule"
          value={data?.upcoming || 0}
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          title="Earnings Today"
          value={`$${data?.earningsToday || 0}`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="New Messages"
          value={data?.newMessages || 0}
          icon={<MessageCircle className="w-5 h-5" />}
        />
      </div>

      {/* Notifications / Updates */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Notifications & Updates
          </h2>
          <Bell className="w-5 h-5 text-indigo-500" />
        </div>
        {data?.notifications?.length > 0 ? (
          <ul className="space-y-3">
            {data.notifications.map((note, index) => (
              <li key={index} className="text-sm text-gray-600 border-b pb-2">
                {note}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No new notifications.</p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-xl font-semibold text-gray-800">{value}</p>
      </div>
      <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
        {icon}
      </div>
    </div>
  );
};

export default DoctorDashboard;

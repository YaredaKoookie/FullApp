import React, { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const fetchAppointments = async () => {
  const res = await axios.get("/api/doctor/appointments");
  return res.data;
};

const DoctorAppointments = () => {
  const [activeTab, setActiveTab] = useState("appointments");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data, isLoading, error } = useQuery({
    queryKey: ["doctorAppointments"],
    queryFn: fetchAppointments,
  });

  const filteredAppointments =
    statusFilter === "All"
      ? data?.appointments || []
      : data?.appointments?.filter((a) => a.status === statusFilter) || [];

  if (isLoading) return <div className="p-6">Loading appointments...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading data</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-gray-800">
          Appointments
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "appointments"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "calendar"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {activeTab === "appointments" ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            {["All", "Confirmed", "Pending", "Completed", "Canceled"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    statusFilter === status
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 border-gray-300 hover:bg-indigo-50"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>

          {/* Appointments List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white shadow-sm p-4 rounded-xl flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-base font-medium text-gray-800">
                      {appt.patientName}
                    </p>
                    <p className="text-sm text-gray-500">{appt.dateTime}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      appt.status === "Confirmed"
                        ? "bg-green-100 text-green-600"
                        : appt.status === "Pending"
                        ? "bg-yellow-100 text-yellow-600"
                        : appt.status === "Completed"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 italic">
                  Note: {appt.notes || "No notes"}
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="text-indigo-600 text-sm flex items-center gap-1 hover:underline">
                    <RefreshCcw className="w-4 h-4" /> Reschedule
                  </button>
                  <button className="text-red-500 text-sm flex items-center gap-1 hover:underline">
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            Calendar View
          </h2>
          <div className="text-sm text-gray-500">
            {/* Placeholder — Replace with real calendar component (e.g., react-calendar) */}
            Integrate a calendar library here for daily/weekly/monthly views.
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;

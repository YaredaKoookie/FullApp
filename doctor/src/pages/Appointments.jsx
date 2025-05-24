import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { DoctorLayout } from "../layouts/DoctorLayout";
import { adminAPI } from "../lib/api";
import { Calendar, Search, Filter, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { FaVideo } from "react-icons/fa";

const AppointmentsContent = () => {
  console.log("Appointments component rendering");

  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    search: "",
    page: 1,
    limit: 10,
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    console.log("Current filters:", filters);
  }, [filters]);

  // Fetch appointments
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery(
    {
      queryKey: ["appointments", filters],
      queryFn: () => adminAPI.appointments.getAll(filters),
      onSuccess: (response) => {
        console.log("Appointments API Response:", response);
      },
      onError: (error) => {
        console.error("Appointments API Error:", error);
      },
    }
  );

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["appointmentStats"],
    queryFn: () => adminAPI.appointments.getStats(),
    onSuccess: (response) => {
      console.log("Stats API Response:", response);
    },
    onError: (error) => {
      console.error("Stats API Error:", error);
    },
  });

  // Accept appointment mutation
  const acceptMutation = useMutation({
    mutationFn: (id) => adminAPI.appointments.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["appointmentStats"]);
      toast.success("Appointment accepted successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to accept appointment"
      );
    },
  });

  // Reject appointment mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => adminAPI.appointments.reject(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["appointmentStats"]);
      toast.success("Appointment rejected successfully");
      setSelectedAppointment(null);
      setRejectionNote("");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to reject appointment"
      );
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search appointments..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-5 w-5 text-gray-400" />
            <span>Filters</span>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Pending</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {statsData?.data?.data?.pending || 0}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Confirmed</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {statsData?.data?.data?.confirmed || 0}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Completed</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {statsData?.data?.data?.completed || 0}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">Cancelled</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {statsData?.data?.data?.cancelled || 0}
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      {isFilterOpen && (
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  handleFilterChange("dateRange", e.target.value)
                }
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingAppointments ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : !appointmentsData?.data?.data ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No data available (Debug: appointmentsData.data.data is null
                    or undefined)
                  </td>
                </tr>
              ) : !appointmentsData.data.data.appointments ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No appointments array found (Debug:
                    appointmentsData.data.data.appointments is null or
                    undefined)
                  </td>
                </tr>
              ) : appointmentsData.data.data.appointments.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No appointments found (Debug: appointments array is empty)
                  </td>
                </tr>
              ) : (
                appointmentsData.data.data.appointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={
                              appointment.patient.profileImage ||
                              "https://via.placeholder.com/40"
                            }
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient.firstName}{" "}
                            {appointment.patient.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(appointment.slot.start).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.slot.start).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {appointment.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          appointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : ""
                        }
                        ${
                          appointment.status === "accepted"
                            ? "bg-blue-100 text-blue-800"
                            : ""
                        }
                        ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                        ${
                          appointment.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : ""
                        }
                        ${
                          appointment.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : ""
                        }
                      `}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {appointment.status === "pending" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              acceptMutation.mutate(appointment._id)
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setRejectionNote("");
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {appointment.status === "accepted" && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Reschedule
                        </button>
                      )}
                      {appointment.status === "confirmed" && (
                        <Link
                          to={`/VideoCall/${appointment._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaVideo />
                        </Link>
                      )}
                      {appointment.status === "confirmed" && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                          }}
                          className="ml-2 text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {appointmentsData?.data?.pagination && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(filters.page - 1)}
            disabled={filters.page === 1}
            className="px-3 py-1 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {filters.page} of {appointmentsData.data.pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(filters.page + 1)}
            disabled={filters.page === appointmentsData.data.pagination.pages}
            className="px-3 py-1 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {/* Reject Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Reject Appointment</h3>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-2 border rounded-md"
              rows="3"
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  rejectMutation.mutate({
                    id: selectedAppointment._id,
                    note: rejectionNote,
                  });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Appointments = () => {
  return (
    <DoctorLayout>
      <AppointmentsContent />
    </DoctorLayout>
  );
};

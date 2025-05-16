import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Search,
  Calendar,
  User,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  MapPin,
  RotateCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import apiClient from "@/lib/apiClient";

const DoctorAppointmentsDashboard = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "today",
    type: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Fetch appointments data
  const {
    data: appointments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "doctor-appointments",
      currentPage,
      itemsPerPage,
      searchTerm,
      filters,
      activeTab,
    ],
    queryFn: async () => {
      const response = await apiClient.get("/doctors/patient", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: filters.status,
          dateRange: filters.dateRange,
          type: filters.type,
          tab: activeTab,
        },
      });
      return response;
    },
  });

  console.log(appointments);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const openAppointmentDetail = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status) => {
    const baseClasses =
      "px-2 py-1 rounded-full text-xs flex items-center gap-1";
    switch (status) {
      case "completed":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="h-3 w-3" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      case "no-show":
        return (
          <span className={`${baseClasses} bg-amber-100 text-amber-800`}>
            <XCircle className="h-3 w-3" /> No Show
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Clock className="h-3 w-3" /> Upcoming
          </span>
        );
    }
  };

  const getAppointmentTypeIcon = (type) => {
    return type === "virtual" ? (
      <Video className="h-4 w-4 text-purple-500" />
    ) : (
      <MapPin className="h-4 w-4 text-blue-500" />
    );
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <RotateCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Failed to load appointments. Please try again later.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Appointment Dashboard
        </h1>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Dates</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="in-person">In-Person</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            activeTab === "upcoming"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming Appointments
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm border-b-2 ${
            activeTab === "past"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("past")}
        >
          Past Appointments
        </button>
      </div>

      {/* Appointments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments?.data?.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {/* <User className="h-5 w-5" /> */}
                        <img src={appointment.profileImage} alt="profilePic" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.firstName + appointment.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {"appointment.patient.age"} •{" "}
                          {appointment.gender}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date("appointment.slot.start").toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date("appointment.slot.start").toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -
                      {new Date("appointment.slot.end").toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getAppointmentTypeIcon(appointment.type)}
                      <span className="ml-2 text-sm text-gray-500 capitalize">
                        {appointment.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(appointment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => openAppointmentDetail(appointment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
                        <div>
                          <Menu.Button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-5 w-5" />
                          </Menu.Button>
                        </div>
                        <Transition
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`${
                                      active
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-700"
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    Reschedule
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`${
                                      active
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-700"
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    Add Notes
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`${
                                      active
                                        ? "bg-red-50 text-red-700"
                                        : "text-red-600"
                                    } block w-full text-left px-4 py-2 text-sm`}
                                  >
                                    Cancel Appointment
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage >= appointments?.pagination?.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * itemsPerPage,
                    appointments?.pagination?.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {appointments?.pagination?.total}
                </span>{" "}
                results
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">
                  Rows per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-8"
                >
                  {[5, 10, 25].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">First</span>
                  <ChevronsLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage >= appointments?.pagination?.totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(appointments?.pagination?.totalPages || 1)
                  }
                  disabled={currentPage >= appointments?.pagination?.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Last</span>
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <Dialog
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-3xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            {selectedAppointment && (
              <>
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Appointment Details
                  </Dialog.Title>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Patient Summary */}
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-100 text-blue-600 rounded-full h-20 w-20 flex items-center justify-center text-2xl font-semibold">
                        <User className="h-8 w-8" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">
                          Patient Info
                        </h3>
                        <p className="text-gray-600">
                          {selectedAppointment.name}
                        </p>
                        <p className="text-gray-600">
                          {"selectedAppointment.patient.age"} years •{" "}
                          {"selectedAppointment.patient.gender"}
                        </p>
                        <p className="text-gray-600">
                          {selectedAppointment.phone}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">
                          Appointment Details
                        </h3>
                        <p className="text-gray-600">
                          {new Date(
                            selectedAppointment.createdAt
                          ).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          {getAppointmentTypeIcon(selectedAppointment.type)}
                          <span className="text-gray-600 capitalize">
                            {selectedAppointment.type}
                          </span>
                        </div>
                        {selectedAppointment.type === "virtual" && (
                          <p className="text-blue-600 text-sm">
                            Video link:{" "}
                            {selectedAppointment.virtualDetails?.link}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">Status</h3>
                        {getStatusBadge(selectedAppointment.status)}
                        {selectedAppointment.status === "cancelled" && (
                          <p className="text-sm text-gray-600">
                            Reason: {selectedAppointment.cancellation?.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medical Info */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Medical Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium flex items-center gap-2 text-gray-900">
                          <ClipboardList className="h-5 w-5 text-blue-500" />
                          Medical History
                        </h4>
                        <div className="mt-2 space-y-2">
                          {selectedAppointment.emergencyContact?.length >
                          0 ? (
                            selectedAppointment.emergencyContact.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="border-l-4 border-blue-200 pl-4 py-1"
                                >
                                  <p className="font-medium text-sm">
                                    {item.condition}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {item.diagnosis}
                                  </p>
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-gray-500 text-sm">
                              No medical history recorded
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium flex items-center gap-2 text-gray-900">
                          <FileText className="h-5 w-5 text-blue-500" />
                          Appointment Notes
                        </h4>
                        <div className="mt-2 space-y-2">
                          {selectedAppointment.notes ? (
                            <p className="text-sm text-gray-600">
                              {selectedAppointment.notes}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              No notes for this appointment
                            </p>
                          )}
                        </div>
                        <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">
                          Add/Edit Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default DoctorAppointmentsDashboard;

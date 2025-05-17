import { useState, Fragment } from "react";
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Calendar,
  Clock,
  User,
  Video,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  Check,
  X,
  RefreshCw,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  AlertCircle,
  DollarSign,
  Clipboard,
  Clock as HistoryIcon,
  Loader2,
} from "lucide-react";
import { Dialog, Transition, Menu, Tab, Listbox } from "@headlessui/react";
import apiClient from "@/lib/apiClient";
import queryClient from "@/lib/queryClient";
import { parseISO, format, formatDistance, differenceInYears } from "date-fns";

const DoctorAppointments = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [newAppointmentTime, setNewAppointmentTime] = useState("");

  // Fetch appointments from API
  const {
    data: appointments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["appointments", selectedTab, dateRange, searchQuery, sortBy],
    queryFn: async () => {
      const response = await apiClient.get("/doctors/Allappointments", {
        params: {
          status: selectedTab === "all" ? undefined : selectedTab,
          //   dateRange,
          search: searchQuery,
          sort: sortBy,
        },
      });
      return response || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch stats from API
  const { data: stats } = useQuery({
    queryKey: ["appointmentStats"],
    queryFn: async () => {
      const response = await apiClient.get("/doctors/appointment/Allstats");
      console.log("app2", response);
      return response || [];
    },
  });
  console.log("app", stats);
  // Mutations for actions
  const acceptMutation = useMutation({
    mutationFn: (appointmentId) =>
      apiClient.post(`/doctors/appointment/${appointmentId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["appointmentStats"]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ appointmentId, note }) =>
      apiClient.post(`/doctors/appointment/${appointmentId}/reject`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["appointmentStats"]);
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ appointmentId, newTime, reason }) =>
      apiClient.post(`/doctors/appointments/${appointmentId}/reschedule`, {
        newTime,
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["appointmentStats"]);
      setIsRescheduleOpen(false);
      setRescheduleReason("");
      setNewAppointmentTime("");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ appointmentId, reason }) =>
      apiClient.post(`/doctors/appointments/${appointmentId}/cancel`, {
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments"]);
      queryClient.invalidateQueries(["appointmentStats"]);
      setIsCancelOpen(false);
      setCancelReason("");
    },
  });

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailOpen(true);
  };

  const handleAccept = (appointmentId) => {
    acceptMutation.mutate(appointmentId);
  };

  const handleReject = (appointmentId) => {
    const note = prompt("Please enter a reason for rejection:");
    if (note) {
      rejectMutation.mutate({ appointmentId, note });
    }
  };

  const handleRescheduleSubmit = () => {
    if (!selectedAppointment || !newAppointmentTime) return;
    rescheduleMutation.mutate({
      appointmentId: selectedAppointment.id,
      newTime: newAppointmentTime,
      reason: rescheduleReason,
    });
  };

  const handleCancelSubmit = () => {
    if (!selectedAppointment || !cancelReason) return;
    cancelMutation.mutate({
      appointmentId: selectedAppointment.id,
      reason: cancelReason,
    });
  };

  const statusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "pending":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            Cancelled
          </span>
        );
      case "rescheduled":
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            Rescheduled
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const appointmentTypeIcon = (type) => {
    return type === "virtual" ? (
      <Video className="w-4 h-4 text-blue-500" />
    ) : (
      <User className="w-4 h-4 text-green-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Appointment Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">completed</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {stats?.completed || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {stats?.pending || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">confirmed</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {stats?.confirmed || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">cancelled</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {stats?.cancelled || 0}
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white shadow rounded-lg mb-6 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tabs */}
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 p-1 shadow-md">
                {[
                  "all",
                  "pending",
                  "confirmed",
                  "completed",
                  "cancelled",
                  "rescheduled",
                ].map((tab) => (
                  <Tab
                    key={tab}
                    className={({ selected }) =>
                      `w-full rounded-md px-3 py-2 text-xs md:text-sm font-semibold transition-all duration-200
         focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-400
         ${
           selected
             ? "bg-white text-blue-700 shadow-sm"
             : "text-blue-100 hover:bg-blue-700/30 hover:text-white"
         }`
                    }
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Tab>
                ))}
              </Tab.List>
            </Tab.Group>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search patients or reasons"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort */}
          </div>
        </div>

        {/* Appointments Table */}
        <div className="h-[500px] bg-white shadow rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
          ) : isError ? (
            <div className="p-4 text-red-500">
              Error loading appointments. Please try again.
            </div>
          ) : (
            <div className="overflow-x-auto h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Patient
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fee
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments?.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {appointment.patient.profileImage ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={appointment.patient.profileImage}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {differenceInYears(
                                new Date(),
                                parseISO(appointment.patient.dateOfBirth)
                              )}{" "}
                              years
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {appointmentTypeIcon(appointment.type)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {appointment.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(appointment.slot.start)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.slot.start)} -{" "}
                          {formatTime(appointment.slot.end)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge(appointment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${appointment.fee.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <div>
                            <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                              Actions
                              <ChevronDown
                                className="-mr-1 ml-2 h-5 w-5"
                                aria-hidden="true"
                              />
                            </Menu.Button>
                          </div>

                          <Transition
                            as={Fragment}
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
                                      onClick={() =>
                                        handleViewAppointment(appointment)
                                      }
                                      className={`${
                                        active
                                          ? "bg-gray-100 text-gray-900"
                                          : "text-gray-700"
                                      } block px-4 py-2 text-sm w-full text-left`}
                                    >
                                      View Details
                                    </button>
                                  )}
                                </Menu.Item>

                                {appointment.status === "pending" && (
                                  <>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            handleAccept(appointment._id)
                                          }
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } block px-4 py-2 text-sm w-full text-left`}
                                        >
                                          Accept Appointment
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            handleReject(appointment.id)
                                          }
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } block px-4 py-2 text-sm w-full text-left`}
                                        >
                                          Reject Appointment
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </>
                                )}

                                {(appointment.status === "confirmed" ||
                                  appointment.status === "accepted") && (
                                  <>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => {
                                            setSelectedAppointment(appointment);
                                            setIsRescheduleOpen(true);
                                          }}
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } block px-4 py-2 text-sm w-full text-left`}
                                        >
                                          Reschedule
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => {
                                            setSelectedAppointment(appointment);
                                            setIsCancelOpen(true);
                                          }}
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } block px-4 py-2 text-sm w-full text-left`}
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </>
                                )}

                                {appointment.status === "rescheduled" && (
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => {
                                          setSelectedAppointment(appointment);
                                          setIsRescheduleOpen(true);
                                        }}
                                        className={`${
                                          active
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-700"
                                        } block px-4 py-2 text-sm w-full text-left`}
                                      >
                                        Review Reschedule
                                      </button>
                                    )}
                                  </Menu.Item>
                                )}

                                {appointment.status === "confirmed" &&
                                  appointment.type === "virtual" && (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <a
                                          href={`/video-call/${appointment.videoCallToken}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`${
                                            active
                                              ? "bg-gray-100 text-gray-900"
                                              : "text-gray-700"
                                          } block px-4 py-2 text-sm w-full text-left`}
                                        >
                                          Start Video Call
                                        </a>
                                      )}
                                    </Menu.Item>
                                  )}
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Appointment Detail Modal */}
      <Transition appear show={isDetailOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsDetailOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {selectedAppointment && (
                    <>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Appointment Details
                      </Dialog.Title>
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Patient Info */}
                          <div className="col-span-1">
                            <h4 className="text-sm font-medium text-gray-500">
                              Patient Information
                            </h4>
                            <div className="mt-2">
                              <div className="flex items-center">
                                {selectedAppointment.patient.profileImage ? (
                                  <img
                                    className="h-16 w-16 rounded-full"
                                    src={
                                      selectedAppointment.patient.profileImage
                                    }
                                    alt={selectedAppointment.patient.name}
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-8 w-8 text-gray-500" />
                                  </div>
                                )}
                                <div className="ml-4">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {selectedAppointment.patient.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    <span>patient age : </span>
                                    {differenceInYears(
                                      new Date(),
                                      parseISO(
                                        selectedAppointment.patient.dateOfBirth
                                      )
                                    )}{" "}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <p className="text-sm text-gray-600">
                                  {selectedAppointment.patient.profile}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Appointment Details */}
                          <div className="col-span-1">
                            <h4 className="text-sm font-medium text-gray-500">
                              Appointment Details
                            </h4>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center">
                                {appointmentTypeIcon(selectedAppointment.type)}
                                <span className="ml-2 text-sm text-gray-900 capitalize">
                                  {selectedAppointment.type} appointment
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clipboard className="w-4 h-4 text-gray-500" />
                                <span className="ml-2 text-sm text-gray-900">
                                  {selectedAppointment.reason}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-gray-500" />
                                <span className="ml-2 text-sm text-gray-900">
                                  Fee: ${selectedAppointment.fee.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <h4 className="text-sm font-medium text-gray-500 mt-4">
                              Time Slot
                            </h4>
                            <div className="mt-2 flex items-center">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="ml-2 text-sm text-gray-900">
                                {formatDateTime(selectedAppointment.slot.start)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="ml-2 text-sm text-gray-900">
                                {formatTime(selectedAppointment.slot.start)} -{" "}
                                {formatTime(selectedAppointment.slot.end)}
                              </span>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="col-span-1">
                            <h4 className="text-sm font-medium text-gray-500">
                              Status
                            </h4>
                            <div className="mt-2">
                              {statusBadge(selectedAppointment.status)}
                              <div className="mt-2 text-xs text-gray-500">
                                Created:{" "}
                                {formatDateTime(selectedAppointment.createdAt)}
                              </div>
                              {selectedAppointment.confirmedAt && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Confirmed:{" "}
                                  {formatDateTime(
                                    selectedAppointment.confirmedAt
                                  )}
                                </div>
                              )}
                              {selectedAppointment.completedAt && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Completed:{" "}
                                  {formatDateTime(
                                    selectedAppointment.completedAt
                                  )}
                                </div>
                              )}
                              {selectedAppointment.cancelledAt && (
                                <div className="mt-1 text-xs text-gray-500">
                                  Cancelled:{" "}
                                  {formatDateTime(
                                    selectedAppointment.cancelledAt
                                  )}
                                </div>
                              )}
                            </div>

                            {selectedAppointment.type === "virtual" &&
                              selectedAppointment.status === "confirmed" && (
                                <>
                                  <h4 className="text-sm font-medium text-gray-500 mt-4">
                                    Virtual Meeting
                                  </h4>
                                  <div className="mt-2 space-y-2">
                                    <a
                                      href={`/video-call/${selectedAppointment.videoCallToken}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                      <Video className="mr-2 h-4 w-4" />
                                      Start Video Call
                                    </a>
                                    <a
                                      href={`/chat/${selectedAppointment.chatToken}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-3"
                                    >
                                      <MessageSquare className="mr-2 h-4 w-4" />
                                      Open Chat
                                    </a>
                                  </div>
                                </>
                              )}
                          </div>
                        </div>

                        {/* History */}
                        {selectedAppointment.history &&
                          selectedAppointment.history.length > 0 && (
                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-gray-500">
                                History
                              </h4>
                              <div className="mt-2 flow-root">
                                <ul className="-mb-8">
                                  {selectedAppointment.history.map(
                                    (event, eventIdx) => (
                                      <li key={eventIdx}>
                                        <div className="relative pb-8">
                                          {eventIdx !==
                                          selectedAppointment.history.length -
                                            1 ? (
                                            <span
                                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                              aria-hidden="true"
                                            />
                                          ) : null}
                                          <div className="relative flex space-x-3">
                                            <div>
                                              <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                                                <HistoryIcon
                                                  className="h-5 w-5 text-white"
                                                  aria-hidden="true"
                                                />
                                              </span>
                                            </div>
                                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                              <div>
                                                <p className="text-sm text-gray-500">
                                                  {event.type ===
                                                    "reschedule" && (
                                                    <>
                                                      Rescheduled from{" "}
                                                      {formatDateTime(
                                                        event.from
                                                      )}{" "}
                                                      to{" "}
                                                      {formatDateTime(event.to)}
                                                      {event.reason &&
                                                        ` (Reason: ${event.reason})`}
                                                    </>
                                                  )}
                                                  {event.type ===
                                                    "status_change" &&
                                                    `Status changed to ${event.newStatus}`}
                                                </p>
                                              </div>
                                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                <time dateTime={event.date}>
                                                  {formatDateTime(event.date)}
                                                </time>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={() => setIsDetailOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Reschedule Modal */}
      <Transition appear show={isRescheduleOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsRescheduleOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Reschedule Appointment
                  </Dialog.Title>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="newTime"
                          className="block text-sm font-medium text-gray-700"
                        >
                          New Appointment Time
                        </label>
                        <input
                          type="datetime-local"
                          id="newTime"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={newAppointmentTime}
                          onChange={(e) =>
                            setNewAppointmentTime(e.target.value)
                          }
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="rescheduleReason"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Reason for Rescheduling
                        </label>
                        <textarea
                          id="rescheduleReason"
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={rescheduleReason}
                          onChange={(e) => setRescheduleReason(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsRescheduleOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      onClick={handleRescheduleSubmit}
                      disabled={
                        rescheduleMutation.isLoading || !newAppointmentTime
                      }
                    >
                      {rescheduleMutation.isLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        "Submit Reschedule"
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Cancel Modal */}
      <Transition appear show={isCancelOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsCancelOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Cancel Appointment
                  </Dialog.Title>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="cancelReason"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Reason for Cancellation
                        </label>
                        <select
                          id="cancelReason"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                        >
                          <option value="">Select a reason</option>
                          <option value="patient_request">
                            Patient Request
                          </option>
                          <option value="doctor_unavailable">
                            Doctor Unavailable
                          </option>
                          <option value="emergency">Emergency</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      {cancelReason === "other" && (
                        <div>
                          <label
                            htmlFor="otherReason"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Please specify
                          </label>
                          <textarea
                            id="otherReason"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsCancelOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                      onClick={handleCancelSubmit}
                      disabled={cancelMutation.isLoading || !cancelReason}
                    >
                      {cancelMutation.isLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Cancellation"
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default DoctorAppointments;

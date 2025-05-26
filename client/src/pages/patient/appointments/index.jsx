import { useState, useEffect } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Tab,
  Transition,
  Listbox,
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
} from "@headlessui/react";
import {
  Calendar,
  Clock,
  CheckCircle,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  ArrowRight,
  Stethoscope,
  DollarSign,
  AlertCircle,
  X,
  Sliders,
  CreditCard,
  VideoIcon,
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
  isPast,
  isToday,
  addDays,
  isTomorrow,
} from "date-fns";

import AppointmentStatusBadge from "./AppointmentStatusBadge";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "@api/apiClient";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Atom, ThreeDot } from "react-loading-indicators";
import { useRescheduleAppointment } from "@/api/patient";
import { queryKeys } from "@/api/queryClient";

const fetchAppointments = async (params, patientId) => {
  const queryParams = new URLSearchParams();
  if (patientId) queryParams.append("patientId", patientId);
  if (params.status) queryParams.append("status", params.status);
  if (params.fromDate)
    queryParams.append("fromDate", params.fromDate.toISOString());
  if (params.toDate) queryParams.append("toDate", params.toDate.toISOString());
  if (params.createdFrom)
    queryParams.append("createdFrom", params.createdFrom.toISOString());
  if (params.createdTo)
    queryParams.append("createdTo", params.createdTo.toISOString());
  if (params.searchQuery) queryParams.append("searchQuery", params.searchQuery);
  if (params.type) queryParams.append("type", params.type);
  queryParams.append("page", (params.page || 1).toString());
  queryParams.append("limit", (params.limit || 10).toString());

  const response = await apiClient.get(
    `/patient/appointments/search?${queryParams.toString()}`
  );
  return response;
};

const statusFilters = [
  { name: "All", value: "all" },
  { name: "Upcoming", value: "upcoming" },
  { name: "Pending", value: "pending" },
  { name: "Confirmed", value: "confirmed" },
  { name: "Completed", value: "completed" },
  { name: "Cancelled", value: "cancelled" },
];

const typeFilters = [
  { name: "All Types", value: "all" },
  { name: "In-Person", value: "in-person" },
  { name: "Virtual", value: "virtual" },
];

const AppointmentsPage = () => {
  const [selectedStatus, setSelectedStatus] = useState(statusFilters[0]);
  const [selectedType, setSelectedType] = useState(typeFilters[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [createdDateRange, setCreatedDateRange] = useState([null, null]);
  const [patientId, setPatientId] = useState();

  // Get patient ID on component mount
  useEffect(() => {
    const fetchPatientId = async () => {
      // Replace with your actual user/patient fetch logic
      const response = await fetch("/api/patients/me");
      if (response.ok) {
        const data = await response.json();
        setPatientId(data._id);
      }
    };
    fetchPatientId();
  }, []);

  const searchParams = {
    status: selectedStatus.value === "all" ? undefined : selectedStatus.value,
    type: selectedType.value === "all" ? undefined : selectedType.value,
    fromDate: dateRange[0],
    toDate: dateRange[1],
    createdFrom: createdDateRange[0],
    createdTo: createdDateRange[1],
    searchQuery: searchQuery || undefined,
    page,
    limit,
  };

  const {
    data: result,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.patient.appointments.search(),
    queryFn: () => fetchAppointments(searchParams),
    enabled: true, // Only fetch when patientId is available
    keepPreviousData: true,
  });

  console.log(result);

  const resetFilters = () => {
    setSelectedStatus(statusFilters[0]);
    setSelectedType(typeFilters[0]);
    setSearchQuery("");
    setDateRange([null, null]);
    setCreatedDateRange([null, null]);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              My Appointments
            </h1>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Sliders className="h-4 w-4 mr-1" />
                Filters
              </button>
            </div>
          </div>

          {/* Status tabs */}
          <div className="mt-6">
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-1 overflow-x-auto">
                {statusFilters.map((filter) => (
                  <Tab
                    key={filter.value}
                    className={({ selected }) =>
                      `whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        selected
                          ? "bg-white shadow text-blue-600"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`
                    }
                    onClick={() => {
                      setSelectedStatus(filter);
                      setPage(1);
                    }}
                  >
                    {filter.name}
                  </Tab>
                ))}
              </Tab.List>
            </Tab.Group>
          </div>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6">
            <DialogTitle className="text-lg font-semibold flex justify-between items-center">
              <span>Filter Appointments</span>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogTitle>

            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Type
                </label>
                <Listbox value={selectedType} onChange={setSelectedType}>
                  <div className="relative mt-1">
                    <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                      <span className="block truncate">
                        {selectedType.name}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {typeFilters.map((filter) => (
                          <Listbox.Option
                            key={filter.value}
                            value={filter}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                active
                                  ? "bg-blue-100 text-blue-900"
                                  : "text-gray-900"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected ? "font-medium" : "font-normal"
                                  }`}
                                >
                                  {filter.name}
                                </span>
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Date Range
                </label>
                <DatePicker
                  selectsRange
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  onChange={(update) => setDateRange(update)}
                  isClearable
                  placeholderText="Select date range"
                  className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created Date Range
                </label>
                <DatePicker
                  selectsRange
                  startDate={createdDateRange[0]}
                  endDate={createdDateRange[1]}
                  onChange={(update) => setCreatedDateRange(update)}
                  isClearable
                  placeholderText="Select creation date range"
                  className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats cards */}
        {result?.data?.stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              icon={<Calendar className="h-6 w-6 text-white" />}
              iconBg="bg-blue-500"
              title="Upcoming"
              value={result?.data?.stats.upcoming}
              change={null}
            />
            <StatCard
              icon={<Clock className="h-6 w-6 text-white" />}
              iconBg="bg-yellow-500"
              title="Pending"
              value={result?.data?.stats.pending}
              change={null}
            />
            <StatCard
              icon={<CheckCircle className="h-6 w-6 text-white" />}
              iconBg="bg-green-500"
              title="Completed"
              value={result?.data?.stats.completed}
              change={null}
            />
            <StatCard
              icon={<DollarSign className="h-6 w-6 text-white" />}
              iconBg="bg-purple-500"
              title="Avg. Fee"
              value={`$${result?.data?.stats.averageFee.toFixed(2)}`}
              change={null}
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error loading appointments
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {!isLoading && !isError && (
          <>
            {/* Appointments list */}
            <div className="space-y-6">
              {result?.data?.appointments?.length > 0 ? (
                result?.data.appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onAction={() => setPage(1)} // Refresh data after actions
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No appointments found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedStatus.value === "all"
                      ? "You don't have any appointments yet."
                      : `You don't have any ${selectedStatus.name.toLowerCase()} appointments.`}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reset filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {result?.pagination?.total > limit && (
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                    page === 1
                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                  <div className="flex items-center space-x-2">
                    {Array.from(
                      { length: Math.ceil(result.pagination.total / limit) },
                      (_, i) => {
                        const pageNumber = i + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber ===
                            Math.ceil(result?.pagination.total / limit) ||
                          (pageNumber >= page - 2 && pageNumber <= page + 2)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                page === pageNumber
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                        if (
                          (pageNumber === page - 3 && page > 4) ||
                          (pageNumber === page + 3 &&
                            page <
                              Math.ceil(result?.pagination.total / limit) - 3)
                        ) {
                          return (
                            <span
                              key={pageNumber}
                              className="px-3 py-1 text-gray-500"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        Math.ceil(result?.pagination.total / limit),
                        p + 1
                      )
                    )
                  }
                  disabled={
                    page === Math.ceil(result?.pagination.total / limit)
                  }
                  className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                    page === Math.ceil(result?.pagination.total / limit)
                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, iconBg, title, value, change }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">
            {title}
          </dt>
          <dd className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
            {change !== null && (
              <span
                className={`ml-2 text-sm font-medium ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </span>
            )}
          </dd>
        </div>
      </div>
    </div>
  </div>
);

// Add CountdownTimer component before AppointmentCard
const CountdownTimer = ({ startDate }) => {
  const [timeInfo, setTimeInfo] = useState({
    remaining: "",
    elapsed: "",
    status: "upcoming", // 'upcoming', 'ongoing', 'ended'
  });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeInfo = () => {
      const now = new Date();
      const start = new Date(startDate);
      const difference = start - now;
      const end = new Date(startDate);
      end.setMinutes(end.getMinutes() + 30); // Assuming 30-minute appointments
      const isEnded = now > end;

      // Check if appointment is within 30 minutes
      setIsUrgent(difference <= 30 * 60 * 1000 && difference > 0);

      if (difference <= 0) {
        if (isEnded) {
          setTimeInfo({
            remaining: "",
            elapsed: formatDistanceToNow(start, { addSuffix: true }),
            status: "ended",
          });
        } else {
          setTimeInfo({
            remaining: "",
            elapsed: formatDistanceToNow(start, { addSuffix: true }),
            status: "ongoing",
          });
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0) parts.push(`${seconds}s`);

      setTimeInfo({
        remaining: parts.join(" "),
        elapsed: "",
        status: "upcoming",
      });
    };

    calculateTimeInfo();
    const timer = setInterval(calculateTimeInfo, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  const getStatusColor = () => {
    switch (timeInfo.status) {
      case "ongoing":
        return "bg-green-50 border-green-200 text-green-600";
      case "ended":
        return "bg-gray-50 border-gray-200 text-gray-600";
      default:
        return isUrgent
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-blue-50 border-blue-200 text-blue-600";
    }
  };

  return (
    <div
      className={`flex flex-col gap-1 px-3 py-2 rounded-lg border transition-all duration-300 ${getStatusColor()}`}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {timeInfo.status === "upcoming" && (
          <span className="text-sm font-medium">
            Starts in: {timeInfo.remaining}
          </span>
        )}
        {timeInfo.status === "ongoing" && (
          <span className="text-sm font-medium">
            Started {timeInfo.elapsed}
          </span>
        )}
        {timeInfo.status === "ended" && (
          <span className="text-sm font-medium">Ended {timeInfo.elapsed}</span>
        )}
      </div>
      {isUrgent && timeInfo.status === "upcoming" && (
        <div className="flex items-center gap-1 text-xs font-medium">
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600">
            Join Soon
          </span>
          <span className="text-red-600">
            Session starts at {format(new Date(startDate), "h:mm a")}
          </span>
        </div>
      )}
      {timeInfo.status === "ongoing" && (
        <div className="flex items-center gap-1 text-xs font-medium text-green-600">
          <span className="px-2 py-0.5 rounded-full bg-green-100">
            Session in Progress
          </span>
        </div>
      )}
    </div>
  );
};

// Appointment Card Component (enhanced)
const AppointmentCard = ({ appointment, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const startDate = new Date(appointment.slot.start);
  const endDate = new Date(appointment.slot.end);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const isPastAppointment = isPast(endDate);
  const isTodayAppointment = isToday(startDate);

  const { mutateAsync: rescheduleAppointment, isLoading: isRescheduling } = useRescheduleAppointment();


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {appointment.doctor.profilePhoto ? (
              <img
                src={appointment.doctor.profilePhoto}
                alt={`${appointment.doctor.firstName} ${appointment.doctor.lastName}`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Stethoscope className="h-5 w-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  <Link
                    className="text-blue-800 hover:underline"
                    to={"../doctors/" + appointment.doctor._id + "/details"}
                  >
                    Dr. {appointment.doctor.firstName}{" "}
                    {appointment.doctor.middleName}
                  </Link>
                </h3>
                <AppointmentStatusBadge status={appointment.status} />
              </div>

              <p className="text-sm text-blue-600 font-medium mt-1">
                {appointment.doctor.specialization}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {format(startDate, "MMM d, yyyy")}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {appointment.appointmentType === "virtual"
                    ? "Virtual"
                    : "In-person"}
                </span>
                {isTodayAppointment && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Today
                  </span>
                )}
                {appointment.status === "confirmed" && (
                  <div className="flex-shrink-0">
                    <CountdownTimer startDate={startDate} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        <Transition
          show={isExpanded}
          enter="transition-opacity duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Reason</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {appointment.reason || "No reason provided"}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Fee</h4>
                <p className="mt-1 text-sm text-gray-900">
                  ${appointment.fee.toFixed(2)}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Created</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {format(
                    new Date(appointment.createdAt),
                    "MMM d, yyyy h:mm a"
                  )}
                </p>
              </div>

              {appointment.status === "cancelled" && (
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">
                    Cancellation Details
                  </h4>
                  <div className="mt-1 p-3 bg-red-50 rounded-md">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">Reason:</span>{" "}
                      {appointment.cancellation.reason}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      <span className="font-medium">Cancelled on:</span>{" "}
                      {format(
                        new Date(appointment.cancellation.cancelledAt),
                        "MMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              )}

              {appointment.rescheduleHistory &&
                appointment.rescheduleHistory.length > 0 && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">
                      Reschedule History
                    </h4>
                    <div className="mt-2 space-y-2">
                      {appointment.rescheduleHistory.map((reschedule, idx) => (
                        <div key={idx} className="p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Requested:</span>{" "}
                            {format(
                              new Date(reschedule.newTimeSlot.start),
                              "MMM d, yyyy h:mm a"
                            )}
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            <span className="font-medium">Status:</span>{" "}
                            {reschedule.status}
                          </p>
                          {reschedule.reason && (
                            <p className="text-sm text-blue-700 mt-1">
                              <span className="font-medium">Reason:</span>{" "}
                              {reschedule.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              {appointment.status === "pending" && (
                <>
                  <button
                    onClick={() => setIsCancelOpen(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsRescheduleOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Reschedule
                  </button>
                </>
              )}

              {appointment.status === "confirmed" && (
                <>
                  {appointment.appointmentType === "virtual" && (
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                      Join Session
                    </button>
                  )}
                  <button
                    onClick={() => setIsRescheduleOpen(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reschedule
                  </button>
                </>
              )}

              {(appointment.status === "accepted" ||
                appointment.status === "payment_pending") && (
                <>
                  <button
                    onClick={() => setIsPaymentOpen(true)}
                    className="px-3 py-1 bg-green-600 text-white rounded flex items-center"
                  >
                    <CreditCard className="mr-1 h-4 w-4" />
                    Pay Now
                  </button>
                  <button
                    onClick={() => setIsCancelOpen(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              )}

              {appointment.status === "completed" && (
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View Details
                </button>
              )}

              {appointment.status === "confirmed" && (
                <Link
                  to={`${appointment._id}/join`}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <VideoIcon className="h-4 w-4" />
                  Join Session
                </Link>
              )}
            </div>
          </div>
        </Transition>

        <CancelAppointmentDialog
          open={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          appointment={appointment}
        />
        <RescheduleDialog
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          onConfirm={rescheduleAppointment}
          isLoading={isRescheduling}
          reason={rescheduleReason}
          setReason={setRescheduleReason}
          doctorId={appointment.doctor._id}
          currentSlot={appointment.slot}
          appointmentId={appointment._id}
        />
        <PaymentDialog
          open={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          appointment={appointment}
        />
      </div>
    </div>
  );
};

const RescheduleDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  reason,
  setReason,
  doctorId,
  appointmentId,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const { data: schedule, isFetching: isScheduleFetching } = useQuery({
    queryKey: ["schedule", doctorId, selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await apiClient.get(
        `/patient/doctors/${doctorId}/schedule/slots?date=${dateStr}&upcomingOnly=true`
      );
      return response;
    },
    placeholderData: keepPreviousData,
    select: (data) => {
      console.log("select", data);
      const now = new Date();
      const filteredSlots = data.slots.filter((slot) => {
        const slotDate = new Date(slot.date);
        const slotDateTime = new Date(
          slot.date.split("T")[0] + "T" + slot.startTime
        );
        console.log(slotDateTime, now);
        return (
          slotDate.toDateString() === selectedDate.toDateString() &&
          !slot.isBooked &&
          slotDateTime > now
        );
      });
      return { ...data, filteredSlots };
    },
    enabled: !!doctorId,
  });

  const handlePreviousDay = () => {
    const newDate = addDays(selectedDate, -1);
    setSelectedDate(newDate);
    setSelectedSlot(null);
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    setSelectedSlot(null);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <Dialog.Panel className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 overflow-auto">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="font-bold text-lg mb-2">
            Reschedule Appointment
          </Dialog.Title>

          <div className="border-b border-gray-100 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Select Date</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handlePreviousDay}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextDay}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="text-center py-2 px-4 bg-blue-100 rounded-lg mb-4">
              <span className="font-medium text-blue-800">
                {isToday(selectedDate)
                  ? "Today"
                  : isTomorrow(selectedDate)
                  ? "Tomorrow"
                  : format(selectedDate, "EEEE, MMM d")}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                const date = addDays(new Date(), dayOffset);
                const isSelected =
                  date.toDateString() === selectedDate.toDateString();
                const isDisabled = isPast(date) && !isToday(date);

                return (
                  <button
                    key={dayOffset}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`py-2 rounded-lg flex flex-col items-center ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <span className="text-xs">{format(date, "EEE")}</span>
                    <span className="text-sm font-medium">
                      {format(date, "d")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="border-b border-gray-100 pb-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">
                Available Time Slots
              </h3>
              {schedule?.filteredSlots?.length > 0 && (
                <span className="text-xs text-gray-500">
                  {schedule.appointmentDuration} min each
                </span>
              )}
            </div>

            <div className="max-h-[250px] overflow-auto">
              {isScheduleFetching ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm text-gray-500">
                    Loading available slots...
                  </p>
                </div>
              ) : schedule?.filteredSlots?.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {schedule.filteredSlots.map((slot) => {
                    const slotTime = new Date(
                      slot.date.split("T")[0] + "T" + slot.startTime
                    );
                    const isSelected = selectedSlot === slot._id;

                    return (
                      <button
                        key={slot._id}
                        onClick={() => setSelectedSlot(slot._id)}
                        className={`py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-center ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {format(slotTime, "h:mm a")}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {isPast(selectedDate) && !isToday(selectedDate)
                    ? "This date has passed"
                    : "No available slots for this date"}
                </div>
              )}
            </div>
          </div>


          <div className="mb-4">
            <label className="block mb-2 text-gray-800">Reason for rescheduling</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="px-4 py-2 border rounded">
              Cancel
            </button>
            <button
              onClick={async () => {
                const response = await onConfirm({appointmentId, slotId: selectedSlot, reason})
                onClose();
                selectedSlot(null);
                selectedDate(null);
                setReason("");
                toast.success(response?.message || "Reschedule request have been sent to the doctor")
                console.log("reset");
              }}
              disabled={!selectedSlot || !reason || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="animate-spin" />
              ) : (
                "Confirm Reschedule"
              )}
            </button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
};

const CancelAppointmentDialog = ({ open, onClose, appointment }) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const queryClient = useQueryClient();

  const { mutate: cancelAppointment, isPending: isCancelling } = useMutation({
    mutationFn: async (data) => {
      await apiClient.put(
        `/patient/appointments/${appointment._id}/cancel`,
        data
      );
    },
    onSuccess: () => {
      onClose();
      setCancellationReason("");
      queryClient.invalidateQueries("appointments");
      toast.success("Appointment has been cancelled successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    cancelAppointment({ cancellationReason });
  };

  return (
    <Dialog
      open={open}
      className="relative z-10 focus:outline-none"
      onClose={onClose}
    >
      <div className="fixed inset-0 bg-neutral-500/50 flex w-screen items-center justify-center p-4">
        <DialogPanel className="bg-white p-8 rounded divided">
          <DialogTitle className="font-bold w-full mb-4 text-lg">
            Cancel Appointment
          </DialogTitle>
          <DialogDescription className="mb-5">
            This will permanently cancel your appointment. If you can
            rescheduling is recommended.
          </DialogDescription>
          <form>
            <label className="text-gray-500">
              Cancellation Reason (optional)
            </label>
            <textarea
              name="cancellationReason"
              onChange={(e) => setCancellationReason(e.target.value)}
              type="text"
              className="py-2 resize-none px-4 mt-2 w-full border-2 border-neutral-300 rounded"
            />
            <div className="flex gap-4 justify-end mt-8">
              <button
                type="submit"
                onClick={onSubmit}
                disabled={isCancelling}
                className="disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none px-4 py-2 bg-red-600 text-white text-sm flex items-center font-medium rounded-md hover:bg-red-700"
              >
                {isCancelling && (
                  <span className="inline-block w-4 h-4 border-4 border-t-transparent animate-spin rounded-full mr-2"></span>
                )}
                Cancel Appointment
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Exit
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

const PaymentDialog = ({ open, onClose, appointment }) => {
  const {
    mutate: initiatePayment,
    isPending: isInitiating,
    isError,
    data: payment,
    reset,
  } = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        `/patient/payments/appointments/${appointment._id}`
      );
      return data.payment;
    },
    onSuccess: (data) => {
      console.log("initiating", data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: initializePayment, isPending: isPaying } = useMutation({
    mutationFn: async (payment) => {
      const { data } = await apiClient.post(`/patient/payments/${payment._id}`);
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.payment_url;
    },
    onError: (error) => {
      toast.error(error.message);
      onClose();
    },
  });

  useEffect(() => {
    if (open && appointment?._id) initiatePayment(appointment._id);
  }, [open, appointment._id]);

  let content = "";

  console.log("payment", payment);

  if (isInitiating) {
    content = (
      <div className="flex items-center justify-center flex-col gap-4">
        <ThreeDot
          color="#32cd32"
          size="medium"
          text=""
          textColor="Initiating Payment Please wait"
        />
        <h1 className="text-gray-800">Initiating payment please wait</h1>
      </div>
    );
  } else if (payment) {
    content = (
      <>
        <Dialog.Title className="text-lg font-semibold">
          Confirm Payment
        </Dialog.Title>
        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between">
              <span>Appointment Fee:</span>
              <span className="font-medium">
                {payment?.amount} {payment?.currency}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            You will be redirected to Chapa for secure payment.
          </p>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => initializePayment(payment)}
            disabled={isPaying}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isPaying ? (
              <RotateCw className="animate-spin h-4 w-4 mx-2" />
            ) : (
              "Pay with Chapa"
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </>
    );
  } else if (isError || !payment) {
    content = (
      <div>
        <h1 className="text-lg font-semibold mb-2">Initializing Error</h1>
        <p className="mb-4">Unable to initiate payment please try again</p>
        <div className="flex items-center gap-4 justify-end">
          <button
            onClick={() => !isInitiating && initiatePayment(appointment._id)}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 disabled:opacity-50"
          >
            {isInitiating ? (
              <RotateCw className="animate-spin h-4 w-4 mx-2" />
            ) : (
              "Try Again"
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6">
          {content}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AppointmentsPage;

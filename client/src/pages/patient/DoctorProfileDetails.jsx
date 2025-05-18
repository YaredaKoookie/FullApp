import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  parseISO,
  addDays,
  isToday,
  isTomorrow,
  isPast,
} from "date-fns";
import {
  Star,
  Clock,
  MapPin,
  Calendar,
  Heart,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  User,
  Stethoscope,
  BadgeCheck,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Clock4,
  ClipboardCheck,
  Phone,
  Video,
  ArrowRight,
} from "lucide-react";
import { Tab } from "@headlessui/react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import apiClient from "@/lib/apiClient";
import Loading from "@/components/Loading";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

const DoctorProfilePage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { doctorId } = useParams();
  const [consultationType, setConsultationType] = useState("in-person");

  // Fetch doctor data
  const {
    data: doctor,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const response = await apiClient.get(`/patient/doctors/${doctorId}`);
      return response.data?.doctor;
    },
  });

  // Fetch schedule with available slots
  const {
    data: schedule,
    isLoading: isScheduleLoading,
    isFetching: isScheduleFetching,
  } = useQuery({
    queryKey: ["schedule", doctorId, selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await apiClient.get(
        `/schedule/${doctorId}?date=${dateStr}/slots`
      );
      return response.data;
    },
    placeholderData: (prev) => prev,
    select: (data) => {
      const filteredSlots = data.availableSlots.filter((slot) => {
        const slotDate = new Date(slot.date);
        return (
          slotDate.toDateString() === selectedDate.toDateString() &&
          !slot.isBooked
        );
      });
      return { ...data, filteredSlots };
    },
    enabled: !!doctor,
  });

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ["reviews", doctorId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/patients/doctors/${doctorId}/reviews`
      );
      return response.data?.reviews;
    },
  });

  console.log("doctors", doctor);

  // Mutation for booking appointment
  const bookingMutation = useMutation({
    mutationFn: (bookingData) => {
      return apiClient.post(
        `/patient/appointments/${doctorId}/book`,
        bookingData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["schedule", doctorId, selectedDate]);
      toast.success("Appointment has been requested for the doctor");
      setIsBookingModalOpen(false);
      setSelectedSlot(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading || isScheduleLoading) return <Loading />;

  if (isError)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error loading doctor data</span>
        </div>
      </div>
    );

  if (!doctor) return <h1>Unable to load</h1>;

  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, 3);

  // Date navigation functions
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
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <img
                src={doctor.profilePhoto || "/default-doctor.jpg"}
                alt={doctor.fullName}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                <div className="bg-green-500 rounded-full p-1">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {doctor.fullName}
                </h1>
                <BadgeCheck className="h-6 w-6 text-blue-300" />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center bg-blue-700 px-3 py-1 rounded-full">
                  <Stethoscope className="h-4 w-4 mr-1" />
                  <span className="text-sm">{doctor.specialization}</span>
                </div>

                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(doctor.rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm">
                    ({doctor.reviewCount} reviews)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{doctor.hospitalAddress?.city}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Experience: {doctor.yearsOfExperience} years</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{doctor.languages.join(", ")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Doctor Details */}
          <div className="lg:w-2/3">
            {/* Navigation Tabs */}
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-lg bg-white p-1 shadow-sm mb-6">
                {["About", "Services", "Reviews", "Location"].map((tab) => (
                  <Tab
                    key={tab}
                    className={({ selected }) =>
                      `w-full py-2.5 text-sm font-medium leading-5 rounded-md transition-colors ${
                        selected
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                      }`
                    }
                  >
                    {tab}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className="mt-2">
                {/* About Tab */}
                <Tab.Panel className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    About Dr. {doctor.fullName.split(" ")[0]}
                  </h2>
                  <p className="text-gray-700 mb-6">{doctor.bio}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        Education
                      </h3>
                      <ul className="space-y-3">
                        {doctor.qualifications.length ? (
                          doctor.qualifications.map((edu, index) => (
                            <li key={index} className="flex items-start">
                              <div className="bg-blue-100 p-1 rounded-full mr-3">
                                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{edu.degree}</p>
                                <p className="text-sm text-gray-600">
                                  {edu.institution} ({edu.year})
                                </p>
                              </div>
                            </li>
                          ))
                        ) : (
                          <p>No educational background provided</p>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {doctor.specialization}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">
                        Hospital Name
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {doctor.hospitalName}
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Services Tab */}
                <Tab.Panel className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Services & Treatments
                  </h2>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Full lab test",
                        description: "We will test all your health condition",
                        price: 100,
                        duration: 30,
                      },
                    ].map((service, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-100 pb-4 last:border-0"
                      >
                        <h3 className="font-medium text-gray-900">
                          {service.name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {service.description}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-blue-600 font-medium">
                            ${service.price}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {service.duration} mins
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Tab.Panel>

                {/* Reviews Tab */}
                <Tab.Panel className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Patient Reviews</h2>
                    <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="font-medium">{doctor.rating}</span>
                      <span className="text-gray-500 ml-1">
                        ({doctor.totalReviews} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {displayedReviews?.length ? (
                      displayedReviews?.map((review) => (
                        <div
                          key={review._id}
                          className="border-b border-gray-100 pb-6 last:border-0"
                        >
                          <div className="flex items-center mb-3">
                            <div className="bg-blue-100 text-blue-800 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {review.patientName}
                              </p>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-500 ml-2">
                                  {format(parseISO(review.date), "MMM d, yyyy")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))
                    ) : (
                      <h1 className="text-center font-medium text-gray-600 mt-8">
                        No Reviews Yet
                      </h1>
                    )}

                    {reviews?.length > 3 && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="text-blue-600 font-medium flex items-center"
                      >
                        {showAllReviews
                          ? "Show fewer reviews"
                          : "View all reviews"}
                        {showAllReviews ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </button>
                    )}
                  </div>
                </Tab.Panel>

                {/* Location Tab */}
                <Tab.Panel className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Clinic Location
                  </h2>
                  <div className="h-64 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                    {/* Map would go here */}
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                      <MapPin className="h-8 w-8" />
                      <span className="ml-2">Map View</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                      <span>{doctor.hospitalAddress.country}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock4 className="h-5 w-5 text-gray-500 mr-2" />
                      <span>Mon-Fri: 9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-500 mr-2" />
                      <span>{doctor.phoneNumber}</span>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>

          {/* Right Column - Booking Section */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-4">
              {/* Consultation Type */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">
                  Consultation Type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setConsultationType("in-person")}
                    {...(consultationType === "in-person"
                      ? { "data-active": true }
                      : {})}
                    className={`flex flex-col items-center justify-center p-3 border border-blue-200 rounded-lg data-[active]:bg-blue-50 data-[active]:text-blue-700`}
                  >
                    <User className="h-6 w-6 mb-2" />
                    <span className="text-sm">In-Person</span>
                  </button>
                  <button
                    onClick={() => setConsultationType("virtual")}
                    {...(consultationType === "virtual"
                      ? { "data-active": true }
                      : {})}
                    className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg data-[active]:bg-blue-50 data-[active]:text-blue-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Video className="h-6 w-6 mb-2" />
                    <span className="text-sm">Video Call</span>
                  </button>
                </div>
              </div>

              {/* Date Selector */}
              <div className="p-6 border-b border-gray-100">
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
              <div className="p-6 border-b border-gray-100">
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

                <div className={`${isScheduleFetching ? "animate-pulse" : ""}`}>
                  {schedule?.filteredSlots?.length ? (
                    <div className="grid grid-cols-2 gap-2">
                      {schedule.filteredSlots.map((slot) => {
                        const slotTime = new Date(
                          slot.date.split("T")[0] + "T" + slot.startTime + ":00"
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

              {/* Book Button */}
              <div className="p-6">
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  disabled={!selectedSlot}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    selectedSlot
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Book Appointment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consultation Fee</span>
                    <span className="font-medium">
                      ${doctor.consultationFee}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated wait time</span>
                    <span className="font-medium">{doctor.waitTime}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between font-medium text-blue-800">
                    <span>Total</span>
                    <span>${doctor.consultationFee}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Transition appear show={isBookingModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsBookingModalOpen(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
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
                    Confirm Appointment
                  </Dialog.Title>

                  <div className="mt-4">
                    {bookingMutation.isError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>
                          Failed to book appointment. Please try again.
                        </span>
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center">
                        <img
                          className="h-12 w-12 rounded-full object-cover mr-3"
                          src={doctor.profilePhoto || "/default-doctor.jpg"}
                          alt={doctor.fullName}
                        />
                        <div>
                          <h4 className="font-medium">{doctor.fullName}</h4>
                          <p className="text-sm text-gray-600">
                            {doctor.specialization}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="font-medium">
                            {format(selectedDate, "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-medium">
                            {/* {format(
                              new Date(
                                schedule?.filteredSlots?.find(s => s._id === selectedSlot)?.startTime || "09:00"
                              ),
                              'h:mm a'
                            )} */}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="font-medium">
                            {schedule?.appointmentDuration} minutes
                          </p>
                        </div>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        bookingMutation.mutate({
                          doctorId,
                          slotId: selectedSlot,
                          date: format(selectedDate, "yyyy-MM-dd"),
                          reason: e.target.notes.value,
                          appointmentType: consultationType,
                        });
                      }}
                    >
                      <div className="mb-4">
                        <label
                          htmlFor="notes"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Reason for visit (optional)
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Briefly describe the reason for your visit..."
                        ></textarea>
                      </div>

                      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">
                            Consultation Fee
                          </span>
                          <span className="font-medium">
                            ${doctor.consultationFee}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-lg text-blue-800">
                          <span>Total</span>
                          <span>${doctor.consultationFee}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          onClick={() => setIsBookingModalOpen(false)}
                          disabled={bookingMutation.isPending}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`${bookingMutation.isPending ? "cursor-not-allowed opacity-50 pointer-events-none" : ""} px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center`}
                          disabled={bookingMutation.isPending}
                        >
                          {bookingMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Booking...
                            </>
                          ) : (
                            "Confirm Booking"
                          )}
                        </button>
                      </div>
                    </form>
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

export default DoctorProfilePage;

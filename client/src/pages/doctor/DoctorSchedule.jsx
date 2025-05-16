import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { toast } from "react-toastify";
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import useGetDoctorProfile from "@/hooks/useGetDoctorProfile";

const DoctorSchedule = () => {
  const { data: doctor, isLoading: isDoctorLoading } = useGetDoctorProfile();
  const doctorId = doctor?._id;
  // console.log(doctorId);
  const queryClient = useQueryClient();
  const [newWorkingHours, setNewWorkingHours] = useState({
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
    breaks: [],
  });
  const [newBreak, setNewBreak] = useState({
    startTime: "",
    endTime: "",
  });
  const [newBlockedSlot, setNewBlockedSlot] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    reason: "",
  });
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);
  const [daysToGenerate, setDaysToGenerate] = useState(14);
  const {
    data: schedule,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["schedule", doctorId],
    queryFn: async () => {
      const response = await apiClient.get(`/schedule/${doctorId}`);
      return {
        workingHours: response.data.workingHours || [],
        availableSlots: response.data.availableSlots || [],
        blockedSlots: response.data.blockedSlots || [],
        appointmentDuration: response.data.appointmentDuration || 30,
        timeSlotSettings: {
          interval: 15,
          bufferTime: 5,
          maxDailyAppointments: 20,
          ...response.data.timeSlotSettings,
        },
      };
    },
    enabled: !!doctorId,
  });

  const { data: availableSlots } = useQuery({
    queryKey: ["availableSlots", doctorId],
    queryFn: async () => {
      const response = await apiClient.get(`/schedule/${doctorId}/slots`);

      return response.slots || [];
    },
    enabled: !!doctorId && !!schedule,
  });

  const { data: blockedSlots } = useQuery({
    queryKey: ["blockedSlots", doctorId],
    queryFn: async () => {
      const response = await apiClient.get(`/schedule/${doctorId}/blocked`);
      // console.log(response);
      return response.blockedSlots || [];
    },
    enabled: !!doctorId && !!schedule,
  });
  const updateScheduleMutation = useMutation({
    mutationFn: (updatedSchedule) =>
      apiClient.put(`/schedule/${doctorId}`, updatedSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", doctorId] });
      toast.success("Schedule updated successfully");
    },
    onError: () => toast.error("Failed to update schedule"),
  });
  const generateSlotsMutation = useMutation({
    mutationFn: ({ startDate, endDate }) =>
      apiClient.post(`/schedule/${doctorId}/slots/generate`, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableSlots", doctorId] });
      toast.success("Slots generated successfully");
      setIsGeneratingSlots(false);
    },
    onError: () => toast.error("Failed to generate slots"),
  });
  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, updates }) =>
      apiClient.put(`/schedule/${doctorId}/slots/${slotId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availableSlots", doctorId] });
      toast.success("Slot updated successfully");
    },
    onError: () => toast.error("Failed to update slot"),
  });
  const addBlockedSlotMutation = useMutation({
    mutationFn: (blockedSlot) =>
      apiClient.post(`/schedule/${doctorId}/blocked`, blockedSlot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedSlots", doctorId] });
      toast.success("Blocked slot added");
      setNewBlockedSlot({
        date: new Date().toISOString().split("T")[0],
        startTime: "",
        endTime: "",
        reason: "",
      });
    },
    onError: () => toast.error("Failed to add blocked slot"),
  });
  const handleAddWorkingDay = () => {
    if (!schedule) {
      toast.error("Schedule data not loaded yet");
      return;
    }

    const updatedSchedule = {
      ...schedule,
      workingHours: [...schedule.workingHours, newWorkingHours],
    };
    updateScheduleMutation.mutate(updatedSchedule);
  };
  const handleRemoveWorkingDay = (day) => {
    if (!schedule) return;

    const updatedSchedule = {
      ...schedule,
      workingHours: schedule.workingHours.filter((wh) => wh.day !== day),
    };
    updateScheduleMutation.mutate(updatedSchedule);
  };
  const handleAddBreak = (day) => {
    if (!schedule || !newBreak.startTime || !newBreak.endTime) {
      toast.error("Please enter both start and end times");
      return;
    }
    const updatedSchedule = {
      ...schedule,
      workingHours: schedule.workingHours.map((wh) =>
        wh.day === day
          ? { ...wh, breaks: [...(wh.breaks || []), newBreak] }
          : wh
      ),
    };
    updateScheduleMutation.mutate(updatedSchedule);
    setNewBreak({ startTime: "", endTime: "" });
  };
  const createScheduleMutation = useMutation({
    mutationFn: (newSchedule) =>
      apiClient.post(`/schedule/${doctorId}`, newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule", doctorId] });
      toast.success("Schedule created successfully");
    },
    onError: () => toast.error("Failed to create schedule"),
  });

  const handleAddBlockedSlot = () => {
    if (!newBlockedSlot.startTime || !newBlockedSlot.endTime) {
      toast.error("Please enter both start and end times");
      return;
    }

    addBlockedSlotMutation.mutate({
      date: new Date(newBlockedSlot.date),
      startTime: newBlockedSlot.startTime,
      endTime: newBlockedSlot.endTime,
      reason: newBlockedSlot.reason || undefined,
    });
  };

  const handleGenerateSlots = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + daysToGenerate);
    generateSlotsMutation.mutate({ startDate, endDate });
  };

  if (isLoading || isDoctorLoading) {
    return <div className="text-center py-8">Loading schedule...</div>;
  }

  if (error) {
    const isNotFoundError = error?.status === 404;
    return (
      <div className="text-center py-8">
        {isNotFoundError ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
            <Calendar className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Schedule Found
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't set up your schedule yet. Let's create one!
            </p>
            <button
              onClick={() => {
                const defaultSchedule = {
                  workingHours: [
                    {
                      day: "Monday",
                      startTime: "09:00",
                      endTime: "17:00",
                      breaks: [],
                    },
                  ],
                  availableSlots: [],
                  blockedSlots: [],
                  appointmentDuration: 30,
                  timeSlotSettings: {
                    interval: 15,
                    bufferTime: 5,
                    maxDailyAppointments: 20,
                  },
                };
                createScheduleMutation.mutate(defaultSchedule);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
              disabled={createScheduleMutation.isLoading}
            >
              {createScheduleMutation.isLoading
                ? "Creating..."
                : "Create Default Schedule"}
            </button>
          </div>
        ) : (
          <div className="text-red-500">
            Error loading schedule: {error.message}
          </div>
        )}
      </div>
    );
  }
  if (!schedule || Object.keys(schedule).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Schedule is Empty
          </h3>
          <p className="text-gray-600 mb-4">
            Your schedule exists but has no data. Would you like to set up
            default availability?
          </p>
          <button
            onClick={() => {
              const defaultWorkingHours = {
                workingHours: [
                  {
                    day: "Monday",
                    startTime: "09:00",
                    endTime: "17:00",
                    breaks: [],
                  },
                ],
                appointmentDuration: 30,
              };
              updateScheduleMutation.mutate({
                ...schedule,
                ...defaultWorkingHours,
              });
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            disabled={updateScheduleMutation.isLoading}
          >
            {updateScheduleMutation.isLoading
              ? "Updating..."
              : "Initialize Schedule"}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Doctor Schedule Management</h1>

      {/* Working Hours Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2" /> Working Hours
        </h2>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Add Working Day</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Day</label>
              <select
                className="w-full p-2 border rounded"
                value={newWorkingHours.day}
                onChange={(e) =>
                  setNewWorkingHours({
                    ...newWorkingHours,
                    day: e.target.value,
                  })
                }
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                className="w-full p-2 border rounded"
                value={newWorkingHours.startTime}
                onChange={(e) =>
                  setNewWorkingHours({
                    ...newWorkingHours,
                    startTime: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                className="w-full p-2 border rounded"
                value={newWorkingHours.endTime}
                onChange={(e) =>
                  setNewWorkingHours({
                    ...newWorkingHours,
                    endTime: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddWorkingDay}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
                disabled={!schedule}
              >
                <Plus size={16} className="mr-1" /> Add Day
              </button>
            </div>
          </div>
        </div>

        {/* Current Working Hours */}
        <div>
          <h3 className="font-medium mb-2">Current Working Hours</h3>
          {(schedule.workingHours || []).length > 0 ? (
            <div className="space-y-4">
              {schedule.workingHours.map((wh, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {wh.day}: {wh.startTime} - {wh.endTime}
                    </span>
                    <button
                      onClick={() => handleRemoveWorkingDay(wh.day)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Breaks for this day */}
                  <div className="ml-4 mt-2">
                    <h4 className="text-sm font-medium mb-2">Breaks</h4>
                    {(wh.breaks || []).length > 0 ? (
                      <ul className="space-y-2">
                        {wh.breaks.map((br, brIdx) => (
                          <li
                            key={brIdx}
                            className="flex justify-between items-center"
                          >
                            <span>
                              {br.startTime} - {br.endTime}
                            </span>
                            <button
                              onClick={() => {
                                const updatedSchedule = {
                                  ...schedule,
                                  workingHours: schedule.workingHours.map((d) =>
                                    d.day === wh.day
                                      ? {
                                          ...d,
                                          breaks: d.breaks.filter(
                                            (_, i) => i !== brIdx
                                          ),
                                        }
                                      : d
                                  ),
                                };
                                updateScheduleMutation.mutate(updatedSchedule);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No breaks added</p>
                    )}

                    <div className="mt-3 flex items-end gap-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          className="p-1 border rounded text-sm"
                          value={newBreak.startTime}
                          onChange={(e) =>
                            setNewBreak({
                              ...newBreak,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          className="p-1 border rounded text-sm"
                          value={newBreak.endTime}
                          onChange={(e) =>
                            setNewBreak({
                              ...newBreak,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </div>
                      <button
                        onClick={() => handleAddBreak(wh.day)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 flex items-center"
                      >
                        <Plus size={14} className="mr-1" /> Add Break
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No working hours configured</p>
          )}
        </div>
      </div>

      {/* Appointment Settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Appointment Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium mb-2">Duration (minutes)</label>
            <select
              className="w-full p-2 border rounded"
              value={schedule.appointmentDuration}
              onChange={(e) =>
                updateScheduleMutation.mutate({
                  ...schedule,
                  appointmentDuration: parseInt(e.target.value),
                })
              }
            >
              {[15, 30, 45, 60].map((duration) => (
                <option key={duration} value={duration}>
                  {duration}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-2">
              Time Slot Interval (minutes)
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={schedule.timeSlotSettings.interval}
              onChange={(e) =>
                updateScheduleMutation.mutate({
                  ...schedule,
                  timeSlotSettings: {
                    ...schedule.timeSlotSettings,
                    interval: parseInt(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="block font-medium mb-2">
              Max Daily Appointments
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={schedule.timeSlotSettings.maxDailyAppointments}
              onChange={(e) =>
                updateScheduleMutation.mutate({
                  ...schedule,
                  timeSlotSettings: {
                    ...schedule.timeSlotSettings,
                    maxDailyAppointments: parseInt(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Slot Management */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="mr-2" /> Slot Management
        </h2>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h3 className="font-medium mb-2">Generate Available Slots</h3>
            <p className="text-sm text-gray-600">
              This will create bookable time slots based on your working hours
              and appointment settings.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Days to Generate
              </label>
              <input
                type="number"
                min="1"
                max="90"
                className="w-20 p-2 border rounded"
                value={daysToGenerate}
                onChange={(e) => setDaysToGenerate(parseInt(e.target.value))}
              />
            </div>
            <button
              onClick={() => setIsGeneratingSlots(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
              disabled={generateSlotsMutation.isLoading}
            >
              {generateSlotsMutation.isLoading
                ? "Generating..."
                : "Generate Slots"}
            </button>
          </div>
        </div>

        {/* Available Slots */}
        <div>
          <h3 className="font-medium mb-2">Available Slots</h3>
          {(availableSlots || []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableSlots.map((slot) => (
                <div key={slot._id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {new Date(slot.date).toLocaleDateString()}
                      </p>
                      <p>
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p
                        className={`text-sm ${
                          slot.isBooked ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {slot.isBooked ? "Booked" : "Available"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          updateSlotMutation.mutate({
                            slotId: slot._id,
                            updates: { isBooked: !slot.isBooked },
                          })
                        }
                        className="text-blue-500 hover:text-blue-700"
                        title={
                          slot.isBooked ? "Mark as available" : "Mark as booked"
                        }
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this slot?"
                            )
                          ) {
                            const updatedSlots = availableSlots.filter(
                              (s) => s._id !== slot._id
                            );
                            updateScheduleMutation.mutate({
                              ...schedule,
                              availableSlots: updatedSlots,
                            });
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Delete slot"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  No available slots
                </p>
                <p className="text-sm text-yellow-700">
                  Generate slots based on your working hours or add them
                  manually.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blocked Slots */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Blocked Time Slots</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium mb-2">Add Blocked Slot</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={newBlockedSlot.date}
                  onChange={(e) =>
                    setNewBlockedSlot({
                      ...newBlockedSlot,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded"
                    value={newBlockedSlot.startTime}
                    onChange={(e) =>
                      setNewBlockedSlot({
                        ...newBlockedSlot,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded"
                    value={newBlockedSlot.endTime}
                    onChange={(e) =>
                      setNewBlockedSlot({
                        ...newBlockedSlot,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Vacation, Meeting"
                  value={newBlockedSlot.reason}
                  onChange={(e) =>
                    setNewBlockedSlot({
                      ...newBlockedSlot,
                      reason: e.target.value,
                    })
                  }
                />
              </div>
              <button
                onClick={handleAddBlockedSlot}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={addBlockedSlotMutation.isLoading}
              >
                {addBlockedSlotMutation.isLoading
                  ? "Adding..."
                  : "Block Time Slot"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Current Blocked Slots</h3>
            {(blockedSlots || []).length > 0 ? (
              <div className="space-y-3">
                {blockedSlots.map((block) => (
                  <div key={block._id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {new Date(block.date).toLocaleDateString()}
                        </p>
                        <p>
                          {block.startTime} - {block.endTime}
                        </p>
                        {block.reason && (
                          <p className="text-sm text-gray-600">
                            Reason: {block.reason}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const updatedSlots = blockedSlots.filter(
                            (b) => b._id !== block._id
                          );
                          updateScheduleMutation.mutate({
                            ...schedule,
                            blockedSlots: updatedSlots,
                          });
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Remove blocked slot"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No blocked time slots</p>
            )}
          </div>
        </div>
      </div>

      {/* Generate Slots Confirmation Modal */}
      <Transition appear show={isGeneratingSlots} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsGeneratingSlots(false)}
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
                    Generate Time Slots
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      This will generate available time slots for the next{" "}
                      {daysToGenerate} days.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
                      onClick={() => setIsGeneratingSlots(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 focus:outline-none"
                      onClick={handleGenerateSlots}
                    >
                      Generate Slots
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

export default DoctorSchedule;

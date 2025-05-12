import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/apiClient'
import { Calendar, Clock, Plus, Trash2, Edit2, X, Check, ChevronDown } from 'lucide-react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { toast } from 'react-toastify'
import useGetDoctorProfile from '@/hooks/useGetDoctorProfile'
import { useOutletContext } from 'react-router-dom'
import Loading from '@/components/Loading'


const SchedulePage = () => {
  const queryClient = useQueryClient()
  const [selectedView, setSelectedView] = useState('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isGenerateSlotsOpen, setIsGenerateSlotsOpen] = useState(false)
  const [isBlockTimeOpen, setIsBlockTimeOpen] = useState(false)
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState({
    startDate: '',
    endDate: ''
  })
  const [blockTimeData, setBlockTimeData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: ''
  })
  const [scheduleData, setScheduleData] = useState({
    workingHours: [],
    appointmentDuration: 30,
    timeSlotSettings: {
      interval: 15,
      bufferTime: 5,
      maxDailyAppointments: 20
    }
  })
  const {data: doctor, isLoading : isDoctorLoading} = useGetDoctorProfile();
  const doctorId = doctor?.doctorId;
  console.log("doctor", doctor)

  // Fetch schedule data
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', doctorId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/schedule/${doctorId}`)
      return data.schedule
    }
  })
  console.log("selected1", schedule)

  // Fetch blocked times
  const { data: blockedTimes } = useQuery({
    queryKey: ['blockedTimes', doctorId],
    queryFn: async () => {
      const response = await apiClient.get(`/schedule/${doctorId}/blocked`)
      return response?.blockedSlots
    },

  })


  // Fetch available slots
  const { data: availableSlots, isSuccess: isAvailableSlotSuccess } = useQuery({
    queryKey: ['availableSlots', doctorId, selectedDate],
    queryFn: async () => {
      const response = await apiClient.get(`/schedule/${doctorId}/slots`, {
        params: { date: selectedDate.toISOString().split('T')[0] }
      })
      console.log("slots", )
      return response?.slots
    },
  })

  console.log("available slots", availableSlots, isAvailableSlotSuccess)

  // Generate slots mutation
  const generateSlots = useMutation({
    mutationFn: async ({ startDate, endDate }) => {
      await apiClient.post(`/schedule/${doctorId}/slots/generate`, {
        startDate,
        endDate
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['availableSlots', doctorId])
      toast.success('Slots generated successfully')
      setIsGenerateSlotsOpen(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate slots')
    }
  })

  // Update slot mutation
  const updateSlot = useMutation({
    mutationFn: async ({ slotId, isBooked }) => {
      await apiClient.put(`/schedule/${doctorId}/slots/${slotId}`, { isBooked })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['availableSlots', doctorId])
      toast.success('Slot updated successfully')
    }
  })

  // Delete slot mutation
  const deleteSlot = useMutation({
    mutationFn: async (slotId) => {
      await apiClient.delete(`/schedule/${doctorId}/slots/${slotId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['availableSlots', doctorId])
      toast.success('Slot deleted successfully')
    }
  })

  // Block time mutation
  const blockTime = useMutation({
    mutationFn: async (blockData) => {
      await apiClient.post(`/schedule/${doctorId}/blocked`, blockData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blockedTimes', doctorId])
      toast.success('Time blocked successfully')
      setIsBlockTimeOpen(false)
    }
  })

  // Delete blocked time mutation
  const deleteBlockedTime = useMutation({
    mutationFn: async (blockId) => {
      await apiClient.delete(`/schedule/${doctorId}/blocked/${blockId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blockedTimes', doctorId])
      toast.success('Blocked time removed')
    }
  })

  // Update schedule mutation
  const updateSchedule = useMutation({
    mutationFn: async (updatedSchedule) => {
      await apiClient.put(`/schedule/${doctorId}`, updatedSchedule)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedule', doctorId])
      toast.success('Schedule updated successfully')
      setIsEditScheduleOpen(false)
    }
  })

  useEffect(() => {
    if (schedule) {
      setScheduleData(schedule)
    }
  }, [schedule])

  if(isDoctorLoading)
    return <Loading />

  const handleGenerateSlots = () => {
    generateSlots.mutate(newSlotData)
  }

  const handleBlockTime = () => {
    blockTime.mutate(blockTimeData)
  }

  const handleUpdateSchedule = () => {
    updateSchedule.mutate(scheduleData)
  }

  const handleSlotStatusChange = (slotId, isBooked) => {
    updateSlot.mutate({ slotId, isBooked: !isBooked })
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Schedule Management</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsGenerateSlotsOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={18} />
            <span>Generate Slots</span>
          </button>
          <button
            onClick={() => setIsBlockTimeOpen(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Clock size={18} />
            <span>Block Time</span>
          </button>
          <button
            onClick={() => setIsEditScheduleOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Edit2 size={18} />
            <span>Edit Schedule</span>
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="mb-6">
        <Listbox value={selectedView} onChange={setSelectedView}>
          <div className="relative w-40">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
              <span className="block truncate capitalize">{selectedView} view</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                {['day', 'week', 'month'].map((view) => (
                  <Listbox.Option
                    key={view}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-4 pr-4 ${
                        active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                      }`
                    }
                    value={view}
                  >
                    {({ selected }) => (
                      <span
                        className={`block truncate capitalize ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {view} view
                      </span>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} />
            <span>Calendar View</span>
          </h2>
        </div>
        <div className="p-4">
          {/* Calendar implementation would go here */}
          <div className="text-center py-8 text-gray-500">
            Calendar component would display here based on {selectedView} view
          </div>
        </div>
      </div>
      {/* Available Slots */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="text-green-500" size={20} />
            <span>Available Time Slots</span>
          </h2>
        </div>
        <div className="p-4">
          {availableSlots?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableSlots.map((slot) => (
                <div
                  key={slot._id}
                  className={`border rounded-lg p-3 ${
                    slot.isBooked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {new Date(slot.date).toLocaleDateString()} at {slot.startTime}
                      </p>
                      <p className="text-sm text-gray-600">Duration: 30 mins</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSlotStatusChange(slot._id, slot.isBooked)}
                        className={`p-1 rounded ${
                          slot.isBooked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {slot.isBooked ? (
                          <Check size={16} />
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteSlot.mutate(slot._id)}
                        className="p-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {slot.isBooked && (
                    <p className="mt-2 text-xs text-red-600">Booked</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No available slots found. Generate slots to get started.
            </div>
          )}
        </div>
      </div>

      {/* Blocked Times */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <X className="text-red-500" size={20} />
            <span>Blocked Times</span>
          </h2>
        </div>
        <div className="p-4">
          {blockedTimes?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {blockedTimes.map((block) => (
                <div
                  key={block._id}
                  className="border border-amber-200 bg-amber-50 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {new Date(block.date).toLocaleDateString()} from {block.startTime} to {block.endTime}
                      </p>
                      {block.reason && (
                        <p className="text-sm text-gray-600">Reason: {block.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteBlockedTime.mutate(block._id)}
                      className="p-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No blocked times scheduled.
            </div>
          )}
        </div>
      </div>

      {/* Generate Slots Modal */}
      <Transition appear show={isGenerateSlotsOpen} as="div">
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsGenerateSlotsOpen(false)}
        >
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as="div"
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
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newSlotData.startDate}
                        onChange={(e) =>
                          setNewSlotData({ ...newSlotData, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newSlotData.endDate}
                        onChange={(e) =>
                          setNewSlotData({ ...newSlotData, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsGenerateSlotsOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={handleGenerateSlots}
                      disabled={generateSlots.isLoading}
                    >
                      {generateSlots.isLoading ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Block Time Modal */}
      <Transition appear show={isBlockTimeOpen} as="div">
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsBlockTimeOpen(false)}
        >
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as="div"
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
                    Block Time
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={blockTimeData.date}
                        onChange={(e) =>
                          setBlockTimeData({ ...blockTimeData, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Start Time
                        </label>
                        <input
                          type="time"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={blockTimeData.startTime}
                          onChange={(e) =>
                            setBlockTimeData({
                              ...blockTimeData,
                              startTime: e.target.value
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          End Time
                        </label>
                        <input
                          type="time"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={blockTimeData.endTime}
                          onChange={(e) =>
                            setBlockTimeData({
                              ...blockTimeData,
                              endTime: e.target.value
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reason (Optional)
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={blockTimeData.reason}
                        onChange={(e) =>
                          setBlockTimeData({
                            ...blockTimeData,
                            reason: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsBlockTimeOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                      onClick={handleBlockTime}
                      disabled={blockTime.isLoading}
                    >
                      {blockTime.isLoading ? 'Saving...' : 'Block Time'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Schedule Modal */}
      <Transition appear show={isEditScheduleOpen} as="div">
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditScheduleOpen(false)}
        >
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as="div"
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Edit Schedule
                  </Dialog.Title>
                  <div className="mt-4 space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Working Hours</h4>
                      <div className="space-y-4">
                        {days.map((day) => {
                          const daySchedule = scheduleData.workingHours.find(
                            (wh) => wh.day === day
                          ) || { day, startTime: '', endTime: '', breaks: [] }
                          return (
                            <div key={day} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{day}</span>
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    checked={!!daySchedule.startTime}
                                    onChange={(e) => {
                                      const newWorkingHours = [...scheduleData.workingHours]
                                      const index = newWorkingHours.findIndex(
                                        (wh) => wh.day === day
                                      )
                                      if (e.target.checked) {
                                        if (index === -1) {
                                          newWorkingHours.push({
                                            day,
                                            startTime: '09:00',
                                            endTime: '17:00',
                                            breaks: []
                                          })
                                        }
                                      } else {
                                        if (index !== -1) {
                                          newWorkingHours.splice(index, 1)
                                        }
                                      }
                                      setScheduleData({
                                        ...scheduleData,
                                        workingHours: newWorkingHours
                                      })
                                    }}
                                  />
                                  <span className="ml-2">Available</span>
                                </label>
                              </div>
                              {daySchedule.startTime && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        Start Time
                                      </label>
                                      <input
                                        type="time"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={daySchedule.startTime}
                                        onChange={(e) => {
                                          const newWorkingHours = [
                                            ...scheduleData.workingHours
                                          ]
                                          const index = newWorkingHours.findIndex(
                                            (wh) => wh.day === day
                                          )
                                          newWorkingHours[index].startTime =
                                            e.target.value
                                          setScheduleData({
                                            ...scheduleData,
                                            workingHours: newWorkingHours
                                          })
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700">
                                        End Time
                                      </label>
                                      <input
                                        type="time"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        value={daySchedule.endTime}
                                        onChange={(e) => {
                                          const newWorkingHours = [
                                            ...scheduleData.workingHours
                                          ]
                                          const index = newWorkingHours.findIndex(
                                            (wh) => wh.day === day
                                          )
                                          newWorkingHours[index].endTime = e.target.value
                                          setScheduleData({
                                            ...scheduleData,
                                            workingHours: newWorkingHours
                                          })
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                      Breaks
                                    </label>
                                    <div className="mt-1 space-y-2">
                                      {daySchedule.breaks?.map((breakItem, breakIndex) => (
                                        <div
                                          key={breakIndex}
                                          className="flex items-center gap-2"
                                        >
                                          <input
                                            type="time"
                                            className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            value={breakItem.startTime}
                                            onChange={(e) => {
                                              const newWorkingHours = [
                                                ...scheduleData.workingHours
                                              ]
                                              const dayIndex = newWorkingHours.findIndex(
                                                (wh) => wh.day === day
                                              )
                                              newWorkingHours[dayIndex].breaks[
                                                breakIndex
                                              ].startTime = e.target.value
                                              setScheduleData({
                                                ...scheduleData,
                                                workingHours: newWorkingHours
                                              })
                                            }}
                                          />
                                          <span>to</span>
                                          <input
                                            type="time"
                                            className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            value={breakItem.endTime}
                                            onChange={(e) => {
                                              const newWorkingHours = [
                                                ...scheduleData.workingHours
                                              ]
                                              const dayIndex = newWorkingHours.findIndex(
                                                (wh) => wh.day === day
                                              )
                                              newWorkingHours[dayIndex].breaks[
                                                breakIndex
                                              ].endTime = e.target.value
                                              setScheduleData({
                                                ...scheduleData,
                                                workingHours: newWorkingHours
                                              })
                                            }}
                                          />
                                          <button
                                            type="button"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => {
                                              const newWorkingHours = [
                                                ...scheduleData.workingHours
                                              ]
                                              const dayIndex = newWorkingHours.findIndex(
                                                (wh) => wh.day === day
                                              )
                                              newWorkingHours[dayIndex].breaks.splice(
                                                breakIndex,
                                                1
                                              )
                                              setScheduleData({
                                                ...scheduleData,
                                                workingHours: newWorkingHours
                                              })
                                            }}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        onClick={() => {
                                          const newWorkingHours = [
                                            ...scheduleData.workingHours
                                          ]
                                          const dayIndex = newWorkingHours.findIndex(
                                            (wh) => wh.day === day
                                          )
                                          newWorkingHours[dayIndex].breaks.push({
                                            startTime: '12:00',
                                            endTime: '13:00'
                                          })
                                          setScheduleData({
                                            ...scheduleData,
                                            workingHours: newWorkingHours
                                          })
                                        }}
                                      >
                                        <Plus size={14} />
                                        <span>Add Break</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Appointment Duration (minutes)
                        </label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={scheduleData.appointmentDuration}
                          onChange={(e) =>
                            setScheduleData({
                              ...scheduleData,
                              appointmentDuration: parseInt(e.target.value)
                            })
                          }
                        >
                          <option value={15}>15</option>
                          <option value={30}>30</option>
                          <option value={45}>45</option>
                          <option value={60}>60</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Time Slot Interval (minutes)
                        </label>
                        <input
                          type="number"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={scheduleData.timeSlotSettings?.interval || 15}
                          onChange={(e) =>
                            setScheduleData({
                              ...scheduleData,
                              timeSlotSettings: {
                                ...scheduleData.timeSlotSettings,
                                interval: parseInt(e.target.value)
                              }
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Buffer Time (minutes)
                        </label>
                        <input
                          type="number"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={scheduleData.timeSlotSettings?.bufferTime || 5}
                          onChange={(e) =>
                            setScheduleData({
                              ...scheduleData,
                              timeSlotSettings: {
                                ...scheduleData.timeSlotSettings,
                                bufferTime: parseInt(e.target.value)
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsEditScheduleOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                      onClick={handleUpdateSchedule}
                      disabled={updateSchedule.isLoading}
                    >
                      {updateSchedule.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default SchedulePage
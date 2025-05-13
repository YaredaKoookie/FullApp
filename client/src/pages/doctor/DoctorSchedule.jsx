import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Plus, Trash2, Edit, X, AlertCircle } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import useGetDoctorProfile from '@/hooks/useGetDoctorProfile';
import apiClient from '@/lib/apiClient';

const DoctorSchedule = () => {
  const { data: doctor, isLoading: isDoctorLoading } = useGetDoctorProfile();
  const doctorId = doctor?.doctorId;
  console.log(doctorId)
  const queryClient = useQueryClient();
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isEditSlotOpen, setIsEditSlotOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [newSlot, setNewSlot] = useState({
    date: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    duration: 30,
  });

  // Fetch Available Slots
  const { data: slots, isLoading } = useQuery({
    queryKey: ['doctorSlots', doctorId],
    queryFn: async () => {
      const response = await apiClient.get(`/schedule/${doctorId}/slots`);
      return response.slots;
    },
    enabled: !!doctorId,
    select: (data) => data.map(slot => ({
      ...slot,
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked || false
      
    }))
  });
  console.log("data", slots)

  // Add New Slot Mutation
  const addSlot = useMutation({
    mutationFn: (slotData) => apiClient.post(`/schedule/${doctorId}/`, slotData),
    onSuccess: (data) => {
      console.log("new",data);
      queryClient.invalidateQueries(['doctorSlots']);
      setIsAddSlotOpen(false);
      setNewSlot({
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        duration: 30,
      });
    },
  })

  // Delete Slot Mutation
  const deleteSlot = useMutation({
    mutationFn: (slotId) => apiClient.delete(`/schedule/${doctorId}/slots/${slotId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctorSlots']);
    },
  });

  // Update Slot Mutation
  const updateSlot = useMutation({
    mutationFn: ({ slotId, ...data }) => 
      apiClient.put(`/schedule/${doctorId}/slots/${slotId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctorSlots']);
      setIsEditSlotOpen(false);
    },
  });

  // Generate time slots based on range and duration
  const generateTimeSlots = (startTime, endTime, duration) => {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const endSlotMinute = currentMinute + duration;
      const endSlotHour = currentHour + Math.floor(endSlotMinute / 60);
      const endSlotMinuteAdj = endSlotMinute % 60;
      
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const slotEnd = `${String(endSlotHour).padStart(2, '0')}:${String(endSlotMinuteAdj).padStart(2, '0')}`;
      
      // Check if slot would go beyond end time
      if (
        endSlotHour > endHour || 
        (endSlotHour === endHour && endSlotMinuteAdj > endMinute)
      ) {
        break;
      }
      
      // Check for overlaps with existing slots
      const overlaps = slots.some(s => (
        (s.startTime <= slotStart && s.endTime > slotStart) ||
        (s.startTime < slotEnd && s.endTime >= slotEnd)
      ));
      
      if (!overlaps) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          duration,
        });
      }
      
      // Move to next slot
      currentMinute += duration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  };

  const handleAddSlots = () => {
    const generatedSlots = generateTimeSlots(
      newSlot.startTime,
      newSlot.endTime,
      newSlot.duration
    );
    
    addSlot.mutate({
      date: newSlot.date,
      slots: generatedSlots,
    });
  };

  const handleDeleteSlot = (slotId, isBooked) => {
    if (!isBooked) {
      deleteSlot.mutate(slotId);
    }
  };

  const handleEditSlot = (slot) => {
    setCurrentSlot(slot);
    setIsEditSlotOpen(true);
  };

  const handleUpdateSlot = () => {
    if (currentSlot) {
      updateSlot.mutate({
        slotId: currentSlot._id,
        startTime: currentSlot.startTime,
        endTime: currentSlot.endTime,
      });
    }
  };

  if (isDoctorLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!doctorId) {
    return (
      <div className="p-4 text-red-500 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Doctor profile not found
      </div>
    );
  }

  // Filter out past slots
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const upcomingSlots = slots.filter(slot => slot);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Doctor Schedule</h1>
        <button
          onClick={() => setIsAddSlotOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add New Slots
        </button>
      </div>

      {/* Slots Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b">
          <div className="font-semibold">Date</div>
          <div className="font-semibold">Time</div>
          <div className="font-semibold">Status</div>
          <div className="font-semibold">Actions</div>
        </div>

        {upcomingSlots.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No upcoming slots available
          </div>
        ) : (
          upcomingSlots
            .sort((a, b) => a.date - b.date || a.startTime.localeCompare(b.startTime))
            .map((slot) => (
              <div 
                key={slot._id} 
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b hover:bg-gray-50"
              >
                <div>
                  {slot.date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div>
                  {slot.startTime} - {slot.endTime}
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    slot.isBooked 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {slot.isBooked ? 'Booked' : 'Available'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSlot(slot)}
                    className="text-blue-500 hover:text-blue-700"
                    disabled={slot.isBooked}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot._id, slot.isBooked)}
                    className="text-red-500 hover:text-red-700"
                    disabled={slot.isBooked}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Add Slot Modal */}
      <Transition appear show={isAddSlotOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddSlotOpen(false)}
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
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Add New Time Slots
                  </Dialog.Title>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        min={new Date().toISOString().split('T')[0]}
                        value={newSlot.date.toISOString().split('T')[0]}
                        onChange={(e) => setNewSlot({...newSlot, date: new Date(e.target.value)})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                          type="time"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={newSlot.startTime}
                          onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                          type="time"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={newSlot.endTime}
                          onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Slot Duration (minutes)</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={newSlot.duration}
                        onChange={(e) => setNewSlot({...newSlot, duration: parseInt(e.target.value)})}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      onClick={() => setIsAddSlotOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleAddSlots}
                      disabled={addSlot.isLoading}
                    >
                      {addSlot.isLoading ? 'Adding...' : 'Add Slots'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Edit Slot Modal */}
      <Transition appear show={isEditSlotOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsEditSlotOpen(false)}
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
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Edit Time Slot
                  </Dialog.Title>
                  
                  {currentSlot && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <div className="mt-1 p-2 bg-gray-100 rounded-md">
                          {currentSlot.date.toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Start Time</label>
                          <input
                            type="time"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={currentSlot.startTime}
                            onChange={(e) => setCurrentSlot({...currentSlot, startTime: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">End Time</label>
                          <input
                            type="time"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={currentSlot.endTime}
                            onChange={(e) => setCurrentSlot({...currentSlot, endTime: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                      onClick={() => setIsEditSlotOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      onClick={handleUpdateSlot}
                      disabled={updateSlot.isLoading}
                    >
                      {updateSlot.isLoading ? 'Updating...' : 'Update Slot'}
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
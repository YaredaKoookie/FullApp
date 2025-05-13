// /src/components/ScheduleForm.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Dialog, Transition } from '@headlessui/react';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

const ScheduleForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [slots, setSlots] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointmentDuration, setAppointmentDuration] = useState(30); // Default duration 30 minutes

  useEffect(() => {
    // Fetch doctor's schedule
    const fetchSlots = async () => {
      try {
        const response = await apiClient.get('/slots'); // Adjust the endpoint to match your backend
        setSlots(response.data);
      } catch (err) {
        console.error('Error fetching slots:', err);
      }
    };

    fetchSlots();
  }, []);

  const onSubmit = async (data) => {
    const slotData = {
      doctorId: 'doc123', // Replace with dynamic doctorId
      startTime: data.startTime,
      endTime: data.endTime,
      date: selectedDate,
    };

    try {
      await apiClient.post('/slots', slotData);
      alert('Slot successfully added!');
    } catch (err) {
      console.error('Error adding slot:', err);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-center">Add New Slot</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Date</label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            {...register('startTime', { required: 'Start time is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.startTime && <p className="text-red-500 text-xs">{errors.startTime.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Duration</label>
          <select
            {...register('duration', { required: 'Duration is required' })}
            onChange={(e) => setAppointmentDuration(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
          </select>
          {errors.duration && <p className="text-red-500 text-xs">{errors.duration.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition duration-300"
        >
          Add Slot
        </button>
      </form>
    </div>
  );
};

export default ScheduleForm;

import React, { useState, useEffect } from 'react';
import ScheduleForm from '@/components/doctor/ScheduleForm';
import SlotList from '@/components/doctor/SlotList';
import axiosInstance from '@/lib/apiClient';

const DoctorSchedulePage = () => {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await axiosInstance.get('/slots');
        setSlots(response.data);
      } catch (err) {
        console.error('Error fetching slots:', err);
      }
    };
    fetchSlots();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <ScheduleForm />
        <div className="mt-8">
          <h2 className="text-2xl font-semibold">Available Slots</h2>
          <SlotList slots={slots} />
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedulePage;

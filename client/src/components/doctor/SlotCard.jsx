// /src/components/SlotCard.jsx
import React from 'react';
import { ClockIcon, CheckCircleIcon } from 'lucide-react';

const SlotCard = ({ slot }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{slot.startTime} - {slot.endTime}</h3>
        <span className={`text-sm ${slot.booked ? 'text-red-500' : 'text-green-500'}`}>
          {slot.booked ? 'Booked' : 'Available'}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <ClockIcon className="h-5 w-5 text-gray-500" />
        <span className="text-sm text-gray-500">{slot.date}</span>
      </div>
      {!slot.booked && (
        <button
          className="w-full bg-green-500 text-white py-2 rounded-md mt-3 hover:bg-green-600 transition duration-300"
          onClick={() => alert('Slot booked!')} // Replace with real booking logic
        >
          Book Slot
        </button>
      )}
    </div>
  );
};

export default SlotCard;

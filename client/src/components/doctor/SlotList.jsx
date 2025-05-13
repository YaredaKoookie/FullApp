// /src/components/SlotList.jsx
import React from 'react';
import SlotCard from './SlotCard';

const SlotList = ({ slots }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {slots.map((slot) => (
        <SlotCard key={slot.id} slot={slot} />
      ))}
    </div>
  );
};

export default SlotList;

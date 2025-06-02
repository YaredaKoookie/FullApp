import React from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export const ScheduleCalendar = ({ slots = [], blockedSlots = [], onSelectSlot }) => {
  // Check if a slot is in the past
  const isSlotPast = (start) => {
    const now = new Date();
    return start < now;
  };

  // Convert slots to calendar events
  const events = [
    ...slots.map(slot => {
      const start = new Date(`${new Date(slot.date).toISOString().split('T')[0]}T${slot.startTime}`);
      const end = new Date(`${new Date(slot.date).toISOString().split('T')[0]}T${slot.endTime}`);
      const isPast = isSlotPast(start);
      
      return {
        id: slot._id,
        title: slot.isBooked ? '🔴 Booked' : isPast ? '⏰ Past' : '🟢 Available',
        start,
        end,
        isBooked: slot.isBooked,
        isPast,
        resource: 'slot'
      };
    }),
    ...blockedSlots.map(slot => ({
      id: `blocked-${slot._id}`,
      title: `🚫 Blocked${slot.reason ? `: ${slot.reason}` : ''}`,
      start: new Date(`${new Date(slot.date).toISOString().split('T')[0]}T${slot.startTime}`),
      end: new Date(`${new Date(slot.date).toISOString().split('T')[0]}T${slot.endTime}`),
      resource: 'blocked'
    }))
  ];

  // Custom event styling
  const eventStyleGetter = (event) => {
    let style = {
      borderRadius: '4px',
      opacity: 0.8,
      border: 'none',
      display: 'block',
      overflow: 'hidden'
    };

    if (event.resource === 'blocked') {
      style.backgroundColor = '#EF4444'; // Red for blocked slots
    } else if (event.isBooked) {
      style.backgroundColor = '#F59E0B'; // Yellow for booked slots
    } else if (event.isPast) {
      style.backgroundColor = '#9CA3AF'; // Gray for past slots
    } else {
      style.backgroundColor = '#10B981'; // Green for available slots
    }

    return {
      style
    };
  };

  return (
    <div className="h-[600px] bg-white rounded-lg shadow p-4">
      <BigCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => {
          if (event.resource === 'slot' && !event.isBooked && !event.isPast) {
            onSelectSlot(event.id);
          }
        }}
        views={['month', 'week', 'day']}
        defaultView="week"
        step={30}
        timeslots={2}
        toolbar={true}
        popup={true}
        selectable={false}
        className="rounded-lg"
      />
    </div>
  );
}; 
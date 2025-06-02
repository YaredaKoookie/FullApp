import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// Add time conversion utilities
const convertTo24Hour = (time12h) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);

  if (hours === 12) {
    hours = modifier === 'PM' ? 12 : 0;
  } else if (modifier === 'PM') {
    hours = hours + 12;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const convertTo12Hour = (time24h) => {
  let [hours, minutes] = time24h.split(':');
  hours = parseInt(hours);
  
  let period = 'AM';
  if (hours >= 12) {
    period = 'PM';
    if (hours > 12) hours -= 12;
  }
  if (hours === 0) hours = 12;
  
  return `${hours}:${minutes} ${period}`;
};

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push({
        value: time24,
        label: convertTo12Hour(time24)
      });
    }
  }
  return options;
};

export const ScheduleSettings = ({
  schedule,
  onUpdateSchedule,
  onUpdateRecurringSchedule,
  onUpdateBreakSettings,
  onCreateSchedule
}) => {
  const [workingHours, setWorkingHours] = useState(schedule?.workingHours || []);
  const [appointmentDuration, setAppointmentDuration] = useState(schedule?.appointmentDuration || 30);
  const [timeSlotSettings, setTimeSlotSettings] = useState(schedule?.timeSlotSettings || {
    interval: 15,
    bufferTime: 5,
    maxDailyAppointments: 20,
    minNoticePeriod: 24,
    maxAdvanceBooking: 30,
    allowEmergencyBookings: true,
    emergencyBufferTime: 15
  });

  const [recurringSchedule, setRecurringSchedule] = useState(schedule?.recurringSchedule || {
    pattern: 'none',
    weeks: []
  });

  const timeOptions = generateTimeOptions();

  const handleWorkingHoursChange = (index, field, value) => {
    const newWorkingHours = [...workingHours];
    if (field === 'startTime' || field === 'endTime') {
      newWorkingHours[index] = {
        ...newWorkingHours[index],
        [field]: value
      };
    } else {
      newWorkingHours[index] = {
        ...newWorkingHours[index],
        [field]: value
      };
    }
    setWorkingHours(newWorkingHours);
  };

  const handleAddWorkingHours = () => {
    setWorkingHours([
      ...workingHours,
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        breaks: []
      }
    ]);
  };

  const handleRemoveWorkingHours = (index) => {
    const newWorkingHours = workingHours.filter((_, i) => i !== index);
    setWorkingHours(newWorkingHours);
  };

  const handleAddBreak = (dayIndex) => {
    const newWorkingHours = [...workingHours];
    newWorkingHours[dayIndex].breaks = [
      ...(newWorkingHours[dayIndex].breaks || []),
      { startTime: '12:00', endTime: '13:00', reason: 'Lunch' }
    ];
    setWorkingHours(newWorkingHours);
  };

  const handleRemoveBreak = (dayIndex, breakIndex) => {
    const newWorkingHours = [...workingHours];
    newWorkingHours[dayIndex].breaks = newWorkingHours[dayIndex].breaks.filter(
      (_, i) => i !== breakIndex
    );
    setWorkingHours(newWorkingHours);
  };

  const handleSave = () => {
    onCreateSchedule({
      workingHours,
      appointmentDuration,
      timeSlotSettings
    });
  };

  const handleUpdate = () => {
    onUpdateSchedule({
      workingHours,
      appointmentDuration,
      timeSlotSettings
    });
  };

  const handleSaveRecurring = () => {
    onUpdateRecurringSchedule(recurringSchedule);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Working Hours</h3>
        <div className="space-y-4">
          {workingHours.map((wh, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <select
                  value={wh.day}
                  onChange={(e) => handleWorkingHoursChange(index, 'day', e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                    (day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    )
                  )}
                </select>
                
                <select
                  value={wh.startTime}
                  onChange={(e) => handleWorkingHoursChange(index, 'startTime', e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <span className="text-gray-500">to</span>

                <select
                  value={wh.endTime}
                  onChange={(e) => handleWorkingHoursChange(index, 'endTime', e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleRemoveWorkingHours(index)}
                  className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Breaks Section */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Breaks</h4>
                <div className="space-y-2">
                  {(wh.breaks || []).map((breakItem, breakIndex) => (
                    <div key={breakIndex} className="flex items-center gap-4">
                      <select
                        value={breakItem.startTime}
                        onChange={(e) =>
                          handleWorkingHoursChange(index, 'breaks', [
                            ...(wh.breaks || []).slice(0, breakIndex),
                            { ...breakItem, startTime: e.target.value },
                            ...(wh.breaks || []).slice(breakIndex + 1),
                          ])
                        }
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {timeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-gray-500">to</span>

                      <select
                        value={breakItem.endTime}
                        onChange={(e) =>
                          handleWorkingHoursChange(index, 'breaks', [
                            ...(wh.breaks || []).slice(0, breakIndex),
                            { ...breakItem, endTime: e.target.value },
                            ...(wh.breaks || []).slice(breakIndex + 1),
                          ])
                        }
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {timeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleRemoveBreak(index, breakIndex)}
                        className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddBreak(index)}
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Break
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleAddWorkingHours}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Working Hours
          </button>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Appointment Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Appointment Duration (minutes)</label>
            <select
              value={appointmentDuration}
              onChange={(e) => setAppointmentDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[15, 30, 45, 60].map((duration) => (
                <option key={duration} value={duration}>
                  {duration} minutes
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Interval (minutes)</label>
              <input
                type="number"
                value={timeSlotSettings.interval}
                onChange={(e) =>
                  setTimeSlotSettings({
                    ...timeSlotSettings,
                    interval: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Buffer Time (minutes)</label>
              <input
                type="number"
                value={timeSlotSettings.bufferTime}
                onChange={(e) =>
                  setTimeSlotSettings({
                    ...timeSlotSettings,
                    bufferTime: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Daily Appointments</label>
              <input
                type="number"
                value={timeSlotSettings.maxDailyAppointments}
                onChange={(e) =>
                  setTimeSlotSettings({
                    ...timeSlotSettings,
                    maxDailyAppointments: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Notice Period (hours)</label>
              <input
                type="number"
                value={timeSlotSettings.minNoticePeriod}
                onChange={(e) =>
                  setTimeSlotSettings({
                    ...timeSlotSettings,
                    minNoticePeriod: Number(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recurring Schedule</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pattern</label>
            <select
              value={recurringSchedule.pattern}
              onChange={(e) =>
                setRecurringSchedule({
                  ...recurringSchedule,
                  pattern: e.target.value
                })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => setWorkingHours(schedule?.workingHours || [])}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Update Schedule
        </button>
      </div>
    </div>
  );
}; 
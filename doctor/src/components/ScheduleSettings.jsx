import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const ScheduleSettings = ({
  schedule,
  onUpdateSchedule,
  onUpdateRecurringSchedule,
  onUpdateBreakSettings
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

  const handleWorkingHoursChange = (index, field, value) => {
    const newWorkingHours = [...workingHours];
    newWorkingHours[index] = {
      ...newWorkingHours[index],
      [field]: value
    };
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
                <input
                  type="time"
                  value={wh.startTime}
                  onChange={(e) => handleWorkingHoursChange(index, 'startTime', e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={wh.endTime}
                  onChange={(e) => handleWorkingHoursChange(index, 'endTime', e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRemoveWorkingHours(index)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="ml-8 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Breaks</h4>
                  <button
                    onClick={() => handleAddBreak(index)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Break
                  </button>
                </div>
                {wh.breaks?.map((br, breakIndex) => (
                  <div key={breakIndex} className="flex items-center gap-4">
                    <input
                      type="time"
                      value={br.startTime}
                      onChange={(e) => {
                        const newBreaks = [...wh.breaks];
                        newBreaks[breakIndex].startTime = e.target.value;
                        handleWorkingHoursChange(index, 'breaks', newBreaks);
                      }}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      value={br.endTime}
                      onChange={(e) => {
                        const newBreaks = [...wh.breaks];
                        newBreaks[breakIndex].endTime = e.target.value;
                        handleWorkingHoursChange(index, 'breaks', newBreaks);
                      }}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Reason"
                      value={br.reason}
                      onChange={(e) => {
                        const newBreaks = [...wh.breaks];
                        newBreaks[breakIndex].reason = e.target.value;
                        handleWorkingHoursChange(index, 'breaks', newBreaks);
                      }}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveBreak(index, breakIndex)}
                      className="p-2 text-gray-600 hover:text-gray-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
      </div>
    </div>
  );
}; 
import { Calendar, Clock, BarChart3, Users } from 'lucide-react';

export const AnalyticsDashboard = ({ analytics }) => {
  if (!analytics?.data) return null;

  const {
    totalSlots = 0,
    bookedSlots = 0,
    utilizationRate = 0,
    peakHours = [],
    popularDays = [],
    blockedTime = 0
  } = analytics.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Slots</p>
              <p className="text-2xl font-semibold">{totalSlots}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Booked Slots</p>
              <p className="text-2xl font-semibold">{bookedSlots}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilization Rate</p>
              <p className="text-2xl font-semibold">{Number(utilizationRate).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Blocked Time</p>
              <p className="text-2xl font-semibold">{blockedTime} min</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Peak Hours</h3>
          <div className="space-y-4">
            {peakHours.length > 0 ? (
              peakHours.map(({ hour, count }) => (
                <div key={hour} className="flex items-center justify-between">
                  <span className="text-gray-600">{hour}:00</span>
                  <div className="w-48 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${(count / Math.max(...peakHours.map(p => p.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No peak hours data available</p>
            )}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Popular Days</h3>
          <div className="space-y-4">
            {popularDays.length > 0 ? (
              popularDays.map(({ day, count }) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-gray-600">{day}</span>
                  <div className="w-48 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${(count / Math.max(...popularDays.map(p => p.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No popular days data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 
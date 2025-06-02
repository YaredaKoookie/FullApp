import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { Clock, Users, Calendar, Ban, CheckCircle, XCircle } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

const StatCard = ({ title, value, icon: Icon, description, percentage }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {percentage && (
          <p className="text-sm text-gray-500">
            {percentage > 0 ? '+' : ''}{percentage}%
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {Icon && <Icon className="w-8 h-8 text-blue-500" />}
    </div>
  </div>
);

export const AnalyticsDashboard = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  // Calculate percentages for the overview stats
  const totalSlots = analytics.totalSlots || 0;
  const bookedPercentage = totalSlots ? ((analytics.bookedSlots || 0) / totalSlots * 100).toFixed(1) : 0;
  const availablePercentage = totalSlots ? ((analytics.availableSlots || 0) / totalSlots * 100).toFixed(1) : 0;

  // Prepare data for the pie chart
  const slotDistributionData = [
    { name: 'Available', value: analytics.availableSlots || 0 },
    { name: 'Booked', value: analytics.bookedSlots || 0 },
    { name: 'Blocked', value: analytics.blockedTime ? Math.floor(analytics.blockedTime / 30) : 0 }
  ];

  // Prepare data for peak hours chart
  const peakHoursData = (analytics.peakHours || []).map(peak => ({
    hour: `${peak.hour}:00`,
    appointments: peak.count
  }));

  // Prepare data for popular days chart
  const popularDaysData = (analytics.popularDays || []).map(day => ({
    day: day.day.substring(0, 3),
    appointments: day.count
  }));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Slots"
          value={totalSlots}
          icon={Calendar}
          description="All-time available time slots"
        />
        <StatCard
          title="Booked Slots"
          value={analytics.bookedSlots || 0}
          percentage={Number(bookedPercentage)}
          icon={CheckCircle}
          description="Total appointments booked"
        />
        <StatCard
          title="Available Slots"
          value={analytics.availableSlots || 0}
          percentage={Number(availablePercentage)}
          icon={Clock}
          description="Currently available slots"
        />
        <StatCard
          title="Blocked Time"
          value={`${Math.floor(analytics.blockedTime / 60)}h ${analytics.blockedTime % 60}m`}
          icon={Ban}
          description="Total time blocked"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slot Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Slot Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slotDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {slotDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Peak Hours</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" fill="#10B981" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Days */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Days</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularDaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" fill="#6366F1" name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Utilization Rate</p>
                <p className="text-2xl font-semibold">{analytics.utilizationRate}%</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Average Daily Appointments</p>
                <p className="text-2xl font-semibold">
                  {analytics.metrics?.averageDailyAppointments || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Blocked Time Impact</p>
                <p className="text-2xl font-semibold">
                  {analytics.metrics?.blockedTimePercentage || 0}%
                </p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
import { Activity, HeartPulse, Clock, Pill, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const DoctorDashboard = () => {
  // Sample data
  const healthMetrics = [
    { name: 'Heart Rate', value: '72', unit: 'bpm', trend: 'down', icon: HeartPulse },
    { name: 'Last Visit', value: '5', unit: 'days ago', trend: 'stable', icon: Clock },
    { name: 'Active Meds', value: '3', unit: 'prescriptions', trend: 'up', icon: Pill },
    { name: 'Next Appointment', value: 'Tomorrow', unit: '10:30 AM', trend: 'none', icon: Calendar }
  ];

  const activityData = [
    { date: 'Jan 1', steps: 4200, heartRate: 72 },
    { date: 'Jan 2', steps: 5800, heartRate: 75 },
    { date: 'Jan 3', steps: 3900, heartRate: 71 },
    { date: 'Jan 4', steps: 6200, heartRate: 74 },
    { date: 'Jan 5', steps: 5400, heartRate: 73 },
  ];

  const upcomingAppointments = [
    { id: 1, doctor: 'Dr. Sarah Johnson', date: 'Tomorrow', time: '10:30 AM', specialty: 'Cardiology' },
    { id: 2, doctor: 'Dr. Michael Chen', date: 'Feb 15', time: '2:00 PM', specialty: 'Dermatology' }
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Welcome Header */}
      <div className="mb-8 ">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back, John</h1>
        <p className="text-gray-500 mt-1">Here's your health overview</p>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {healthMetrics.map((metric, index) => (
          <div 
            key={index} 
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                <div className="flex items-end mt-2">
                  <span className="text-xl md:text-2xl font-bold text-gray-900">{metric.value}</span>
                  <span className="ml-1 text-xs md:text-sm text-gray-500">{metric.unit}</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg ${getTrendColor(metric.trend)}`}>
                <metric.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Steps Chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-semibold">Weekly Activity</h3>
            <div className="flex items-center text-xs md:text-sm text-indigo-600">
              <Activity className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Last 7 days
            </div>
          </div>
          <div className="h-[220px] md:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="steps" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366F1' }}
                  activeDot={{ r: 5, stroke: '#6366F1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heart Rate Chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold mb-4">Heart Rate Trends</h3>
          <div className="h-[220px] md:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="heartRate" 
                  fill="#EC4899" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-base md:text-lg font-semibold mb-4">Upcoming Appointments</h3>
        <div className="space-y-3">
          {upcomingAppointments.map(appointment => (
            <div 
              key={appointment.id} 
              className="flex items-center p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors border border-gray-100"
            >
              <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="ml-3 md:ml-4 flex-1 min-w-0">
                <h4 className="text-sm md:text-base font-medium text-gray-900 truncate">{appointment.doctor}</h4>
                <p className="text-xs md:text-sm text-gray-500 truncate">{appointment.specialty}</p>
              </div>
              <div className="text-right ml-2">
                <p className="text-sm md:text-base font-medium whitespace-nowrap">{appointment.date}</p>
                <p className="text-xs md:text-sm text-gray-500 whitespace-nowrap">{appointment.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function for trend colors
const getTrendColor = (trend) => {
  switch(trend) {
    case 'up': return 'bg-green-100 text-green-600';
    case 'down': return 'bg-red-100 text-red-600';
    case 'stable': return 'bg-blue-100 text-blue-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default DoctorDashboard;
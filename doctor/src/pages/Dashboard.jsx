import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DoctorLayout } from '../layouts/DoctorLayout';
import { adminAPI } from '../lib/api';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">
          {title.toLowerCase().includes('revenue') ? `ETB ${value.toLocaleString()}` : value}
        </p>
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`w-4 h-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ml-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const TodayActivityCard = ({ activity }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100">
      <div className={`p-2 rounded-lg ${
        activity.type === 'appointment' ? 'bg-blue-50' :
        activity.type === 'record' ? 'bg-green-50' :
        activity.type === 'payment' ? 'bg-purple-50' :
        'bg-gray-50'
      }`}>
        {activity.type === 'appointment' && <Calendar className="w-5 h-5 text-blue-600" />}
        {activity.type === 'record' && <FileText className="w-5 h-5 text-green-600" />}
        {activity.type === 'payment' && <DollarSign className="w-5 h-5 text-purple-600" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
          </div>
          {activity.type === 'appointment' && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
              {activity.status}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {format(new Date(activity.timestamp), 'hh:mm a')}
          </div>
          {activity.type === 'appointment' && activity.status === 'confirmed' && (
            <Link
              to={`/VideoCall/${activity._id}`}
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <Video className="w-4 h-4 mr-1" />
              Join Video Call
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('week');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["doctorStats", timeRange],
    queryFn: async () => {
      const response = await adminAPI.doctor.getStats(timeRange);
      return response.data;
    },
  });

  // Fetch today's activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["doctorActivities"],
    queryFn: async () => {
      const response = await adminAPI.doctor.getActivities();
      return response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (statsLoading || activitiesLoading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-500 mt-1">Welcome back, Dr. {statsData?.doctor?.firstName}</p>
          </div>

          {/* Time Range Selector for Stats */}
          <div className="mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    timeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Appointments"
              value={statsData?.appointments?.total || 0}
              icon={Calendar}
              color="bg-blue-500"
              trend={statsData?.appointments?.trend}
            />
            <StatCard
              title="Total Revenue"
              value={statsData?.revenue?.doctorShare || 0}
              icon={DollarSign}
              color="bg-green-500"
              trend={statsData?.revenue?.trend}
            />
            <StatCard
              title="Total Patients"
              value={statsData?.patients?.total || 0}
              icon={Users}
              color="bg-purple-500"
              trend={statsData?.patients?.trend}
            />
            <StatCard
              title="Rating"
              value={statsData?.rating?.average || 0}
              icon={Star}
              color="bg-yellow-500"
            />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-medium text-gray-900">{statsData?.metrics?.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${statsData?.metrics?.completionRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Cancellation Rate</span>
                    <span className="text-sm font-medium text-gray-900">{statsData?.metrics?.cancellationRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${statsData?.metrics?.cancellationRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Activities */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
              <Link
                to="/appointments"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                View All Appointments
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {activitiesData?.length > 0 ? (
                activitiesData.map((activity) => (
                  <TodayActivityCard key={activity._id} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No activities scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
};
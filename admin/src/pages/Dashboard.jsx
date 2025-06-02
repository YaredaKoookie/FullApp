import { useEffect, useState } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAPI } from '../lib/api';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  Stethoscope,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  DollarSign,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const statCards = [
  {
    name: 'Total Appointments',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-700',
    link: '/appointments',
    key: 'appointments',
  },
  {
    name: 'Active Patients',
    icon: Users,
    color: 'bg-green-100 text-green-700',
    link: '/users',
    key: 'patients',
  },
  {
    name: 'Doctors',
    icon: Stethoscope,
    color: 'bg-blue-100 text-blue-700',
    link: '/doctors',
    key: 'doctors',
  },
  {
    name: 'Total Revenue',
    icon: DollarSign,
    color: 'bg-yellow-100 text-yellow-700',
    link: '/payments',
    key: 'revenue',
  },
];

const Dashboard = () => {
  // Use React Query for fetching dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        console.log('Fetching dashboard data...');
        const response = await adminAPI.analytics.getDashboard();
        console.log('Dashboard API Response:', response);
        return response.data;
      } catch (error) {
        console.error('Dashboard API Error:', error);
        throw error;
      }
    }
  });

  // Use React Query for fetching today's stats
  const { data: todayStats, isLoading: isTodayStatsLoading } = useQuery({
    queryKey: ['todayStats'],
    queryFn: async () => {
      const response = await adminAPI.analytics.getTodayStats();
      return response.data;
    }
  });

  // Derived state from query data
  const stats = dashboardData?.data?.stats || {
    appointments: 0,
    patients: 0,
    doctors: 0,
    revenue: 0
  };

  const todayAppointments = todayStats?.data?.appointments?.list || [];
  const todayPayments = todayStats?.data?.payments?.list || [];

  const recentAppointments = dashboardData?.data?.recent?.appointments?.map(apt => ({
    _id: apt.id,
    patient: {
      fullName: apt.patientName,
      profileImage: apt.patientImage
    },
    doctor: {
      fullName: apt.doctorName,
      profilePhoto: apt.doctorImage,
      specialization: apt.doctorSpecialization
    },
    date: apt.date,
    status: apt.status,
    type: apt.type,
    duration: apt.duration,
    payment: apt.payment
  })) || [];

  const recentPayments = dashboardData?.data?.recent?.payments?.map(payment => ({
    _id: payment.id,
    patient: {
      fullName: payment.patientName,
      profileImage: payment.patientImage
    },
    amount: payment.amount,
    status: payment.status,
    createdAt: payment.date,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId
  })) || [];

  const chartData = {
    appointments: dashboardData?.data?.charts?.appointments || [],
    patients: dashboardData?.data?.charts?.patients || [],
    doctors: dashboardData?.data?.charts?.doctors || [],
    payments: dashboardData?.data?.charts?.revenue || []
  };

  // Add console log to debug the data
  console.log('Chart Data:', chartData);

  // Update chart configurations
  const appointmentsChartData = {
    labels: chartData.appointments.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })),
    datasets: [
      {
        type: 'line',
        label: 'Total',
        data: chartData.appointments.map(d => d.count || 0),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        yAxisID: 'y1',
        order: 0
      },
      {
        type: 'bar',
        label: 'Completed',
        data: chartData.appointments.map(d => d.completed || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        yAxisID: 'y',
        order: 1,
        stack: 'stack1'
      },
      {
        type: 'bar',
        label: 'Cancelled',
        data: chartData.appointments.map(d => d.cancelled || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        yAxisID: 'y',
        order: 1,
        stack: 'stack1'
      },
      {
        type: 'bar',
        label: 'Pending',
        data: chartData.appointments.map(d => d.pending || 0),
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 2,
        yAxisID: 'y',
        order: 1,
        stack: 'stack1'
      }
    ]
  };

  const revenueChartData = {
    labels: chartData.payments.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: chartData.payments.map(d => d.revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const patientDoctorChartData = {
    labels: chartData.patients.map(d => d.month),
    datasets: [
      {
        label: 'New Patients',
        data: chartData.patients.map(d => d.count),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Active Doctors',
        data: chartData.doctors.map(d => d.activeCount),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [2, 4],
          color: '#e5e7eb'
        }
      }
    },
    maintainAspectRatio: false
  };

  // Add error state display
  if (error) {
    console.error('Dashboard Error State:', error);
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">Overview & quick stats for your clinic</p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card) => (
            <Link
              to={card.link}
              key={card.name}
              className={`rounded-xl shadow hover:shadow-lg transition p-6 flex items-center gap-4 cursor-pointer ${card.color}`}
            >
              <card.icon className="h-10 w-10" />
              <div>
                <div className="text-lg font-semibold">{card.name}</div>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="animate-spin h-6 w-6" />
                  ) : card.key === 'revenue' ? (
                    `ETB ${stats[card.key].toLocaleString()}`
                  ) : (
                    stats[card.key]
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Today's Appointments and Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Today's Appointments Table */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
              <Link to="/appointments" className="text-indigo-600 hover:underline text-sm">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isTodayStatsLoading ? (
                    <tr><td colSpan={4} className="py-6 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></td></tr>
                  ) : todayAppointments.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">No appointments for today</td></tr>
                  ) : (
                    todayAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            {appt.patientImage && (
                              <img 
                                src={appt.patientImage} 
                                alt={appt.patientName}
                                className="h-8 w-8 rounded-full mr-2"
                              />
                            )}
                            <span>{appt.patientName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            {appt.doctorImage && (
                              <img 
                                src={appt.doctorImage} 
                                alt={appt.doctorName}
                                className="h-8 w-8 rounded-full mr-2"
                              />
                            )}
                            <div>
                              <div>{appt.doctorName || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{appt.doctorSpecialization}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {new Date(appt.time).toLocaleTimeString('en-US', { 
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                            appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'}`}
                          >
                            {appt.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                            {appt.status === 'cancelled' && <XCircle className="h-4 w-4" />}
                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Payments Table */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Today's Payments</h2>
              <Link to="/payments" className="text-indigo-600 hover:underline text-sm">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isTodayStatsLoading ? (
                    <tr><td colSpan={4} className="py-6 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></td></tr>
                  ) : todayPayments.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">No payments for today</td></tr>
                  ) : (
                    todayPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <div className="flex items-center">
                            {payment.patientImage && (
                              <img 
                                src={payment.patientImage} 
                                alt={payment.patientName}
                                className="h-8 w-8 rounded-full mr-2"
                              />
                            )}
                            <span>{payment.patientName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">ETB {payment.amount.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'}`}
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {new Date(payment.time).toLocaleTimeString('en-US', { 
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Weekly Appointments</h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center text-xs font-medium">
                  <span className="w-2 h-2 inline-block rounded-full bg-indigo-500 mr-1"></span>
                  Total
                </span>
                <span className="inline-flex items-center text-xs font-medium">
                  <span className="w-2 h-2 inline-block rounded-full bg-green-500 mr-1"></span>
                  Completed
                </span>
                <span className="inline-flex items-center text-xs font-medium">
                  <span className="w-2 h-2 inline-block rounded-full bg-red-500 mr-1"></span>
                  Cancelled
                </span>
                <span className="inline-flex items-center text-xs font-medium">
                  <span className="w-2 h-2 inline-block rounded-full bg-yellow-500 mr-1"></span>
                  Pending
                </span>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : (
              <div className="h-[300px]">
                <Bar 
                  data={appointmentsChartData} 
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        stacked: true,
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        stacked: true,
                        position: 'left',
                        grid: {
                          borderDash: [2, 4],
                          color: '#e5e7eb'
                        },
                        title: {
                          display: true,
                          text: 'By Status'
                        },
                        min: 0
                      },
                      y1: {
                        position: 'right',
                        grid: {
                          drawOnChartArea: false
                        },
                        title: {
                          display: true,
                          text: 'Total'
                        },
                        min: 0
                      }
                    },
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Revenue</h3>
              <div className="text-xs font-medium text-gray-500">Last 6 months</div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : (
              <div className="h-[300px]">
                <Line 
                  data={revenueChartData} 
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        beginAtZero: true,
                        grid: {
                          borderDash: [2, 4],
                          color: '#e5e7eb'
                        },
                        ticks: {
                          callback: (value) => `ETB ${value.toLocaleString()}`
                        }
                      }
                    }
                  }} 
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Patients & Doctors Growth</h3>
              <div className="text-xs font-medium text-gray-500">Last 6 months</div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : (
              <div className="h-[300px]">
                <Line 
                  data={patientDoctorChartData} 
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'New Patients'
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Active Doctors'
                        },
                        grid: {
                          drawOnChartArea: false
                        }
                      }
                    }
                  }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
export default Dashboard;

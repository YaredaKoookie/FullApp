import { useEffect, useState } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAPI } from '../lib/api';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Stethoscope,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';

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
];

const Dashboard = () => {
  const [stats, setStats] = useState({ appointments: 0, patients: 0, doctors: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [apptRes, userRes, docRes] = await Promise.all([
          adminAPI.appointments.list({ limit: 100 }),
          adminAPI.users.list({ limit: 100, status: 'active', role: 'patient' }),
          adminAPI.doctors.list({ limit: 100 }),
        ]);
        setStats({
          appointments: apptRes.data.appointments?.length || 0,
          patients: userRes.data.data?.length || 0,
          doctors: docRes.data.data?.length || 0,
        });
        setRecentAppointments(
          (apptRes.data.appointments || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
        );
      } catch (err) {
        // handle error
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-500 mb-8">Overview & quick stats for your clinic</p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
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
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : stats[card.key]}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Appointments Table */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Appointments</h2>
            <Link to="/appointments" className="text-indigo-600 hover:underline text-sm">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={4} className="py-6 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></td></tr>
                ) : recentAppointments.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">No recent appointments</td></tr>
                ) : (
                  recentAppointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{appt.patient?.fullName || '-'}</td>
                      <td className="px-4 py-2">{appt.doctor?.fullName || '-'}</td>
                      <td className="px-4 py-2">{new Date(appt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
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

        {/* Charts Section (Placeholder) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-lg font-semibold mb-2">Appointments Trend</h3>
            <div className="text-gray-400">(Chart coming soon)</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-lg font-semibold mb-2">Patients Growth</h3>
            <div className="text-gray-400">(Chart coming soon)</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
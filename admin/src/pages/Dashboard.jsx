import { AdminLayout } from '../layouts/AdminLayout';

export const Dashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Sample Cards */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">1,234</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Active Appointments</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">56</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">New Messages</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">23</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
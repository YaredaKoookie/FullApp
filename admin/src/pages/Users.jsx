import { AdminLayout } from '../layouts/AdminLayout';

export const Users = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="rounded-lg bg-white shadow">
          <div className="p-6">
            <p className="text-gray-600">User management page content will go here.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}; 
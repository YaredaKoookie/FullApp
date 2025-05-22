import React from 'react';
import { DoctorLayout } from '../layouts/DoctorLayout';

const Notifications = () => {
  return (
    <DoctorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p>Notifications content will go here</p>
        </div>
      </div>
    </DoctorLayout>
  );
};

export default Notifications;
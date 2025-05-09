import React, { useState } from 'react';
import { Heart, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SelectRole = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    setSelectedRole(role);
  };

  const handleProceed = () => {
    if (!selectedRole) return;
    navigate(`/auth/register?role=${selectedRole}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Select Your Role</h1>

        <div className="flex justify-around mb-6 gap-1">
          {/* Doctor Card */}
          <div
            className={`flex flex-col items-center justify-center p-12 border rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ${
              selectedRole === 'doctor' ? 'bg-blue-100 border-blue-500 scale-105' : 'bg-transparent border-gray-300'
            }`}
            onClick={() => handleSelectRole('doctor')}
          >
            <Stethoscope className="text-blue-500 w-10 h-10" />
            <span className="mt-2 font-semibold text-sm">Doctor</span>
          </div>

          {/* Patient Card */}
          <div
            className={`flex flex-col items-center justify-center p-12 border rounded-lg shadow-lg cursor-pointer transition-transform duration-300 ${
              selectedRole === 'patient' ? 'bg-green-100 border-green-500 scale-105' : 'bg-transparent border-gray-300'
            }`}
            onClick={() => handleSelectRole('patient')}
          >
            <Heart className="text-green-500 w-10 h-10" />
            <span className="mt-2 font-semibold text-sm">Patient</span>
          </div>
        </div>

        <button
          className={`w-full py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-900 transition ${
            !selectedRole && 'opacity-50 cursor-not-allowed'
          }`}
          onClick={handleProceed}
          disabled={!selectedRole}
        >
          Proceed to Registration
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-500">
            Choose your role to get started. You will be able to switch your role later if needed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;

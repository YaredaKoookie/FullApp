import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Stethoscope } from "lucide-react"; // Correct Lucide icons

export default function SelectRole() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    setSelectedRole(role);
  };

  const handleProceed = () => {
    if (!selectedRole) return; // Do nothing if no role is selected
    navigate(`/register?role=${selectedRole}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Select Your Role
        </h1>

        <div className="flex justify-around mb-6">
          {/* Doctor Card */}
          <div
            className={`w-36 h-36 sm:w-40 sm:h-40 flex flex-col items-center justify-center p-4 border rounded-lg shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 ${
              selectedRole === "doctor"
                ? "border-blue-500 bg-blue-100"
                : "border-gray-300"
            }`}
            onClick={() => handleSelectRole("doctor")}
          >
            <Stethoscope className="text-3xl sm:text-4xl text-blue-600 mb-2" />
            <p className="text-base font-semibold">Doctor</p>
          </div>

          {/* Patient Card */}
          <div
            className={`w-36 h-36 sm:w-40 sm:h-40 flex flex-col items-center justify-center p-4 border rounded-lg shadow-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 ${
              selectedRole === "patient"
                ? "border-green-500 bg-green-100"
                : "border-gray-300"
            }`}
            onClick={() => handleSelectRole("patient")}
          >
            <Heart className="text-3xl sm:text-4xl text-green-600 mb-2" />
            <p className="text-base font-semibold">Patient</p>
          </div>
        </div>

        <button
          className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 ease-in-out disabled:opacity-50"
          onClick={handleProceed}
          disabled={!selectedRole}
        >
          Proceed to Registration
        </button>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Choose your role to get started. You will be able to switch your
            role later if needed.
          </p>
        </div>
      </div>
    </div>
  );
}

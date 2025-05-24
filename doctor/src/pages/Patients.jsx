import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { adminAPI } from "../lib/api";
import { format } from "date-fns";
import { FaSearch, FaHistory, FaStickyNote } from "react-icons/fa";
import MedicalRecordModal from "../components/MedicalRecordModal";
import MedicalHistoryModal from "../components/MedicalHistoryModal";
import { DoctorLayout } from "../layouts/DoctorLayout";
const Patients = () => {
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Get current doctor's ID
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await adminAPI.auth.getCurrentUser();
      return response;
    },
    onError: (error) => {
      console.error("Error fetching current user:", error);
      toast.error("Failed to fetch user information");
    },
  });

  const { data: currentDoctor } = useQuery({
    queryKey: ["currentDoctor"],
    queryFn: async () => {
      if (!currentUser?.data?.data?.user?._id) {
        throw new Error("User information not available");
      }
      const response = await adminAPI.doctor.getCurrentDoctor();
      return response;
    },
    enabled: !!currentUser?.data?.data?.user?._id,
    onError: (error) => {
      console.error("Error fetching current doctor:", error);
      toast.error("Failed to fetch doctor information");
    },
  });

  // Fetch patients
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["patients", filters],
    queryFn: async () => {
      try {
        const response = await adminAPI.patients.getAll(filters);
        return response;
      } catch (error) {
        console.error("Patients API Error:", error);
        throw error;
      }
    },
  });

  // Fetch patient medical history
  const { data: medicalHistory, isLoading: isMedicalHistoryLoading } = useQuery(
    {
      queryKey: ["medicalHistory", selectedPatient?._id],
      queryFn: async () => {
        if (!selectedPatient?._id) {
          throw new Error("No patient ID available");
        }
        const response = await adminAPI.patients.getMedicalHistory(
          selectedPatient._id
        );
        return response;
      },
      enabled: !!selectedPatient?._id && showHistory,
    }
  );

  const handleViewHistory = (patient) => {
    setSelectedPatient(patient);
    setShowHistory(true);
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Appointments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : !patientsData?.data?.data?.patients ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No patients found
                    </td>
                  </tr>
                ) : (
                  patientsData.data.data.patients.map((patient) => (
                    <tr key={patient._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={
                                patient.profileImage ||
                                "https://via.placeholder.com/40"
                              }
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.lastAppointmentDate
                            ? format(
                                new Date(patient.lastAppointmentDate),
                                "MMM d, yyyy"
                              )
                            : "No appointments"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.totalAppointments}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewHistory(patient)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View History"
                          >
                            <FaHistory />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowNotes(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Add Note"
                          >
                            <FaStickyNote />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {patientsData?.data?.data?.pagination && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {filters.page} of {patientsData.data.data.pagination.pages}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={
                filters.page === patientsData.data.data.pagination.pages
              }
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        {showHistory && selectedPatient && (
          <MedicalHistoryModal
            patient={selectedPatient}
            medicalHistory={medicalHistory}
            onClose={() => setShowHistory(false)}
            isLoading={isMedicalHistoryLoading}
          />
        )}
        {showNotes && selectedPatient && currentDoctor && (
          <MedicalRecordModal
            patient={selectedPatient}
            currentDoctor={currentDoctor}
            onClose={() => setShowNotes(false)}
          />
        )}
      </div>
    </DoctorLayout>
  );
};

export default Patients;

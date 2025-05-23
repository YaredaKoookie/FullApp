import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { adminAPI } from "../lib/api";
import { format } from "date-fns";
import {
  FaSearch,
  FaVideo,
  FaHistory,
  FaStickyNote,
  FaTimes,
} from "react-icons/fa";
import { DoctorLayout } from "../layouts/DoctorLayout";

const PatientsContent = () => {
  console.log("Patients component rendering");

  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState({
    additionalNotes: "",
    prescriptions: [],
    testsOrdered: [],
    followUpRequired: false,
    followUpDate: "", // Fixed typo: follUpDate -> followUpDate
    lifeStyleChanges: [],
    symptoms: [],
  });
  const [newPrescription, setNewPrescription] = useState({
    name: "",
    instruction: "",
    dosage: "",
    duration: "",
  });
  const [newTest, setNewTest] = useState({
    testName: "",
    orderedDate: new Date().toISOString().split("T")[0],
  });
  const [newLifestyleChange, setNewLifestyleChange] = useState("");
  const [newSymptom, setNewSymptom] = useState("");

  // Get current doctor's ID
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      console.log("Fetching current user...");
      const response = await adminAPI.auth.getCurrentUser();
      console.log("Current user response:", response);
      return response;
    },
    onError: (error) => {
      console.error("Error fetching current user:", error);
      toast.error("Failed to fetch user information");
    },
  });

  // Get current doctor's ID
  const { data: currentDoctor } = useQuery({
    queryKey: ["currentDoctor"],
    queryFn: async () => {
      if (!currentUser?.data?.data?.user?._id) {
        throw new Error("User information not available");
      }
      console.log("Fetching current doctor...");
      const response = await adminAPI.doctor.getCurrentDoctor();
      console.log(
        "Current doctor response:",
        JSON.stringify(response, null, 2)
      );
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
      console.log("Fetching patients with filters:", filters);
      try {
        const response = await adminAPI.patients.getAll(filters);
        console.log("Raw API Response:", JSON.stringify(response, null, 2));
        console.log("Response Data:", JSON.stringify(response.data, null, 2));
        return response;
      } catch (error) {
        console.error("Patients API Error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Patients Query Success:", data);
      console.log("Patients Data Structure:", {
        hasData: !!data?.data,
        hasPatients: !!data?.data?.patients,
        patientsLength: data?.data?.patients?.length,
        patients: data?.data?.patients,
      });
    },
    onError: (error) => {
      console.error("Patients Query Error:", error);
    },
  });

  // Fetch patient medical history
  const {
    data: medicalHistory,
    isLoading: isMedicalHistoryLoading,
    error: medicalHistoryError,
  } = useQuery({
    queryKey: ["medicalHistory", selectedPatient?._id],
    queryFn: async () => {
      if (!selectedPatient?._id) {
        console.error("No patient ID available");
        throw new Error("No patient ID available");
      }
      console.log(
        "Making API call for medical history with patient ID:",
        selectedPatient._id
      );
      try {
        const response = await adminAPI.patients.getMedicalHistory(
          selectedPatient._id
        );
        console.log("API Response:", response);
        if (!response?.data?.data) {
          console.error("Invalid response structure:", response);
          throw new Error("Invalid response structure");
        }
        return response;
      } catch (error) {
        console.error("API call failed:", error);
        throw error;
      }
    },
    enabled: !!selectedPatient?._id && showHistory,
    onSuccess: (data) => {
      console.log("Medical history query success:", data);
      console.log("Medical history data structure:", {
        hasData: !!data?.data,
        hasDataData: !!data?.data?.data,
        patient: data?.data?.data?.patient,
        lifestyle: data?.data?.data?.lifestyle,
        conditions: data?.data?.data?.conditions,
        allergies: data?.data?.data?.allergies,
      });
    },
    onError: (error) => {
      console.error("Error fetching medical history:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(
        error.response?.data?.message || "Failed to fetch medical history"
      );
    },
  });

  // Add medical record mutation
  const addNoteMutation = useMutation({
    mutationFn: ({ patientId, record }) => {
      console.log(
        "Current doctor data:",
        JSON.stringify(currentDoctor, null, 2)
      );

      // Extract doctor ID from the response
      const doctorId = currentDoctor?.data?.data?.doctor?._id;
      console.log("Doctor ID:", doctorId);

      if (!doctorId) {
        console.error("Doctor data structure:", {
          hasData: !!currentDoctor?.data,
          hasDataData: !!currentDoctor?.data?.data,
          hasDoctor: !!currentDoctor?.data?.data?.doctor,
          doctorId,
          fullData: currentDoctor,
        });
        throw new Error("Doctor information not available");
      }

      // Format the data to match the server's expected structure
      const medicalRecordData = {
        additionalNotes: record.additionalNotes || "",
        prescriptions: record.prescriptions.map((prescription) => ({
          name: prescription.name,
          instruction: prescription.instruction || "",
          dosage: prescription.dosage,
          duration: prescription.duration,
        })),
        testsOrdered: record.testsOrdered.map((test) => ({
          testName: test.testName,
          orderedDate: test.orderedDate,
        })),
        followUpRequired: record.followUpRequired || false,
        followUpDate: record.followUpDate || null, // Fixed typo: follUpDate -> followUpDate
        lifeStyleChanges: record.lifeStyleChanges || [],
        symptoms: record.symptoms || [],
      };

      console.log("Sending medical record data:", medicalRecordData);
      return adminAPI.patients.addNote(patientId, medicalRecordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["patientNotes"]);
      toast.success("Medical record added successfully");
      setMedicalRecord({
        additionalNotes: "",
        prescriptions: [],
        testsOrdered: [],
        followUpRequired: false,
        followUpDate: "", // Fixed typo: follUpDate -> followUpDate
        lifeStyleChanges: [],
        symptoms: [],
      });
      setShowNotes(false);
    },
    onError: (error) => {
      console.error("Medical record error:", error);
      toast.error(
        error.response?.data?.message || "Failed to add medical record"
      );
    },
  });

  console.log("Component rendering");
  console.log("Current newPrescription state:", newPrescription);
  console.log("Current newTest state:", newTest);
  console.log("Current newLifestyleChange state:", newLifestyleChange);
  console.log("Current newSymptom state:", newSymptom);

  // Video call mutation
  const videoCallMutation = useMutation({
    mutationFn: (patientId) => adminAPI.patients.initiateVideoCall(patientId),
    onSuccess: (data) => {
      // Handle video call initiation
      const { roomId } = data.data.data;
      // You would typically redirect to your video call page here
      window.open(`/video-call/${roomId}`, "_blank");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to initiate video call"
      );
    },
  });

  // Add debug logs for the click handler
  const handleViewHistory = (patient) => {
    console.log("View history clicked for patient:", patient);
    console.log("Patient ID:", patient._id);
    setSelectedPatient(patient);
    setShowHistory(true);
  };

  // Add error boundary component
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      console.error("Error in PatientsContent:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 text-center">
            <h2 className="text-lg font-semibold text-red-600">
              Something went wrong
            </h2>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        );
      }

      return this.props.children;
    }
  }

  return (
    <ErrorBoundary>
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
                            onClick={() =>
                              videoCallMutation.mutate(patient._id)
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title="Start Video Call"
                          >
                            <FaVideo />
                          </button>
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

        {/* History Modal */}
        {showHistory && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Medical History - {selectedPatient.firstName}{" "}
                  {selectedPatient.lastName}
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              {isMedicalHistoryLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !medicalHistory?.data?.data?.data ? (
                <div className="text-center text-gray-500 py-4">
                  No medical history data available
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Vital Health Data */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium mb-3">
                      Vital Health Data
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Blood Type</p>
                        <p className="font-medium">
                          {medicalHistory.data.data.data.bloodType ||
                            "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Height</p>
                        <p className="font-medium">
                          {medicalHistory.data.data.data.height
                            ? `${medicalHistory.data.data.data.height} cm`
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Weight</p>
                        <p className="font-medium">
                          {medicalHistory.data.data.data.weight
                            ? `${medicalHistory.data.data.data.weight} kg`
                            : "Not recorded"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Last Physical Exam
                        </p>
                        <p className="font-medium">
                          {medicalHistory.data.data.data.lastPhysicalExam
                            ? format(
                                new Date(
                                  medicalHistory.data.data.data.lastPhysicalExam
                                ),
                                "MMM d, yyyy"
                              )
                            : "Not recorded"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Current Conditions */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">
                      Current Conditions
                    </h4>
                    {medicalHistory.data.data.data.conditions?.length > 0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.conditions.map(
                          (condition, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="font-medium">{condition.name}</p>
                                <p className="text-sm text-gray-600">
                                  {condition.diagnosisDate &&
                                    `Diagnosed: ${format(
                                      new Date(condition.diagnosisDate),
                                      "MMM d, yyyy"
                                    )}`}
                                  {condition.isChronic && " (Chronic)"}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 text-sm rounded-full ${
                                  condition.status === "Active"
                                    ? "bg-blue-100 text-blue-800"
                                    : condition.status === "In Remission"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {condition.status}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No conditions recorded</p>
                    )}
                  </section>

                  {/* Allergies */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">Allergies</h4>
                    {medicalHistory.data.data.data.allergies?.length > 0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.allergies.map(
                          (allergy, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    {allergy.substance}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Reaction: {allergy.reaction}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 text-sm rounded-full ${
                                    allergy.isCritical
                                      ? "bg-red-100 text-red-800"
                                      : allergy.severity === "Life-threatening"
                                      ? "bg-red-100 text-red-800"
                                      : allergy.severity === "Severe"
                                      ? "bg-orange-100 text-orange-800"
                                      : allergy.severity === "Moderate"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {allergy.severity}
                                </span>
                              </div>
                              {allergy.firstObserved && (
                                <p className="text-sm text-gray-500 mt-1">
                                  First observed:{" "}
                                  {format(
                                    new Date(allergy.firstObserved),
                                    "MMM d, yyyy"
                                  )}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No allergies recorded</p>
                    )}
                  </section>

                  {/* Current Medications */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">
                      Current Medications
                    </h4>
                    {medicalHistory.data.data.data.currentMedications?.length >
                    0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.currentMedications.map(
                          (med, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-gray-600">
                                {med.dosage} - {med.frequency}
                                {med.purpose && ` (${med.purpose})`}
                              </p>
                              {med.startDate && (
                                <p className="text-sm text-gray-500">
                                  Started:{" "}
                                  {format(
                                    new Date(med.startDate),
                                    "MMM d, yyyy"
                                  )}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No current medications</p>
                    )}
                  </section>

                  {/* Past Medications */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">
                      Past Medications
                    </h4>
                    {medicalHistory.data.data.data.pastMedications?.length >
                    0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.pastMedications.map(
                          (med, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-gray-600">
                                {med.dosage} - {med.frequency}
                                {med.purpose && ` (${med.purpose})`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {med.startDate &&
                                  `Started: ${format(
                                    new Date(med.startDate),
                                    "MMM d, yyyy"
                                  )}`}
                                {med.endDate &&
                                  ` - Ended: ${format(
                                    new Date(med.endDate),
                                    "MMM d, yyyy"
                                  )}`}
                              </p>
                              {med.reasonStopped && (
                                <p className="text-sm text-gray-500">
                                  Reason stopped: {med.reasonStopped}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No past medications</p>
                    )}
                  </section>

                  {/* Surgeries */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">Surgeries</h4>
                    {medicalHistory.data.data.data.surgeries?.length > 0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.surgeries.map(
                          (surgery, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium">{surgery.name}</p>
                              <p className="text-sm text-gray-600">
                                {surgery.date &&
                                  `Date: ${format(
                                    new Date(surgery.date),
                                    "MMM d, yyyy"
                                  )}`}
                                {surgery.hospital &&
                                  ` - Hospital: ${surgery.hospital}`}
                              </p>
                              {surgery.surgeon?.doctorId && (
                                <p className="text-sm text-gray-500">
                                  Surgeon: {surgery.surgeon.doctorId.name}
                                  {surgery.surgeon.doctorId.specialty &&
                                    ` (${surgery.surgeon.doctorId.specialty})`}
                                </p>
                              )}
                              {surgery.outcome && (
                                <p className="text-sm text-gray-500">
                                  Outcome: {surgery.outcome}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No surgeries recorded</p>
                    )}
                  </section>

                  {/* Hospitalizations */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">
                      Hospitalizations
                    </h4>
                    {medicalHistory.data.data.data.hospitalizations?.length >
                    0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.hospitalizations.map(
                          (hosp, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium">{hosp.reason}</p>
                              <p className="text-sm text-gray-600">
                                {format(
                                  new Date(hosp.admissionDate),
                                  "MMM d, yyyy"
                                )}
                                {hosp.dischargeDate &&
                                  ` - ${format(
                                    new Date(hosp.dischargeDate),
                                    "MMM d, yyyy"
                                  )}`}
                                {hosp.hospitalName && ` - ${hosp.hospitalName}`}
                              </p>
                              {hosp.dischargeSummary && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {hosp.dischargeSummary}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No hospitalizations recorded
                      </p>
                    )}
                  </section>

                  {/* Family History */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">Family History</h4>
                    {medicalHistory.data.data.data.familyHistory?.length > 0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.familyHistory.map(
                          (history, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium">{history.condition}</p>
                              <p className="text-sm text-gray-600">
                                {history.relation}
                                {history.ageAtDiagnosis &&
                                  ` - Diagnosed at age ${history.ageAtDiagnosis}`}
                                {history.deceased && " (Deceased)"}
                              </p>
                              {history.notes && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {history.notes}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No family history recorded
                      </p>
                    )}
                  </section>

                  {/* Lifestyle */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">Lifestyle</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium">Smoking</p>
                        <p className="text-sm text-gray-600">
                          Status:{" "}
                          {medicalHistory.data.data.data.lifestyle?.smoking
                            ?.status
                            ? "Yes"
                            : "No"}
                          {medicalHistory.data.data.data.lifestyle?.smoking
                            ?.frequency &&
                            ` - ${medicalHistory.data.data.data.lifestyle.smoking.frequency}`}
                          {medicalHistory.data.data.data.lifestyle?.smoking
                            ?.years &&
                            ` (${medicalHistory.data.data.data.lifestyle.smoking.years} years)`}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Alcohol</p>
                        <p className="text-sm text-gray-600">
                          Status:{" "}
                          {medicalHistory.data.data.data.lifestyle?.alcohol
                            ?.status
                            ? "Yes"
                            : "No"}
                          {medicalHistory.data.data.data.lifestyle?.alcohol
                            ?.frequency &&
                            ` - ${medicalHistory.data.data.data.lifestyle.alcohol.frequency}`}
                        </p>
                      </div>
                      {medicalHistory.data.data.data.lifestyle
                        ?.exerciseFrequency && (
                        <div>
                          <p className="font-medium">Exercise</p>
                          <p className="text-sm text-gray-600">
                            {
                              medicalHistory.data.data.data.lifestyle
                                .exerciseFrequency
                            }
                          </p>
                        </div>
                      )}
                      {medicalHistory.data.data.data.lifestyle?.diet && (
                        <div>
                          <p className="font-medium">Diet</p>
                          <p className="text-sm text-gray-600">
                            {medicalHistory.data.data.data.lifestyle.diet}
                          </p>
                        </div>
                      )}
                      {medicalHistory.data.data.data.lifestyle?.occupation && (
                        <div>
                          <p className="font-medium">Occupation</p>
                          <p className="text-sm text-gray-600">
                            {medicalHistory.data.data.data.lifestyle.occupation}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Immunizations */}
                  <section className="bg-white p-4 rounded-lg border">
                    <h4 className="text-lg font-medium mb-3">Immunizations</h4>
                    {medicalHistory.data.data.data.immunizations?.length > 0 ? (
                      <div className="space-y-2">
                        {medicalHistory.data.data.data.immunizations.map(
                          (immunization, index) => (
                            <div key={index} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium">
                                {immunization.vaccine}
                              </p>
                              <p className="text-sm text-gray-600">
                                Date:{" "}
                                {format(
                                  new Date(immunization.date),
                                  "MMM d, yyyy"
                                )}
                                {immunization.administeredBy &&
                                  ` - Administered by: ${immunization.administeredBy}`}
                              </p>
                              {immunization.boosterDue && (
                                <p className="text-sm text-gray-500">
                                  Booster due:{" "}
                                  {format(
                                    new Date(immunization.boosterDue),
                                    "MMM d, yyyy"
                                  )}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No immunizations recorded</p>
                    )}
                  </section>

                  {/* Women's Health (if applicable) */}
                  {medicalHistory.data.data.data.patient?.gender ===
                    "Female" && (
                    <section className="bg-white p-4 rounded-lg border">
                      <h4 className="text-lg font-medium mb-3">
                        Women's Health
                      </h4>
                      <div className="space-y-2">
                        <div className="p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-600">
                            Pregnancies:{" "}
                            {medicalHistory.data.data.data.womenHealth
                              ?.pregnancies || 0}
                          </p>
                          <p className="text-sm text-gray-600">
                            Live Births:{" "}
                            {medicalHistory.data.data.data.womenHealth
                              ?.liveBirths || 0}
                          </p>
                          {medicalHistory.data.data.data.womenHealth
                            ?.lastMenstrualPeriod && (
                            <p className="text-sm text-gray-600">
                              Last Menstrual Period:{" "}
                              {format(
                                new Date(
                                  medicalHistory.data.data.data.womenHealth.lastMenstrualPeriod
                                ),
                                "MMM d, yyyy"
                              )}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Contraceptive Use:{" "}
                            {medicalHistory.data.data.data.womenHealth
                              ?.contraceptiveUse
                              ? "Yes"
                              : "No"}
                          </p>
                          {medicalHistory.data.data.data.womenHealth
                            ?.menstrualCycleRegular !== null && (
                            <p className="text-sm text-gray-600">
                              Regular Menstrual Cycle:{" "}
                              {medicalHistory.data.data.data.womenHealth
                                ?.menstrualCycleRegular
                                ? "Yes"
                                : "No"}
                            </p>
                          )}
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Modal */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
            showNotes ? "block" : "hidden"
          }`}
        >
          {selectedPatient && (
            <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Medical Record - {selectedPatient.firstName}{" "}
                  {selectedPatient.lastName}
                </h3>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Symptoms */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-3">Symptoms</h4>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                      placeholder="Add symptom..."
                      className="flex-1 p-2 border rounded-md"
                    />
                    <button
                      onClick={() => {
                        if (newSymptom.trim()) {
                          setMedicalRecord((prev) => ({
                            ...prev,
                            symptoms: [...prev.symptoms, newSymptom.trim()],
                          }));
                          setNewSymptom("");
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {medicalRecord.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {medicalRecord.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-2"
                        >
                          {symptom}
                          <button
                            onClick={() => {
                              setMedicalRecord((prev) => ({
                                ...prev,
                                symptoms: prev.symptoms.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescriptions */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-3">Prescriptions</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
  <input
  type="text"
  value={newPrescription.name}
  onChange={(e) => {
    console.log("Input value:", e.target.value); // Add this log
    const updated = {...newPrescription, name: e.target.value};
    console.log("Updated prescription:", updated); // Add this log
    setNewPrescription(updated);
  }}
  placeholder="Medication name"
  className="p-2 border rounded-md"
/>
                    <input
                      type="text"
                      value={newPrescription.dosage}
                      onChange={(e) => {
                        setNewPrescription((prev) => ({
                          ...prev,
                          dosage: e.target.value,
                        }));
                      }}
                      placeholder="Dosage"
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="text"
                      value={newPrescription.instruction}
                      onChange={(e) => {
                        setNewPrescription((prev) => ({
                          ...prev,
                          instruction: e.target.value,
                        }));
                      }}
                      placeholder="Instructions"
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="text"
                      value={newPrescription.duration}
                      onChange={(e) => {
                        setNewPrescription((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }));
                      }}
                      placeholder="Duration"
                      className="p-2 border rounded-md"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (newPrescription.name && newPrescription.dosage) {
                        setMedicalRecord((prev) => ({
                          ...prev,
                          prescriptions: [
                            ...prev.prescriptions,
                            { ...newPrescription },
                          ],
                        }));
                        setNewPrescription({
                          name: "",
                          instruction: "",
                          dosage: "",
                          duration: "",
                        });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Prescription
                  </button>
                  {medicalRecord.prescriptions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {medicalRecord.prescriptions.map(
                        (prescription, index) => (
                          <div
                            key={index}
                            className="bg-white p-3 rounded-md flex justify-between items-start"
                          >
                            <div>
                              <p className="font-medium">{prescription.name}</p>
                              <p className="text-sm text-gray-600">
                                {prescription.dosage} -{" "}
                                {prescription.instruction}
                              </p>
                              <p className="text-sm text-gray-500">
                                Duration: {prescription.duration}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setMedicalRecord((prev) => ({
                                  ...prev,
                                  prescriptions: prev.prescriptions.filter(
                                    (_, i) => i !== index
                                  ),
                                }));
                              }}
                              className="text-gray-500 hover:text-red-500"
                            >
                              ×
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Tests Ordered */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-3">Tests Ordered</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <input
                      type="text"
                      value={newTest.testName}
                      onChange={(e) => {
                        setNewTest((prev) => ({
                          ...prev,
                          testName: e.target.value,
                        }));
                      }}
                      placeholder="Test name"
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="date"
                      value={newTest.orderedDate}
                      onChange={(e) => {
                        setNewTest((prev) => ({
                          ...prev,
                          orderedDate: e.target.value,
                        }));
                      }}
                      className="p-2 border rounded-md"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (newTest.testName) {
                        setMedicalRecord((prev) => ({
                          ...prev,
                          testsOrdered: [...prev.testsOrdered, { ...newTest }],
                        }));
                        setNewTest({
                          testName: "",
                          orderedDate: new Date().toISOString().split("T")[0],
                        });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Test
                  </button>
                  {medicalRecord.testsOrdered.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {medicalRecord.testsOrdered.map((test, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-md flex justify-between items-start"
                        >
                          <div>
                            <p className="font-medium">{test.testName}</p>
                            <p className="text-sm text-gray-600">
                              Ordered:{" "}
                              {format(
                                new Date(test.orderedDate),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setMedicalRecord((prev) => ({
                                ...prev,
                                testsOrdered: prev.testsOrdered.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lifestyle Changes */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-3">
                    Lifestyle Changes
                  </h4>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newLifestyleChange}
                      onChange={(e) => {
                        setNewLifestyleChange(e.target.value);
                      }}
                      placeholder="Add lifestyle change..."
                      className="flex-1 p-2 border rounded-md"
                    />
                    <button
                      onClick={() => {
                        if (newLifestyleChange.trim()) {
                          setMedicalRecord((prev) => ({
                            ...prev,
                            lifeStyleChanges: [
                              ...prev.lifeStyleChanges,
                              newLifestyleChange.trim(),
                            ],
                          }));
                          setNewLifestyleChange("");
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {medicalRecord.lifeStyleChanges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {medicalRecord.lifeStyleChanges.map((change, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-2"
                        >
                          {change}
                          <button
                            onClick={() => {
                              setMedicalRecord((prev) => ({
                                ...prev,
                                lifeStyleChanges: prev.lifeStyleChanges.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }}
                            className="text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Follow-up */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-3">Follow-up</h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={medicalRecord.followUpRequired}
                        onChange={(e) =>
                          setMedicalRecord((prev) => ({
                            ...prev,
                            followUpRequired: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span>Follow-up required</span>
                    </label>
                    {medicalRecord.followUpRequired && (
                      <input
                        type="date"
                        value={medicalRecord.followUpDate}
                        onChange={(e) =>
                          setMedicalRecord((prev) => ({
                            ...prev,
                            followUpDate: e.target.value,
                          }))
                        }
                        className="p-2 border rounded-md"
                      />
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-3">Additional Notes</h4>
                  <textarea
                    value={medicalRecord.additionalNotes}
                    onChange={(e) =>
                      setMedicalRecord((prev) => ({
                        ...prev,
                        additionalNotes: e.target.value,
                      }))
                    }
                    placeholder="Enter additional notes..."
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setMedicalRecord({
                        additionalNotes: "",
                        prescriptions: [],
                        testsOrdered: [],
                        followUpRequired: false,
                        followUpDate: "", // Fixed typo: follUpDate -> followUpDate
                        lifeStyleChanges: [],
                        symptoms: [],
                      });
                      setShowNotes(false);
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (
                        !medicalRecord.additionalNotes.trim() &&
                        medicalRecord.prescriptions.length === 0 &&
                        medicalRecord.testsOrdered.length === 0 &&
                        medicalRecord.symptoms.length === 0
                      ) {
                        toast.error("Please add at least one record item");
                        return;
                      }
                      addNoteMutation.mutate({
                        patientId: selectedPatient._id,
                        record: medicalRecord,
                      });
                    }}
                    disabled={addNoteMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addNoteMutation.isLoading
                      ? "Saving..."
                      : "Save Medical Record"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export const Patients = () => {
  return (
    <DoctorLayout>
      <PatientsContent />
    </DoctorLayout>
  );
};

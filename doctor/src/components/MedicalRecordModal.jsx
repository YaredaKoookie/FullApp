import { useState } from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import { format } from "date-fns";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { medicalRecordAPI } from "../lib/api";

const MedicalRecordModal = ({ patient, onClose, currentDoctor, existingRecords, mode = "add", readOnly = false }) => {
  // Initialize mode state based on prop
  const [currentMode, setCurrentMode] = useState(mode);
  const queryClient = useQueryClient();
  const [medicalRecord, setMedicalRecord] = useState({
    clinicalNotes: [{ note: "", date: new Date() }],
    diagnoses: [],
    prescriptions: [],
    labResults: [],
    imagingReports: [],
    procedures: [],
    hospitalizations: [],
    vitalSigns: [{
      date: new Date(),
      bloodPressure: "",
      heartRate: "",
      respiratoryRate: "",
      temperature: "",
      oxygenSaturation: ""
    }],
    immunizations: []
  });

  const [newDiagnosis, setNewDiagnosis] = useState({
    name: "",
    status: "Active",
    diagnosisDate: new Date().toISOString().split("T")[0],
    code: "",
    notes: ""
  });

  const [newPrescription, setNewPrescription] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    route: "",
    duration: "",
    startDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  const [newLabResult, setNewLabResult] = useState({
    testName: "",
    result: "",
    units: "",
    referenceRange: "",
    date: new Date().toISOString().split("T")[0],
    comments: ""
  });

  const [newImagingReport, setNewImagingReport] = useState({
    type: "",
    findings: "",
    impression: "",
    date: new Date().toISOString().split("T")[0],
    reportUrl: ""
  });

  const [newProcedure, setNewProcedure] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    outcome: "",
    hospital: "",
    surgeon: "",
    notes: ""
  });

  const [newHospitalization, setNewHospitalization] = useState({
    reason: "",
    admissionDate: new Date().toISOString().split("T")[0],
    dischargeDate: "",
    hospitalName: "",
    dischargeSummary: ""
  });

  const [newImmunization, setNewImmunization] = useState({
    vaccine: "",
    date: new Date().toISOString().split("T")[0],
    lotNumber: "",
    site: "",
    manufacturer: "",
    notes: ""
  });

  // Add medical record mutation
  const addMedicalRecordMutation = useMutation({
    mutationFn: async (record) => {
      const doctorId = currentDoctor?.data?.data?.doctor?._id;
      if (!doctorId) {
        throw new Error("Doctor information not available");
      }

      // Validate required fields
      if (!record.clinicalNotes[0].note.trim() && 
          record.diagnoses.length === 0 && 
          record.prescriptions.length === 0) {
        throw new Error("Please add at least clinical notes or a diagnosis/prescription");
      }

      const medicalRecordData = {
        addedBy: doctorId,
        source: "Doctor",
        clinicalNotes: record.clinicalNotes.filter(note => note.note.trim() !== ""),
        diagnoses: record.diagnoses,
        prescriptions: record.prescriptions,
        labResults: record.labResults,
        imagingReports: record.imagingReports,
        procedures: record.procedures,
        hospitalizations: record.hospitalizations,
        vitalSigns: record.vitalSigns.filter(vs => 
          vs.bloodPressure || vs.heartRate || vs.respiratoryRate || 
          vs.temperature || vs.oxygenSaturation
        ),
        immunizations: record.immunizations
      };

      return medicalRecordAPI.create(patient._id, medicalRecordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["patientMedicalRecords", patient._id]);
      toast.success("Medical record added successfully");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add medical record");
    },
  });

  // Function to format date
  const formatDate = (date) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {mode === "add" ? "Add Medical Record" : "View Medical Records"} - {patient.firstName} {patient.lastName}
          </h3>
          <div className="flex items-center gap-4">
            {!readOnly && mode === "view" && (
              <button
                onClick={() => setCurrentMode(currentMode === "view" ? "add" : "view")}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <FaPlus className="h-4 w-4" />
                {currentMode === "view" ? "Add New Record" : "View Records"}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mode === "view" ? (
          <div className="space-y-6">
            {existingRecords?.length > 0 ? (
              existingRecords.map((record, index) => (
                <div key={record._id || index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">
                        Added on {formatDate(record.createdAt)}
                      </span>
                      {record.addedBy && (
                        <span className="text-sm text-gray-500 ml-2">
                          by Dr. {record.addedBy.fullName} ({record.addedBy.specialty})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  {record.clinicalNotes?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2">Clinical Notes</h4>
                      {record.clinicalNotes.map((note, i) => (
                        <div key={i} className="bg-white p-3 rounded border mb-2">
                          <p className="text-gray-600">{note.note}</p>
                          <span className="text-sm text-gray-500">
                            {formatDate(note.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Diagnoses */}
                  {record.diagnoses?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2">Diagnoses</h4>
                      <div className="grid gap-3">
                        {record.diagnoses.map((diagnosis, i) => (
                          <div key={i} className="bg-white p-3 rounded border">
                            <div className="flex justify-between">
                              <h5 className="font-medium">{diagnosis.name}</h5>
                              <span className={`px-2 py-1 rounded text-sm ${
                                diagnosis.status === "Active" ? "bg-yellow-100 text-yellow-800" :
                                diagnosis.status === "Resolved" ? "bg-green-100 text-green-800" :
                                diagnosis.status === "In Remission" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {diagnosis.status}
                              </span>
                            </div>
                            {diagnosis.diagnosisDate && (
                              <p className="text-sm text-gray-500 mt-1">
                                Diagnosed on: {formatDate(diagnosis.diagnosisDate)}
                              </p>
                            )}
                            {diagnosis.notes && (
                              <p className="text-sm text-gray-600 mt-2">{diagnosis.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {record.prescriptions?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2">Prescriptions</h4>
                      <div className="grid gap-3">
                        {record.prescriptions.map((prescription, i) => (
                          <div key={i} className="bg-white p-3 rounded border">
                            <h5 className="font-medium">{prescription.medication}</h5>
                            <p className="text-sm text-gray-600">
                              {prescription.dosage} - {prescription.frequency}
                              {prescription.route && ` (${prescription.route})`}
                            </p>
                            {prescription.duration && (
                              <p className="text-sm text-gray-500">
                                Duration: {prescription.duration}
                              </p>
                            )}
                            {prescription.startDate && (
                              <p className="text-sm text-gray-500">
                                Started: {formatDate(prescription.startDate)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vital Signs */}
                  {record.vitalSigns?.some(vs => 
                    vs.bloodPressure || vs.heartRate || vs.respiratoryRate || 
                    vs.temperature || vs.oxygenSaturation
                  ) && (
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2">Vital Signs</h4>
                      {record.vitalSigns.map((vs, i) => (
                        <div key={i} className="bg-white p-3 rounded border mb-2">
                          <div className="grid grid-cols-2 gap-4">
                            {vs.bloodPressure && (
                              <p className="text-sm">
                                <span className="font-medium">Blood Pressure:</span> {vs.bloodPressure}
                              </p>
                            )}
                            {vs.heartRate && (
                              <p className="text-sm">
                                <span className="font-medium">Heart Rate:</span> {vs.heartRate} bpm
                              </p>
                            )}
                            {vs.respiratoryRate && (
                              <p className="text-sm">
                                <span className="font-medium">Respiratory Rate:</span> {vs.respiratoryRate} /min
                              </p>
                            )}
                            {vs.temperature && (
                              <p className="text-sm">
                                <span className="font-medium">Temperature:</span> {vs.temperature}°C
                              </p>
                            )}
                            {vs.oxygenSaturation && (
                              <p className="text-sm">
                                <span className="font-medium">O2 Saturation:</span> {vs.oxygenSaturation}%
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Recorded: {formatDate(vs.date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No medical records found
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clinical Notes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-3">Clinical Notes</h4>
              <textarea
                value={medicalRecord.clinicalNotes[0].note}
                onChange={(e) => setMedicalRecord(prev => ({
                  ...prev,
                  clinicalNotes: [{ ...prev.clinicalNotes[0], note: e.target.value }]
                }))}
                placeholder="Enter clinical notes..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                disabled={readOnly}
              />
            </div>

            {/* Diagnoses */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-3">Diagnoses</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  value={newDiagnosis.name}
                  onChange={(e) => setNewDiagnosis(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="Diagnosis name"
                  className="p-2 border rounded-md"
                />
                <select
                  value={newDiagnosis.status}
                  onChange={(e) => setNewDiagnosis(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                  className="p-2 border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Resolved">Resolved</option>
                  <option value="In Remission">In Remission</option>
                  <option value="Chronic">Chronic</option>
                </select>
                <input
                  type="date"
                  value={newDiagnosis.diagnosisDate}
                  onChange={(e) => setNewDiagnosis(prev => ({
                    ...prev,
                    diagnosisDate: e.target.value
                  }))}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newDiagnosis.code}
                  onChange={(e) => setNewDiagnosis(prev => ({
                    ...prev,
                    code: e.target.value
                  }))}
                  placeholder="ICD/SNOMED code"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newDiagnosis.notes}
                  onChange={(e) => setNewDiagnosis(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Notes"
                  className="p-2 border rounded-md md:col-span-2"
                />
              </div>
              <button
                onClick={() => {
                  if (newDiagnosis.name) {
                    setMedicalRecord(prev => ({
                      ...prev,
                      diagnoses: [...prev.diagnoses, {
                        ...newDiagnosis,
                        diagnosisDate: new Date(newDiagnosis.diagnosisDate)
                      }]
                    }));
                    setNewDiagnosis({
                      name: "",
                      status: "Active",
                      diagnosisDate: new Date().toISOString().split("T")[0],
                      code: "",
                      notes: ""
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Diagnosis
              </button>
              {medicalRecord.diagnoses.length > 0 && (
                <div className="mt-3 space-y-2">
                  {medicalRecord.diagnoses.map((diagnosis, index) => (
                    <div key={index} className="bg-white p-3 rounded-md flex justify-between items-start">
                      <div>
                        <p className="font-medium">{diagnosis.name}</p>
                        <div className="flex gap-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full ${
                            diagnosis.status === "Active" ? "bg-blue-100 text-blue-800" :
                            diagnosis.status === "Resolved" ? "bg-green-100 text-green-800" :
                            diagnosis.status === "In Remission" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {diagnosis.status}
                          </span>
                          {diagnosis.diagnosisDate && (
                            <span>
                              Diagnosed: {format(new Date(diagnosis.diagnosisDate), "MMM d, yyyy")}
                            </span>
                          )}
                          {diagnosis.code && <span>Code: {diagnosis.code}</span>}
                        </div>
                        {diagnosis.notes && (
                          <p className="text-sm text-gray-500 mt-1">{diagnosis.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setMedicalRecord(prev => ({
                            ...prev,
                            diagnoses: prev.diagnoses.filter((_, i) => i !== index)
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

            {/* Prescriptions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-3">Prescriptions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  value={newPrescription.medication}
                  onChange={(e) => setNewPrescription(prev => ({
                    ...prev,
                    medication: e.target.value
                  }))}
                  placeholder="Medication name"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newPrescription.dosage}
                  onChange={(e) => setNewPrescription(prev => ({
                    ...prev,
                    dosage: e.target.value
                  }))}
                  placeholder="Dosage"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newPrescription.frequency}
                  onChange={(e) => setNewPrescription(prev => ({
                    ...prev,
                    frequency: e.target.value
                  }))}
                  placeholder="Frequency"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newPrescription.route}
                  onChange={(e) => setNewPrescription(prev => ({
                    ...prev,
                    route: e.target.value
                  }))}
                  placeholder="Route (oral, IV, etc.)"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newPrescription.duration}
                  onChange={(e) => setNewPrescription(prev => ({
                    ...prev,
                    duration: e.target.value
                  }))}
                  placeholder="Duration"
                  className="p-2 border rounded-md"
                />
                <input
                  type="date"
                  value={newPrescription.startDate}
                  onChange={(e) => setNewPrescription(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Notes"
                  className="p-2 border rounded-md md:col-span-2"
                />
              </div>
              <button
                onClick={() => {
                  if (newPrescription.medication && newPrescription.dosage) {
                    setMedicalRecord(prev => ({
                      ...prev,
                      prescriptions: [...prev.prescriptions, {
                        ...newPrescription,
                        startDate: new Date(newPrescription.startDate)
                      }]
                    }));
                    setNewPrescription({
                      medication: "",
                      dosage: "",
                      frequency: "",
                      route: "",
                      duration: "",
                      startDate: new Date().toISOString().split("T")[0],
                      notes: ""
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Prescription
              </button>
              {medicalRecord.prescriptions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {medicalRecord.prescriptions.map((prescription, index) => (
                    <div key={index} className="bg-white p-3 rounded-md flex justify-between items-start">
                      <div>
                        <p className="font-medium">{prescription.medication}</p>
                        <div className="text-sm text-gray-600">
                          <span>{prescription.dosage}</span>
                          {prescription.frequency && <span> - {prescription.frequency}</span>}
                          {prescription.route && <span> ({prescription.route})</span>}
                          {prescription.duration && <span> for {prescription.duration}</span>}
                        </div>
                        {prescription.startDate && (
                          <p className="text-sm text-gray-500">
                            Start: {format(new Date(prescription.startDate), "MMM d, yyyy")}
                          </p>
                        )}
                        {prescription.notes && (
                          <p className="text-sm text-gray-500 mt-1">{prescription.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setMedicalRecord(prev => ({
                            ...prev,
                            prescriptions: prev.prescriptions.filter((_, i) => i !== index)
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

            {/* Lab Results */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-3">Lab Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  value={newLabResult.testName}
                  onChange={(e) => setNewLabResult(prev => ({
                    ...prev,
                    testName: e.target.value
                  }))}
                  placeholder="Test name"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newLabResult.result}
                  onChange={(e) => setNewLabResult(prev => ({
                    ...prev,
                    result: e.target.value
                  }))}
                  placeholder="Result"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newLabResult.units}
                  onChange={(e) => setNewLabResult(prev => ({
                    ...prev,
                    units: e.target.value
                  }))}
                  placeholder="Units"
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newLabResult.referenceRange}
                  onChange={(e) => setNewLabResult(prev => ({
                    ...prev,
                    referenceRange: e.target.value
                  }))}
                  placeholder="Reference range"
                  className="p-2 border rounded-md"
                />
                <input
                  type="date"
                  value={newLabResult.date}
                  onChange={(e) => setNewLabResult(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  value={newLabResult.comments}
                  onChange={(e) => setNewLabResult(prev => ({
                    ...prev,
                    comments: e.target.value
                  }))}
                  placeholder="Comments"
                  className="p-2 border rounded-md md:col-span-2"
                />
              </div>
              <button
                onClick={() => {
                  if (newLabResult.testName && newLabResult.result) {
                    setMedicalRecord(prev => ({
                      ...prev,
                      labResults: [...prev.labResults, {
                        ...newLabResult,
                        date: new Date(newLabResult.date)
                      }]
                    }));
                    setNewLabResult({
                      testName: "",
                      result: "",
                      units: "",
                      referenceRange: "",
                      date: new Date().toISOString().split("T")[0],
                      comments: ""
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Lab Result
              </button>
              {medicalRecord.labResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {medicalRecord.labResults.map((labResult, index) => (
                    <div key={index} className="bg-white p-3 rounded-md flex justify-between items-start">
                      <div>
                        <p className="font-medium">{labResult.testName}</p>
                        <div className="text-sm text-gray-600">
                          <span>Result: {labResult.result}</span>
                          {labResult.units && <span> {labResult.units}</span>}
                          {labResult.referenceRange && <span> (Ref: {labResult.referenceRange})</span>}
                        </div>
                        {labResult.date && (
                          <p className="text-sm text-gray-500">
                            Date: {format(new Date(labResult.date), "MMM d, yyyy")}
                          </p>
                        )}
                        {labResult.comments && (
                          <p className="text-sm text-gray-500 mt-1">{labResult.comments}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setMedicalRecord(prev => ({
                            ...prev,
                            labResults: prev.labResults.filter((_, i) => i !== index)
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

            {/* Vital Signs */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-3">Vital Signs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  value={medicalRecord.vitalSigns[0].bloodPressure}
                  onChange={(e) => setMedicalRecord(prev => ({
                    ...prev,
                    vitalSigns: [{
                      ...prev.vitalSigns[0],
                      bloodPressure: e.target.value
                    }]
                  }))}
                  placeholder="Blood Pressure (e.g., 120/80)"
                  className="p-2 border rounded-md"
                />
                <input
                  type="number"
                  value={medicalRecord.vitalSigns[0].heartRate}
                  onChange={(e) => setMedicalRecord(prev => ({
                    ...prev,
                    vitalSigns: [{
                      ...prev.vitalSigns[0],
                      heartRate: e.target.value
                    }]
                  }))}
                  placeholder="Heart Rate (bpm)"
                  className="p-2 border rounded-md"
                />
                <input
                  type="number"
                  value={medicalRecord.vitalSigns[0].respiratoryRate}
                  onChange={(e) => setMedicalRecord(prev => ({
                    ...prev,
                    vitalSigns: [{
                      ...prev.vitalSigns[0],
                      respiratoryRate: e.target.value
                    }]
                  }))}
                  placeholder="Respiratory Rate"
                  className="p-2 border rounded-md"
                />
                <input
                  type="number"
                  value={medicalRecord.vitalSigns[0].temperature}
                  onChange={(e) => setMedicalRecord(prev => ({
                    ...prev,
                    vitalSigns: [{
                      ...prev.vitalSigns[0],
                      temperature: e.target.value
                    }]
                  }))}
                  placeholder="Temperature (°C)"
                  className="p-2 border rounded-md"
                />
                <input
                  type="number"
                  value={medicalRecord.vitalSigns[0].oxygenSaturation}
                  onChange={(e) => setMedicalRecord(prev => ({
                    ...prev,
                    vitalSigns: [{
                      ...prev.vitalSigns[0],
                      oxygenSaturation: e.target.value
                    }]
                  }))}
                  placeholder="Oxygen Saturation (%)"
                  className="p-2 border rounded-md"
                />
                <input
                  type="date"
                  value={format(new Date(medicalRecord.vitalSigns[0].date), "yyyy-MM-dd")}
                  onChange={(e) => setMedicalRecord(prev => ({
                    ...prev,
                    vitalSigns: [{
                      ...prev.vitalSigns[0],
                      date: new Date(e.target.value)
                    }]
                  }))}
                  className="p-2 border rounded-md"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addMedicalRecordMutation.mutate(medicalRecord);
                }}
                disabled={addMedicalRecordMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {addMedicalRecordMutation.isLoading ? "Saving..." : "Save Medical Record"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordModal;
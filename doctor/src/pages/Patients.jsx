import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../lib/api';
import { format } from 'date-fns';
import { FaSearch, FaVideo, FaHistory, FaStickyNote, FaTimes } from 'react-icons/fa';
import { DoctorLayout } from '../layouts/DoctorLayout';

const PatientsContent = () => {
  console.log('Patients component rendering');
  
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [medicalRecord, setMedicalRecord] = useState({
    additionalNotes: '',
    prescriptions: [],
    testsOrdered: [],
    followUpRequired: false,
    follUpDate: '',
    lifeStyleChanges: [],
    symptoms: []
  });
  const [newPrescription, setNewPrescription] = useState({
    name: '',
    instruction: '',
    dosage: '',
    duration: ''
  });
  const [newTest, setNewTest] = useState({
    testName: '',
    orderedDate: new Date().toISOString().split('T')[0]
  });
  const [newLifestyleChange, setNewLifestyleChange] = useState('');
  const [newSymptom, setNewSymptom] = useState('');

  // Get current doctor's ID
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      console.log('Fetching current user...');
      const response = await adminAPI.auth.getCurrentUser();
      console.log('Current user response:', response);
      return response;
    },
    onError: (error) => {
      console.error('Error fetching current user:', error);
      toast.error('Failed to fetch user information');
    }
  });

  // Get current doctor's ID
  const { data: currentDoctor } = useQuery({
    queryKey: ['currentDoctor'],
    queryFn: async () => {
      if (!currentUser?.data?.data?.user?._id) {
        throw new Error('User information not available');
      }
      console.log('Fetching current doctor...');
      const response = await adminAPI.doctor.getCurrentDoctor();
      console.log('Current doctor response:', JSON.stringify(response, null, 2));
      return response;
    },
    enabled: !!currentUser?.data?.data?.user?._id,
    onError: (error) => {
      console.error('Error fetching current doctor:', error);
      toast.error('Failed to fetch doctor information');
    }
  });

  // Fetch patients
  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['patients', filters],
    queryFn: async () => {
      console.log('Fetching patients with filters:', filters);
      try {
        const response = await adminAPI.patients.getAll(filters);
        console.log('Raw API Response:', JSON.stringify(response, null, 2));
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        return response;
      } catch (error) {
        console.error('Patients API Error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Patients Query Success:', data);
      console.log('Patients Data Structure:', {
        hasData: !!data?.data,
        hasPatients: !!data?.data?.patients,
        patientsLength: data?.data?.patients?.length,
        patients: data?.data?.patients
      });
    },
    onError: (error) => {
      console.error('Patients Query Error:', error);
    }
  });

  // Fetch patient medical history
  const { data: medicalHistory } = useQuery({
    queryKey: ['medicalHistory', selectedPatient?._id],
    queryFn: () => adminAPI.patients.getMedicalHistory(selectedPatient._id),
    enabled: !!selectedPatient?._id && showHistory,
    onSuccess: (data) => {
      console.log('Medical history query success:', data);
    },
    onError: (error) => {
      console.error('Error fetching medical history:', error);
      toast.error('Failed to fetch medical history');
    }
  });

  // Add medical record mutation
  const addNoteMutation = useMutation({
    mutationFn: ({ patientId, record }) => {
      console.log('Current doctor data:', JSON.stringify(currentDoctor, null, 2));
      
      // Extract doctor ID from the response
      const doctorId = currentDoctor?.data?.data?.doctor?._id;
      console.log('Doctor ID:', doctorId);
      
      if (!doctorId) {
        console.error('Doctor data structure:', {
          hasData: !!currentDoctor?.data,
          hasDataData: !!currentDoctor?.data?.data,
          hasDoctor: !!currentDoctor?.data?.data?.doctor,
          doctorId,
          fullData: currentDoctor
        });
        throw new Error('Doctor information not available');
      }

      // Format the data to match the server's expected structure
      const medicalRecordData = {
        additionalNotes: record.additionalNotes || '',
        prescriptions: record.prescriptions.map(prescription => ({
          name: prescription.name,
          instruction: prescription.instruction || '',
          dosage: prescription.dosage,
          duration: prescription.duration
        })),
        testsOrdered: record.testsOrdered.map(test => ({
          testName: test.testName,
          orderedDate: test.orderedDate
        })),
        followUpRequired: record.followUpRequired || false,
        follUpDate: record.follUpDate || null,
        lifeStyleChanges: record.lifeStyleChanges || [],
        symptoms: record.symptoms || []
      };
      
      console.log('Sending medical record data:', medicalRecordData);
      return adminAPI.patients.addNote(patientId, medicalRecordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patientNotes']);
      toast.success('Medical record added successfully');
      setMedicalRecord({
        additionalNotes: '',
        prescriptions: [],
        testsOrdered: [],
        followUpRequired: false,
        follUpDate: '',
        lifeStyleChanges: [],
        symptoms: []
      });
      setShowNotes(false);
    },
    onError: (error) => {
      console.error('Medical record error:', error);
      toast.error(error.response?.data?.message || 'Failed to add medical record');
    }
  });

  // Video call mutation
  const videoCallMutation = useMutation({
    mutationFn: (patientId) => adminAPI.patients.initiateVideoCall(patientId),
    onSuccess: (data) => {
      // Handle video call initiation
      const { roomId } = data.data.data;
      // You would typically redirect to your video call page here
      window.open(`/video-call/${roomId}`, '_blank');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to initiate video call');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
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
                            src={patient.profileImage || 'https://via.placeholder.com/40'}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{patient.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {patient.lastAppointmentDate
                          ? format(new Date(patient.lastAppointmentDate), 'MMM d, yyyy')
                          : 'No appointments'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.totalAppointments}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => videoCallMutation.mutate(patient._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Start Video Call"
                        >
                          <FaVideo />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowHistory(true);
                          }}
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
            disabled={filters.page === patientsData.data.data.pagination.pages}
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
                Medical History - {selectedPatient.firstName} {selectedPatient.lastName}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {console.log('Rendering medical history:', medicalHistory)}
            {medicalHistory?.data?.data ? (
              <div className="space-y-6">
                {/* Vital Health Data */}
                <section className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium mb-3">Vital Health Data</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Blood Type</p>
                      <p className="font-medium">{medicalHistory.data.data.bloodType || 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Height</p>
                      <p className="font-medium">{medicalHistory.data.data.height ? `${medicalHistory.data.data.height} cm` : 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Weight</p>
                      <p className="font-medium">{medicalHistory.data.data.weight ? `${medicalHistory.data.data.weight} kg` : 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">BMI</p>
                      <p className="font-medium">{medicalHistory.data.data.bmi || 'Not calculated'}</p>
                    </div>
                  </div>
                </section>

                {/* Current Conditions */}
                <section className="bg-white p-4 rounded-lg border">
                  <h4 className="text-lg font-medium mb-3">Current Conditions</h4>
                  {medicalHistory.data.data.activeConditions?.length > 0 ? (
                    <div className="space-y-2">
                      {medicalHistory.data.data.activeConditions.map((condition, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{condition.name}</p>
                            <p className="text-sm text-gray-600">
                              Diagnosed: {format(new Date(condition.diagnosisDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                            {condition.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No current conditions recorded</p>
                  )}
                </section>

                {/* Allergies */}
                <section className="bg-white p-4 rounded-lg border">
                  <h4 className="text-lg font-medium mb-3">Allergies</h4>
                  {medicalHistory.data.data.allergies?.length > 0 ? (
                    <div className="space-y-2">
                      {medicalHistory.data.data.allergies.map((allergy, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{allergy.substance}</p>
                            <p className="text-sm text-gray-600">{allergy.reaction}</p>
                          </div>
                          <span className={`px-2 py-1 text-sm rounded-full ${
                            allergy.severity === 'Life-threatening' ? 'bg-red-100 text-red-800' :
                            allergy.severity === 'Severe' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {allergy.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No allergies recorded</p>
                  )}
                </section>

                {/* Current Medications */}
                <section className="bg-white p-4 rounded-lg border">
                  <h4 className="text-lg font-medium mb-3">Current Medications</h4>
                  {medicalHistory.data.data.currentMedications?.length > 0 ? (
                    <div className="space-y-2">
                      {medicalHistory.data.data.currentMedications.map((med, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-gray-600">
                            {med.dosage} - {med.frequency}
                          </p>
                          {med.purpose && (
                            <p className="text-sm text-gray-600">Purpose: {med.purpose}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No current medications recorded</p>
                  )}
                </section>

                {/* Family History */}
                <section className="bg-white p-4 rounded-lg border">
                  <h4 className="text-lg font-medium mb-3">Family History</h4>
                  {medicalHistory.data.data.familyHistory?.length > 0 ? (
                    <div className="space-y-2">
                      {medicalHistory.data.data.familyHistory.map((history, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{history.condition}</p>
                          <p className="text-sm text-gray-600">
                            {history.relation} - Diagnosed at age {history.ageAtDiagnosis}
                            {history.deceased && ' (Deceased)'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No family history recorded</p>
                  )}
                </section>

                {/* Lifestyle */}
                <section className="bg-white p-4 rounded-lg border">
                  <h4 className="text-lg font-medium mb-3">Lifestyle</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Smoking</p>
                      <p className="font-medium">
                        {medicalHistory.data.data.lifestyle?.smoking?.status ? 'Yes' : 'No'}
                        {medicalHistory.data.data.lifestyle?.smoking?.frequency && 
                          ` (${medicalHistory.data.data.lifestyle.smoking.frequency})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alcohol Use</p>
                      <p className="font-medium">
                        {medicalHistory.data.data.lifestyle?.alcohol?.status ? 'Yes' : 'No'}
                        {medicalHistory.data.data.lifestyle?.alcohol?.frequency && 
                          ` (${medicalHistory.data.data.lifestyle.alcohol.frequency})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Exercise</p>
                      <p className="font-medium">
                        {medicalHistory.data.data.lifestyle?.exerciseFrequency || 'Not recorded'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Occupation</p>
                      <p className="font-medium">
                        {medicalHistory.data.data.lifestyle?.occupation || 'Not recorded'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Immunizations */}
                <section className="bg-white p-4 rounded-lg border">
                  <h4 className="text-lg font-medium mb-3">Immunizations</h4>
                  {medicalHistory.data.data.immunizations?.length > 0 ? (
                    <div className="space-y-2">
                      {medicalHistory.data.data.immunizations.map((immunization, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{immunization.vaccine}</p>
                          <p className="text-sm text-gray-600">
                            Date: {format(new Date(immunization.date), 'MMM d, yyyy')}
                            {immunization.boosterDue && 
                              ` - Booster due: ${format(new Date(immunization.boosterDue), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No immunizations recorded</p>
                  )}
                </section>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading medical history...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotes && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                Medical Record - {selectedPatient.firstName} {selectedPatient.lastName}
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
                        setMedicalRecord(prev => ({
                          ...prev,
                          symptoms: [...prev.symptoms, newSymptom.trim()]
                        }));
                        setNewSymptom('');
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
                      <span key={index} className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-2">
                        {symptom}
                        <button
                          onClick={() => {
                            setMedicalRecord(prev => ({
                              ...prev,
                              symptoms: prev.symptoms.filter((_, i) => i !== index)
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
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Medication name"
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    value={newPrescription.dosage}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="Dosage"
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    value={newPrescription.instruction}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, instruction: e.target.value }))}
                    placeholder="Instructions"
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="text"
                    value={newPrescription.duration}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Duration"
                    className="p-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newPrescription.name && newPrescription.dosage) {
                      setMedicalRecord(prev => ({
                        ...prev,
                        prescriptions: [...prev.prescriptions, { ...newPrescription }]
                      }));
                      setNewPrescription({
                        name: '',
                        instruction: '',
                        dosage: '',
                        duration: ''
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
                          <p className="font-medium">{prescription.name}</p>
                          <p className="text-sm text-gray-600">
                            {prescription.dosage} - {prescription.instruction}
                          </p>
                          <p className="text-sm text-gray-500">Duration: {prescription.duration}</p>
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

              {/* Tests Ordered */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Tests Ordered</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <input
                    type="text"
                    value={newTest.testName}
                    onChange={(e) => setNewTest(prev => ({ ...prev, testName: e.target.value }))}
                    placeholder="Test name"
                    className="p-2 border rounded-md"
                  />
                  <input
                    type="date"
                    value={newTest.orderedDate}
                    onChange={(e) => setNewTest(prev => ({ ...prev, orderedDate: e.target.value }))}
                    className="p-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newTest.testName) {
                      setMedicalRecord(prev => ({
                        ...prev,
                        testsOrdered: [...prev.testsOrdered, { ...newTest }]
                      }));
                      setNewTest({
                        testName: '',
                        orderedDate: new Date().toISOString().split('T')[0]
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
                      <div key={index} className="bg-white p-3 rounded-md flex justify-between items-start">
                        <div>
                          <p className="font-medium">{test.testName}</p>
                          <p className="text-sm text-gray-600">
                            Ordered: {format(new Date(test.orderedDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setMedicalRecord(prev => ({
                              ...prev,
                              testsOrdered: prev.testsOrdered.filter((_, i) => i !== index)
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
                <h4 className="text-lg font-medium mb-3">Lifestyle Changes</h4>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newLifestyleChange}
                    onChange={(e) => setNewLifestyleChange(e.target.value)}
                    placeholder="Add lifestyle change..."
                    className="flex-1 p-2 border rounded-md"
                  />
                  <button
                    onClick={() => {
                      if (newLifestyleChange.trim()) {
                        setMedicalRecord(prev => ({
                          ...prev,
                          lifeStyleChanges: [...prev.lifeStyleChanges, newLifestyleChange.trim()]
                        }));
                        setNewLifestyleChange('');
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
                      <span key={index} className="px-3 py-1 bg-white rounded-full text-sm flex items-center gap-2">
                        {change}
                        <button
                          onClick={() => {
                            setMedicalRecord(prev => ({
                              ...prev,
                              lifeStyleChanges: prev.lifeStyleChanges.filter((_, i) => i !== index)
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
                      onChange={(e) => setMedicalRecord(prev => ({
                        ...prev,
                        followUpRequired: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span>Follow-up required</span>
                  </label>
                  {medicalRecord.followUpRequired && (
                    <input
                      type="date"
                      value={medicalRecord.follUpDate}
                      onChange={(e) => setMedicalRecord(prev => ({
                        ...prev,
                        follUpDate: e.target.value
                      }))}
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
                  onChange={(e) => setMedicalRecord(prev => ({
                    ...prev,
                    additionalNotes: e.target.value
                  }))}
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
                      additionalNotes: '',
                      prescriptions: [],
                      testsOrdered: [],
                      followUpRequired: false,
                      follUpDate: '',
                      lifeStyleChanges: [],
                      symptoms: []
                    });
                    setShowNotes(false);
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!medicalRecord.additionalNotes.trim() && 
                        medicalRecord.prescriptions.length === 0 && 
                        medicalRecord.testsOrdered.length === 0 && 
                        medicalRecord.symptoms.length === 0) {
                      toast.error('Please add at least one record item');
                      return;
                    }
                    addNoteMutation.mutate({
                      patientId: selectedPatient._id,
                      record: medicalRecord
                    });
                  }}
                  disabled={addNoteMutation.isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {addNoteMutation.isLoading ? 'Saving...' : 'Save Medical Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Patients = () => {
  return (
    <DoctorLayout>
      <PatientsContent />
    </DoctorLayout>
  );
}; 
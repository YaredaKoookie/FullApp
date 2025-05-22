import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Tab } from '@headlessui/react';
import { 
  Heart, 
  Pill, 
  AlertTriangle, 
  Activity, 
  Calendar, 
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ChevronRight,
  XCircle,
  FileText,
  Settings,
  Syringe,
  Stethoscope,
  Building2,
  Users,
  RefreshCw
} from 'lucide-react';
import apiClient from '@api/apiClient';
import MedicalHistorySkeleton from '@/components/skeletons/MedicalHistorySkeleton';
import { 
  AddConditionModal, 
  AddMedicationModal, 
  AddAllergyModal,
  EditConditionModal,
  EditMedicationModal,
  EditAllergyModal,
  DiscontinueMedicationModal,
  UpdateVitalsModal,
  AddImmunizationModal,
  EditImmunizationModal,
  AddSurgeryModal,
  EditSurgeryModal,
  AddHospitalizationModal,
  EditHospitalizationModal,
  AddFamilyHistoryModal,
  EditFamilyHistoryModal
} from '@/components/modals/medical-history';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12 px-4">
    <Icon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {action && (
      <div className="mt-6">
        {action}
      </div>
    )}
  </div>
);

const MedicalHistory = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [isUpdateVitalsOpen, setIsUpdateVitalsOpen] = useState(false);
  const [isAddImmunizationOpen, setIsAddImmunizationOpen] = useState(false);
  const [isAddSurgeryOpen, setIsAddSurgeryOpen] = useState(false);
  const [isAddHospitalizationOpen, setIsAddHospitalizationOpen] = useState(false);
  const [isAddFamilyHistoryOpen, setIsAddFamilyHistoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [discontinuingMedication, setDiscontinuingMedication] = useState(null);
  const queryClient = useQueryClient();
  
  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters ** 2)).toFixed(2);
  };

  const { data: medicalHistory, isLoading, error, refetch } = useQuery({
    queryKey: ['medicalHistory'],
    queryFn: async () => {
      const response = await apiClient.get('/medical-history');
      return response.data;
    },
  });

  // Calculate BMI if not provided in response
  const bmi = medicalHistory?.bmi || calculateBMI(medicalHistory?.weight, medicalHistory?.height);

  const { data: medicationTimeline } = useQuery({
    queryKey: ['medicationTimeline'],
    queryFn: async () => {
      const response = await apiClient.get('/medical-history/timeline/medications');
      return response.data;
    },
  });

  console.log("medical timeline", medicationTimeline)

  const { mutate: createMedicalHistory, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/medical-history');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      toast.success('Medical history created successfully');
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create medical history");
    }
  });

  const {mutate: discontinueMedication, isPending: isDiscontinuingMedication} = useMutation({
    mutationFn: async ({ medicationId, reasonStopped, endDate }) => {
      const response = await apiClient.post(`/medical-history/medications/${medicationId}/discontinue`, {
        reasonStopped,
        endDate
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      toast.success('Medication discontinued successfully');
      setDiscontinuingMedication(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to discontinue medication");
    }
  });

  const handleDiscontinueMedication = (medication) => {
    setDiscontinuingMedication(medication);
  };

  const handleConfirmDiscontinue = (data) => {
    discontinueMedication({
      medicationId: discontinuingMedication._id,
      ...data
    });
  };

  if (isLoading) return <MedicalHistorySkeleton />;

  // Show error message if there's an error fetching medical history
  if (error && error.status !== 404) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-24 w-24 text-red-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Unable to Load Medical History
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              {error.message || "We encountered an error while trying to load your medical history. Please try again later."}
            </p>
            <div className="mt-8">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="mr-3 h-5 w-5" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show create medical history UI if none exists
  if (error?.status === 404) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <FileText className="mx-auto h-24 w-24 text-blue-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              No Medical History Found
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Let's create your medical history profile to keep track of your health information.
            </p>
            <div className="mt-8">
              <button
                onClick={() => createMedicalHistory()}
                disabled={isCreating}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="-ml-1 mr-3 h-5 w-5" />
                    Create Medical History
                  </>
                )}
              </button>
            </div>
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">What's included in your medical history?</h3>
              <ul className="space-y-4 text-left">
                <li className="flex items-start">
                  <Heart className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
                  <span className="text-gray-600">Medical conditions and diagnoses</span>
                </li>
                <li className="flex items-start">
                  <Pill className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
                  <span className="text-gray-600">Current and past medications</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
                  <span className="text-gray-600">Allergies and adverse reactions</span>
                </li>
                <li className="flex items-start">
                  <Activity className="h-6 w-6 text-green-500 mr-3 mt-0.5" />
                  <span className="text-gray-600">Vital statistics and measurements</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("medicalHistory", medicalHistory);

  const tabs = [
    { name: 'Conditions', icon: Heart },
    { name: 'Medications', icon: Pill },
    { name: 'Allergies', icon: AlertTriangle },
    { name: 'Immunizations', icon: Syringe },
    { name: 'Surgeries', icon: Stethoscope },
    { name: 'Hospitalizations', icon: Building2 },
    { name: 'Family History', icon: Users },
    { name: 'Timeline', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Medical History
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Your complete health profile at a glance
          </p>
        </div>

        {/* Overview Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vital Stats Card */}
            <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-900">Vital Statistics</h3>
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <button
                    onClick={() => setIsUpdateVitalsOpen(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {medicalHistory.height || medicalHistory.weight || medicalHistory.bloodType ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Height</span>
                    <span className="font-medium text-blue-900">{medicalHistory.height || 'Not set'} cm</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Weight</span>
                    <span className="font-medium text-blue-900">{medicalHistory.weight || 'Not set'} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Blood Type</span>
                    <span className="font-medium text-blue-900">{medicalHistory.bloodType || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">BMI</span>
                    <span className="font-medium text-blue-900">{bmi || 'Not set'}</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No vital statistics"
                  description="Add your vital statistics"
                  action={
                    <button
                      onClick={() => setIsUpdateVitalsOpen(true)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Vitals
                    </button>
                  }
                />
              )}
            </div>

            {/* Active Conditions Card */}
            <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-red-900">Active Conditions</h3>
                <Heart className="h-4 w-4 text-red-500" />
              </div>
              {medicalHistory.activeConditions?.length > 0 ? (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  {medicalHistory.activeConditions.map((condition) => (
                    <div key={condition._id} className="flex items-center justify-between bg-red-50 p-1.5 rounded">
                      <span className="text-xs text-gray-700 truncate max-w-[120px]">{condition.name}</span>
                      <span className="text-xs font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Heart}
                  title="No active conditions"
                  description="Add your conditions"
                  action={
                    <button
                      onClick={() => setIsAddConditionOpen(true)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Add Condition
                    </button>
                  }
                />
              )}
            </div>

            {/* Critical Allergies Card */}
            <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 border border-yellow-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-yellow-900">Critical Allergies</h3>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </div>
              {medicalHistory.criticalAllergies?.length > 0 ? (
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                  {medicalHistory.criticalAllergies.map((allergy) => (
                    <div key={allergy._id} className="flex items-center justify-between bg-yellow-50 p-1.5 rounded">
                      <span className="text-xs text-gray-700 truncate max-w-[120px]">{allergy.substance}</span>
                      <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full">Critical</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={AlertTriangle}
                  title="No critical allergies"
                  description="Add your allergies"
                  action={
                    <button
                      onClick={() => setIsAddAllergyOpen(true)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Add Allergy
                    </button>
                  }
                />
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-green-900">Quick Actions</h3>
                <Plus className="h-4 w-4 text-green-500" />
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => setIsAddConditionOpen(true)}
                  className="w-full flex items-center justify-between p-1.5 bg-green-50 rounded hover:bg-green-100 transition-colors duration-200"
                >
                  <span className="text-xs text-gray-700">Add Condition</span>
                  <ChevronRight className="h-3 w-3 text-green-600" />
                </button>
                <button
                  onClick={() => setIsAddMedicationOpen(true)}
                  className="w-full flex items-center justify-between p-1.5 bg-green-50 rounded hover:bg-green-100 transition-colors duration-200"
                >
                  <span className="text-xs text-gray-700">Add Medication</span>
                  <ChevronRight className="h-3 w-3 text-green-600" />
                </button>
                <button
                  onClick={() => setIsAddAllergyOpen(true)}
                  className="w-full flex items-center justify-between p-1.5 bg-green-50 rounded hover:bg-green-100 transition-colors duration-200"
                >
                  <span className="text-xs text-gray-700">Add Allergy</span>
                  <ChevronRight className="h-3 w-3 text-green-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <div className="border-b border-gray-200">
              <div className="overflow-x-auto">
                <Tab.List className="flex space-x-1 bg-gradient-to-r from-blue-50 to-indigo-50 p-1 min-w-max">
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        `flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                        ${
                          selected
                            ? 'bg-white text-blue-600 shadow-md transform scale-105'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                        }`
                      }
                    >
                      <tab.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{tab.name}</span>
                    </Tab>
                  ))}
                </Tab.List>
              </div>
            </div>

            <Tab.Panels className="p-6">
              {/* Conditions Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Medical Conditions</h3>
                    <button
                      onClick={() => setIsAddConditionOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chronic Conditions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Chronic and Active Conditions</h4>
                      {medicalHistory.chronicConditions?.length > 0 ? (
                        <div className="space-y-4">
                          {medicalHistory.chronicConditions.map((condition) => (
                            <div key={condition._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                              <div>
                                <p className="font-medium text-gray-900">{condition.name}</p>
                                <p className="text-sm text-gray-500">
                                  Diagnosed: {format(new Date(condition.diagnosisDate), 'MMM d, yyyy')}
                                </p>
                                <div className="mt-1 flex items-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {condition.status}
                                  </span>
                                  {condition.isChronic && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      Chronic
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingItem({ type: 'condition', data: condition })}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Heart}
                          title="No chronic conditions"
                          description="Add your chronic conditions to track your long-term health"
                          action={
                            <button
                              onClick={() => setIsAddConditionOpen(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Add Chronic Condition
                            </button>
                          }
                        />
                      )}
                    </div>

                    {/* Past Conditions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Past Conditions</h4>
                      {medicalHistory.pastConditions?.length > 0 ? (
                        <div className="space-y-4">
                          {medicalHistory.pastConditions.map((condition) => (
                            <div key={condition._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                              <div className="">
                                <p className="font-medium text-gray-900">{condition.name}</p>
                                <p className="text-sm text-gray-500">
                                  Diagnosed: {format(new Date(condition.diagnosisDate), 'MMM d, yyyy')}
                                </p>
                                <div className="mt-1  gap-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    condition.status === 'Resolved' 
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {condition.status}
                                  </span>
                                  {condition.resolvedDate && (
                                    <span className="ml-2 text-sm text-gray-500">
                                      Resolved: {format(new Date(condition.resolvedDate), 'MMM d, yyyy')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingItem({ type: 'condition', data: condition })}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Heart}
                          title="No past conditions"
                          description="Add your resolved conditions to maintain a complete health history"
                          action={
                            <button
                              onClick={() => setIsAddConditionOpen(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Add Past Condition
                            </button>
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Medications Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Medications</h3>
                    <button
                      onClick={() => setIsAddMedicationOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Medications */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Current Medications</h4>
                      {medicalHistory.currentMedications?.length > 0 ? (
                        <div className="space-y-4">
                          {medicalHistory.currentMedications.map((medication) => (
                            <div key={medication._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                              <div>
                                <p className="font-medium text-gray-900 mb-1">{medication.name}</p>
                                <p className="text-sm text-gray-500">
                                  {medication.dosage} - {medication.frequency}
                                </p>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  Started at: {format(new Date(medication.startDate), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingItem({ type: 'medication', data: medication })}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDiscontinueMedication(medication)}
                                  disabled={isDiscontinuingMedication}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Pill}
                          title="No current medications"
                          description="Add your current medications to track your treatment"
                          action={
                            <button
                              onClick={() => setIsAddMedicationOpen(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Add Medication
                            </button>
                          }
                        />
                      )}
                    </div>

                    {/* Past Medications */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Past Medications</h4>
                      {medicalHistory.pastMedications?.length > 0 ? (
                        <div className="space-y-4">
                          {medicalHistory.pastMedications.map((medication) => (
                            <div key={medication._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                              <div>
                                <p className="font-medium text-gray-900">{medication.name}</p>
                                <p className="text-sm text-gray-500">
                                  Stopped: {format(new Date(medication.endDate), 'MMM d, yyyy')}
                                  {medication.reasonStopped && (
                                    <span className="block text-red-600">Reason: {medication.reasonStopped}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Pill}
                          title="No past medications"
                          description="Your discontinued medications will appear here"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* Allergies Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Allergies</h3>
                    <button
                      onClick={() => setIsAddAllergyOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Allergy
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    {medicalHistory.allergies?.length > 0 ? (
                      <div className="space-y-4">
                        {medicalHistory.allergies.map((allergy) => (
                          <div key={allergy._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <div>
                              <p className="font-medium text-gray-900">{allergy.substance}</p>
                              <p className="text-sm text-gray-500">
                                {allergy.reaction} - {allergy.severity}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingItem({ type: 'allergy', data: allergy })}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={AlertTriangle}
                        title="No allergies recorded"
                        description="Add your allergies to ensure proper medical care"
                        action={
                          <button
                            onClick={() => setIsAddAllergyOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add Allergy
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>
              </Tab.Panel>

              {/* Immunizations Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Immunizations</h3>
                    <button
                      onClick={() => setIsAddImmunizationOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Immunization
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    {medicalHistory.immunizations?.length > 0 ? (
                      <div className="space-y-4">
                        {medicalHistory.immunizations.map((immunization) => (
                          <div key={immunization._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <div>
                              <p className="font-medium text-gray-900">{immunization.vaccine}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(immunization.date), 'MMM d, yyyy')}
                                {immunization.boosterDue && (
                                  <span className="ml-2 text-yellow-600">
                                    • Booster due: {format(new Date(immunization.boosterDue), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingItem({ type: 'immunization', data: immunization })}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Syringe}
                        title="No immunizations recorded"
                        description="Add your immunizations to track your vaccination history"
                        action={
                          <button
                            onClick={() => setIsAddImmunizationOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add Immunization
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>
              </Tab.Panel>

              {/* Surgeries Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Surgeries</h3>
                    <button
                      onClick={() => setIsAddSurgeryOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Surgery
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    {medicalHistory.surgeries?.length > 0 ? (
                      <div className="space-y-4">
                        {medicalHistory.surgeries.map((surgery) => (
                          <div key={surgery._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <div>
                              <p className="font-medium text-gray-900">{surgery.name}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(surgery.date), 'MMM d, yyyy')}
                                {surgery.hospital && (
                                  <span className="ml-2">• {surgery.hospital}</span>
                                )}
                              </p>
                              {surgery.outcome && (
                                <p className="text-sm text-gray-500 mt-1">{surgery.outcome}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingItem({ type: 'surgery', data: surgery })}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Stethoscope}
                        title="No surgeries recorded"
                        description="Add your surgeries to track your surgical history"
                        action={
                          <button
                            onClick={() => setIsAddSurgeryOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add Surgery
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>
              </Tab.Panel>

              {/* Hospitalizations Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Hospitalizations</h3>
                    <button
                      onClick={() => setIsAddHospitalizationOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Hospitalization
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    {medicalHistory.hospitalizations?.length > 0 ? (
                      <div className="space-y-4">
                        {medicalHistory.hospitalizations.map((hospitalization) => (
                          <div key={hospitalization._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <div>
                              <p className="font-medium text-gray-900">{hospitalization.reason}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(hospitalization.admissionDate), 'MMM d, yyyy')}
                                {hospitalization.dischargeDate && (
                                  <span className="ml-2">
                                    to {format(new Date(hospitalization.dischargeDate), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {hospitalization.hospitalName}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingItem({ type: 'hospitalization', data: hospitalization })}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Building2}
                        title="No hospitalizations recorded"
                        description="Add your hospitalizations to track your hospital stays"
                        action={
                          <button
                            onClick={() => setIsAddHospitalizationOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add Hospitalization
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>
              </Tab.Panel>

              {/* Family History Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Family History</h3>
                    <button
                      onClick={() => setIsAddFamilyHistoryOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Family History
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    {medicalHistory.familyHistory?.length > 0 ? (
                      <div className="space-y-4">
                        {medicalHistory.familyHistory.map((history) => (
                          <div key={history._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                            <div>
                              <p className="font-medium text-gray-900">{history.condition}</p>
                              <p className="text-sm text-gray-500">
                                {history.relation}
                                {history.ageAtDiagnosis && (
                                  <span className="ml-2">• Diagnosed at age {history.ageAtDiagnosis}</span>
                                )}
                                {history.deceased && (
                                  <span className="ml-2 text-red-600">• Deceased</span>
                                )}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingItem({ type: 'familyHistory', data: history })}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Users}
                        title="No family history recorded"
                        description="Add your family history to maintain a complete health history"
                        action={
                          <button
                            onClick={() => setIsAddFamilyHistoryOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Add Family History
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>
              </Tab.Panel>

              {/* Timeline Panel */}
              <Tab.Panel>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Medication Timeline</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    {medicationTimeline?.length > 0 ? (
                      <div className="space-y-8">
                        {medicationTimeline.map((medication, index) => (
                          <div key={`${medication._id}-${index}`} className="relative">
                            {/* Timeline connector */}
                            {index !== 0 && (
                              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                            )}
                            
                            <div className="relative flex items-start space-x-4">
                              {/* Icon */}
                              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${medication.type === 'current' ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                                <Pill className={`w-6 h-6 ${medication.type === 'current' ? 'text-blue-600' : 'text-gray-600'}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {medication.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {format(new Date(medication.startDate), 'MMM d, yyyy')}
                                  </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                  {medication.dosage} - {medication.frequency}
                                  {medication.purpose && ` • ${medication.purpose}`}
                                </p>
                                {medication.type === 'past' && (
                                  <div className="mt-2 flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                      Stopped: {medication.reasonStopped ? `Reason: ${medication.reasonStopped}` : 'No reason provided'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {format(new Date(medication.endDate), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                )}
                                <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${medication.type === 'current' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {medication.type === 'current' ? 'Current' : 'Past'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Calendar}
                        title="No medication history available"
                        description="Your medication timeline will appear here as you add medications"
                      />
                    )}
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Modals */}
      <AddConditionModal
        isOpen={isAddConditionOpen}
        onClose={() => setIsAddConditionOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Condition added successfully');
          setIsAddConditionOpen(false);
        }}
      />

      <AddMedicationModal
        isOpen={isAddMedicationOpen}
        onClose={() => setIsAddMedicationOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Medication added successfully');
          setIsAddMedicationOpen(false);
        }}
      />

      <AddAllergyModal
        isOpen={isAddAllergyOpen}
        onClose={() => setIsAddAllergyOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Allergy added successfully');
          setIsAddAllergyOpen(false);
        }}
      />

      {editingItem && (
        <>
          {editingItem.type === 'condition' && (
            <EditConditionModal
              isOpen={!!editingItem}
              onClose={() => setEditingItem(null)}
              condition={editingItem.data}
              onSuccess={() => {
                refetch();
                toast.success('Condition updated successfully');
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === 'medication' && (
            <EditMedicationModal
              isOpen={!!editingItem}
              onClose={() => setEditingItem(null)}
              medication={editingItem.data}
              onSuccess={() => {
                refetch();
                toast.success('Medication updated successfully');
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === 'allergy' && (
            <EditAllergyModal
              isOpen={!!editingItem}
              onClose={() => setEditingItem(null)}
              allergy={editingItem.data}
              onSuccess={() => {
                refetch();
                toast.success('Allergy updated successfully');
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === 'immunization' && (
            <EditImmunizationModal
              isOpen={!!editingItem}
              onClose={() => setEditingItem(null)}
              immunization={editingItem.data}
              onSuccess={() => {
                refetch();
                toast.success('Immunization updated successfully');
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === 'surgery' && (
            <EditSurgeryModal
              isOpen={!!editingItem}
              onClose={() => setEditingItem(null)}
              surgery={editingItem.data}
              onSuccess={() => {
                refetch();
                toast.success('Surgery updated successfully');
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === 'hospitalization' && (
            <EditHospitalizationModal
              isOpen={!!editingItem}
              onClose={() => setEditingItem(null)}
              hospitalization={editingItem.data}
              onSuccess={() => {
                refetch();
                toast.success('Hospitalization updated successfully');
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === 'familyHistory' && (
            <EditFamilyHistoryModal
              isOpen={!!editingItem}
              onClose={() => setEditingItem(null)}
              familyHistory={editingItem.data}
              onSuccess={() => {
                refetch();
                toast.success('Family history updated successfully');
                setEditingItem(null);
              }}
            />
          )}
        </>
      )}

      <DiscontinueMedicationModal
        isOpen={!!discontinuingMedication}
        onClose={() => setDiscontinuingMedication(null)}
        onConfirm={handleConfirmDiscontinue}
        medication={discontinuingMedication}
        isPending={isDiscontinuingMedication}
      />

      <UpdateVitalsModal
        isOpen={isUpdateVitalsOpen}
        onClose={() => setIsUpdateVitalsOpen(false)}
        initialData={medicalHistory}
        onSuccess={() => {
          refetch();
          toast.success('Vitals updated successfully');
          setIsUpdateVitalsOpen(false);
        }}
      />

      <AddImmunizationModal
        isOpen={isAddImmunizationOpen}
        onClose={() => setIsAddImmunizationOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Immunization added successfully');
          setIsAddImmunizationOpen(false);
        }}
      />

      <AddSurgeryModal
        isOpen={isAddSurgeryOpen}
        onClose={() => setIsAddSurgeryOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Surgery added successfully');
          setIsAddSurgeryOpen(false);
        }}
      />

      <AddHospitalizationModal
        isOpen={isAddHospitalizationOpen}
        onClose={() => setIsAddHospitalizationOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Hospitalization added successfully');
          setIsAddHospitalizationOpen(false);
        }}
      />

      <AddFamilyHistoryModal
        isOpen={isAddFamilyHistoryOpen}
        onClose={() => setIsAddFamilyHistoryOpen(false)}
        onSuccess={() => {
          refetch();
          toast.success('Family history added successfully');
          setIsAddFamilyHistoryOpen(false);
        }}
      />
    </div>
  );
};

export default MedicalHistory;
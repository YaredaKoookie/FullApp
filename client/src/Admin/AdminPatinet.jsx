import { useState } from 'react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  CheckIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  EyeIcon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldIcon,
  ShieldOffIcon
} from 'lucide-react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import queryClient from '@/lib/queryClient';
import apiClient from '@/lib/apiClient';


const AdminPatientListContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch patients
  const { data: patients, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin','admin-patients'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/patient');
      console.log(response.patients)
      return response.patients || [];
    }
  });

  // Toggle patient status
  const toggleStatus = useMutation({
    mutationFn: (patientId) => apiClient.patch(`/admin/patient/${patientId}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
    }
  });

  // Filter patients
  const filteredPatients = patients?.filter(patient => {
    const matchesSearch = 
      (patient.firstName && patient.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phoneNumber && patient.phoneNumber.includes(searchTerm));

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && patient.isActive) || 
      (statusFilter === 'inactive' && !patient.isActive);

    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handleStatusToggle = (patientId) => {
    toggleStatus.mutate(patientId);
  };

  const openProfile = (patient) => {
    setSelectedPatient(patient);
    setIsProfileOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Patient Management</h1>
        
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FilterIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <button
                onClick={() => refetch()}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                title="Refresh data"
              >
                <RefreshCwIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading patients...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Error loading patients</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPatients.length > 0 ? (
                      currentPatients.map((patient) => (
                        <tr key={patient._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {patient.profileImage ? (
                                  <img className="h-10 w-10 rounded-full" src={`http://localhost:3000/${patient.profileImage}`} alt={patient.firstName} />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="h-5 w-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{patient.firstName + patient.lastName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <MailIcon className="h-4 w-4 mr-1 text-gray-500" />
                              {patient.email}
                            </div>
                            {patient.phoneNumber && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <PhoneIcon className="h-4 w-4 mr-1" />
                                {patient.phoneNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {patient.gender && (
                              <div className="text-sm text-gray-500 capitalize">{patient.gender}</div>
                            )}
                            {patient.dateOfBirth && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(patient.dateOfBirth).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${patient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {patient.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openProfile(patient)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                title="View profile"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusToggle(patient._id)}
                                disabled={toggleStatus.isLoading}
                                className={`p-1 rounded ${patient.isActive ? 'text-red-600 hover:text-red-900 hover:bg-red-50' : 'text-green-600 hover:text-green-900 hover:bg-green-50'}`}
                                title={patient.isActive ? 'Disable patient' : 'Enable patient'}
                              >
                                {patient.isActive ? (
                                  <ShieldOffIcon className="h-5 w-5" />
                                ) : (
                                  <ShieldIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          No patients found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {filteredPatients.length > itemsPerPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(indexOfLastItem, filteredPatients.length)}</span> of{' '}
                        <span className="font-medium">{filteredPatients.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Patient Profile Modal */}
      <Transition appear show={isProfileOpen} as="div">
        <Dialog as="div" className="relative z-10" onClose={() => setIsProfileOpen(false)}>
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as="div"
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {selectedPatient && (
                    <>
                      <div className="flex justify-between items-start">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Patient Profile
                        </Dialog.Title>
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <span className="sr-only">Close</span>
                          <XIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex flex-col items-center mb-4">
                          {selectedPatient.profileImage ? (
                            <img 
                              className="h-24 w-24 rounded-full mb-2" 
                              src={`http://localhost:3000/${selectedPatient.profileImage}`} 
                              alt={selectedPatient.firstName + selectedPatient.lastName} 
                            />
                          ) : (
                            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                              <UserIcon className="h-12 w-12 text-gray-500" />
                            </div>
                          )}
                          <h4 className="text-lg font-medium text-gray-900">{selectedPatient.firstName + selectedPatient.lastName}</h4>
                          <span className={`px-2 mt-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${selectedPatient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {selectedPatient.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <MailIcon className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-gray-700">{selectedPatient.email}</span>
                          </div>
                          
                          {selectedPatient.phoneNumber && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-gray-700">{selectedPatient.phoneNumber}</span>
                            </div>
                          )}
                          
                          {selectedPatient.gender && (
                            <div className="flex items-center">
                              <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-gray-700 capitalize">{selectedPatient.gender}</span>
                            </div>
                          )}
                          
                          {selectedPatient.dateOfBirth && (
                            <div className="flex items-center">
                              <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-gray-700">
                                {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} 
                                {` (Age: ${Math.floor((new Date() - new Date(selectedPatient.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365))})`}
                              </span>
                            </div>
                          )}
                          
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-500">Registered on</p>
                            <p className="text-sm text-gray-700">
                              {new Date(selectedPatient.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
export default AdminPatientListContent
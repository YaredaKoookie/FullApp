import { useState, useEffect } from 'react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {
  LucideGlasses,
  FunnelIcon,
  XCircleIcon,
  CheckIcon,
  ClockIcon,
  BanIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  FileTextIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  MapPinIcon,
  DollarSignIcon,
  StarIcon,
  ShieldCheckIcon,
  ShieldAlertIcon
} from 'lucide-react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import queryClient from '@/lib/queryClient';
import useGetDoctorProfile from '@/hooks/useGetDoctorProfile';

const DoctorListContent = () => {
  // const { data: doctor, isLoading: isDoctorLoading } = useGetDoctorProfile();
  // const doctorId = doctor._id;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 10;

  // Fetch doctors data
  const { data: doctors, isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/doctor');
      return response.doctors || [];
    },
  });
  // Approve doctor mutation
  // console.log("two",selectedDoctor._id)
  const approveDoctor = useMutation({
    mutationFn: (doctorId) => apiClient.patch(`/admin/doctor/${doctorId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      setIsModalOpen(false);
    },
  });

  // Reject doctor mutation
  const rejectDoctor = useMutation({
    mutationFn: (doctorId) => apiClient.patch(`/admin/doctor/${doctorId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      setIsModalOpen(false);
    },
  });

  // Filter doctors based on search and status
  const filteredDoctors = doctors?.filter(doctor => {
    const matchesSearch = 
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.middleName && doctor.middleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      selectedStatus === 'all' || 
      doctor.verificationStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  }) || [];

  // Pagination logic
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openDoctorModal = (doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleApprove = () => {
    if (selectedDoctor) {
      approveDoctor.mutate(selectedDoctor._id);
    }
  };
  // console.log(selectedDoctor._id);
  const handleReject = () => {
    if (selectedDoctor) {
      rejectDoctor.mutate(selectedDoctor._id);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (isError) return <div className="flex justify-center items-center h-screen">Error fetching data</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Doctor Management</h1>
        
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LucideGlasses className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or specialization..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FunnelIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Doctors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDoctors.length > 0 ? (
                  currentDoctors.map((doctor) => (
                    <tr 
                      key={doctor._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDoctorModal(doctor)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {doctor.profilePhoto ? (
                              <img className="h-10 w-10 rounded-full" src={doctor.profilePhoto} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {doctor.firstName} {doctor.middleName ? doctor.middleName + ' ' : ''}{doctor.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MailIcon className="h-4 w-4 mr-1" />
                              {doctor.user?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.specialization}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${doctor.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                            doctor.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {doctor.verificationStatus === 'verified' ? (
                            <span className="flex items-center">
                              <CheckIcon className="h-3 w-3 mr-1" /> Verified
                            </span>
                          ) : doctor.verificationStatus === 'rejected' ? (
                            <span className="flex items-center">
                              <BanIcon className="h-3 w-3 mr-1" /> Rejected
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" /> Pending
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doctor.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No doctors found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredDoctors.length > doctorsPerPage && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstDoctor + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastDoctor, filteredDoctors.length)}</span> of{' '}
                    <span className="font-medium">{filteredDoctors.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === number
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {number}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
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
        </div>
      </div>
      
      {/* Doctor Details Modal */}
      <Transition appear show={isModalOpen} as="div">
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {selectedDoctor && (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                            Doctor Profile: {selectedDoctor.firstName} {selectedDoctor.lastName}
                          </Dialog.Title>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${selectedDoctor.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                                selectedDoctor.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {selectedDoctor.verificationStatus}
                            </span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${selectedDoctor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {selectedDoctor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={() => setIsModalOpen(false)}
                        >
                          <span className="sr-only">Close</span>
                          <XCircleIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column - Personal Info */}
                        <div className="col-span-1">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">PERSONAL INFORMATION</h4>
                            
                            <div className="flex justify-center mb-4">
                              {selectedDoctor.profilePhoto ? (
                                <img className="h-32 w-32 rounded-full" src={selectedDoctor.profilePhoto} alt="" />
                              ) : (
                                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserIcon className="h-16 w-16 text-gray-500" />
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500">Full Name</p>
                                <p className="text-sm font-medium">
                                  {selectedDoctor.firstName} {selectedDoctor.middleName ? selectedDoctor.middleName + ' ' : ''}{selectedDoctor.lastName}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Gender</p>
                                <p className="text-sm font-medium capitalize">{selectedDoctor.gender || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Date of Birth</p>
                                <p className="text-sm font-medium">
                                  {selectedDoctor.dateOfBirth ? new Date(selectedDoctor.dateOfBirth).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-1" />
                                  {selectedDoctor.phoneNumber || 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium flex items-center">
                                  <MailIcon className="h-4 w-4 mr-1" />
                                  {selectedDoctor.user?.email || 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Bio</p>
                                <p className="text-sm font-medium">
                                  {selectedDoctor.bio || 'No bio provided'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Middle Column - Professional Info */}
                        <div className="col-span-1">
                          <div className="bg-gray-50 p-4 rounded-lg h-full">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">PROFESSIONAL INFORMATION</h4>
                            
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs text-gray-500">Specialization</p>
                                <p className="text-sm font-medium">{selectedDoctor.specialization}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Years of Experience</p>
                                <p className="text-sm font-medium">{selectedDoctor.yearsOfExperience || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Languages</p>
                                <p className="text-sm font-medium">
                                  {selectedDoctor.languages?.join(', ') || 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Hospital</p>
                                <p className="text-sm font-medium flex items-center">
                                  <BriefcaseIcon className="h-4 w-4 mr-1" />
                                  {selectedDoctor.hospitalName || 'N/A'}
                                </p>
                                {selectedDoctor.hospitalAddress && (
                                  <p className="text-sm font-medium flex items-center mt-1">
                                    <MapPinIcon className="h-4 w-4 mr-1" />
                                    {"selectedDoctor.hospitalAddress"}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Consultation Fee</p>
                                <p className="text-sm font-medium flex items-center">
                                  <DollarSignIcon className="h-4 w-4 mr-1" />
                                  {selectedDoctor.consultationFee ? `$${selectedDoctor.consultationFee}` : 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Service Areas</p>
                                <p className="text-sm font-medium">
                                  {selectedDoctor.serviceAreas?.join(', ') || 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Application Notes</p>
                                <p className="text-sm font-medium">
                                  {selectedDoctor.applicationNotes || 'No notes provided'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-gray-500 mb-3">QUALIFICATIONS</h4>
                              {selectedDoctor.qualifications?.length > 0 ? (
                                <div className="space-y-3">
                                  {selectedDoctor.qualifications.map((qual, index) => (
                                    <div key={index} className="bg-white p-3 rounded-md shadow-sm">
                                      <p className="text-sm font-medium">{qual.degree}</p>
                                      <p className="text-xs text-gray-600">{qual.institution}</p>
                                      <p className="text-xs text-gray-500">{qual.year}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No qualifications added</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Verification & Documents */}
                        <div className="col-span-1">
                          <div className="bg-gray-50 p-4 rounded-lg h-full">
                            <h4 className="text-sm font-medium text-gray-500 mb-3">VERIFICATION DOCUMENTS</h4>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {selectedDoctor.nationalIdFront && (
                                <DocumentPreview 
                                  title="National ID (Front)" 
                                  url={`http://localhost:3000/${selectedDoctor.nationalIdFront}`} 
                                />
                              )}
                              {selectedDoctor.nationalIdBack && (
                                <DocumentPreview 
                                  title="National ID (Back)" 
                                  url={`http://localhost:3000/${selectedDoctor.nationalIdBack}`} 
                                />
                              )}
                              {selectedDoctor.licenseFront && (
                                <DocumentPreview 
                                  title="License (Front)" 
                                  url={`http://localhost:3000/${selectedDoctor.licenseFront}`} 
                                />
                              )}
                              {selectedDoctor.licenseBack && (
                                <DocumentPreview 
                                  title="License (Back)" 
                                  url={`http://localhost:3000/${selectedDoctor.licenseBack}`} 
                                />
                              )}
                              {selectedDoctor.boardCertificationsDocument && (
                                <DocumentPreview 
                                  title="Board Certifications" 
                                  url={`http://localhost:3000/${selectedDoctor.boardCertificationsDocument}`} 
                                />
                              )}
                              {selectedDoctor.educationDocument && (
                                <DocumentPreview 
                                  title="Education Document" 
                                  url={`http://localhost:3000/${selectedDoctor.educationDocument}`} 
                                />
                              )}
                            </div>
                            
                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-gray-500 mb-3">ACCOUNT DETAILS</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500">Verification Status</p>
                                  <p className="text-sm font-medium capitalize">{selectedDoctor.verificationStatus}</p>
                                </div>
                                
                                {selectedDoctor.approvedAt && (
                                  <div>
                                    <p className="text-xs text-gray-500">Approval Date</p>
                                    <p className="text-sm font-medium">
                                      {new Date(selectedDoctor.approvedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                                
                                <div>
                                  <p className="text-xs text-gray-500">Account Created</p>
                                  <p className="text-sm font-medium">
                                    {new Date(selectedDoctor.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-xs text-gray-500">Last Updated</p>
                                  <p className="text-sm font-medium">
                                    {new Date(selectedDoctor.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-gray-500 mb-3">PERFORMANCE METRICS</h4>
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="text-sm font-medium">
                                    {selectedDoctor.rating?.toFixed(1) || 'N/A'} ({selectedDoctor.totalReviews || 0} reviews)
                                  </span>
                                </div>
                                
                                <div>
                                  <p className="text-xs text-gray-500">Total Earnings</p>
                                  <p className="text-sm font-medium">
                                    ${selectedDoctor.totalEarnings?.toFixed(2) || '0.00'}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-xs text-gray-500">Withdrawal Balance</p>
                                  <p className="text-sm font-medium">
                                    ${selectedDoctor.withdrawalBalance?.toFixed(2) || '0.00'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {selectedDoctor.verificationStatus === 'pending' && (
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                            onClick={handleReject}
                            disabled={rejectDoctor.isLoading}
                          >
                            {rejectDoctor.isLoading ? 'Rejecting...' : 'Reject'}
                          </button>
                          <button
                            type="button"
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                            onClick={handleApprove}
                            disabled={approveDoctor.isLoading}
                          >
                            {approveDoctor.isLoading ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      )}
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
};
export default DoctorListContent

const DocumentPreview = ({ title, url }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="cursor-pointer hover:bg-gray-100 p-2 rounded"
        onClick={() => setIsOpen(true)}
      >
        <div className="bg-white border border-gray-200 rounded h-24 flex items-center justify-center">
          <FileTextIcon className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-xs text-center mt-1 truncate">{title}</p>
      </div>

      <Transition appear show={isOpen} as="div">
        <Dialog as="div" className="relative z-20" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                        {title}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="sr-only">Close</span>
                        <XCircleIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <img 
                        src={url} 
                        alt={title} 
                        className="w-full h-auto max-h-[70vh] object-contain"
                      />
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
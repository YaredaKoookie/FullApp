import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAPI } from '../lib/api';
import { Search, Filter, Plus, Edit2, Trash2, CheckCircle, XCircle, Eye, Save, X } from 'lucide-react';
import { AddDoctorForm } from '../components/AddDoctorForm';
import toast from 'react-hot-toast';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Award, MapPin, Phone, Mail, Calendar, User, GraduationCap, Languages, DollarSign, Clock, Star } from 'lucide-react';
const  VITE_API_URL = 'http://localhost:3000';

export const DoctorManagement = () => {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [editedDoctor, setEditedDoctor] = useState(null);
  const [imageLoading, setImageLoading] = useState({});

  const queryClient = useQueryClient();

  // Fetch doctors query
  const { data: doctorsData, isLoading, error } = useQuery({
    queryKey: ['doctors', pagination.page, pagination.limit],
    queryFn: async () => {
      const response = await adminAPI.doctors.list({
        page: pagination.page,
        limit: pagination.limit
      });
      return response.data;
    }
  });

  // Delete doctor mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.doctors.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      toast.success('Doctor deleted successfully');
      setShowDeleteModal(false);
      setDoctorToDelete(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete doctor');
    }
  });

  // Update doctor mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.doctors.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['doctors']);
      queryClient.invalidateQueries(['doctor', selectedDoctor?._id]);
      toast.success('Doctor updated successfully');
      setIsEditing(false);
      setSelectedDoctor(response.data.data);
      setEditedDoctor(null);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update doctor');
    }
  });

  // Get doctor details query
  const { data: doctorDetails } = useQuery({
    queryKey: ['doctor', selectedDoctor?._id],
    queryFn: async () => {
      const response = await adminAPI.doctors.get(selectedDoctor._id);
      return response.data.data;
    },
    enabled: !!selectedDoctor?._id
  });

  // Filter and search doctors locally
  const filteredDoctors = useMemo(() => {
    if (!doctorsData?.data) return [];
    
    return doctorsData.data.filter(doctor => {
      const searchMatch = searchInput.length < 2 || 
        doctor.fullName.toLowerCase().includes(searchInput.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchInput.toLowerCase());

      const statusMatch = filters.status === 'all' || 
        (filters.status === 'active' && doctor.isActive) ||
        (filters.status === 'inactive' && !doctor.isActive);

      return searchMatch && statusMatch;
    });
  }, [doctorsData?.data, searchInput, filters]);

  // Calculate pagination for filtered results
  const paginatedDoctors = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredDoctors.slice(startIndex, endIndex);
  }, [filteredDoctors, pagination.page, pagination.limit]);

  // Update total count when filters change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredDoctors.length,
      page: 1
    }));
  }, [filteredDoctors]);

  const handleSearch = (e) => {
    setSearchInput(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminAPI.doctors.toggleStatus(id, !currentStatus);
      queryClient.invalidateQueries(['doctors']);
      toast.success('Doctor status updated successfully');
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error(err.response?.data?.message || 'Failed to update doctor status');
    }
  };

  const handleDelete = (id) => {
    setDoctorToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (doctorToDelete) {
      deleteMutation.mutate(doctorToDelete);
    }
  };

  const handleViewProfile = async (id) => {
    try {
      const response = await adminAPI.doctors.get(id);
      const doctorDetails = response.data.data;
      setSelectedDoctor(doctorDetails);
    setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      toast.error('Failed to load doctor details');
    }
  };

  const handleEdit = () => {
    if (doctorDetails) {
      setEditedDoctor({
        ...doctorDetails,
        qualifications: doctorDetails.qualifications || []
      });
      setIsEditing(true);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '/images/default-avatar.png'; // Use local default image
    if (url.startsWith('http')) return url;
    return `${VITE_API_URL}/${url}`;
  };

  const handleSave = async () => {
    if (selectedDoctor?._id && editedDoctor) {
      const formData = new FormData();
      
      if (editedDoctor.profilePhoto instanceof File) {
        formData.append('profilePhoto', editedDoctor.profilePhoto);
      }
      if (editedDoctor.boardCertificationsDocument instanceof File) {
        formData.append('boardCertificationsDocument', editedDoctor.boardCertificationsDocument);
      }
      if (editedDoctor.educationDocument instanceof File) {
        formData.append('educationDocument', editedDoctor.educationDocument);
      }

      Object.keys(editedDoctor).forEach(key => {
        if (key !== 'profilePhoto' && key !== 'boardCertificationsDocument' && key !== 'educationDocument') {
          if (key === 'qualifications' || key === 'languages' || key === 'serviceAreas' || key === 'hospitalAddress') {
          formData.append(key, JSON.stringify(editedDoctor[key]));
          } else if (editedDoctor[key] !== undefined && editedDoctor[key] !== null) {
          formData.append(key, editedDoctor[key]);
          }
        }
      });

      updateMutation.mutate({
        id: selectedDoctor._id,
        data: formData
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDoctor(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditedDoctor(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditedDoctor(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // const handleAddDoctor = async (formData) => {
  //   try {
  //     await adminAPI.doctors.create(formData);
  //     toast.success('Doctor added successfully');
  //     setShowAddForm(false);
  //     queryClient.invalidateQueries(['doctors']);
  //   } catch (err) {
  //     console.error('Error adding doctor:', err);
  //     toast.error(err.response?.data?.message || 'Failed to add doctor');
  //   }
  // };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setEditedDoctor(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const handleAddQualification = () => {
    setEditedDoctor(prev => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), { degree: '', institution: '', year: '' }]
    }));
  };

  const handleRemoveQualification = (index) => {
    setEditedDoctor(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleImageLoad = (id) => {
    setImageLoading(prev => ({
      ...prev,
      [id]: false
    }));
  };

  const handleImageError = (id) => {
    setImageLoading(prev => ({
      ...prev,
      [id]: false
    }));
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Doctors</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all doctors in the system including their name, specialization, and status.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Add New Doctor
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
            <input
              type="text"
                placeholder="Search by name or specialization... (min. 2 characters)"
              value={searchInput}
              onChange={handleSearch}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-12 text-base"
              />
              {searchInput.length > 0 && searchInput.length < 2 && (
                <p className="mt-1 text-sm text-red-600">
                  Search term must be at least 2 characters
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-12"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-red-600">{error.message}</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Doctor
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Specialization
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Contact
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paginatedDoctors.map((doctor) => (
                        <tr key={doctor._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 relative">
                                {imageLoading[doctor._id] !== false && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                  </div>
                                )}
                                <img
                                  className={`h-10 w-10 rounded-full object-cover ${imageLoading[doctor._id] !== false ? 'opacity-0' : 'opacity-100'}`}
                                  src={getImageUrl(doctor.profilePhoto)}
                                  alt={doctor.fullName}
                                  onLoad={() => handleImageLoad(doctor._id)}
                                  onError={() => handleImageError(doctor._id)}
                                />
                              </div>
                              <div className="ml-4">
                            <div className="font-medium text-gray-900">{doctor.fullName}</div>
                                <div className="text-gray-500">{doctor.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {doctor.specialization}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {doctor.phoneNumber}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                doctor.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {doctor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewProfile(doctor._id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View Profile"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                            <button
                              onClick={() => handleToggleStatus(doctor._id, doctor.isActive)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title={doctor.isActive ? "Deactivate" : "Activate"}
                              >
                                {doctor.isActive ? (
                                  <XCircle className="h-5 w-5" />
                                ) : (
                                  <CheckCircle className="h-5 w-5" />
                                )}
                            </button>
                            <button
                              onClick={() => handleDelete(doctor._id)}
                              className="text-red-600 hover:text-red-900"
                                title="Delete"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && !error && filteredDoctors.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Doctor Form Modal */}
      {showAddForm && (
        <AddDoctorForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            queryClient.invalidateQueries(['doctors']);
          }} 
        />
      )}

      {/* View/Edit Profile Modal */}
      {showProfileModal && selectedDoctor && (
        <AddDoctorForm
          doctor={selectedDoctor}
          mode="view"
          onClose={() => {
            setShowProfileModal(false);
            setSelectedDoctor(null);
          }}
          onSuccess={() => {
            setShowProfileModal(false);
            setSelectedDoctor(null);
            queryClient.invalidateQueries(['doctors']);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setShowDeleteModal(false)}
        >
          <Transition.Child
            as={Fragment}
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
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-center mb-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 text-center">
                    Delete Doctor
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 text-center">
                      Are you sure you want to delete this doctor? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deleteMutation.isLoading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </AdminLayout>
  );
}; 
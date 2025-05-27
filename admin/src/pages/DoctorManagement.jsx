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
    onSuccess: () => {
      queryClient.invalidateQueries(['doctors']);
      toast.success('Doctor updated successfully');
      setIsEditing(false);
      setSelectedDoctor(editedDoctor);
    },
    onError: (error) => {
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

  const handleViewProfile = (id) => {
    setSelectedDoctor({ _id: id });
    setShowProfileModal(true);
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
        if (key === 'qualifications') {
          formData.append(key, JSON.stringify(editedDoctor[key]));
        } else if (key === 'languages' || key === 'serviceAreas') {
          formData.append(key, JSON.stringify(editedDoctor[key]));
        } else if (key === 'hospitalAddress') {
          formData.append(key, JSON.stringify(editedDoctor[key]));
        } else if (!(editedDoctor[key] instanceof File)) {
          formData.append(key, editedDoctor[key]);
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
      <Transition appear show={showProfileModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setShowProfileModal(false)}
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
                <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {doctorDetails && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            {imageLoading['profile'] !== false && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                              </div>
                            )}
                            <img
                              src={getImageUrl(doctorDetails?.profilePhoto)}
                              alt={doctorDetails?.fullName}
                              className={`h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg ${imageLoading['profile'] !== false ? 'opacity-0' : 'opacity-100'}`}
                              onLoad={() => handleImageLoad('profile')}
                              onError={() => handleImageError('profile')}
                            />
                            {isEditing && (
                              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full cursor-pointer hover:bg-indigo-700">
                                <Upload className="h-4 w-4" />
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(e, 'profilePhoto')}
                                />
                              </label>
                            )}
                          </div>
                          <div>
                            <Dialog.Title as="h3" className="text-2xl font-semibold text-gray-900">
                              {doctorDetails.fullName}
                            </Dialog.Title>
                            <p className="text-sm text-gray-500">{doctorDetails.specialization}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSave}
                                disabled={updateMutation.isLoading}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={handleEdit}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Profile
                              </button>
                              <button
                                onClick={() => setShowProfileModal(false)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                          <Tab
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                              ${selected
                                ? 'bg-white text-indigo-700 shadow'
                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
                              }`
                            }
                          >
                            <div className="flex items-center justify-center">
                              <User className="h-4 w-4 mr-2" />
                              Personal Info
                            </div>
                          </Tab>
                          <Tab
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                              ${selected
                                ? 'bg-white text-indigo-700 shadow'
                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
                              }`
                            }
                          >
                            <div className="flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Professional Info
                            </div>
                          </Tab>
                          <Tab
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                              ${selected
                                ? 'bg-white text-indigo-700 shadow'
                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
                              }`
                            }
                          >
                            <div className="flex items-center justify-center">
                              <Award className="h-4 w-4 mr-2" />
                              Qualifications
                            </div>
                          </Tab>
                          <Tab
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                              ${selected
                                ? 'bg-white text-indigo-700 shadow'
                                : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
                              }`
                            }
                          >
                            <div className="flex items-center justify-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Documents
                            </div>
                          </Tab>
                        </Tab.List>
                        <Tab.Panels className="mt-6">
                          {/* Personal Information Panel */}
                          <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                  {isEditing ? (
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                      <input
                                        type="text"
                                        name="firstName"
                                        value={editedDoctor.firstName}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="First Name"
                                      />
                                      <input
                                        type="text"
                                        name="middleName"
                                        value={editedDoctor.middleName}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Middle Name"
                                      />
                                      <input
                                        type="text"
                                        name="lastName"
                                        value={editedDoctor.lastName}
                                        onChange={handleInputChange}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Last Name"
                                      />
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.fullName}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Email</label>
                                  {isEditing ? (
                                    <input
                                      type="email"
                                      name="email"
                                      value={editedDoctor.email}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.email}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                  {isEditing ? (
                                    <input
                                      type="tel"
                                      name="phoneNumber"
                                      value={editedDoctor.phoneNumber}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.phoneNumber}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                  {isEditing ? (
                                    <input
                                      type="date"
                                      name="dateOfBirth"
                                      value={editedDoctor.dateOfBirth}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">
                                      {new Date(doctorDetails.dateOfBirth).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                                  {isEditing ? (
                                    <select
                                      name="gender"
                                      value={editedDoctor.gender}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                      <option value="male">Male</option>
                                      <option value="female">Female</option>
                                      <option value="other">Other</option>
                                    </select>
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900 capitalize">{doctorDetails.gender}</p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">National ID/FAN Number</label>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      name="nationalIdFanNumber"
                                      value={editedDoctor.nationalIdFanNumber}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.nationalIdFanNumber}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      name="licenseNumber"
                                      value={editedDoctor.licenseNumber}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.licenseNumber}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                                  {isEditing ? (
                                    <textarea
                                      name="bio"
                                      value={editedDoctor.bio || ''}
                                      onChange={handleInputChange}
                                      rows={4}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.bio || 'No bio provided'}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Tab.Panel>

                          {/* Professional Information Panel */}
                          <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      name="specialization"
                                      value={editedDoctor.specialization}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.specialization}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      name="yearsOfExperience"
                                      value={editedDoctor.yearsOfExperience}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.yearsOfExperience} years</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Languages</label>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      name="languages"
                                      value={editedDoctor.languages.join(', ')}
                                      onChange={(e) => handleInputChange({
                                        target: {
                                          name: 'languages',
                                          value: e.target.value.split(',').map(lang => lang.trim())
                                        }
                                      })}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      placeholder="Enter languages separated by commas"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.languages.join(', ')}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Consultation Fee</label>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      name="consultationFee"
                                      value={editedDoctor.consultationFee}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">${doctorDetails.consultationFee}</p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      name="hospitalName"
                                      value={editedDoctor.hospitalName}
                                      onChange={handleInputChange}
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">{doctorDetails.hospitalName || 'Not specified'}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Hospital Address</label>
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        name="hospitalAddress.street1"
                                        value={editedDoctor.hospitalAddress?.street1 || ''}
                                        onChange={handleInputChange}
                                        placeholder="Street 1"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                      <input
                                        type="text"
                                        name="hospitalAddress.street2"
                                        value={editedDoctor.hospitalAddress?.street2 || ''}
                                        onChange={handleInputChange}
                                        placeholder="Street 2"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          name="hospitalAddress.city"
                                          value={editedDoctor.hospitalAddress?.city || ''}
                                          onChange={handleInputChange}
                                          placeholder="City"
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                        <input
                                          type="text"
                                          name="hospitalAddress.state"
                                          value={editedDoctor.hospitalAddress?.state || ''}
                                          onChange={handleInputChange}
                                          placeholder="State"
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        name="hospitalAddress.postalCode"
                                        value={editedDoctor.hospitalAddress?.postalCode || ''}
                                        onChange={handleInputChange}
                                        placeholder="Postal Code"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                      />
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">
                                      {doctorDetails.hospitalAddress ? (
                                        <>
                                          {doctorDetails.hospitalAddress.street1}
                                          {doctorDetails.hospitalAddress.street2 && <>, {doctorDetails.hospitalAddress.street2}</>}
                                          <br />
                                          {doctorDetails.hospitalAddress.city}, {doctorDetails.hospitalAddress.state} {doctorDetails.hospitalAddress.postalCode}
                                        </>
                                      ) : (
                                        'No address provided'
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Service Areas</label>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      name="serviceAreas"
                                      value={typeof editedDoctor.serviceAreas === 'string' ? editedDoctor.serviceAreas : (editedDoctor.serviceAreas || []).join(', ')}
                                      onChange={(e) => handleInputChange({
                                        target: {
                                          name: 'serviceAreas',
                                          value: e.target.value
                                        }
                                      })}
                                      placeholder="Enter service areas separated by commas"
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-900">
                                      {typeof doctorDetails.serviceAreas === 'string' 
                                        ? doctorDetails.serviceAreas 
                                        : (doctorDetails.serviceAreas || []).join(', ') || 'No service areas specified'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Tab.Panel>

                          {/* Qualifications Panel */}
                          <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                            <div className="space-y-6">
                              {isEditing ? (
                                <div className="space-y-4">
                                  {editedDoctor.qualifications.map((qual, index) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">Degree</label>
                                          <input
                                            type="text"
                                            name={`qualifications.${index}.degree`}
                                            value={qual.degree}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">Institution</label>
                                          <input
                                            type="text"
                                            name={`qualifications.${index}.institution`}
                                            value={qual.institution}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700">Year</label>
                                          <input
                                            type="text"
                                            name={`qualifications.${index}.year`}
                                            value={qual.year}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                          />
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveQualification(index)}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={handleAddQualification}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                  >
                                    Add Qualification
                                  </button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {doctorDetails.qualifications.map((qual, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                      <h4 className="font-medium text-gray-900">{qual.degree}</h4>
                                      <p className="text-sm text-gray-600">{qual.institution}</p>
                                      <p className="text-sm text-gray-500">{qual.year}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Tab.Panel>

                          {/* Documents Panel */}
                          <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                            <div className="grid grid-cols-1 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Board Certifications</label>
                                  {isEditing ? (
                                    <div className="mt-1">
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => handleFileChange(e, 'boardCertificationsDocument')}
                                        className="block w-full text-sm text-gray-500
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-md file:border-0
                                          file:text-sm file:font-semibold
                                          file:bg-indigo-50 file:text-indigo-700
                                          hover:file:bg-indigo-100"
                                      />
                                      {editedDoctor.boardCertificationsDocument && (
                                        <div className="mt-2">
                                          {editedDoctor.boardCertificationsDocument instanceof File ? (
                                            <p className="text-sm text-gray-600">New file selected: {editedDoctor.boardCertificationsDocument.name}</p>
                                          ) : (
                                            <a
                                              href={editedDoctor.boardCertificationsDocument}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sm text-indigo-600 hover:text-indigo-900"
                                            >
                                              View Current Document
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-1">
                                      {doctorDetails?.boardCertificationsDocument ? (
                                        <a
                                          href={doctorDetails.boardCertificationsDocument}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-600 hover:text-indigo-900"
                                        >
                                          View Document
                                        </a>
                                      ) : (
                                        <p className="text-sm text-gray-500">No document uploaded</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Education Document</label>
                                  {isEditing ? (
                                    <div className="mt-1">
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => handleFileChange(e, 'educationDocument')}
                                        className="block w-full text-sm text-gray-500
                                          file:mr-4 file:py-2 file:px-4
                                          file:rounded-md file:border-0
                                          file:text-sm file:font-semibold
                                          file:bg-indigo-50 file:text-indigo-700
                                          hover:file:bg-indigo-100"
                                      />
                                      {editedDoctor.educationDocument && (
                                        <div className="mt-2">
                                          {editedDoctor.educationDocument instanceof File ? (
                                            <p className="text-sm text-gray-600">New file selected: {editedDoctor.educationDocument.name}</p>
                                          ) : (
                                            <a
                                              href={editedDoctor.educationDocument}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sm text-indigo-600 hover:text-indigo-900"
                                            >
                                              View Current Document
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-1">
                                      {doctorDetails?.educationDocument ? (
                                        <a
                                          href={doctorDetails.educationDocument}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-600 hover:text-indigo-900"
                                        >
                                          View Document
                                        </a>
                                      ) : (
                                        <p className="text-sm text-gray-500">No document uploaded</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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
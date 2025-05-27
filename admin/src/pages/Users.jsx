import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAPI } from '../lib/api';
import { Search, Filter, Edit2, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const VITE_API_URL = 'http://localhost:3000';

export const Users = () => {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [imageLoading, setImageLoading] = useState({});

  const queryClient = useQueryClient();

  // Fetch users query - only patients
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', pagination.page, pagination.limit, searchInput, filters.status],
    queryFn: async () => {
      const response = await adminAPI.users.list({
        page: pagination.page,
        limit: pagination.limit,
        search: searchInput,
        status: filters.status,
        role: 'patient' // Only fetch patients
      });
      return response.data;
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Patient deleted successfully');
      setShowDeleteModal(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete patient');
    }
  });

  // Get user details query
  const { data: userDetails } = useQuery({
    queryKey: ['user', selectedUser?._id],
    queryFn: async () => {
      const response = await adminAPI.users.get(selectedUser._id);
      return response.data.data;
    },
    enabled: !!selectedUser?._id
  });

  // Filter and search users locally
  const filteredUsers = useMemo(() => {
    if (!usersData?.data) return [];
    return usersData.data.filter(user => user.role === 'patient'); // Additional safety check
  }, [usersData?.data]);

  // Calculate pagination for filtered results
  const paginatedUsers = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, pagination.page, pagination.limit]);

  // Update total count when filters change
  useEffect(() => {
    if (usersData?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: usersData.pagination.total,
        page: 1
      }));
    }
  }, [usersData?.pagination]);

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
      await adminAPI.users.toggleStatus(id, !currentStatus);
      queryClient.invalidateQueries(['users']);
      toast.success('Patient status updated successfully');
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error(err.response?.data?.message || 'Failed to update patient status');
    }
  };

  const handleDelete = (id) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
    }
  };

  const handleViewProfile = (id) => {
    setSelectedUser({ _id: id });
    setShowProfileModal(true);
  };

  const getImageUrl = (url) => {
    if (!url) return '/images/default-avatar.png';
    if (url.startsWith('http')) return url;
    return `${VITE_API_URL}/${url}`;
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
            <h1 className="text-xl font-semibold text-gray-900">Patients</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all patients in the system including their name, email, and status.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email... (min. 2 characters)"
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

        {/* Users Table */}
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
                          Patient
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
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
                      {paginatedUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 relative">
                                {imageLoading[user._id] !== false && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                  </div>
                                )}
                                <img
                                  className={`h-10 w-10 rounded-full object-cover ${imageLoading[user._id] !== false ? 'opacity-0' : 'opacity-100'}`}
                                  src={getImageUrl(user.patientDetails?.profileImage)}
                                  alt={user.fullName}
                                  onLoad={() => handleImageLoad(user._id)}
                                  onError={() => handleImageError(user._id)}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{user.fullName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewProfile(user._id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View Profile"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user._id, user.isActive)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title={user.isActive ? "Deactivate" : "Activate"}
                              >
                                {user.isActive ? (
                                  <XCircle className="h-5 w-5" />
                                ) : (
                                  <CheckCircle className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(user._id)}
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
        {!isLoading && !error && filteredUsers.length > 0 && (
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

      {/* View Profile Modal */}
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {userDetails && (
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
                              src={getImageUrl(userDetails.patientDetails?.profileImage)}
                              alt={userDetails.patientDetails?.fullName}
                              className={`h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg ${imageLoading['profile'] !== false ? 'opacity-0' : 'opacity-100'}`}
                              onLoad={() => handleImageLoad('profile')}
                              onError={() => handleImageError('profile')}
                            />
                          </div>
                          <div>
                            <Dialog.Title as="h3" className="text-2xl font-semibold text-gray-900">
                              {userDetails.patientDetails?.fullName || 'No Name Provided'}
                            </Dialog.Title>
                            <p className="text-sm text-gray-500">{userDetails.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowProfileModal(false)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Close
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Personal Information</label>
                            <div className="mt-2 space-y-2">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Full Name:</span>{' '}
                                {`${userDetails.patientDetails?.firstName || ''} ${userDetails.patientDetails?.middleName || ''} ${userDetails.patientDetails?.lastName || ''}`.trim() || 'Not provided'}
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Date of Birth:</span>{' '}
                                {userDetails.patientDetails?.dateOfBirth ? new Date(userDetails.patientDetails.dateOfBirth).toLocaleDateString() : 'Not provided'}
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Gender:</span>{' '}
                                {userDetails.patientDetails?.gender || 'Not provided'}
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Blood Type:</span>{' '}
                                {userDetails.patientDetails?.bloodType || 'Not provided'}
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Marital Status:</span>{' '}
                                {userDetails.patientDetails?.maritalStatus || 'Not provided'}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                            <div className="mt-2 space-y-2">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Phone:</span>{' '}
                                {userDetails.patientDetails?.phone || 'Not provided'}
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Location:</span>{' '}
                                {userDetails.patientDetails?.location ? (
                                  <>
                                    {userDetails.patientDetails.location.address}
                                    {userDetails.patientDetails.location.city && <>, {userDetails.patientDetails.location.city}</>}
                                    {userDetails.patientDetails.location.state && <>, {userDetails.patientDetails.location.state}</>}
                                    {userDetails.patientDetails.location.postalCode && <>, {userDetails.patientDetails.location.postalCode}</>}
                                  </>
                                ) : 'Not provided'}
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Emergency Contact:</span>{' '}
                                {userDetails.patientDetails?.emergencyContact?.[0] ? (
                                  <>
                                    {userDetails.patientDetails.emergencyContact[0].name} ({userDetails.patientDetails.emergencyContact[0].phone})
                                    {userDetails.patientDetails.emergencyContact[0].relation && <>, {userDetails.patientDetails.emergencyContact[0].relation}</>}
                                  </>
                                ) : 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Additional Information</label>
                            <div className="mt-2 space-y-2">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Preferred Language:</span>{' '}
                                {userDetails.patientDetails?.preferredLanguage || 'Not provided'}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Account Status</label>
                            <div className="mt-2 space-y-2">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Status:</span>{' '}
                                <span
                                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    userDetails.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {userDetails.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Email Verification:</span>{' '}
                                <span
                                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                    userDetails.isEmailVerified
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {userDetails.isEmailVerified ? 'Verified' : 'Not Verified'}
                                </span>
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Member Since:</span>{' '}
                                {new Date(userDetails.createdAt).toLocaleDateString()}
                              </p>
                            </div>
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
                    Delete Patient
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 text-center">
                      Are you sure you want to delete this patient? This action cannot be undone.
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
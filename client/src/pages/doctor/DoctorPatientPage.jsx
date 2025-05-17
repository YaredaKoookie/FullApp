import { useState, Fragment } from 'react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Video,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  Clock,
  Clipboard,
  Plus,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  History,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Dialog, Transition, Menu, Listbox } from '@headlessui/react';
import queryClient from '@/lib/queryClient';

const DoctorPatientPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    lastAppointment: 'any',
    activeWithin: 'any'
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Get current doctor ID (in a real app, this would come from auth context)
  const currentDoctorId = 'doctor123';

  // Fetch patients
  const { data: patientsData, isLoading, isError } = useQuery({
    queryKey: ['patients', currentDoctorId, searchQuery, filters, page],
    queryFn: async () => {
      const response = await apiClient.get('/doctors/patientList', {
        params: {
          doctorId: currentDoctorId,
          search: searchQuery,
          type: filters.type === 'all' ? undefined : filters.type,
          lastAppointment: filters.lastAppointment === 'any' ? undefined : filters.lastAppointment,
          activeWithin: filters.activeWithin === 'any' ? undefined : filters.activeWithin,
          page,
          limit: itemsPerPage
        }
      });
      console.log("data",response);
      return response || [];
    },
    keepPreviousData: true
  });
  console.log("data",patientsData);

  // Fetch patient history
  const { data: patientHistory } = useQuery({
    queryKey: ['patientHistory', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return;
      const response = await apiClient.get(`/doctors/patient/${selectedPatient.id}/history`);
      return response.data || [];
    },
    enabled: !!selectedPatient
  });

  // Mutation for adding a note
  const addNoteMutation = useMutation({
    mutationFn: ({ patientId, note }) => 
      apiClient.post(`/patient/${patientId}/notes`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      setIsNoteOpen(false);
      setNewNote('');
    }
  });

  const handleAddNote = () => {
    if (!selectedPatient || !newNote.trim()) return;
    addNoteMutation.mutate({
      patientId: selectedPatient.id,
      note: newNote.trim()
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const appointmentTypeIcon = (type) => {
    return type === 'virtual' ? (
      <Video className="w-4 h-4 text-blue-500" />
    ) : (
      <User className="w-4 h-4 text-green-500" />
    );
  };

  const statusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'confirmed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Confirmed</span>;
      case 'completed':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Completed</span>;
      case 'cancelled':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Cancelled</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {patientsData?.totalCount || '0'} confirmed patients
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-6 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search patients by name, email or phone"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Listbox
                as="div"
                className="relative"
                value={filters.type}
                onChange={(value) => {
                  setFilters({ ...filters, type: value });
                  setPage(1);
                }}
              >
                <Listbox.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span className="flex items-center">
                    {filters.type === 'all' ? 'All Types' : filters.type === 'virtual' ? 'Virtual' : 'In-person'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {['all', 'in-person', 'virtual'].map((type) => (
                    <Listbox.Option
                      key={type}
                      value={type}
                      className={({ active }) =>
                        `cursor-default select-none relative py-2 pl-3 pr-9 ${
                          active ? 'text-white bg-blue-600' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {type === 'all' ? 'All Types' : type === 'virtual' ? 'Virtual' : 'In-person'}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>

              <Listbox
                as="div"
                className="relative"
                value={filters.lastAppointment}
                onChange={(value) => {
                  setFilters({ ...filters, lastAppointment: value });
                  setPage(1);
                }}
              >
                <Listbox.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span className="flex items-center">
                    {filters.lastAppointment === 'any' 
                      ? 'Any Last Appointment' 
                      : filters.lastAppointment === 'lastWeek' 
                        ? 'Last Week' 
                        : filters.lastAppointment === 'lastMonth' 
                          ? 'Last Month' 
                          : 'Last 3 Months'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {['any', 'lastWeek', 'lastMonth', 'last3Months'].map((option) => (
                    <Listbox.Option
                      key={option}
                      value={option}
                      className={({ active }) =>
                        `cursor-default select-none relative py-2 pl-3 pr-9 ${
                          active ? 'text-white bg-blue-600' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {option === 'any' 
                              ? 'Any Last Appointment' 
                              : option === 'lastWeek' 
                                ? 'Last Week' 
                                : option === 'lastMonth' 
                                  ? 'Last Month' 
                                  : 'Last 3 Months'}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>

              <Listbox
                as="div"
                className="relative"
                value={filters.activeWithin}
                onChange={(value) => {
                  setFilters({ ...filters, activeWithin: value });
                  setPage(1);
                }}
              >
                <Listbox.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span className="flex items-center">
                    {filters.activeWithin === 'any' 
                      ? 'Any Activity' 
                      : filters.activeWithin === '7days' 
                        ? 'Active last 7 days' 
                        : filters.activeWithin === '30days' 
                          ? 'Active last 30 days' 
                          : 'Active last 90 days'}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {['any', '7days', '30days', '90days'].map((option) => (
                    <Listbox.Option
                      key={option}
                      value={option}
                      className={({ active }) =>
                        `cursor-default select-none relative py-2 pl-3 pr-9 ${
                          active ? 'text-white bg-blue-600' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                            {option === 'any' 
                              ? 'Any Activity' 
                              : option === '7days' 
                                ? 'Active last 7 days' 
                                : option === '30days' 
                                  ? 'Active last 30 days' 
                                  : 'Active last 90 days'}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="h-[500px] bg-white shadow rounded-lg overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
          ) : isError ? (
            <div className="p-4 text-red-500">Error loading patients. Please try again.</div>
          ) : patientsData?.patients?.length === 0 ? (
            <div className="p-4 text-gray-500">No patients found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointments
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Appointment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patientsData?.patients?.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {patient.avatar ? (
                              <img className="h-10 w-10 rounded-full" src={patient.prfileImage} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.FullName}</div>
                            <div className="text-sm text-gray-500">{patient.dateOfBirth} years</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* <div className="text-sm text-gray-900">{patient.email}</div> */}
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.appointmentCount} confirmed
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(patient.lastAppointmentDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {appointmentTypeIcon(patient.lastAppointmentType)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {patient.lastAppointmentType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Menu as="div" className="relative inline-block text-left">
                          <div>
                            <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                              Actions
                              <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                            </Menu.Button>
                          </div>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => {
                                        setSelectedPatient(patient);
                                        setIsHistoryOpen(true);
                                      }}
                                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <div className="flex items-center">
                                        <History className="mr-2 h-4 w-4" />
                                        View Appointments
                                      </div>
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => {
                                        // In a real app, this would open the patient's profile
                                        alert(`Viewing profile for ${patient.name}`);
                                      }}
                                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Profile
                                      </div>
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => {
                                        // In a real app, this would open a chat window
                                        alert(`Opening chat with ${patient.name}`);
                                      }}
                                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <div className="flex items-center">
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Send Message
                                      </div>
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => {
                                        setSelectedPatient(patient);
                                        setIsNoteOpen(true);
                                      }}
                                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <div className="flex items-center">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Note
                                      </div>
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {patientsData?.totalCount > itemsPerPage && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * itemsPerPage >= patientsData.totalCount}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * itemsPerPage, patientsData.totalCount)}</span> of{' '}
                  <span className="font-medium">{patientsData.totalCount}</span> patients
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {Array.from({ length: Math.ceil(patientsData.totalCount / itemsPerPage) }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === page || p === page - 1 || p === page + 1 || p === Math.ceil(patientsData.totalCount / itemsPerPage))
                    .map((pageNum, i, arr) => (
                      <Fragment key={pageNum}>
                        {i > 0 && arr[i - 1] !== pageNum - 1 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </Fragment>
                    ))}
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * itemsPerPage >= patientsData.totalCount}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Patient History Modal */}
      <Transition appear show={isHistoryOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsHistoryOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {selectedPatient && (
                    <>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Appointment History for {selectedPatient.name}
                      </Dialog.Title>
                      <div className="mt-4">
                        {patientHistory?.length === 0 ? (
                          <p className="text-gray-500">No appointment history found.</p>
                        ) : (
                          <div className="overflow-y-auto max-h-96">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {patientHistory?.map((appointment) => (
                                  <tr key={appointment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {formatDate(appointment.slot.start)}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {new Date(appointment.slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        {appointmentTypeIcon(appointment.type)}
                                        <span className="ml-2 text-sm text-gray-900 capitalize">
                                          {appointment.type}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {statusBadge(appointment.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-900">
                                        {appointment.reason}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          onClick={() => setIsHistoryOpen(false)}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add Note Modal */}
      <Transition appear show={isNoteOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsNoteOpen(false)}>
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
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Add Note for {selectedPatient?.name}
                  </Dialog.Title>
                  <div className="mt-4">
                    <textarea
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter your notes about this patient..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsNoteOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      onClick={handleAddNote}
                      disabled={addNoteMutation.isLoading || !newNote.trim()}
                    >
                      {addNoteMutation.isLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        'Save Note'
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default DoctorPatientPage;
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Calendar, Clock, DollarSign, FileText, AlertTriangle, Link as LinkIcon, 
  MapPin, Phone, UserCircle, Video, ChevronLeft, MoreVertical, Star, X 
} from 'lucide-react'
import { Dialog, Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { toast } from 'react-toastify'
import { useGetAppointmentById, useCancelAppointment } from '@api/patient'


const AppointmentDetailsPage = () => {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const cancelAppointmentMutation = useCancelAppointment(appointmentId);
  const {data: response, isLoading, isError, error} = useGetAppointmentById(appointmentId);

  const appointment = response?.data?.appointment;

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-blue-100 text-blue-800',
    payment_pending: 'bg-purple-100 text-purple-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    'no-show': 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
    rescheduled: 'bg-orange-100 text-orange-800',
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (isError || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Appointment</h2>
          <p className="text-gray-600 mb-4">{error?.message}</p>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
          <X className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Appointment Not Found</h2>
          <p className="text-gray-600 mb-4">The requested appointment could not be found.</p>
          <button
            onClick={() => navigate('/patient/appointments')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            to={'/patient/appointments'}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Appointments
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[appointment.status]}`}>
              {appointment.status}
            </span>
            
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="flex items-center text-gray-500 hover:text-gray-700 focus:outline-none">
                  <MoreVertical className="h-5 w-5" />
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
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setIsRescheduleOpen(true)}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex px-4 py-2 text-sm w-full`}
                        >
                          <Calendar className="mr-3 h-5 w-5 text-gray-500" />
                          Reschedule
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setIsCancelOpen(true)}
                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex px-4 py-2 text-sm w-full`}
                        >
                          <AlertTriangle className="mr-3 h-5 w-5 text-gray-500" />
                          Cancel Appointment
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Appointment Overview */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-lg">
                {appointment.appointmentType === 'virtual' ? (
                  <Video className="h-6 w-6 text-indigo-600" />
                ) : (
                  <MapPin className="h-6 w-6 text-indigo-600" />
                )}
              </div>
              <div className="ml-4 flex-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {appointment.doctor.fullName}
                </h1>
                <p className="text-sm text-gray-500">{appointment.doctor.specialization}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {new Date(appointment.slot.start).toLocaleString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {' - '}
                  {new Date(appointment.slot.end).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {appointment.appointmentType === 'virtual' ? (
                  <div className="mt-2 flex items-center text-sm text-indigo-600">
                    <LinkIcon className="flex-shrink-0 mr-1.5 h-5 w-5" />
                    <a href={appointment.virtualDetails.joinUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Join virtual consultation
                    </a>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <MapPin className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {appointment.doctor.hospitalName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid Layout for Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Patient Information */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <UserCircle className="h-5 w-5 text-gray-500 mr-2" />
                  Patient Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-sm text-gray-900">{appointment.patient.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-1" />
                      {appointment.patient.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{appointment.patient.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  Appointment Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-sm text-gray-900">
                      {appointment.appointmentType === 'virtual' ? 'Virtual Consultation' : 'In-Person Visit'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reason</p>
                    <p className="text-sm text-gray-900">
                      {appointment.reason || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fee</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      ${appointment.fee.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-sm text-gray-900">
                      {appointment.note || 'No additional notes'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor Information */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <UserCircle className="h-5 w-5 text-gray-500 mr-2" />
                  Doctor Information
                </h2>
                <div className="flex items-start mb-4">
                  <img 
                    src={appointment.doctor.profilePhoto || '/doctor-avatar.jpg'} 
                    alt={appointment.doctor.fullName}
                    className="h-12 w-12 rounded-full object-cover mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{appointment.doctor.fullName}</p>
                    <p className="text-sm text-gray-500">{appointment.doctor.specialization}</p>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(appointment.doctor.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        ({appointment.doctor.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                {appointment.appointmentType !== 'virtual' && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                    <p className="text-sm text-gray-900 flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                      {appointment.doctor.hospitalName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCancelOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel Appointment
            </button>
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Reschedule
            </button>
          </div>
        </div>
      </main>

      {/* Reschedule Modal */}
      <Transition appear show={isRescheduleOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsRescheduleOpen(false)}>
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
                    Reschedule Appointment
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Select a new date and time for your appointment with {appointment.doctor.fullName}.
                    </p>
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <div className="relative flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 absolute right-2" />
                          <input
                            type="date"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-3 pr-8 py-2"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <div className="relative flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 absolute right-2" />
                          <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pl-3 pr-8 py-2">
                            <option>09:00 AM</option>
                            <option>09:30 AM</option>
                            <option>10:00 AM</option>
                            <option>10:30 AM</option>
                            <option>11:00 AM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsRescheduleOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        // Handle reschedule logic
                        setIsRescheduleOpen(false)
                      }}
                    >
                      Confirm Reschedule
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Cancel Modal */}
      <Transition appear show={isCancelOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCancelOpen(false)}>
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
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Cancel Appointment
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to cancel your appointment with {appointment.doctor.fullName} on {' '}
                          {new Date(appointment.slot.start).toLocaleDateString()}?
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700">
                      Reason for cancellation (optional)
                    </label>
                    <select
                      id="cancel-reason"
                      name="cancel-reason"
                      onChange={(e) => setCancellationReason(e.currentTarget.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select a reason</option>
                      <option value="schedule_conflict">Schedule conflict</option>
                      <option value="found_another_doctor">Found another doctor</option>
                      <option value="no_longer_needed">No longer needed</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setIsCancelOpen(false)}
                    >
                      Go Back
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={async () => {
                        await cancelAppointmentMutation.mutateAsync(appointmentId, { cancellationReason });
                        setIsCancelOpen(false)
                        navigate('/patient/appointments')
                      }}
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default AppointmentDetailsPage
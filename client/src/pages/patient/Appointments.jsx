import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Video, Stethoscope, CheckCircle2, XCircle, Clock4, CalendarCheck2, RotateCw } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import useGetApprovedDoctors from '@/hooks/useGetApprovedDoctors';
import useGetPatientAppointments from '@/hooks/useGetPatientAppointments';


const fetchAppointments = () => {
  // In a real app, this would be an API call
  return [
    {
      _id: '1',
      doctor: {
        _id: 'doc1',
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiology',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      },
      appointmentType: 'consultation',
      reason: 'Heart palpitations',
      slot: {
        start: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        end: new Date(Date.now() + 5400000).toISOString(), // 1.5 hours from now
      },
      status: 'confirmed',
      videoCallToken: 'xyz123',
    },
    {
      _id: '2',
      doctor: {
        _id: 'doc2',
        name: 'Dr. Michael Chen',
        specialty: 'Dermatology',
        avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
      },
      appointmentType: 'follow-up',
      reason: 'Skin rash follow-up',
      slot: {
        start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        end: new Date(Date.now() + 87000000).toISOString(),
      },
      status: 'pending',
    },
    {
      _id: '3',
      doctor: {
        _id: 'doc3',
        name: 'Dr. Emily Wilson',
        specialty: 'Pediatrics',
        avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
      },
      appointmentType: 'check-up',
      reason: 'Annual physical',
      slot: {
        start: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        end: new Date(Date.now() - 258300000).toISOString(),
      },
      status: 'completed',
    },
    {
      _id: '4',
      doctor: {
        _id: 'doc4',
        name: 'Dr. Robert Garcia',
        specialty: 'Neurology',
        avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
      },
      appointmentType: 'therapy',
      reason: 'Migraine management',
      slot: {
        start: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
        end: new Date(Date.now() + 606600000).toISOString(),
      },
      status: 'confirmed',
    },
  ];
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  declined: 'bg-gray-100 text-gray-800',
  'no-show': 'bg-purple-100 text-purple-800',
  rescheduled: 'bg-orange-100 text-orange-800',
};

const typeIcons = {
  consultation: <Stethoscope className="h-5 w-5 text-blue-500" />,
  'follow-up': <RotateCw className="h-5 w-5 text-green-500" />,
  emergency: <XCircle className="h-5 w-5 text-red-500" />,
  therapy: <CheckCircle2 className="h-5 w-5 text-indigo-500" />,
  'check-up': <CalendarCheck2 className="h-5 w-5 text-teal-500" />,
};

const Appointments = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const { data: response, isLoading } = useGetPatientAppointments();

  const filteredAppointments = response?.data?.appointments?.filter((appt) => {
    const isUpcoming = isFuture(parseISO(appt.slot.start));
    return activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
  });

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const formatTime = (dateString) => {
    return format(parseISO(dateString), 'h:mm a');
  };
  console.log(filteredAppointments)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl h-full shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-500 mt-1">
            {activeTab === 'upcoming' ? 'Upcoming appointments' : 'Appointment history'}
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments?.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <Calendar className="w-full h-full" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No {activeTab === 'upcoming' ? 'upcoming' : 'past'} appointments
            </h3>
            <p className="mt-1 text-gray-500">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming appointments scheduled."
                : "Your past appointments will appear here."}
            </p>
          </div>
        ) : (
          filteredAppointments?.map((appointment) => (
            <div
              key={appointment._id}
              className={`border rounded-xl p-5 hover:shadow-md transition-shadow ${
                selectedAppointment?._id === appointment._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedAppointment(appointment)}
            >
              <div className="flex items-start space-x-4">
                {/* Doctor Avatar */}
                <div className="flex-shrink-0">
                  {appointment.doctor?.avatar ? (
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={appointment.doctor?.avatar}
                      alt={appointment.doctor?.fullName}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Appointment Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {appointment.doctor?.fullName}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {appointment.doctor?.specialty}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="flex items-center text-sm text-gray-500">
                      {typeIcons[appointment.appointmentType]}
                      <span className="ml-2 capitalize">
                        {appointment.appointmentType.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="ml-2">
                        {formatDate(appointment.slot.start)}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="ml-2">
                        {formatTime(appointment.slot.start)} - {formatTime(appointment.slot.end)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {appointment.reason}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {appointment.status === 'confirmed' && isFuture(parseISO(appointment.slot.start)) && (
                  <>
                    {appointment.videoCallToken && (
                      <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Video className="h-3 w-3 mr-1" />
                        Join Video Call
                      </button>
                    )}
                    <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <RotateCw className="h-3 w-3 mr-1" />
                      Reschedule
                    </button>
                    <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancel
                    </button>
                  </>
                )}
                {appointment.status === 'pending' && (
                  <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    View Details
                  </button>
                )}
                {appointment.status === 'completed' && (
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    View Summary
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Doctor</h4>
                  <div className="mt-1 flex items-center">
                    {selectedAppointment.doctor?.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full mr-3"
                        src={selectedAppointment.doctor?.avatar}
                        alt={selectedAppointment.doctor?.fullName}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <Stethoscope className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {selectedAppointment.doctor?.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedAppointment.doctor?.specialty}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Appointment Type</h4>
                  <p className="mt-1 text-lg text-gray-900 capitalize">
                    {selectedAppointment.appointmentType.replace('-', ' ')}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
                  <p className="mt-1 text-lg text-gray-900">
                    {format(parseISO(selectedAppointment.slot.start), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-900">
                    {format(parseISO(selectedAppointment.slot.start), 'h:mm a')} -{' '}
                    {format(parseISO(selectedAppointment.slot.end), 'h:mm a')}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <span className={`mt-1 px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedAppointment.status]}`}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Reason</h4>
                  <p className="mt-1 text-lg text-gray-900">
                    {selectedAppointment.reason}
                  </p>
                </div>

                {selectedAppointment.videoCallToken && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Video Consultation</h4>
                    <p className="mt-1 text-gray-900">
                      This appointment includes a video consultation option.
                    </p>
                    <button className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <Video className="h-4 w-4 mr-2" />
                      Join Video Call
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setSelectedAppointment(null)}
                >
                  Close
                </button>
                {selectedAppointment.status === 'confirmed' && isFuture(parseISO(selectedAppointment.slot.start)) && (
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
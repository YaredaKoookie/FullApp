import { ArrowLeft, Calendar, Clock, MapPin, Stethoscope, User, ClipboardList, AlertCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AppointmentDetail = () => {
  const { id } = useParams();
  
  // Sample data - replace with actual data fetching
  const appointment = {
    id: id,
    doctor: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    date: "February 15, 2023",
    time: "10:30 AM",
    duration: "30 minutes",
    location: "Main Hospital, Cardiology Wing - Floor 3, Room 302",
    status: "Confirmed",
    purpose: "Follow-up on echocardiogram results",
    notes: "Patient reported improved symptoms since last visit. No chest pain in past 2 weeks.",
    preparation: "Fast for 4 hours prior to appointment. Bring current medications.",
    documents: [
      { name: "Echocardiogram Results", date: "Jan 10, 2023" },
      { name: "Bloodwork Report", date: "Jan 5, 2023" }
    ]
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="mb-8 flex items-center">
        <Link to="../appointments" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Appointment Details</h1>
          <p className="text-gray-500">Viewing appointment with {appointment.doctor}</p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Doctor header */}
        <div className="bg-indigo-50 p-6 flex items-start">
          <div className="bg-indigo-100 text-indigo-600 rounded-full w-16 h-16 flex items-center justify-center mr-4">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{appointment.doctor}</h2>
            <div className="flex items-center mt-1">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {appointment.specialty}
              </span>
              <span className={`ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                appointment.status === 'Confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {appointment.status}
              </span>
            </div>
          </div>
        </div>

        {/* Appointment details */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column */}
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                Appointment Information
              </h3>
              <div className="space-y-3">
                <div className="flex">
                  <span className="text-gray-500 w-28 flex-shrink-0">Date:</span>
                  <span className="font-medium">{appointment.date}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-28 flex-shrink-0">Time:</span>
                  <span className="font-medium">{appointment.time} ({appointment.duration})</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-28 flex-shrink-0">Location:</span>
                  <span className="font-medium">{appointment.location}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-28 flex-shrink-0">Purpose:</span>
                  <span className="font-medium">{appointment.purpose}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" />
                Preparation Instructions
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-blue-800">{appointment.preparation}</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Doctor's Notes
              </h3>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <p className="text-gray-700">{appointment.notes}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
                Related Documents
              </h3>
              <div className="space-y-3">
                {appointment.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">Uploaded: {doc.date}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end space-x-3">
          <Button variant="outline">
            Reschedule
          </Button>
          <Button variant="outline">
            Cancel Appointment
          </Button>
          <Button>
            Join Virtual Visit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;
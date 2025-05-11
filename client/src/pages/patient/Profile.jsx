import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Droplet, 
  HeartPulse, 
  Bell, 
  Globe, 
  Lock, 
  Edit2,
  Check,
  X,
  ChevronDown
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

const PatientProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [patientData, setPatientData] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch patient data (replace with your API call)
  useEffect(() => {
    // Mock data - replace with actual API call
    const fetchPatientData = async () => {
      const mockData = {
        name: "John Doe",
        profileImage: null,
        gender: "male",
        phone: "+1234567890",
        dob: "1985-04-15",
        bloodType: "A+",
        preferredLanguage: "English",
        maritalStatus: "married",
        notificationPreferences: {
          systemNotification: true,
          emailNotification: false,
          smsNotification: true
        },
        emergencyContact: [
          {
            name: "Jane Doe",
            relation: "Spouse",
            phone: "+1987654321",
            email: "jane@example.com"
          }
        ],
        insurance: [
          {
            provider: "Blue Cross",
            policyNumber: "BC123456789",
            coverageDetails: "Full coverage",
            validTill: "2025-12-31",
            status: "active"
          }
        ],
        location: {
          locationType: "home",
          country: "United States",
          city: "New York",
          address: "123 Main St",
          postalCode: "10001",
          state: "NY",
          coordinates: {
            type: "Point",
            coordinates: [-74.006, 40.7128]
          }
        }
      };
      setPatientData(mockData);
      reset(mockData); // Initialize form with data
    };

    fetchPatientData();
  }, [reset]);

  const onSubmit = (data) => {
    console.log("Updated data:", data);
    // Here you would typically make an API call to update the patient data
    setIsEditing(false);
    setPatientData(data);
  };

  const onCancel = () => {
    reset(patientData);
    setIsEditing(false);
  };

  if (!patientData) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? "Update your personal information" : "View and manage your profile"}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`${activeTab === 'personal' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className={`${activeTab === 'emergency' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Emergency Contacts
          </button>
          <button
            onClick={() => setActiveTab('insurance')}
            className={`${activeTab === 'insurance' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Insurance
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`${activeTab === 'notifications' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Notifications
          </button>
        </nav>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'personal' && (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Image */}
              <div className="md:col-span-2 flex items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                    {patientData.profileImage ? (
                      <img src={patientData.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      patientData.name.charAt(0)
                    )}
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
                {isEditing && (
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700">Change Photo</label>
                    <input
                      type="file"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    {...register("name", { required: "Name is required" })}
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-gray-900">{patientData.nwame}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Gender
                </label>
                {isEditing ? (
                  <select
                    {...register("gender")}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{patientData.gender}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    {...register("phone", { 
                      required: "Phone is required",
                      pattern: {
                        value: /^\+?[1-9]\d{1,14}$/,
                        message: "Invalid phone number format"
                      }
                    })}
                    type="tel"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-gray-900">{patientData.phone}</p>
                )}
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    {...register("dob", { 
                      required: "Date of birth is required",
                      validate: value => new Date(value) < new Date() || "Date must be in the past"
                    })}
                    type="date"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-gray-900">{new Date(patientData.dob).toLocaleDateString()}</p>
                )}
                {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>}
              </div>

              {/* Blood Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Droplet className="w-4 h-4 mr-2 text-gray-400" />
                  Blood Type
                </label>
                {isEditing ? (
                  <select
                    {...register("bloodType")}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{patientData.bloodType || "Unknown"}</p>
                )}
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <HeartPulse className="w-4 h-4 mr-2 text-gray-400" />
                  Marital Status
                </label>
                {isEditing ? (
                  <select
                    {...register("maritalStatus")}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{patientData.maritalStatus || "Not specified"}</p>
                )}
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-gray-400" />
                  Preferred Language
                </label>
                {isEditing ? (
                  <select
                    {...register("preferredLanguage")}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{patientData.preferredLanguage}</p>
                )}
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Location Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    {isEditing ? (
                      <input
                        {...register("location.country", { required: "Country is required" })}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{patientData.location.country}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    {isEditing ? (
                      <input
                        {...register("location.city", { required: "City is required" })}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{patientData.location.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    {isEditing ? (
                      <input
                        {...register("location.address")}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{patientData.location.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    {isEditing ? (
                      <input
                        {...register("location.postalCode")}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{patientData.location.postalCode}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    {isEditing ? (
                      <input
                        {...register("location.state")}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{patientData.location.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                    {isEditing ? (
                      <select
                        {...register("location.locationType")}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize">{patientData.location.locationType}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contacts</h3>
            {patientData.emergencyContact.map((contact, index) => (
              <div key={index} className="mb-6 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.name`, { required: "Name is required" })}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.relation`, { required: "Relationship is required" })}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.relation}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.phone`, { 
                          required: "Phone is required",
                          pattern: {
                            value: /^\+?[1-9]\d{1,14}$/,
                            message: "Invalid phone number format"
                          }
                        })}
                        type="tel"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.email`)}
                        type="email"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.email || "Not provided"}</p>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Contact
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                type="button"
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + Add Emergency Contact
              </button>
            )}
          </div>
        )}

        {activeTab === 'insurance' && (
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>
            {patientData.insurance.map((insurance, index) => (
              <div key={index} className="mb-6 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    {isEditing ? (
                      <input
                        {...register(`insurance.${index}.provider`, { required: "Provider is required" })}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{insurance.provider}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                    {isEditing ? (
                      <input
                        {...register(`insurance.${index}.policyNumber`, { required: "Policy number is required" })}
                        type="text"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{insurance.policyNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Details</label>
                    {isEditing ? (
                      <textarea
                        {...register(`insurance.${index}.coverageDetails`)}
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{insurance.coverageDetails || "Not specified"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                    {isEditing ? (
                      <input
                        {...register(`insurance.${index}.validTill`)}
                        type="date"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {insurance.validTill ? new Date(insurance.validTill).toLocaleDateString() : "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {isEditing ? (
                      <select
                        {...register(`insurance.${index}.status`)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize">{insurance.status}</p>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Insurance
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                type="button"
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + Add Insurance
              </button>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    System Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications within the application</p>
                </div>
                {isEditing ? (
                  <input
                    {...register("notificationPreferences.systemNotification")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patientData.notificationPreferences.systemNotification ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {patientData.notificationPreferences.systemNotification ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                {isEditing ? (
                  <input
                    {...register("notificationPreferences.emailNotification")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patientData.notificationPreferences.emailNotification ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {patientData.notificationPreferences.emailNotification ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    SMS Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications via text message</p>
                </div>
                {isEditing ? (
                  <input
                    {...register("notificationPreferences.smsNotification")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patientData.notificationPreferences.smsNotification ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {patientData.notificationPreferences.smsNotification ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        {isEditing && (
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6 flex justify-end space-x-3 bg-gray-50">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </form>

      {/* Security Section (always visible) */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-indigo-600" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Password</p>
                <p className="text-sm text-gray-500">Last changed 3 months ago</p>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Change Password
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
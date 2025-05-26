import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
  ChevronDown,
} from "lucide-react";
// import { Menu, Transition } from "@headlessui/react";
import Loading from "@/components/Loading";
import { useGetPatientProfile, useUpdateProfile, useUpdateProfileImage } from "@api/patient";

const PatientProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [patientData, setPatientData] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const updateProfileImageMutation = useUpdateProfileImage();
  const updateProfileMutation = useUpdateProfile();
  const { isLoading: isProfileLoading, data: response } = useGetPatientProfile();

  if (isProfileLoading) return <Loading />;

  console.log(response);
  const profile = response?.data?.user;

  if (!profile) {
    return <div>Unable to load profile please try again</div>;
  }

  if (profile && !profile.emergencyContact?.length) {
    profile.emergencyContact = [
      {

        name: "Not provided",
        relation: "Not Provided",
        phone: "Not Provided",
        email: "Not Provided",
      },
    ];
  }
  if (profile && !profile.insurance?.length) {
    profile.insurance = [
      {
        provider: "",
        policyNumber: "",
        coverageDetails: "",
        validTill: "",
        status: "",
      },
    ];
  }

  const onSubmit = async (data) => {
    console.log("Updated data:", data);
    // Here you would typically make an API call to update the patient data
    await updateProfileMutation.mutateAsync(data);
    setIsEditing(false);
    setPatientData(data);
  };

  const onProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    const formData = new FormData();
    if (!file) return;
    formData.append("profileImage", file);
    updateProfileImageMutation.mutate(formData);
  };

  const onCancel = () => {
    reset(patientData);
    setIsEditing(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            My Profile
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing
              ? "Update your personal information"
              : "View and manage your profile"}
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
            onClick={() => setActiveTab("personal")}
            className={`${
              activeTab === "personal"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab("emergency")}
            className={`${
              activeTab === "emergency"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Emergency Contacts
          </button>
          <button
            onClick={() => setActiveTab("insurance")}
            className={`${
              activeTab === "insurance"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Insurance
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`${
              activeTab === "notifications"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Notifications
          </button>
        </nav>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {activeTab === "personal" && (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Image */}
              <div className="md:col-span-2 flex items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt="Profile"
                        className={`w-full h-full rounded-full object-cover ${updateProfileImageMutation.isPending ? "animate-pulse" : ""}`}
                      />
                    ) : (
                      profile.firstName
                    )}
                  </div>
                  {
                    <button
                      type="button"
                      disabled={updateProfileImageMutation.isPending}
                      className="absolute disabled:opacity-50 disabled:cursor-not-allowed bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                  }
                </div>
                {
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Change Photo
                    </label>
                    <input
                      onChange={onProfileImageChange}
                      type="file"
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                }
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    {...register("firstName", { required: "Name is required" })}
                    type="text"
                    defaultValue={profile.firstName}
                    className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-gray-900">{profile.fullName}</p>
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
                    defaultValue={profile.gender.toLowerCase()}
                    className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 capitalize">{profile.gender}</p>
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
                        value: /^(\+251|0)(9|7)\d{8}$|^\+?\d{1,3}[-. ]?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}$/,
                        message: "Invalid phone number format",
                      },
                    })}
                    defaultValue={profile.phone}
                    type="tel"
                    className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-gray-900">{profile.phone}</p>
                )}
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Date of Birth
                </label>
                {console.log(profile.date)}
                {isEditing ? (
                  <input
                    {...register("dateOfBirth", {
                      required: "Date of birth is required",
                      validate: (value) =>
                        new Date(value) < new Date() ||
                        "Date must be in the past",
                    })}
                    defaultValue={profile.dateOfBirth?.split("T")[0]}
                    type="date"
                    className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-gray-900">
                    {new Date(profile.dateOfBirth).toLocaleDateString()}
                  </p>
                )}
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dateOfBirth.message}
                  </p>
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
                    defaultValue={profile.maritalStatus}
                    className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  <p className="text-gray-900 capitalize">
                    {profile.maritalStatus || "Not specified"}
                  </p>
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
                    defaultValue={profile.preferredLanguage}
                    className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.preferredLanguage}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    {isEditing ? (
                      <input
                        {...register("location.country", {
                          required: "Country is required",
                        })}
                        defaultValue={profile.location?.country}
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.location.country}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    {isEditing ? (
                      <input
                        {...register("location.city", {
                          required: "City is required",
                        })}
                        defaultValue={profile.location?.city}
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.location.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        {...register("location.address")}
                        type="text"
                        defaultValue={profile.location?.address}
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.location.address || "Unknown"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    {isEditing ? (
                      <input
                        {...register("location.postalCode")}
                        defaultValue={profile.postalCode}
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.location.postalCode || "Unknown"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    {isEditing ? (
                      <input
                        {...register("location.state")}
                        defaultValue={profile.location.state}
                        
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile.location.state || "Unknown"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "emergency" && (
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Emergency Contacts
            </h3>
            {profile.emergencyContact.map((contact, index) => (
              <div
                key={index}
                className="mb-6 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.name`, {
                          required: "Name is required",
                        })}
                        defaultValue={contact.name}
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.relation`, {
                          required: "Relationship is required",
                        })}
                        defaultValue={contact.relation}
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.relation}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.phone`, {
                          required: "Phone is required",
                          pattern: {
                            value: /^\+?[1-9]\d{1,14}$/,
                            message: "Invalid phone number format",
                          },
                        })}
                        defaultValue={contact.phone}
                        type="tel"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        {...register(`emergencyContact.${index}.email`)}
                        type="email"
                        defaultValue={contact.email}
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {contact.email || "Not provided"}
                      </p>
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

        {activeTab === "insurance" && (
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Insurance Information
            </h3>
            {profile.insurance.map((insurance, index) => (
              <div
                key={index}
                className="mb-6 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    {isEditing ? (
                      <input
                        {...register(`insurance.${index}.provider`, {
                          required: "Provider is required",
                        })}
                        defaultValue={insurance.provider}
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{insurance.provider}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Number
                    </label>
                    {isEditing ? (
                      <input
                        {...register(`insurance.${index}.policyNumber`, {
                          required: "Policy number is required",
                        })}
                        defaultValue={insurance.policyNumber}
                        type="text"
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">{insurance.policyNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coverage Details
                    </label>
                    {isEditing ? (
                      <textarea
                        {...register(`insurance.${index}.coverageDetails`)}
                        rows={3}
                        defaultValue={insurance.coverageDetails}
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {insurance.coverageDetails || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until
                    </label>
                    {isEditing ? (
                      <input
                        {...register(`insurance.${index}.validTill`)}
                        type="date"
                        defaultValue={insurance.validTill}
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {insurance.validTill
                          ? new Date(insurance.validTill).toLocaleDateString()
                          : "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    {isEditing ? (
                      <select
                        {...register(`insurance.${index}.status`)}
                        defaultValue={insurance.status}
                        className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize">
                        {insurance.status}
                      </p>
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

        {activeTab === "notifications" && (
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    System Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive notifications within the application
                  </p>
                </div>
                {isEditing ? (
                  <input
                    {...register("notificationPreferences.systemNotification")}
                    defaultChecked={profile.notificationPreferences?.systemNotification}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      profile.notificationPreferences.systemNotification
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {profile.notificationPreferences.systemNotification
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                {isEditing ? (
                  <input
                    {...register("notificationPreferences.emailNotification")}
                    defaultChecked={profile.notificationPreferences?.emailNotification}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      profile.notificationPreferences.emailNotification
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {profile.notificationPreferences.emailNotification
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    SMS Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive notifications via text message
                  </p>
                </div>
                {isEditing ? (
                  <input
                    {...register("notificationPreferences.smsNotification")}
                    checked={profile.notificationPreferences?.smsNotification}
              
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      profile.notificationPreferences.smsNotification
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {profile.notificationPreferences.smsNotification
                      ? "Enabled"
                      : "Disabled"}
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

  
    </div>
  );
};

export default PatientProfile;

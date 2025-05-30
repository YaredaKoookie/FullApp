import { useState, useEffect, Fragment, useRef } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Dialog, Transition, Tab, Listbox, ListboxOptions, ListboxOption, ListboxButton } from "@headlessui/react";
import {
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  Bell,
  BellOff,
  Check,
  X,
} from "lucide-react";
import {
  useAddEmergencyContact,
  useAddInsurance,
  useDeleteEmergencyContact,
  useDeleteInsurance,
  useGetPatientProfile,
  useUpdateEmergencyContact,
  useUpdateInsurance,
  useUpdateProfile,
  useUpdateProfileImage,
} from "@/api/patient";

const PatientProfile = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("");
  const [isEditingContact, setIsEditingContact] = useState(null);
  const [isEditingInsurance, setIsEditingInsurance] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = useRef(null);

// Add this function to handle file selection
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setSelectedFile(file);
    // Immediately upload the file when selected
    uploadProfileImage(file);
  }
};



  // Fetch patient data
  const { data: profileResponse, isLoading } = useGetPatientProfile();

  const patient = profileResponse?.data?.user;

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      phone: "",
      dateOfBirth: "",
      preferredLanguage: "English",
      maritalStatus: "",
      notificationPreferences: {
        systemNotification: true,
        emailNotification: false,
        smsNotification: false,
      },
      location: {
        locationType: "home",
        country: "",
        city: "",
        address: "",
        postalCode: "",
        state: "",
        coordinates: [0, 0],
      },
      newEmergencyContact: {
        name: "",
        relation: "",
        phone: "",
        email: "",
      },
      newInsurance: {
        provider: "",
        policyNumber: "",
        coverageDetails: "",
        validTill: "",
        status: "active",
      },
    },
  });

  console.log("location", watch("location"))

  // Reset form with patient data when loaded
  useEffect(() => {
    if (patient) {
      reset({
        ...patient,
        dateOfBirth: patient.dateOfBirth
          ? format(new Date(patient.dateOfBirth), "yyyy-MM-dd")
          : "",
        location: {
          ...patient.location,
          coordinates: patient.location?.coordinates || [0, 0],
        },
      });
    }

    if (patient && isEditingContact && isEditingContact !== "new") {
      const editingContact = patient.emergencyContact.find(
        (e) => e._id === isEditingContact
      );
      setValue("newEmergencyContact", {
        name: editingContact?.name || "",
        relation: editingContact?.relation || "",
        phone: editingContact?.phone || "",
        email: editingContact?.email || "",
      });
    }

    if (patient && isEditingInsurance && isEditingInsurance !== "new") {
      const editingInsurance = patient.insurance.find(
        (e) => e._id === isEditingInsurance
      );
      setValue("newInsurance", {
        provider: editingInsurance?.provider || "",
        policyNumber: editingInsurance?.policyNumber || "",
        coverageDetails: editingInsurance?.coverageDetails || "",
        validTill: editingInsurance?.validTill || "",
        status: editingInsurance?.status || "",
      });
    }
  }, [patient, reset, isEditingContact, isEditingInsurance, setValue]);

  // Update profile mutation
  const updateProfileMutation = useUpdateProfile();

  // Handle form submission
  const onSubmit = async (data) => {
    const formattedData = {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth).toISOString(),
    };
    await updateProfileMutation.mutateAsync(formattedData);
    setIsEditMode(false);
  };

  const updateProfileImageMutation = useUpdateProfileImage();

  // Add this function to handle the upload
const uploadProfileImage = async (file) => {
  setIsUploading(true);
  const formData = new FormData();
  formData.append('profileImage', file);

  try {
    await updateProfileImageMutation.mutateAsync(formData)
  } finally {
    setIsUploading(false);
    setSelectedFile(null);
  }
};

  // Insurance mutations
  const addInsuranceMutation = useAddInsurance();

  const updateInsuranceMutation = useUpdateInsurance();

  const deleteInsuranceMutation = useDeleteInsurance();
  // Emergency contact mutations
  const addEmergencyContactMutation = useAddEmergencyContact();

  const updateEmergencyContactMutation = useUpdateEmergencyContact();

  const deleteEmergencyContactMutation = useDeleteEmergencyContact();

  // Toggle notification preference
  const toggleNotification = (type) => {
    const currentValue = watch(`notificationPreferences.${type}`);
    setValue(`notificationPreferences.${type}`, !currentValue);
    handleSubmit(onSubmit)();
  };

  // Location type options
  const locationTypes = [
    { id: "home", name: "Home" },
    { id: "work", name: "Work" },
    { id: "other", name: "Other" },
  ];

  // Marital status options
  const maritalStatuses = [
    { value: "", label: "Not specified" },
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "divorced", label: "Divorced" },
    { value: "widowed", label: "Widowed" },
    { value: "separated", label: "Separated" },
    { value: "other", label: "Other" },
  ];

  if (isLoading)
    return <div className="flex justify-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!isEditMode && activeTab === "profile" && (
            <button
              onClick={() => setIsEditMode(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </button>
          )}
          {isEditMode && activeTab === "profile" && (
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditMode(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-indigo-900/20 p-1 mb-8">
            {["Profile", "Insurance", "Emergency Contacts"].map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700
                   ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2
                   ${
                     selected
                       ? "bg-white shadow"
                       : "text-indigo-600 hover:bg-white/[0.12] hover:text-white"
                   }`
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            {/* Profile Tab */}
            <Tab.Panel>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Personal Information
                  </h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      {/* Profile Image */}
                      <div className="sm:col-span-1 flex flex-col items-center">
                        <div className="relative">
                          <img
                            className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
                            src={
                              selectedFile
                                ? URL.createObjectURL(selectedFile)
                                : patient.profileImage || "/default-profile.png"
                            }
                            alt="Profile"
                          />
                          {isEditMode && (
                            <>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                              >
                                {isUploading ? (
                                  <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                ) : (
                                  <Pencil className="h-4 w-4" />
                                )}
                              </button>
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                              />
                            </>
                          )}
                        </div>
                        {isUploading && (
                          <p className="mt-2 text-sm text-gray-500">
                            Uploading...
                          </p>
                        )}
                      </div>

                      {/* Personal Info */}
                      <div className="sm:col-span-2 mt-4 sm:mt-0">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-2">
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              First Name
                            </label>
                            {isEditMode ? (
                              <input
                                type="text"
                                {...register("firstName", {
                                  required: "First name is required",
                                })}
                                className={`mt-1 block w-full border ${
                                  errors.firstName
                                    ? "border-red-300"
                                    : "border-gray-300"
                                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                              />
                            ) : (
                              <p className="mt-1 text-sm text-gray-900">
                                {patient.firstName}
                              </p>
                            )}
                            {errors.firstName && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.firstName.message}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor="middleName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Middle Name
                            </label>
                            {isEditMode ? (
                              <input
                                type="text"
                                {...register("middleName", {
                                  required: "Middle name is required",
                                })}
                                className={`mt-1 block w-full border ${
                                  errors.middleName
                                    ? "border-red-300"
                                    : "border-gray-300"
                                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                              />
                            ) : (
                              <p className="mt-1 text-sm text-gray-900">
                                {patient.middleName}
                              </p>
                            )}
                            {errors.middleName && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.middleName.message}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Last Name
                            </label>
                            {isEditMode ? (
                              <input
                                type="text"
                                {...register("lastName", {
                                  required: "Last name is required",
                                })}
                                className={`mt-1 block w-full border ${
                                  errors.lastName
                                    ? "border-red-300"
                                    : "border-gray-300"
                                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                              />
                            ) : (
                              <p className="mt-1 text-sm text-gray-900">
                                {patient.lastName}
                              </p>
                            )}
                            {errors.lastName && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.lastName.message}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor="gender"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Gender
                            </label>
                            {isEditMode ? (
                              <select
                                {...register("gender", {
                                  required: "Gender is required",
                                })}
                                className={`mt-1 block w-full border ${
                                  errors.gender
                                    ? "border-red-300"
                                    : "border-gray-300"
                                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                              >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            ) : (
                              <p className="mt-1 text-sm text-gray-900 capitalize">
                                {patient.gender}
                              </p>
                            )}
                            {errors.gender && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.gender.message}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Phone Number
                            </label>
                            {isEditMode ? (
                              <input
                                type="tel"
                                {...register("phone", {
                                  required: "Phone number is required",
                                })}
                                className={`mt-1 block w-full border ${
                                  errors.phone
                                    ? "border-red-300"
                                    : "border-gray-300"
                                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                              />
                            ) : (
                              <p className="mt-1 text-sm text-gray-900">
                                {patient.phone}
                              </p>
                            )}
                            {errors.phone && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.phone.message}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor="dateOfBirth"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Date of Birth
                            </label>
                            {isEditMode ? (
                              <input
                                type="date"
                                {...register("dateOfBirth", {
                                  required: "Date of birth is required",
                                })}
                                className={`mt-1 block w-full border ${
                                  errors.dateOfBirth
                                    ? "border-red-300"
                                    : "border-gray-300"
                                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                              />
                            ) : (
                              <p className="mt-1 text-sm text-gray-900">
                                {patient.dateOfBirth
                                  ? format(
                                      new Date(patient.dateOfBirth),
                                      "MMMM d, yyyy"
                                    )
                                  : "Not specified"}
                              </p>
                            )}
                            {errors.dateOfBirth && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.dateOfBirth.message}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="preferredLanguage"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Preferred Language
                            </label>
                            {isEditMode ? (
                              <input
                                type="text"
                                {...register("preferredLanguage")}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            ) : (
                              <p className="mt-1 text-sm text-gray-900">
                                {patient.preferredLanguage || "Not specified"}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-3">
                            <label
                              htmlFor="maritalStatus"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Marital Status
                            </label>
                            {isEditMode ? (
                              <select
                                {...register("maritalStatus")}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              >
                                {maritalStatuses.map((status) => (
                                  <option
                                    key={status.value}
                                    value={status.value}
                                  >
                                    {status.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="mt-1 text-sm text-gray-900">
                                {maritalStatuses.find(
                                  (s) => s.value === patient.maritalStatus
                                )?.label || "Not specified"}
                              </p>
                            )}
                          </div>

                          {/* Location Section */}
                          <div className="sm:col-span-6">
                            <h4 className="text-md font-medium text-gray-900 mb-2">
                              Location Information
                            </h4>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 md:grid-cols-5">
                              <div className="sm:col-span-2">
                                <label
                                  htmlFor="location.locationType"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Location Type
                                </label>
                                {isEditMode ? (
                                  <Listbox
                                    {...register("location.locationType")}
                                    onChange={value => setValue("location.locationType", value)}
                                  >
                                    <div className="relative mt-1 !z-50">
                                      <ListboxButton className="relative z-50 w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                                        <span className="block truncate">
                                          {watch("location.locationType") || locationTypes[0]?.id}
                                        </span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                          <ChevronDown
                                            className="h-5 w-5 text-gray-400"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      </ListboxButton>
                                    
                                        <ListboxOptions className="absolute ring  z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg focus:outline-none sm:text-sm">
                                          {locationTypes.map((locationType) => (
                                            <ListboxOption
                                              key={locationType.id}
                                              className="group relative  text-gray-900 cursor-default select-none py-2 pl-10 pr-4 data-focus:bg-indigo-100 data-focus:text-indigo-900"   
                                              value={locationType.id}
                                            >                                              
                                                  <span
                                                    className="group-data-selected:font-semibold"
                                                  >
                                                    {locationType?.name}
                                                  </span>
                                                    <span className="absolute hidden group-data-selected:flex inset-y-0 left-0 items-center pl-3 text-indigo-600">
                                                      <Check
                                                        className="h-5 w-5"
                                                        aria-hidden="true"
                                                      />
                                                    </span>
                                            </ListboxOption>
                                          ))}
                                        </ListboxOptions>
                                    </div>
                                  </Listbox>
                                ) : (
                                  <p className="mt-1 text-sm text-gray-900 capitalize">
                                    {patient.location?.locationType ||
                                      "Not specified"}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-3">
                                <label
                                  htmlFor="location.country"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Country
                                </label>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    {...register("location.country", {
                                      required: "Country is required",
                                    })}
                                    className={`mt-1 block w-full border ${
                                      errors.location?.country
                                        ? "border-red-300"
                                        : "border-gray-300"
                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                  />
                                ) : (
                                  <p className="mt-1 text-sm text-gray-900">
                                    {patient.location?.country ||
                                      "Not specified"}
                                  </p>
                                )}
                                {errors.location?.country && (
                                  <p className="mt-1 text-sm text-red-600">
                                    {errors.location.country.message}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-2">
                                <label
                                  htmlFor="location.city"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  City
                                </label>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    {...register("location.city", {
                                      required: "City is required",
                                    })}
                                    className={`mt-1 block w-full border ${
                                      errors.location?.city
                                        ? "border-red-300"
                                        : "border-gray-300"
                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                  />
                                ) : (
                                  <p className="mt-1 text-sm text-gray-900">
                                    {patient.location?.city || "Not specified"}
                                  </p>
                                )}
                                {errors.location?.city && (
                                  <p className="mt-1 text-sm text-red-600">
                                    {errors.location.city.message}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-3">
                                <label
                                  htmlFor="location.address"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Address
                                </label>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    {...register("location.address")}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                ) : (
                                  <p className="mt-1 text-sm text-gray-900">
                                    {patient.location?.address ||
                                      "Not specified"}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-2">
                                <label
                                  htmlFor="location.state"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  State/Province
                                </label>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    {...register("location.state")}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                ) : (
                                  <p className="mt-1 text-sm text-gray-900">
                                    {patient.location?.state || "Not specified"}
                                  </p>
                                )}
                              </div>

                              <div className="sm:col-span-3">
                                <label
                                  htmlFor="location.postalCode"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Postal Code
                                </label>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    {...register("location.postalCode")}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                ) : (
                                  <p className="mt-1 text-sm text-gray-900">
                                    {patient.location?.postalCode ||
                                      "Not specified"}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notification Preferences */}
                          <div className="sm:col-span-6">
                            <h4 className="text-md font-medium text-gray-900 mb-2">
                              Notification Preferences
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleNotification("systemNotification")
                                  }
                                  className={`mr-3 flex items-center justify-center h-8 w-8 rounded-full ${
                                    watch(
                                      "notificationPreferences.systemNotification"
                                    )
                                      ? "bg-indigo-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  {watch(
                                    "notificationPreferences.systemNotification"
                                  ) ? (
                                    <Bell className="h-5 w-5 text-white" />
                                  ) : (
                                    <BellOff className="h-5 w-5 text-gray-600" />
                                  )}
                                </button>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    System Notifications
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    In-app notifications
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleNotification("emailNotification")
                                  }
                                  className={`mr-3 flex items-center justify-center h-8 w-8 rounded-full ${
                                    watch(
                                      "notificationPreferences.emailNotification"
                                    )
                                      ? "bg-indigo-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  {watch(
                                    "notificationPreferences.emailNotification"
                                  ) ? (
                                    <Bell className="h-5 w-5 text-white" />
                                  ) : (
                                    <BellOff className="h-5 w-5 text-gray-600" />
                                  )}
                                </button>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Email Notifications
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Notifications via email
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleNotification("smsNotification")
                                  }
                                  className={`mr-3 flex items-center justify-center h-8 w-8 rounded-full ${
                                    watch(
                                      "notificationPreferences.smsNotification"
                                    )
                                      ? "bg-indigo-600"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  {watch(
                                    "notificationPreferences.smsNotification"
                                  ) ? (
                                    <Bell className="h-5 w-5 text-white" />
                                  ) : (
                                    <BellOff className="h-5 w-5 text-gray-600" />
                                  )}
                                </button>
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    SMS Notifications
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Text message notifications
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </Tab.Panel>

            {/* Insurance Tab */}
            <Tab.Panel>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Insurance Information
                  </h3>
                  <button
                    onClick={() => setIsEditingInsurance("new")}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Insurance
                  </button>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  {/* Add/Edit Insurance Form */}
                  {(isEditingInsurance === "new" || isEditingInsurance) && (
                    <div className="px-4 py-5 sm:p-6 bg-gray-50">
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        {isEditingInsurance === "new"
                          ? "Add New Insurance"
                          : "Edit Insurance"}
                      </h4>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newInsurance.provider"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Provider
                          </label>
                          <input
                            type="text"
                            {...register("newInsurance.provider", {
                              required: "Provider is required",
                            })}
                            className={`mt-1 block w-full border ${
                              errors.newInsurance?.provider
                                ? "border-red-300"
                                : "border-gray-300"
                            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          />
                          {errors.newInsurance?.provider && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.newInsurance.provider.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newInsurance.policyNumber"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Policy Number
                          </label>
                          <input
                            type="text"
                            {...register("newInsurance.policyNumber", {
                              required: "Policy number is required",
                            })}
                            className={`mt-1 block w-full border ${
                              errors.newInsurance?.policyNumber
                                ? "border-red-300"
                                : "border-gray-300"
                            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          />
                          {errors.newInsurance?.policyNumber && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.newInsurance.policyNumber.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-6">
                          <label
                            htmlFor="newInsurance.coverageDetails"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Coverage Details
                          </label>
                          <textarea
                            {...register("newInsurance.coverageDetails")}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newInsurance.validTill"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Valid Till
                          </label>
                          <input
                            type="date"
                            {...register("newInsurance.validTill")}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newInsurance.status"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Status
                          </label>
                          <select
                            {...register("newInsurance.status")}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>

                        <div className="sm:col-span-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setIsEditingInsurance(null)}
                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit(async (data) => {
                              if (isEditingInsurance === "new") {
                                await addInsuranceMutation.mutateAsync(
                                  data.newInsurance
                                );
                              } else {
                                await updateInsuranceMutation.mutateAsync({
                                  insuranceId: isEditingInsurance,
                                  ...data.newInsurance,
                                });
                              }
                              setValue("newInsurance", {
                                provider: "",
                                policyNumber: "",
                                coverageDetails: "",
                                validTill: "",
                                status: "active",
                              });
                              setIsEditingInsurance(null);
                            })}
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            {isEditingInsurance === "new"
                              ? "Add Insurance"
                              : "Update Insurance"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Insurance List */}
                  {patient.insurance?.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {patient.insurance.map((insurance) => (
                        <div key={insurance._id} className="py-4 px-4 sm:px-6">
                          {isEditingInsurance === insurance._id ? (
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                              {/* Edit form fields (same as add form) */}
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <div>
                                <h4 className="text-md font-medium text-indigo-600">
                                  {insurance.provider}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Policy #: {insurance.policyNumber}
                                </p>
                                {insurance.coverageDetails && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {insurance.coverageDetails}
                                  </p>
                                )}
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      insurance.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : insurance.status === "expired"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {insurance.status}
                                  </span>
                                  {insurance.validTill && (
                                    <span className="ml-2">
                                      Valid till:{" "}
                                      {format(
                                        new Date(insurance.validTill),
                                        "MMM d, yyyy"
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    setIsEditingInsurance(insurance._id)
                                  }
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setItemToDelete(insurance._id);
                                    setDeleteType("insurance");
                                    setOpenDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-12 text-center">
                      <p className="text-gray-500">
                        No insurance information available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>

            {/* Emergency Contacts Tab */}
            <Tab.Panel>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Emergency Contacts
                  </h3>
                  <button
                    onClick={() => setIsEditingContact("new")}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Contact
                  </button>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  {/* Add/Edit Emergency Contact Form */}
                  {(isEditingContact === "new" || isEditingContact) && (
                    <div className="px-4 py-5 sm:p-6 bg-gray-50">
                      <h4 className="text-md font-medium text-gray-900 mb-4">
                        {isEditingContact === "new"
                          ? "Add New Emergency Contact"
                          : "Edit Emergency Contact"}
                      </h4>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newEmergencyContact.name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Full Name
                          </label>
                          <input
                            type="text"
                            {...register("newEmergencyContact.name", {
                              required: "Name is required",
                            })}
                            className={`mt-1 block w-full border ${
                              errors.newEmergencyContact?.name
                                ? "border-red-300"
                                : "border-gray-300"
                            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          />
                          {errors.newEmergencyContact?.name && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.newEmergencyContact.name.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newEmergencyContact.relation"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Relationship
                          </label>
                          <input
                            type="text"
                            {...register("newEmergencyContact.relation", {
                              required: "Relationship is required",
                            })}
                            className={`mt-1 block w-full border ${
                              errors.newEmergencyContact?.relation
                                ? "border-red-300"
                                : "border-gray-300"
                            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          />
                          {errors.newEmergencyContact?.relation && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.newEmergencyContact.relation.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newEmergencyContact.phone"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            {...register("newEmergencyContact.phone", {
                              required: "Phone number is required",
                            })}
                            className={`mt-1 block w-full border ${
                              errors.newEmergencyContact?.phone
                                ? "border-red-300"
                                : "border-gray-300"
                            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                          />
                          {errors.newEmergencyContact?.phone && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.newEmergencyContact.phone.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-3">
                          <label
                            htmlFor="newEmergencyContact.email"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            {...register("newEmergencyContact.email")}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="sm:col-span-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setIsEditingContact(null)}
                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit(async (data) => {
                              if (isEditingContact === "new") {
                                await addEmergencyContactMutation.mutateAsync(
                                  data.newEmergencyContact
                                );
                                setValue("newEmergencyContact", {
                                  name: "",
                                  relation: "",
                                  phone: "",
                                  email: "",
                                });
                                setIsEditingContact(null);
                              } else {
                                await updateEmergencyContactMutation.mutateAsync(
                                  {
                                    contactId: isEditingContact,
                                    ...data.newEmergencyContact,
                                  }
                                );
                                setIsEditingContact(null);
                              }
                            })}
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            {isEditingContact === "new"
                              ? "Add Contact"
                              : "Update Contact"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emergency Contacts List */}
                  {patient.emergencyContact?.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {patient.emergencyContact.map((contact) => (
                        <div key={contact._id} className="py-4 px-4 sm:px-6">
                          {isEditingContact === contact._id ? (
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                              {/* Edit form fields (same as add form) */}
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <div>
                                <h4 className="text-md font-medium text-gray-900">
                                  {contact.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {contact.relation}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-gray-500 flex items-center">
                                    <span className="mr-2">📞</span>
                                    {contact.phone}
                                  </p>
                                  {contact.email && (
                                    <p className="text-sm text-gray-500 flex items-center">
                                      <span className="mr-2">✉️</span>
                                      {contact.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    setIsEditingContact(contact._id)
                                  }
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setItemToDelete(contact._id);
                                    setDeleteType("contact");
                                    setOpenDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-12 text-center">
                      <p className="text-gray-500">
                        No emergency contacts available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Delete Confirmation Modal */}
        <Transition.Root show={openDeleteModal} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={setOpenDeleteModal}
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
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <X
                          className="h-6 w-6 text-red-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-medium leading-6 text-gray-900"
                        >
                          Delete{" "}
                          {deleteType === "insurance"
                            ? "Insurance"
                            : "Emergency Contact"}
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete this{" "}
                            {deleteType === "insurance"
                              ? "insurance information"
                              : "emergency contact"}
                            ? This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={async () => {
                          if (deleteType === "insurance") {
                            await deleteInsuranceMutation.mutateAsync(
                              itemToDelete
                            );
                          } else {
                            await deleteEmergencyContactMutation.mutateAsync(
                              itemToDelete
                            );
                          }
                          setOpenDeleteModal(false);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={() => setOpenDeleteModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </div>
    </div>
  );
};

export default PatientProfile;

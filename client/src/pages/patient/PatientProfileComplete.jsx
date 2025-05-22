import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ChevronDown, Upload, X } from "lucide-react";
import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Listbox,
  Transition,
} from "@headlessui/react";
import apiClient from "@/lib/apiClient";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import queryClient from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

const genderOptions = [
  { id: 1, name: "Male", value: "male" },
  { id: 2, name: "Female", value: "female" },
  { id: 3, name: "Other", value: "other" },
];

const bloodTypeOptions = [
  { id: 1, name: "A+", value: "A+" },
  { id: 2, name: "A-", value: "A-" },
  { id: 3, name: "B+", value: "B+" },
  { id: 4, name: "B-", value: "B-" },
  { id: 5, name: "AB+", value: "AB+" },
  { id: 6, name: "AB-", value: "AB-" },
  { id: 7, name: "O+", value: "O+" },
  { id: 8, name: "O-", value: "O-" },
  { id: 9, name: "Unknown", value: "" },
];

const locationTypeOptions = [
  { id: 1, name: "Home", value: "home" },
  { id: 2, name: "Work", value: "work" },
  { id: 3, name: "Other", value: "other" },
];

export default function ProfileCompletion() {
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {login} = useAuth();

  const {
    register,
    handleSubmit,
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
      bloodType: "",
      dateOfBirth: "",
      emergencyContact: [
        {
          name: "",
          relation: "",
          phone: "",
          email: "",
        },
      ],
      location: {
        locationType: "home",
        country: "",
        city: "",
        address: "",
        postalCode: "",
        state: "",
        coordinates: [0, 0],
      },
    },
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      apiClient.post("/patient/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: (response) => {
      setIsSubmitting(false);
      setShowSuccess(true);
      queryClient.clear();
      const {user, accessToken} = response?.data;
      login(accessToken, user);
      setTimeout(() => setShowSuccess(true), 3000);
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message)
      console.error("Error submitting profile:", error);
      // Handle error (show toast, etc.)
    },
  });

  const onSubmit = (data) => {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("firstName", data.firstName);
    formData.append("middleName", data.middleName);
    formData.append("lastName", data.lastName);
    formData.append("gender", data.gender);
    formData.append("phone", data.phone);
    formData.append("bloodType", data.bloodType);
    formData.append("dateOfBirth", data.dateOfBirth);
    formData.append("emergencyContact", JSON.stringify(data.emergencyContact));
    formData.append("location", JSON.stringify(data.location));

    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    mutation.mutate(formData);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    setValue("profileImage", null);
  };

  // Automatically get user's location coordinates if possible
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue("location.coordinates", [
            position.coords.longitude,
            position.coords.latitude,
          ]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [setValue]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Please fill in the required information to complete your patient
            profile.
          </p>
        </div>

        <Dialog
          open={showSuccess}
          className="z-50 relative"
          onClose={() => navigate("/patient/dashboard", { replace: true })}
        >
          <DialogBackdrop className="fixed inset-0 bg-black/80" />
          <div className="fixed inset-0 flex items-center justify-center">
          <DialogPanel className="bg-gray-100 rounded max-w-md p-12 border-green-500 border-4 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <DialogTitle className="font-semibold text-lg mb-5">Profile Completed Successfully</DialogTitle>
            <Description className="font-medium text-gray-800 mb-8">
              You have completed your profile now you can access the platform as
              you need.
            </Description>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate("/patient/dashboard", { replace: true })}
                className="px-5 py-2 bg-green-500 hover:bg-green-400 rounded text-sm font-semibold text-white"
              >
                Ok
              </button>
            </div>
          </DialogPanel>
          </div>
        </Dialog>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Profile Image Upload */}
                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center">
                    <div className="relative rounded-full overflow-hidden h-24 w-24 bg-gray-100">
                      {profileImagePreview ? (
                        <>
                          <img
                            src={profileImagePreview}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <Upload className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <label
                        htmlFor="profileImage"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Upload className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                        {profileImagePreview ? "Change" : "Upload"}
                      </label>
                      <input
                        id="profileImage"
                        name="profileImage"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>
                </div>

                {/* First Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                    className={`mt-1 block w-full border ${
                      errors.firstName ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                {/* Middle Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="middleName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Middle Name *
                  </label>
                  <input
                    type="text"
                    id="middleName"
                    {...register("middleName", {
                      required: "Middle name is required",
                    })}
                    className={`mt-1 block w-full border ${
                      errors.middleName ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.middleName && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.middleName.message}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                    className={`mt-1 block w-full border ${
                      errors.lastName ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gender *
                  </label>
                  <Listbox
                    value={watch("gender")}
                    onChange={(value) => setValue("gender", value)}
                  >
                    {({ open }) => (
                      <>
                        <div className="mt-1 relative">
                          <Listbox.Button className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <span className="block truncate">
                              {genderOptions.find(
                                (g) => g.value === watch("gender")
                              )?.name || "Select gender"}
                            </span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            </span>
                          </Listbox.Button>

                          <Transition
                            show={open}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                              {genderOptions.map((gender) => (
                                <Listbox.Option
                                  key={gender.id}
                                  className={({ active }) =>
                                    `${
                                      active
                                        ? "text-white bg-blue-600"
                                        : "text-gray-900"
                                    } cursor-default select-none relative py-2 pl-3 pr-9`
                                  }
                                  value={gender.value}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`${
                                          selected
                                            ? "font-semibold"
                                            : "font-normal"
                                        } block truncate`}
                                      >
                                        {gender.name}
                                      </span>
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </>
                    )}
                  </Listbox>
                  {errors.gender && (
                    <p className="mt-2 text-sm text-red-600">
                      Gender is required
                    </p>
                  )}
                </div>

                {/* Blood Type */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="bloodType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Blood Type
                  </label>
                  <Listbox
                    value={watch("bloodType")}
                    onChange={(value) => setValue("bloodType", value)}
                  >
                    {({ open }) => (
                      <>
                        <div className="mt-1 relative">
                          <Listbox.Button className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <span className="block truncate">
                              {bloodTypeOptions.find(
                                (b) => b.value === watch("bloodType")
                              )?.name || "Select blood type"}
                            </span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            </span>
                          </Listbox.Button>

                          <Transition
                            show={open}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                              {bloodTypeOptions.map((bloodType) => (
                                <Listbox.Option
                                  key={bloodType.id}
                                  className={({ active }) =>
                                    `${
                                      active
                                        ? "text-white bg-blue-600"
                                        : "text-gray-900"
                                    } cursor-default select-none relative py-2 pl-3 pr-9`
                                  }
                                  value={bloodType.value}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`${
                                          selected
                                            ? "font-semibold"
                                            : "font-normal"
                                        } block truncate`}
                                      >
                                        {bloodType.name}
                                      </span>
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </>
                    )}
                  </Listbox>
                </div>

                {/* Phone */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register("phone", {
                      required: "Phone number is required",
                      pattern: {
                        value:
                          /^(\+?\d{1,3}[-. ]?)?(\(?\d{3}\)?[-. ]?)?\d{3}[-. ]?\d{4}$|^(\+251|0)(9|7)\d{8}$/,
                        message: "Invalid phone number format",
                      },
                    })}
                    className={`mt-1 block w-full border ${
                      errors.phone ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    {...register("dateOfBirth", {
                      required: "Date of birth is required",
                      validate: (value) => {
                        const selectedDate = new Date(value);
                        const today = new Date();
                        return (
                          selectedDate < today ||
                          "Date of birth must be in the past"
                        );
                      },
                    })}
                    className={`mt-1 block w-full border ${
                      errors.dateOfBirth ? "border-red-300" : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Emergency Contact
              </h2>

              {watch("emergencyContact")?.map((contact, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6"
                >
                  <div className="sm:col-span-6">
                    <h3 className="text-md font-medium text-gray-700">
                      Contact #{index + 1}
                    </h3>
                  </div>

                  {/* Name */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`emergencyContact.${index}.name`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id={`emergencyContact.${index}.name`}
                      {...register(`emergencyContact.${index}.name`, {
                        required: "Name is required",
                      })}
                      className={`mt-1 block w-full border ${
                        errors.emergencyContact?.[index]?.name
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {errors.emergencyContact?.[index]?.name && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.emergencyContact[index].name.message}
                      </p>
                    )}
                  </div>

                  {/* Relation */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`emergencyContact.${index}.relation`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Relationship *
                    </label>
                    <input
                      type="text"
                      id={`emergencyContact.${index}.relation`}
                      {...register(`emergencyContact.${index}.relation`, {
                        required: "Relationship is required",
                      })}
                      className={`mt-1 block w-full border ${
                        errors.emergencyContact?.[index]?.relation
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {errors.emergencyContact?.[index]?.relation && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.emergencyContact[index].relation.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`emergencyContact.${index}.phone`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id={`emergencyContact.${index}.phone`}
                      {...register(`emergencyContact.${index}.phone`, {
                        required: "Phone number is required",
                        pattern: {
                          value:
                            /^(\+?\d{1,3}[-. ]?)?(\(?\d{3}\)?[-. ]?)?\d{3}[-. ]?\d{4}$|^(\+251|0)(9|7)\d{8}$/,
                          message: "Invalid phone number format",
                        },
                      })}
                      className={`mt-1 block w-full border ${
                        errors.emergencyContact?.[index]?.phone
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {errors.emergencyContact?.[index]?.phone && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.emergencyContact[index].phone.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor={`emergencyContact.${index}.email`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id={`emergencyContact.${index}.email`}
                      {...register(`emergencyContact.${index}.email`, {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      className={`mt-1 block w-full border ${
                        errors.emergencyContact?.[index]?.email
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    />
                    {errors.emergencyContact?.[index]?.email && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.emergencyContact[index].email.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Location Information
              </h2>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Location Type */}
                <div className="sm:col-span-6">
                  <label
                    htmlFor="location.locationType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Location Type
                  </label>
                  <Listbox
                    value={watch("location.locationType")}
                    onChange={(value) =>
                      setValue("location.locationType", value)
                    }
                  >
                    {({ open }) => (
                      <>
                        <div className="mt-1 relative">
                          <Listbox.Button className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <span className="block truncate">
                              {locationTypeOptions.find(
                                (l) =>
                                  l.value === watch("location.locationType")
                              )?.name || "Select location type"}
                            </span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            </span>
                          </Listbox.Button>

                          <Transition
                            show={open}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                              {locationTypeOptions.map((locationType) => (
                                <Listbox.Option
                                  key={locationType.id}
                                  className={({ active }) =>
                                    `${
                                      active
                                        ? "text-white bg-blue-600"
                                        : "text-gray-900"
                                    } cursor-default select-none relative py-2 pl-3 pr-9`
                                  }
                                  value={locationType.value}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`${
                                          selected
                                            ? "font-semibold"
                                            : "font-normal"
                                        } block truncate`}
                                      >
                                        {locationType.name}
                                      </span>
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </>
                    )}
                  </Listbox>
                </div>

                {/* Country */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="location.country"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Country *
                  </label>
                  <input
                    type="text"
                    id="location.country"
                    {...register("location.country", {
                      required: "Country is required",
                    })}
                    className={`mt-1 block w-full border ${
                      errors.location?.country
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.location?.country && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.location.country.message}
                    </p>
                  )}
                </div>

                {/* City */}
                <div className="sm:col-span-3">
                  <label
                    htmlFor="location.city"
                    className="block text-sm font-medium text-gray-700"
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    id="location.city"
                    {...register("location.city", {
                      required: "City is required",
                    })}
                    className={`mt-1 block w-full border ${
                      errors.location?.city
                        ? "border-red-300"
                        : "border-gray-300"
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  />
                  {errors.location?.city && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.location.city.message}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="sm:col-span-6">
                  <label
                    htmlFor="location.address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="location.address"
                    {...register("location.address")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* State */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="location.state"
                    className="block text-sm font-medium text-gray-700"
                  >
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="location.state"
                    {...register("location.state")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Postal Code */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="location.postalCode"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="location.postalCode"
                    {...register("location.postalCode")}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Complete Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

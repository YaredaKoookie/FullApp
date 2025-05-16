import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  User,
  Calendar,
  BriefcaseMedical,
  GraduationCap,
  Languages,
  MapPin,
  Phone,
  DollarSign,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { Link, useNavigate } from "react-router-dom";

const DoctorProfileForm = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "male",
    dateOfBirth: "",
    specialization: "",
    qualifications: [{ degree: "", institution: "", year: "" }],
    yearsOfExperience: "",
    languages: [""],
    hospitalName: "",
    hospitalAddress: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Ethiopia",
      coordinates: [0, 0],
    },
    phoneNumber: "",
    consultationFee: "",
    serviceAreas: [""],
    bio: "",
    applicationNotes: "",
    nationalIdFront: null,
    nationalIdBack: null,
    licenseFront: null,
    licenseBack: null,
    boardCertificationsDocument: null,
    educationDocument: null,
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.specialization.trim())
      newErrors.specialization = "Specialization is required";
    if (!formData.yearsOfExperience)
      newErrors.yearsOfExperience = "Years of experience is required";
    if (!formData.hospitalName.trim())
      newErrors.hospitalName = "Hospital name is required";
    if (!formData.hospitalAddress.street1.trim())
      newErrors["hospitalAddress.street1"] = "Street address is required";
    if (!formData.hospitalAddress.city.trim())
      newErrors["hospitalAddress.city"] = "City is required";
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";
    if (!formData.consultationFee)
      newErrors.consultationFee = "Consultation fee is required";
    if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    if (!formData.applicationNotes.trim())
      newErrors.applicationNotes = "Application notes are required";

    // Qualifications validation
    formData.qualifications.forEach((qual, index) => {
      if (!qual.degree.trim())
        newErrors[`qualifications[${index}].degree`] = "Degree is required";
      if (!qual.institution.trim())
        newErrors[`qualifications[${index}].institution`] =
          "Institution is required";
      if (!qual.year)
        newErrors[`qualifications[${index}].year`] = "Year is required";
    });

    // Documents validation
    if (!formData.nationalIdFront)
      newErrors.nationalIdFront = "National ID front is required";
    if (!formData.nationalIdBack)
      newErrors.nationalIdBack = "National ID back is required";
    if (!formData.licenseFront)
      newErrors.licenseFront = "License front is required";
    if (!formData.licenseBack)
      newErrors.licenseBack = "License back is required";
    if (!formData.boardCertificationsDocument)
      newErrors.boardCertificationsDocument = "Board certification is required";
    if (!formData.educationDocument)
      newErrors.educationDocument = "Education document is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle qualification fields (nested array objects)
    if (name.includes("qualifications[")) {
      const matches = name.match(/qualifications\[(\d+)\]\.(\w+)/);
      if (matches) {
        const [_, index, property] = matches;
        setFormData((prev) => ({
          ...prev,
          qualifications: prev.qualifications.map((qual, i) =>
            i === parseInt(index) ? { ...qual, [property]: value } : qual
          ),
        }));
        return;
      }
    }

    // Handle other array fields (languages, serviceAreas)
    else if (name.includes("[") && name.includes("]")) {
      const matches = name.match(/(\w+)\[(\d+)\]/);
      if (matches) {
        const [_, arrayName, index] = matches;
        setFormData((prev) => {
          const newArray = [...prev[arrayName]];
          newArray[index] = value;
          return { ...prev, [arrayName]: newArray };
        });
        return;
      }
    }

    // Handle nested objects (hospitalAddress)
    else if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
      return;
    }

    // Handle regular fields
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        { degree: "", institution: "", year: "" },
      ],
    }));
  };

  const removeQualification = (index) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const addLanguage = () => {
    setFormData((prev) => ({
      ...prev,
      languages: [...prev.languages, ""],
    }));
  };

  const removeLanguage = (index) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  const addServiceArea = () => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: [...prev.serviceAreas, ""],
    }));
  };

  const removeServiceArea = (index) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== index),
    }));
  };

  const submitProfile = useMutation({
    mutationFn: async (formData) => {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      console.log(formData);
      // Append all fields
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("middleName", formData.middleName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("dateOfBirth", formData.dateOfBirth);
      formDataToSend.append("specialization", formData.specialization);
      formDataToSend.append(
        "qualifications",
        JSON.stringify(formData.qualifications)
      );
      formDataToSend.append("yearsOfExperience", formData.yearsOfExperience);
      formDataToSend.append("languages", JSON.stringify(formData.languages));
      formDataToSend.append("hospitalName", formData.hospitalName);
      formDataToSend.append(
        "hospitalAddress",
        JSON.stringify(formData.hospitalAddress)
      );
      formDataToSend.append("phoneNumber", formData.phoneNumber);
      formDataToSend.append("consultationFee", formData.consultationFee);
      formDataToSend.append(
        "serviceAreas",
        JSON.stringify(formData.serviceAreas)
      );
      formDataToSend.append("bio", formData.bio);
      formDataToSend.append("applicationNotes", formData.applicationNotes);

      // Append files
      formDataToSend.append("nationalIdFront", formData.nationalIdFront);
      formDataToSend.append("nationalIdBack", formData.nationalIdBack);
      formDataToSend.append("licenseFront", formData.licenseFront);
      formDataToSend.append("licenseBack", formData.licenseBack);
      formDataToSend.append(
        "boardCertificationsDocument",
        formData.boardCertificationsDocument
      );
      formDataToSend.append("educationDocument", formData.educationDocument);
      console.log("data", formDataToSend.entries());
      const response = await apiClient.post(
        "/doctors/profile/complete",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log("send successfull", data);
      toast.success("Profile submitted successfully!");
      setIsOpen(true);
    },
    onError: (error) => {
      toast.error(`Error submitting profile: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    console.log(e);
    e.preventDefault();
    if (validateForm()) {
      submitProfile.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-700 px-6 py-6">
            <h1 className="text-2xl font-bold text-white">
              Doctor Profile Submission
            </h1>
            <p className="text-indigo-200 mt-2">
              Please fill out all required fields to complete your profile
            </p>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-8">
            {/* Personal Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-indigo-600" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.specialization
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.specialization}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-indigo-600" />
                Qualifications <span className="text-red-500">*</span>
              </h2>

              {formData.qualifications.map((qual, index) => (
                <div
                  key={index}
                  className="mb-6 border-b pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Qualification #{index + 1}</h3>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeQualification(index)}
                        className="text-red-500 hover:text-red-700 flex items-center text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name={`qualifications[${index}].degree`}
                        value={qual.degree}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors[`qualifications[${index}].degree`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`qualifications[${index}].degree`] && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors[`qualifications[${index}].degree`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name={`qualifications[${index}].institution`}
                        value={qual.institution}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors[`qualifications[${index}].institution`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`qualifications[${index}].institution`] && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors[`qualifications[${index}].institution`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name={`qualifications[${index}].year`}
                        value={qual.year}
                        onChange={handleChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors[`qualifications[${index}].year`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`qualifications[${index}].year`] && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors[`qualifications[${index}].year`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addQualification}
                className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Another Qualification
              </button>
            </div>

            {/* Professional Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <BriefcaseMedical className="h-5 w-5 mr-2 text-indigo-600" />
                Professional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.yearsOfExperience
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.yearsOfExperience && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.yearsOfExperience}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee (ETB){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.consultationFee
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.consultationFee && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.consultationFee}
                    </p>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages You Speak <span className="text-red-500">*</span>
                </label>

                {formData.languages.map((lang, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      name={`languages[${index}]`}
                      value={lang}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.languages && errors.languages[index]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g. English, Amharic"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLanguage}
                  className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Another Language
                </button>
              </div>
            </div>

            {/* Practice Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                Practice Information
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.hospitalName ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.hospitalName && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.hospitalName}
                  </p>
                )}
              </div>

              <h3 className="font-medium text-gray-800 mb-3">
                Hospital Address
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospitalAddress.street1"
                    value={formData.hospitalAddress.street1}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors["hospitalAddress.street1"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["hospitalAddress.street1"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors["hospitalAddress.street1"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address 2
                  </label>
                  <input
                    type="text"
                    name="hospitalAddress.street2"
                    value={formData.hospitalAddress.street2}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospitalAddress.city"
                    value={formData.hospitalAddress.city}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors["hospitalAddress.city"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["hospitalAddress.city"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors["hospitalAddress.city"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospitalAddress.state"
                    value={formData.hospitalAddress.state}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors["hospitalAddress.state"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["hospitalAddress.state"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors["hospitalAddress.state"]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="hospitalAddress.postalCode"
                    value={formData.hospitalAddress.postalCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospitalAddress.country"
                    value={formData.hospitalAddress.country}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors["hospitalAddress.country"]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["hospitalAddress.country"] && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors["hospitalAddress.country"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="+251911223344"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Service Areas */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Areas <span className="text-red-500">*</span>
                </label>

                {formData.serviceAreas.map((area, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      name={`serviceAreas[${index}]`}
                      value={area}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.serviceAreas && errors.serviceAreas[index]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g. Addis Ababa, Adama"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeServiceArea(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addServiceArea}
                  className="mt-2 text-indigo-600 hover:text-indigo-800 flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Another Service Area
                </button>
              </div>
            </div>

            {/* Bio and Notes */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Additional Information
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.bio ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Tell us about your professional experience and specialties..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to join our platform?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="applicationNotes"
                  value={formData.applicationNotes}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.applicationNotes
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Explain your motivation for joining our platform..."
                />
                {errors.applicationNotes && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.applicationNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Required Documents <span className="text-red-500">*</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    National ID (Front) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="nationalIdFront"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.nationalIdFront
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.nationalIdFront && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.nationalIdFront}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    National ID (Back) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="nationalIdBack"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.nationalIdBack
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.nationalIdBack && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.nationalIdBack}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical License (Front){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="licenseFront"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.licenseFront ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.licenseFront && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.licenseFront}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical License (Back){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="licenseBack"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.licenseBack ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.licenseBack && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.licenseBack}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Board Certification <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="boardCertificationsDocument"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.boardCertificationsDocument
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.boardCertificationsDocument && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.boardCertificationsDocument}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Transcript <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="educationDocument"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.educationDocument
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.educationDocument && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.educationDocument}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitProfile.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitProfile.isPending ? "Submitting..." : "Submit Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Verification Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
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
                  <div className="flex flex-col items-center text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="mt-4 text-lg font-medium leading-6 text-gray-900"
                    >
                      Profile Submitted Successfully!
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Your profile has been submitted for verification. Our
                        team will review your information and documents. You'll
                        receive a notification once your profile is approved.
                        This process typically takes 2-3 business days.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Link to="/doctor/dashboard">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Got it, thanks!
                      </button>
                    </Link>
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
export default DoctorProfileForm;

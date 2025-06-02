import { useState, useEffect } from "react";
import {
  X,
  User,
  GraduationCap,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Image as ImageIcon,
} from "lucide-react";
import { adminAPI } from "../lib/api";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Tab } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

//

//
const ethiopianBanks = [
  {
    id: 130,
    slug: "abay_bank",
    swift: "ABAYETAA",
    name: "Abay Bank",
    acct_length: 16,
    country_id: 1,
    is_mobilemoney: null,
    is_active: 1,
    is_rtgs: 1,
    active: 1,
    is_24hrs: null,
    created_at: "2023-01-24T04:28:30.000000Z",
    updated_at: "2024-08-03T08:10:24.000000Z",
    currency: "ETB",
  },
  {
    id: 571,
    slug: "berhan_bank",
    swift: "BERHETAA",
    name: "Berhan Bank",
    acct_length: 13,
    country_id: 1,
    is_mobilemoney: null,
    is_active: 1,
    is_rtgs: 1,
    active: 1,
    is_24hrs: 1,
    created_at: "2024-08-12T04:21:18.000000Z",
    updated_at: "2024-08-12T04:21:18.000000Z",
    currency: "ETB",
  },
  {
    id: 572,
    slug: "commercial_bank_ethiopia",
    swift: "CBETETAA",
    name: "Commercial Bank of Ethiopia",
    acct_length: 16,
    country_id: 1,
    is_active: 1,
    currency: "ETB",
  },
  {
    id: 573,
    slug: "dashen_bank",
    swift: "DASHETAA",
    name: "Dashen Bank",
    acct_length: 14,
    country_id: 1,
    is_active: 1,
    currency: "ETB",
  },
  {
    id: 574,
    slug: "awash_bank",
    swift: "AWSHETAA",
    name: "Awash Bank",
    acct_length: 15,
    country_id: 1,
    is_active: 1,
    currency: "ETB",
  }
];

const imageFileTest = (value) => {
  if (!value?.[0]) return true; // Skip validation if no file is provided
  const file = value[0];
  return ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type);
};

const schema = yup.object().shape({
  email: yup.string().required("Email is required"),
  password: yup.string().when(['$isUpdate'], {
    is: true,
    then: () => yup.string(),
    otherwise: () => yup.string().required("Password is required")
  }),
  firstName: yup.string().required("First name is required"),
  middleName: yup.string().required("Middle name is required"),
  lastName: yup.string().required("Last name is required"),
  gender: yup
    .string()
    .oneOf(["male", "female", "other"], "Please select a valid gender")
    .required("Gender is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  profilePhoto: yup
    .mixed()
    .when(['$isUpdate'], {
      is: true,
      then: () => yup
        .mixed()
        .test("fileType", "Only JPEG, PNG, and JPG images are allowed", imageFileTest),
      otherwise: () => yup
        .mixed()
        .required("Profile photo is required")
        .test("fileType", "Only JPEG, PNG, and JPG images are allowed", imageFileTest)
    }),
  nationalIdFanNumber: yup.string().required("National ID/FAN number is required"),
  licenseNumber: yup.string().required("License number is required"),
  boardCertificationsDocument: yup
    .mixed()
    .when(['$isUpdate'], {
      is: true,
      then: () => yup
        .mixed()
        .test("fileType", "Only JPEG, PNG, and JPG images are allowed", imageFileTest),
      otherwise: () => yup
        .mixed()
        .required("Board certifications document is required")
        .test("fileType", "Only JPEG, PNG, and JPG images are allowed", imageFileTest)
    }),
  educationDocument: yup
    .mixed()
    .when(['$isUpdate'], {
      is: true,
      then: () => yup
        .mixed()
        .test("fileType", "Only JPEG, PNG, and JPG images are allowed", imageFileTest),
      otherwise: () => yup
        .mixed()
        .required("Education document is required")
        .test("fileType", "Only JPEG, PNG, and JPG images are allowed", imageFileTest)
    }),
  specialization: yup.string().required("Specialization is required"),
  qualifications: yup
    .array()
    .of(
      yup.object().shape({
        degree: yup.string().required("Degree is required"),
        institution: yup.string().required("Institution is required"),
        year: yup.string().required("Year is required"),
      })
    )
    .required("Qualifications are required"),
  yearsOfExperience: yup
    .number()
    .min(0)
    .required("Years of experience is required"),
  languages: yup.array().of(yup.string()).default([]),
  hospitalName: yup.string().default(""),
  hospitalAddress: yup.object().shape({
    street1: yup.string().default(""),
    street2: yup.string().default(""),
    city: yup.string().default(""),
    state: yup.string().default(""),
    postalCode: yup.string().default(""),
    country: yup.string().default("Ethiopia"),
    coordinates: yup.array().of(yup.number()).length(2).default([0, 0]),
  }),
  paymentDetails: yup.object().shape({
    bankName: yup.string().required("Bank name is required"),
    accountNumber: yup.string().required("Account number is required"),
    businessName: yup.string().required("Business name is required"),
    accountName: yup.string().required("Account name is required"),
    accountType: yup
      .string()
      .oneOf(["personal", "business"])
      .default("business")
  }),
  phoneNumber: yup
    .string()
    .matches(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
      "Invalid phone number format"
    )
    .required("Phone number is required"),
  consultationFee: yup.number().min(0).default(0),
  serviceAreas: yup.string().default(""),
  bio: yup.string().max(1000),
  isActive: yup.boolean().default(true),
  verificationStatus: yup.boolean().default(true),
});

// Add this line after the schema definition
schema.fields = schema.fields || {};

// Add this constant at the top of the file, after the imports
const API_URL = 'http://localhost:3000';

// Add this helper function before the ViewDoctorForm component
const getImageUrl = (path) => {
  if (!path) return '/images/default-avatar.png';
  if (path.startsWith('http')) return path;
  return `${API_URL}/${path}`;
};

export const AddDoctorForm = ({ onClose, onSuccess, doctor, mode = "create" }) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const isUpdate = Boolean(doctor);
  const isViewMode = mode === "view";

  // If in view mode, render the ViewDoctorForm
  if (isViewMode && doctor) {
    return <ViewDoctorForm doctor={doctor} onClose={onClose} />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    context: { isUpdate }, // Pass isUpdate flag to the validation context
    defaultValues: {
      gender: "male",
      languages: ["English"],
      hospitalAddress: {
        country: "Ethiopia",
        coordinates: [0, 0],
      },
      qualifications: [{ degree: "", institution: "", year: "" }],
      serviceAreas: "Ethiopia",
      isActive: true,
      yearsOfExperience: 0,
      consultationFee: 0,
      verificationStatus: true,
      // Set initial values from doctor if in update mode
      ...(doctor && {
        email: doctor.email,
        firstName: doctor.firstName,
        middleName: doctor.middleName,
        lastName: doctor.lastName,
        gender: doctor.gender,
        dateOfBirth: doctor.dateOfBirth,
        nationalIdFanNumber: doctor.nationalIdFanNumber,
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        yearsOfExperience: doctor.yearsOfExperience,
        languages: doctor.languages,
        hospitalName: doctor.hospitalName,
        hospitalAddress: doctor.hospitalAddress,
        phoneNumber: doctor.phoneNumber,
        consultationFee: doctor.consultationFee,
        serviceAreas: doctor.serviceAreas,
        bio: doctor.bio,
        isActive: doctor.isActive,
        qualifications: doctor.qualifications,
        paymentDetails: doctor.paymentDetails
      })
    },
  });

  const [previewImages, setPreviewImages] = useState({
    profilePhoto: null,
    boardCertificationsDocument: null,
    educationDocument: null,
  });

  // Create mutation for adding doctor
  const addDoctorMutation = useMutation({
    mutationFn: async (formData) => {
      // console.log('=== FORM SUBMISSION START ===');
      // console.log('Raw form data:', formData);
      return adminAPI.doctors.create(formData);
    },
    onSuccess: (response) => {
      // console.log('=== MUTATION SUCCESS ===');
      // console.log('API Response:', response);
      toast.success("Doctor added successfully");
      queryClient.invalidateQueries(["doctors"]); // Invalidate doctors list query
      onSuccess();
      onClose();
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Failed to add doctor";
      if (
        msg.toLowerCase().includes("chapa") ||
        msg.toLowerCase().includes("payment")
      ) {
        toast.error(
          "Payment system temporarily unavailable. Please check bank details or try again later."
        );
      } else {
        toast.error(msg);
      }
    },
  });

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const addQualification = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQualifications = watch("qualifications") || [];
    setValue("qualifications", [
      ...currentQualifications,
      { degree: "", institution: "", year: "" },
    ]);
  };

  const removeQualification = (index) => {
    const currentQualifications = watch("qualifications");
    setValue(
      "qualifications",
      currentQualifications.filter((_, i) => i !== index)
    );
  };

  const handleQualificationChange = (index, field, value) => {
    const currentQualifications = watch("qualifications");
    const updatedQualifications = currentQualifications.map((qual, i) => {
      if (i === index) {
        return { ...qual, [field]: value };
      }
      return qual;
    });
    setValue("qualifications", updatedQualifications);
  };

  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Amharic", label: "Amharic" },
    { value: "Tigrinya", label: "Tigrinya" },
    { value: "Oromia", label: "Oromia" },
  ];

  const handleLanguageChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setValue("languages", selectedOptions);
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error(`Please upload only image files for ${field === 'boardCertificationsDocument' ? 'board certification' : 'education certificate'}`);
        e.target.value = ''; // Clear the input
        return;
      }

      // Additional check for specific image types
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload only JPG, JPEG, PNG, or WebP images');
        e.target.value = '';
        return;
      }

      // Check file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        e.target.value = '';
        return;
      }

      // Set the file in react-hook-form
      setValue(field, [file]);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => ({
          ...prev,
          [field]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field) => {
    setPreviewImages((prev) => ({
      ...prev,
      [field]: null,
    }));
    setValue(field, null);
  };

  useEffect(() => {
    if (doctor) {
      setPreviewImages({
        profilePhoto: doctor.profilePhoto || null,
        boardCertificationsDocument: doctor.boardCertificationsDocument || null,
        educationDocument: doctor.educationDocument || null,
      });
    }
  }, [doctor]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Log the complete form data
      console.log('Form Data being submitted:', {
        ...data,
        profilePhoto: data.profilePhoto?.[0]?.name,
        boardCertificationsDocument: data.boardCertificationsDocument?.[0]?.name,
        educationDocument: data.educationDocument?.[0]?.name
      });

      const formData = new FormData();

      // Add basic fields
      formData.append("email", data.email);
      if (!isUpdate || data.password) {
        formData.append("password", data.password);
      }
      formData.append("firstName", data.firstName);
      formData.append("middleName", data.middleName);
      formData.append("lastName", data.lastName);
      formData.append("gender", data.gender);
      formData.append("dateOfBirth", data.dateOfBirth);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("specialization", data.specialization);
      formData.append("yearsOfExperience", data.yearsOfExperience);
      formData.append("nationalIdFanNumber", data.nationalIdFanNumber);
      formData.append("licenseNumber", data.licenseNumber);
      formData.append("consultationFee", data.consultationFee);
      formData.append("serviceAreas", data.serviceAreas);
      formData.append("bio", data.bio || "");
      formData.append("isActive", data.isActive);
      formData.append("verificationStatus", data.verificationStatus);

      // Add arrays and objects as JSON strings
      formData.append("qualifications", JSON.stringify(data.qualifications));
      formData.append("hospitalAddress", JSON.stringify(data.hospitalAddress));
      formData.append("languages", JSON.stringify(data.languages));
      
      // Add payment details
      const paymentDetails = {
        ...data.paymentDetails,
      };
      formData.append("paymentDetails", JSON.stringify(paymentDetails));

      // Only append files if they are provided
      if (data.profilePhoto?.[0]) {
        formData.append("profilePhoto", data.profilePhoto[0]);
      }
      if (data.boardCertificationsDocument?.[0]) {
        formData.append(
          "boardCertificationsDocument",
          data.boardCertificationsDocument[0]
        );
      }
      if (data.educationDocument?.[0]) {
        formData.append("educationDocument", data.educationDocument[0]);
      }

      if (isUpdate) {
        await adminAPI.doctors.update(doctor._id, formData);
        toast.success("Doctor updated successfully");
      } else {
        await addDoctorMutation.mutateAsync(formData);
        toast.success("Doctor added successfully");
      }

      queryClient.invalidateQueries(["doctors"]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      const msg = error.response?.data?.message || (isUpdate ? "Failed to update doctor" : "Failed to add doctor");
      if (msg.toLowerCase().includes("chapa") || msg.toLowerCase().includes("payment")) {
        toast.error("Payment system temporarily unavailable. Please check bank details or try again later.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Add New Doctor
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6 sticky top-16 bg-white z-10">
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${
                      selected
                        ? "bg-white text-indigo-700 shadow"
                        : "text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600"
                    }`
                  }
                >
                  <div className="flex items-center justify-center">
                    <User className="h-4 w-4 mr-2" />
                    Personal Info
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${
                      selected
                        ? "bg-white text-indigo-700 shadow"
                        : "text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600"
                    }`
                  }
                >
                  <div className="flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Professional Info
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${
                      selected
                        ? "bg-white text-indigo-700 shadow"
                        : "text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600"
                    }`
                  }
                >
                  <div className="flex items-center justify-center">
                    <Award className="h-4 w-4 mr-2" />
                    Qualifications
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${
                      selected
                        ? "bg-white text-indigo-700 shadow"
                        : "text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600"
                    }`
                  }
                >
                  <div className="flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </div>
                </Tab>
              </Tab.List>

              <Tab.Panels className="mt-2">
                {/* Personal Information Panel */}
                <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <input
                            {...register("firstName")}
                            placeholder="First Name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                          <input
                            {...register("middleName")}
                            placeholder="Middle Name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                          <input
                            {...register("lastName")}
                            placeholder="Last Name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                        </div>
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.firstName.message}
                          </p>
                        )}
                        {errors.middleName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.middleName.message}
                          </p>
                        )}
                        {errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          {...register("email")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          {...register("password")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          {...register("phoneNumber")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.phoneNumber && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.phoneNumber.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          {...register("dateOfBirth")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.dateOfBirth && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.dateOfBirth.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Gender
                        </label>
                        <select
                          {...register("gender")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bio
                        </label>
                        <textarea
                          {...register("bio")}
                          rows={4}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Enter doctor's bio (max 1000 characters)"
                        />
                        {errors.bio && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.bio.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Professional Information Panel */}
                <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          National ID/FAN Number
                        </label>
                        <input
                          {...register("nationalIdFanNumber")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.nationalIdFanNumber && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.nationalIdFanNumber.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          License Number
                        </label>
                        <input
                          {...register("licenseNumber")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.licenseNumber && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.licenseNumber.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Specialization
                        </label>
                        <input
                          {...register("specialization")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.specialization && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.specialization.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          {...register("yearsOfExperience")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.yearsOfExperience && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.yearsOfExperience.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Languages
                        </label>
                        <select
                          multiple
                          value={watch("languages")}
                          onChange={handleLanguageChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-24"
                        >
                          {languageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                          Hold Ctrl (Windows) or Command (Mac) to select
                          multiple languages
                        </p>
                        {errors.languages && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.languages.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Hospital Name
                        </label>
                        <input
                          {...register("hospitalName")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.hospitalName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.hospitalName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Hospital Address
                        </label>
                        <div className="space-y-2">
                          <input
                            {...register("hospitalAddress.street1")}
                            placeholder="Street 1"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                          <input
                            {...register("hospitalAddress.street2")}
                            placeholder="Street 2"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              {...register("hospitalAddress.city")}
                              placeholder="City"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            />
                            <input
                              {...register("hospitalAddress.state")}
                              placeholder="State"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            />
                          </div>
                          <input
                            {...register("hospitalAddress.postalCode")}
                            placeholder="Postal Code"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Service Areas
                        </label>
                        <input
                          type="text"
                          {...register("serviceAreas")}
                          placeholder="Enter service areas (comma-separated)"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Enter multiple areas separated by commas
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Consultation Fee
                        </label>
                        <input
                          type="number"
                          {...register("consultationFee")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.consultationFee && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.consultationFee.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 mt-6 border-t pt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          Payment Setup
                        </h4>

                        <div className="flex items-center mb-2">
                          <span className="text-xs text-gray-500 mr-2">
                            Need help?
                          </span>
                          <span className="relative group">
                            <svg
                              className="w-4 h-4 text-blue-500 cursor-pointer"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 16v-4m0-4h.01"
                              />
                            </svg>
                            <div className="absolute left-1/2 z-10 hidden group-hover:block w-64 -translate-x-1/2 bg-white border border-gray-200 rounded shadow-lg p-3 text-xs text-gray-700 mt-2">
                              <strong>How Chapa Works:</strong>
                              <ul className="list-disc ml-4 mt-1">
                                <li>
                                  Chapa is a payment gateway for Ethiopia.
                                </li>
                                <li>
                                  Doctors must provide valid bank details to
                                  receive payments.
                                </li>
                                <li>
                                  Payments are split automatically: 95% to the
                                  doctor, 5% to the platform.
                                </li>
                                <li>
                                  Bank code and account name must match the bank
                                  records.
                                </li>
                              </ul>
                              <div className="mt-2 text-yellow-700">
                                If you see 'Payment system temporarily
                                unavailable', please check your bank details or
                                try again later.
                              </div>
                            </div>
                          </span>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg mb-4">
                          <p className="text-sm text-blue-700 flex items-start">
                            <svg
                              className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Payments will be automatically deposited to this
                            account. 95% goes to the doctor, 5% to the platform.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                              <select
                                {...register("paymentDetails.bankName")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              >
                                <option value="">Select Bank</option>
                                {ethiopianBanks.map((bank) => (
                                  <option key={bank.id} value={bank.name}>
                                    {bank.name}
                                  </option>
                                ))}
                              </select>
                              {errors.paymentDetails?.bankName && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.paymentDetails.bankName.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Account Number</label>
                              <input
                                type="text"
                                {...register("paymentDetails.accountNumber")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                              {errors.paymentDetails?.accountNumber && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.paymentDetails.accountNumber.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Business Name</label>
                              <input
                                type="text"
                                {...register("paymentDetails.businessName")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                              {errors.paymentDetails?.businessName && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.paymentDetails.businessName.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Account Name</label>
                              <input
                                type="text"
                                {...register("paymentDetails.accountName")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                              {errors.paymentDetails?.accountName && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.paymentDetails.accountName.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Account Type</label>
                              <select
                                {...register("paymentDetails.accountType")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              >
                                <option value="personal">Personal Account</option>
                                <option value="business">Business Account</option>
                              </select>
                              {errors.paymentDetails?.accountType && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.paymentDetails.accountType.message}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700 flex items-center">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                              </svg>
                              Payment Split: 90% to doctor, 10% to platform (fixed)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <div className="mt-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              {...register("isActive")}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="ml-2">Active</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Qualifications Panel */}
                <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Qualifications
                      </h3>
                      <button
                        type="button"
                        onClick={addQualification}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add Qualification
                      </button>
                    </div>

                    {watch("qualifications")?.map((qual, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Degree
                            </label>
                            <input
                              value={qual.degree}
                              onChange={(e) =>
                                handleQualificationChange(
                                  index,
                                  "degree",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Institution
                            </label>
                            <input
                              value={qual.institution}
                              onChange={(e) =>
                                handleQualificationChange(
                                  index,
                                  "institution",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Year
                            </label>
                            <input
                              value={qual.year}
                              onChange={(e) =>
                                handleQualificationChange(
                                  index,
                                  "year",
                                  e.target.value
                                )
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className="mt-2 text-sm text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </Tab.Panel>

                {/* Documents Panel */}
                <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Profile Photo <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          {previewImages.profilePhoto ? (
                            <div className="relative">
                              <img
                                src={previewImages.profilePhoto}
                                alt="Profile preview"
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage("profilePhoto")}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              {...register("profilePhoto")}
                              onChange={(e) => handleImageChange(e, "profilePhoto")}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 h-10"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Accepted formats: JPG, JPEG, PNG, WebP
                            </p>
                            {errors.profilePhoto && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.profilePhoto.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Board Certification Image <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          {previewImages.boardCertificationsDocument ? (
                            <div className="relative">
                              <img
                                src={previewImages.boardCertificationsDocument}
                                alt="Board certification preview"
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage("boardCertificationsDocument")}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              {...register("boardCertificationsDocument")}
                              onChange={(e) => handleImageChange(e, "boardCertificationsDocument")}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 h-10"
                            />
                            <div className="mt-1">
                              <p className="text-sm text-gray-500">
                                Take a clear photo or scan of your board certification
                              </p>
                              <p className="text-sm text-gray-500">
                                Accepted formats: JPG, JPEG, PNG, WebP
                              </p>
                            </div>
                            {errors.boardCertificationsDocument && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.boardCertificationsDocument.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Education Certificate Image <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          {previewImages.educationDocument ? (
                            <div className="relative">
                              <img
                                src={previewImages.educationDocument}
                                alt="Education certificate preview"
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage("educationDocument")}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              {...register("educationDocument")}
                              onChange={(e) => handleImageChange(e, "educationDocument")}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 h-10"
                            />
                            <div className="mt-1">
                              <p className="text-sm text-gray-500">
                                Take a clear photo or scan of your highest education certificate
                              </p>
                              <p className="text-sm text-gray-500">
                                Accepted formats: JPG, JPEG, PNG, WebP
                              </p>
                            </div>
                            {errors.educationDocument && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.educationDocument.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end sticky bottom-0 bg-white pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Doctor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const ViewDoctorForm = ({ doctor, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16">
                <img
                  src={getImageUrl(doctor.profilePhoto)}
                  alt={`${doctor.firstName} ${doctor.lastName}`}
                  className="h-16 w-16 rounded-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {`${doctor.firstName} ${doctor.middleName} ${doctor.lastName}`}
                </h2>
                <p className="text-sm text-gray-500">{doctor.specialization}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Personal Information */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{`${doctor.firstName} ${doctor.middleName} ${doctor.lastName}`}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(doctor.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Gender</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{doctor.gender}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">National ID/FAN Number</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.nationalIdFanNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">License Number</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.bio || 'No bio provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Languages</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.languages?.join(', ') || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Professional Information */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Specialization</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.specialization}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Years of Experience</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.yearsOfExperience} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Hospital Name</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.hospitalName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Hospital Address</label>
                    <div className="mt-1 text-sm text-gray-900">
                      <p>{doctor.hospitalAddress?.street1}</p>
                      {doctor.hospitalAddress?.street2 && <p>{doctor.hospitalAddress.street2}</p>}
                      <p>{`${doctor.hospitalAddress?.city || ''} ${doctor.hospitalAddress?.state || ''} ${doctor.hospitalAddress?.postalCode || ''}`}</p>
                      <p>{doctor.hospitalAddress?.country}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Consultation Fee</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.consultationFee} ETB</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Service Areas</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.serviceAreas || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Qualifications */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Qualifications</h3>
              <div className="space-y-4">
                {doctor.qualifications?.map((qual, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Degree</label>
                        <p className="mt-1 text-sm text-gray-900">{qual.degree}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Institution</label>
                        <p className="mt-1 text-sm text-gray-900">{qual.institution}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Year</label>
                        <p className="mt-1 text-sm text-gray-900">{qual.year}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!doctor.qualifications || doctor.qualifications.length === 0) && (
                  <p className="text-sm text-gray-500">No qualifications added</p>
                )}
              </div>
            </section>

            {/* Documents */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Board Certification</label>
                  <div className="mt-1">
                    {doctor.boardCertificationsDocument ? (
                      <div className="space-y-2">
                        <img
                          src={getImageUrl(doctor.boardCertificationsDocument)}
                          alt="Board Certification"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                        <a
                          href={getImageUrl(doctor.boardCertificationsDocument)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Full Image
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No document uploaded</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Education Certificate</label>
                  <div className="mt-1">
                    {doctor.educationDocument ? (
                      <div className="space-y-2">
                        <img
                          src={getImageUrl(doctor.educationDocument)}
                          alt="Education Certificate"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                        />
                        <a
                          href={getImageUrl(doctor.educationDocument)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Full Image
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No document uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Information */}
            <section>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.paymentDetails?.bankName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Account Number</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.paymentDetails?.accountNumber || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Business Name</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.paymentDetails?.businessName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Account Name</label>
                    <p className="mt-1 text-sm text-gray-900">{doctor.paymentDetails?.accountName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Account Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{doctor.paymentDetails?.accountType || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

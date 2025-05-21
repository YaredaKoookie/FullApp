import { useState, useEffect } from 'react';
import { X, User, GraduationCap, FileText, MapPin, Phone, Mail, Calendar, Award, Image as ImageIcon } from 'lucide-react';
import { adminAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Tab } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const schema = yup.object().shape({
  email: yup.string().required('Email is required'),
  password: yup.string().required('Password is required'),
  firstName: yup.string().required('First name is required'),
  middleName: yup.string().required('Middle name is required'),
  lastName: yup.string().required('Last name is required'),
  gender: yup.string()
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
    .required('Gender is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  profilePhoto: yup.mixed()
    .test('fileType', 'Only JPEG, PNG, and JPG images are allowed', (value) => {
      if (!value?.[0]) return true; // Optional field
      const file = value[0];
      return ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
    }),
  nationalIdFanNumber: yup.string().required('National ID/FAN number is required'),
  licenseNumber: yup.string().required('License number is required'),
  boardCertificationsDocument: yup.mixed()
    .test('fileType', 'Only JPEG, PNG, and JPG images are allowed', (value) => {
      if (!value?.[0]) return true; // Optional field
      const file = value[0];
      return ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
    }),
  educationDocument: yup.mixed()
    .test('fileType', 'Only JPEG, PNG, and JPG images are allowed', (value) => {
      if (!value?.[0]) return true; // Optional field
      const file = value[0];
      return ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type);
    }),
  specialization: yup.string().required('Specialization is required'),
  qualifications: yup.array().of(
    yup.object().shape({
      degree: yup.string().required('Degree is required'),
      institution: yup.string().required('Institution is required'),
      year: yup.string().required('Year is required')
    })
  ).required('Qualifications are required'),
  yearsOfExperience: yup.number().min(0).required('Years of experience is required'),
  languages: yup.array().of(yup.string()).default([]),
  hospitalName: yup.string().default(''),
  hospitalAddress: yup.object().shape({
    street1: yup.string().default(''),
    street2: yup.string().default(''),
    city: yup.string().default(''),
    state: yup.string().default(''),
    postalCode: yup.string().default(''),
    country: yup.string().default('Ethiopia'),
    coordinates: yup.array().of(yup.number()).length(2).default([0, 0])
  }),
  phoneNumber: yup.string()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format')
    .required('Phone number is required'),
  consultationFee: yup.number().min(0).default(0),
  serviceAreas: yup.string().default(''),
  bio: yup.string().max(1000),
  isActive: yup.boolean().default(true)
});

export const AddDoctorForm = ({ onClose, onSuccess, doctor }) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
    gender: 'male',
    languages: ['English'],
    hospitalAddress: {
      country: 'Ethiopia',
      coordinates: [0, 0]
    },
      qualifications: [{ degree: '', institution: '', year: '' }],
      serviceAreas: "Ethiopia",
      isActive: true,
      yearsOfExperience: 0,
    consultationFee: 0,
      verificationStatus: true
    }
  });

  const [previewImages, setPreviewImages] = useState({
    profilePhoto: null,
    boardCertificationsDocument: null,
    educationDocument: null
  });

  // Create mutation for adding doctor
  const addDoctorMutation = useMutation({
    mutationFn: async (formData) => {
      console.log('=== FORM SUBMISSION START ===');
      console.log('Raw form data:', formData);
      return adminAPI.doctors.create(formData);
    },
    onSuccess: (response) => {
      console.log('=== MUTATION SUCCESS ===');
      console.log('API Response:', response);
      toast.success('Doctor added successfully');
      queryClient.invalidateQueries(['doctors']); // Invalidate doctors list query
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error('=== MUTATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Failed to add doctor');
    }
  });

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const addQualification = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQualifications = watch('qualifications') || [];
    setValue('qualifications', [...currentQualifications, { degree: '', institution: '', year: '' }]);
  };

  const removeQualification = (index) => {
    const currentQualifications = watch('qualifications');
    setValue('qualifications', currentQualifications.filter((_, i) => i !== index));
  };

  const handleQualificationChange = (index, field, value) => {
    const currentQualifications = watch('qualifications');
    const updatedQualifications = currentQualifications.map((qual, i) => {
      if (i === index) {
        return { ...qual, [field]: value };
      }
      return qual;
    });
    setValue('qualifications', updatedQualifications);
  };

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Amharic', label: 'Amharic' },
    { value: 'Tigrinya', label: 'Tigrinya' },
    { value: 'Oromia', label: 'Oromia' }
  ];

  const handleLanguageChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setValue('languages', selectedOptions);
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => ({
      ...prev,
          [field]: reader.result
    }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field) => {
    setPreviewImages(prev => ({
      ...prev,
      [field]: null
    }));
    setValue(field, null);
  };

  useEffect(() => {
    if (doctor) {
      setPreviewImages({
        profilePhoto: doctor.profilePhoto || null,
        boardCertificationsDocument: doctor.boardCertificationsDocument || null,
        educationDocument: doctor.educationDocument || null
      });
    }
  }, [doctor]);

  const onSubmit = async (data) => {
    try {
      console.log('=== FORM SUBMISSION START ===');
      console.log('Raw form data:', data);
      setLoading(true);
      const formData = new FormData();

      // Add basic fields
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('firstName', data.firstName);
      formData.append('middleName', data.middleName);
      formData.append('lastName', data.lastName);
      formData.append('gender', data.gender);
      formData.append('dateOfBirth', data.dateOfBirth);
      formData.append('nationalIdFanNumber', data.nationalIdFanNumber);
      formData.append('licenseNumber', data.licenseNumber);
      formData.append('specialization', data.specialization);
      formData.append('yearsOfExperience', data.yearsOfExperience);
      formData.append('hospitalName', data.hospitalName);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('consultationFee', data.consultationFee);
      formData.append('serviceAreas', data.serviceAreas || '');

      // Add arrays and objects as JSON strings
      formData.append('languages', JSON.stringify(data.languages || []));
      
      // Format qualifications as array of objects
      const qualifications = data.qualifications.map(qual => ({
        degree: qual.degree,
        institution: qual.institution,
        year: qual.year
      }));
      formData.append('qualifications', JSON.stringify(qualifications));

      // Format hospital address as object
      const hospitalAddress = {
        street1: data.hospitalAddress?.street1 || '',
        street2: data.hospitalAddress?.street2 || '',
        city: data.hospitalAddress?.city || '',
        state: data.hospitalAddress?.state || '',
        postalCode: data.hospitalAddress?.postalCode || '',
        country: data.hospitalAddress?.country || 'Ethiopia',
        coordinates: data.hospitalAddress?.coordinates || [0, 0]
      };
      formData.append('hospitalAddress', JSON.stringify(hospitalAddress));

      // Add optional fields if they exist
      if (data.bio) formData.append('bio', data.bio);

      // Add files if they exist
      if (data.profilePhoto?.[0]) {
        formData.append('profilePhoto', data.profilePhoto[0]);
      }
      if (data.boardCertificationsDocument?.[0]) {
        formData.append('boardCertificationsDocument', data.boardCertificationsDocument[0]);
      }
      if (data.educationDocument?.[0]) {
        formData.append('educationDocument', data.educationDocument[0]);
      }

      // Log the form data entries
      console.log('=== FORM DATA ENTRIES ===');
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      // Use the mutation to submit the form
      const response = await addDoctorMutation.mutateAsync(formData);
      console.log('=== MUTATION RESPONSE ===');
      console.log('Response:', response);
      
      if (response.data?.success) {
      toast.success('Doctor added successfully');
      onSuccess();
      onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to add doctor');
      }
    } catch (error) {
      console.error('=== ERROR IN FORM SUBMISSION ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]" onClick={handleClose}>
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Add New Doctor</h2>
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
                    ${selected
                      ? 'bg-white text-indigo-700 shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
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
                    ${selected
                      ? 'bg-white text-indigo-700 shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
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
                    ${selected
                      ? 'bg-white text-indigo-700 shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
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
                    ${selected
                      ? 'bg-white text-indigo-700 shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-indigo-600'
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
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                  <input
                            {...register('firstName')}
                            placeholder="First Name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                  <input
                            {...register('middleName')}
                            placeholder="Middle Name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                  <input
                            {...register('lastName')}
                            placeholder="Last Name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                  />
                </div>
                        {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                        {errors.middleName && <p className="mt-1 text-sm text-red-600">{errors.middleName.message}</p>}
                        {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
            </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                          {...register('email')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                          {...register('password')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                          {...register('phoneNumber')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input
                          type="date"
                          {...register('dateOfBirth')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                          {...register('gender')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                        {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                </div>

                <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          {...register('bio')}
                          rows={4}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Enter doctor's bio (max 1000 characters)"
                        />
                        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
                </div>
              </div>
                  </div>
                </Tab.Panel>

                {/* Professional Information Panel */}
                <Tab.Panel className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">National ID/FAN Number</label>
                        <input
                          {...register('nationalIdFanNumber')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.nationalIdFanNumber && <p className="mt-1 text-sm text-red-600">{errors.nationalIdFanNumber.message}</p>}
            </div>

            <div>
                        <label className="block text-sm font-medium text-gray-700">License Number</label>
                        <input
                          {...register('licenseNumber')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.licenseNumber && <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>}
                      </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input
                          {...register('specialization')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.specialization && <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                          {...register('yearsOfExperience')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.yearsOfExperience && <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Languages</label>
                        <select
                          multiple
                          value={watch('languages')}
                          onChange={handleLanguageChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-24"
                        >
                          {languageOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">Hold Ctrl (Windows) or Command (Mac) to select multiple languages</p>
                        {errors.languages && <p className="mt-1 text-sm text-red-600">{errors.languages.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
                        <input
                          {...register('hospitalName')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.hospitalName && <p className="mt-1 text-sm text-red-600">{errors.hospitalName.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hospital Address</label>
                        <div className="space-y-2">
                          <input
                            {...register('hospitalAddress.street1')}
                            placeholder="Street 1"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                          <input
                            {...register('hospitalAddress.street2')}
                            placeholder="Street 2"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              {...register('hospitalAddress.city')}
                              placeholder="City"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            />
                            <input
                              {...register('hospitalAddress.state')}
                              placeholder="State"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            />
                          </div>
                          <input
                            {...register('hospitalAddress.postalCode')}
                            placeholder="Postal Code"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                  />
                </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Service Areas</label>
                        <input
                          type="text"
                          {...register('serviceAreas')}
                          placeholder="Enter service areas (comma-separated)"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        <p className="mt-1 text-sm text-gray-500">Enter multiple areas separated by commas</p>
                      </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Consultation Fee</label>
                  <input
                    type="number"
                          {...register('consultationFee')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        />
                        {errors.consultationFee && <p className="mt-1 text-sm text-red-600">{errors.consultationFee.message}</p>}
            </div>

            <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-2">
                          <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                              {...register('isActive')}
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
                <h3 className="text-lg font-medium text-gray-900">Qualifications</h3>
                <button
                  type="button"
                  onClick={addQualification}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Qualification
                </button>
              </div>

                    {watch('qualifications')?.map((qual, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                            <label className="block text-sm font-medium text-gray-700">Degree</label>
                    <input
                      value={qual.degree}
                      onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                    />
                  </div>
                  <div>
                            <label className="block text-sm font-medium text-gray-700">Institution</label>
                    <input
                      value={qual.institution}
                      onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                    />
                  </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                      value={qual.year}
                      onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
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
                        <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
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
                                onClick={() => removeImage('profilePhoto')}
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
                              {...register('profilePhoto')}
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              onChange={(e) => handleImageChange(e, 'profilePhoto')}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 h-10"
                            />
                            {errors.profilePhoto && <p className="mt-1 text-sm text-red-600">{errors.profilePhoto.message}</p>}
                          </div>
                </div>
                </div>

                <div>
                        <label className="block text-sm font-medium text-gray-700">Board Certifications</label>
                        <div className="mt-1 flex items-center space-x-4">
                          {previewImages.boardCertificationsDocument ? (
                            <div className="relative">
                              <img
                                src={previewImages.boardCertificationsDocument}
                                alt="Board certifications preview"
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage('boardCertificationsDocument')}
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
                              {...register('boardCertificationsDocument')}
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              onChange={(e) => handleImageChange(e, 'boardCertificationsDocument')}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 h-10"
                            />
                            {errors.boardCertificationsDocument && <p className="mt-1 text-sm text-red-600">{errors.boardCertificationsDocument.message}</p>}
                </div>
              </div>
            </div>

            <div>
                        <label className="block text-sm font-medium text-gray-700">Education Document</label>
                        <div className="mt-1 flex items-center space-x-4">
                          {previewImages.educationDocument ? (
                            <div className="relative">
                              <img
                                src={previewImages.educationDocument}
                                alt="Education document preview"
                                className="h-20 w-20 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage('educationDocument')}
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
                              {...register('educationDocument')}
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              onChange={(e) => handleImageChange(e, 'educationDocument')}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 h-10"
                            />
                            {errors.educationDocument && <p className="mt-1 text-sm text-red-600">{errors.educationDocument.message}</p>}
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
                {loading ? 'Adding...' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 
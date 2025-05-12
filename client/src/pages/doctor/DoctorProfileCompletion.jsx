import { useState, useEffect,Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { 
  Home,
  User, 
  Calendar, 
  BookOpen, 
  BriefcaseMedical, 
  MapPin, 
  Phone, 
  DollarSign, 
  Clock, 
  FileText, 
  Image,
  Award,
  Globe,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/apiClient'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const appointmentDurations = [15, 30, 45, 60]
const serviceAreasOptions = ['In-person', 'Telehealth', 'Home visits']
const genderOptions = ['male', 'female', 'other', 'Prefer not to say']

const DoctorProfileCompletion = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm()
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [currentDocumentType, setCurrentDocumentType] = useState('')

  // Fetch existing profile if available
  const { data: existingProfile } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/doctors/profile/me')
      return response.data
    }
  })

  // Initialize form with existing data
  useEffect(() => {
    if (existingProfile) {
      Object.entries(existingProfile).forEach(([key, value]) => {
        setValue(key, value)
      })
    }
  }, [existingProfile, setValue])

  const submitProfile = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('http://localhost:3000/doctors/profile/complete', data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Profile submitted successfully!')
      navigate('doctor/dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit profile')
    }
  })

  const onSubmit = (data) => {
    submitProfile.mutate(data)
    console.log(data);
  }

  // Handle document upload
  const handleDocumentUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await axios.post('/api/upload', formData)
      setValue(currentDocumentType, response.data.url)
      setShowDocumentUpload(false)
      toast.success('Document uploaded successfully!')
    } catch (error) {
      toast.error('Failed to upload document')
    }
  }

  // Add/remove qualifications
  const addQualification = () => {
    setValue('qualifications', [
      ...(watch('qualifications') || []),
      { degree: '', institution: '', year: new Date().getFullYear() }
    ])
  }

  const removeQualification = (index) => {
    const updated = [...watch('qualifications')]
    updated.splice(index, 1)
    setValue('qualifications', updated)
  }

  // Add/remove working hours
  const addWorkingDay = () => {
    setValue('workingHours', [
      ...(watch('workingHours') || []),
      { day: 'Monday', startTime: '09:00', endTime: '17:00', breaks: [] }
    ])
  }

  const removeWorkingDay = (index) => {
    const updated = [...watch('workingHours')]
    updated.splice(index, 1)
    setValue('workingHours', updated)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Doctor Profile</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="mr-2 h-5 w-5" /> Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name*</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Middle Name</label>
              <input
                {...register('middleName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name*</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender*</label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {genderOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth*</label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Photo URL</label>
              <div className="flex items-center mt-1">
                <input
                  {...register('profilePhoto')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentType('profilePhoto')
                    setShowDocumentUpload(true)
                  }}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Image className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Information Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BriefcaseMedical className="mr-2 h-5 w-5" /> Professional Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Specialization*</label>
              <input
                {...register('specialization', { required: 'Specialization is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.specialization && <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Years of Experience*</label>
              <input
                type="number"
                {...register('yearsOfExperience', { 
                  required: 'Years of experience is required',
                  min: { value: 0, message: 'Must be 0 or more' }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.yearsOfExperience && <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Languages Spoken*</label>
              <input
                {...register('languages', { required: 'At least one language is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="English, Spanish, etc."
              />
              {errors.languages && <p className="mt-1 text-sm text-red-600">{errors.languages.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Qualifications*</label>
              <div className="space-y-4 mt-2">
                {(watch('qualifications') || []).map((qual, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Degree</label>
                      <input
                        {...register(`qualifications.${index}.degree`, { required: 'Degree is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Institution</label>
                      <input
                        {...register(`qualifications.${index}.institution`, { required: 'Institution is required' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500">Year</label>
                        <input
                          type="number"
                          {...register(`qualifications.${index}.year`, { 
                            required: 'Year is required',
                            min: { value: 1900, message: 'Invalid year' },
                            max: { value: new Date().getFullYear(), message: 'Year cannot be in future' }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQualification(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addQualification}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Qualification
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Practice Information Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Home className="mr-2 h-5 w-5" /> Practice Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hospital/Clinic Name*</label>
              <input
                {...register('hospitalName', { required: 'Hospital name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.hospitalName && <p className="mt-1 text-sm text-red-600">{errors.hospitalName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hospital Address*</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Street 1*</label>
                  <input
                    {...register('hospitalAddress.street1', { required: 'Street address is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Street 2</label>
                  <input
                    {...register('hospitalAddress.street2')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">City*</label>
                  <input
                    {...register('hospitalAddress.city', { required: 'City is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">State*</label>
                  <input
                    {...register('hospitalAddress.state', { required: 'State is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Postal Code*</label>
                  <input
                    {...register('hospitalAddress.postalCode', { required: 'Postal code is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Country*</label>
                  <input
                    {...register('hospitalAddress.country', { required: 'Country is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number*</label>
              <input
                {...register('phoneNumber', { required: 'Phone number is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Consultation Fee*</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  {...register('consultationFee', { 
                    required: 'Consultation fee is required',
                    min: { value: 0, message: 'Must be 0 or more' }
                  })}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              {errors.consultationFee && <p className="mt-1 text-sm text-red-600">{errors.consultationFee.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Service Areas*</label>
              <div className="mt-2 space-x-4">
                {serviceAreasOptions.map(option => (
                  <label key={option} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      {...register('serviceAreas', { required: 'At least one service area is required' })}
                      value={option}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
              {errors.serviceAreas && <p className="mt-1 text-sm text-red-600">{errors.serviceAreas.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Appointment Duration (minutes)*</label>
              <select
                {...register('appointmentDuration', { required: 'Appointment duration is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {appointmentDurations.map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
              {errors.appointmentDuration && <p className="mt-1 text-sm text-red-600">{errors.appointmentDuration.message}</p>}
            </div>
          </div>
        </section>
        {/* Documents Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5" /> Required Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">National ID Front*</label>
              <div className="flex items-center mt-1">
                <input
                  {...register('nationalId.frontImage', { required: 'National ID front is required' })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentType('nationalId.frontImage')
                    setShowDocumentUpload(true)
                  }}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Image className="h-5 w-5" />
                </button>
              </div>
              {errors.nationalId?.frontImage && <p className="mt-1 text-sm text-red-600">{errors.nationalId.frontImage.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">National ID Back*</label>
              <div className="flex items-center mt-1">
                <input
                  {...register('nationalId.backImage', { required: 'National ID back is required' })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentType('nationalId.backImage')
                    setShowDocumentUpload(true)
                  }}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Image className="h-5 w-5" />
                </button>
              </div>
              {errors.nationalId?.backImage && <p className="mt-1 text-sm text-red-600">{errors.nationalId.backImage.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Medical License Front*</label>
              <div className="flex items-center mt-1">
                <input
                  {...register('licenseInfo.frontImage', { required: 'License front is required' })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentType('licenseInfo.frontImage')
                    setShowDocumentUpload(true)
                  }}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Image className="h-5 w-5" />
                </button>
              </div>
              {errors.licenseInfo?.frontImage && <p className="mt-1 text-sm text-red-600">{errors.licenseInfo.frontImage.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Medical License Back*</label>
              <div className="flex items-center mt-1">
                <input
                  {...register('licenseInfo.backImage', { required: 'License back is required' })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentType('licenseInfo.backImage')
                    setShowDocumentUpload(true)
                  }}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Image className="h-5 w-5" />
                </button>
              </div>
              {errors.licenseInfo?.backImage && <p className="mt-1 text-sm text-red-600">{errors.licenseInfo.backImage.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Board Certifications Document</label>
              <div className="flex items-center mt-1">
                <input
                  {...register('boardCertificationsDocument')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentType('boardCertificationsDocument')
                    setShowDocumentUpload(true)
                  }}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Image className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Education Document</label>
              <div className="flex items-center mt-1">
                <input
                  {...register('educationDocument')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDocumentType('educationDocument')
                    setShowDocumentUpload(true)
                  }}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <Image className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Information Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BookOpen className="mr-2 h-5 w-5" /> Additional Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                {...register('bio')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Application Notes</label>
              <textarea
                {...register('applicationNotes')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Any additional information for the admin review"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitProfile.isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitProfile.isLoading ? 'Submitting...' : 'Submit Profile'}
          </button>
        </div>
      </form>

      {/* Document Upload Modal */}
      <Transition.Root show={showDocumentUpload} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowDocumentUpload(false)}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                      <Image className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Upload {currentDocumentType.split('.').pop()} Document
                      </Dialog.Title>
                      <div className="mt-2">
                        <input
                          type="file"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleDocumentUpload(e.target.files[0])
                            }
                          }}
                          className="mt-2 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                      onClick={() => setShowDocumentUpload(false)}
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
  )
}

export default DoctorProfileCompletion
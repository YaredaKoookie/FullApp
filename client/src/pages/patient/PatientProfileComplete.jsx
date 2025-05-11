import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Combobox, Listbox, Transition } from '@headlessui/react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

// Schema validation
const schema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  gender: yup.string().oneOf(['male', 'female', 'other']).required('Gender is required'),
  phone: yup
    .string()
    .matches(
      /^\+?[1-9]\d{1,14}$|^(\+?\d{1,3})?[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}$/,
      'Invalid phone number format'
    )
    .required('Phone number is required'),
  dob: yup
    .date()
    .max(new Date(), 'Date of birth must be in the past')
    .required('Date of birth is required'),
  emergencyContact: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string().required('Emergency contact name is required'),
        relation: yup.string().required('Relation is required'),
        phone: yup
          .string()
          .matches(
            /^\+?[1-9]\d{1,14}$|^(\+?\d{1,3})?[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}$/,
            'Invalid phone number format'
          )
          .required('Emergency contact phone is required'),
      })
    )
    .min(1, 'At least one emergency contact is required'),
  location: yup.object().shape({
    country: yup.string().required('Country is required'),
    city: yup.string().required('City is required'),
    coordinates: yup.object().shape({
      coordinates: yup
        .array()
        .of(yup.number())
        .length(2, 'Coordinates must include longitude and latitude')
        .required(),
    }),
  }),
});

const genderOptions = ['male', 'female', 'other'];
const relationOptions = ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'];

const PatientProfileCompletion = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([{ name: '', relation: '', phone: '' }]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      emergencyContact: [{ name: '', relation: '', phone: '' }],
    },
  });

  const onSubmit = (data) => {
    console.log('Form submitted:', data);
    // Handle form submission
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([...emergencyContacts, { name: '', relation: '', phone: '' }]);
  };

  const removeEmergencyContact = (index) => {
    const updatedContacts = [...emergencyContacts];
    updatedContacts.splice(index, 1);
    setEmergencyContacts(updatedContacts);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setValue('dob', date);
    setShowDatePicker(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
            <p className="mt-2 text-indigo-100">
              Please fill in the required information to complete your patient profile
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-8 space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Personal Information</h2>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors.name ? 'border-red-500' : 'border'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  {...register('gender')}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors.gender ? 'border-red-500' : 'border'
                  }`}
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors.phone ? 'border-red-500' : 'border'
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    id="dob"
                    type="text"
                    readOnly
                    value={selectedDate ? format(selectedDate, 'MM/dd/yyyy') : ''}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      errors.dob ? 'border-red-500' : 'border'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {showDatePicker && (
                  <div className="mt-2 z-10">
                    <input type="date" selected={selectedDate} onChange={handleDateSelect} inline />
                  </div>
                )}
                {errors.dob && (
                  <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
                )}
              </div>
            </div>

            {/* Emergency Contacts Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Emergency Contacts <span className="text-red-500">*</span>
              </h2>

              {emergencyContacts.map((_, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-4 relative">
                  {emergencyContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmergencyContact(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}

                  <div>
                    <label
                      htmlFor={`emergencyContact.${index}.name`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`emergencyContact.${index}.name`}
                      type="text"
                      {...register(`emergencyContact.${index}.name`)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.emergencyContact?.[index]?.name ? 'border-red-500' : 'border'
                      }`}
                    />
                    {errors.emergencyContact?.[index]?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.emergencyContact[index].name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`emergencyContact.${index}.relation`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Relation <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={`emergencyContact.${index}.relation`}
                      {...register(`emergencyContact.${index}.relation`)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.emergencyContact?.[index]?.relation ? 'border-red-500' : 'border'
                      }`}
                    >
                      <option value="">Select relation</option>
                      {relationOptions.map((relation) => (
                        <option key={relation} value={relation}>
                          {relation}
                        </option>
                      ))}
                    </select>
                    {errors.emergencyContact?.[index]?.relation && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.emergencyContact[index].relation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`emergencyContact.${index}.phone`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`emergencyContact.${index}.phone`}
                      type="tel"
                      {...register(`emergencyContact.${index}.phone`)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.emergencyContact?.[index]?.phone ? 'border-red-500' : 'border'
                      }`}
                    />
                    {errors.emergencyContact?.[index]?.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.emergencyContact[index].phone.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addEmergencyContact}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Another Emergency Contact
              </button>
            </div>

            {/* Location Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Location Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="country"
                    type="text"
                    {...register('location.country')}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      errors.location?.country ? 'border-red-500' : 'border'
                    }`}
                  />
                  {errors.location?.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.country.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register('location.city')}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                      errors.location?.city ? 'border-red-500' : 'border'
                    }`}
                  />
                  {errors.location?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('location.address')}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    id="state"
                    type="text"
                    {...register('location.state')}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    {...register('location.postalCode')}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Complete Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileCompletion;
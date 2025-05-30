import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@api/apiClient';
import { endpoints } from '@/api/endpoints';

const BLOOD_TYPES = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"
];

const FREQUENCY_OPTIONS = ["Never", "Occasionally", "Weekly", "Daily"];

const vitalsSchema = z.object({
  height: z.number().min(0).max(300).optional(),
  weight: z.number().min(0).max(500).optional(),
  bloodType: z.enum([...BLOOD_TYPES, ""]).optional(),
  lifestyle: z.object({
    smoking: z.object({
      status: z.boolean(),
      frequency: z.enum(FREQUENCY_OPTIONS),
      years: z.number().min(0).max(100).optional()
    }),
    alcohol: z.object({
      status: z.boolean(),
      frequency: z.enum(FREQUENCY_OPTIONS)
    }),
    exerciseFrequency: z.enum(FREQUENCY_OPTIONS),
    diet: z.string().max(100).optional(),
    occupation: z.string().max(100).optional()
  })
});

const UpdateVitalsModal = ({ isOpen, onClose, initialData }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      height: initialData?.height || '',
      weight: initialData?.weight || '',
      bloodType: initialData?.bloodType || '',
      lifestyle: {
        smoking: {
          status: initialData?.lifestyle?.smoking?.status || false,
          frequency: initialData?.lifestyle?.smoking?.frequency || 'Never',
          years: initialData?.lifestyle?.smoking?.years || 0
        },
        alcohol: {
          status: initialData?.lifestyle?.alcohol?.status || false,
          frequency: initialData?.lifestyle?.alcohol?.frequency || 'Never'
        },
        exerciseFrequency: initialData?.lifestyle?.exerciseFrequency || 'Never',
        diet: initialData?.lifestyle?.diet || '',
        occupation: initialData?.lifestyle?.occupation || ''
      }
    }
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        height: initialData.height || '',
        weight: initialData.weight || '',
        bloodType: initialData.bloodType || '',
        lifestyle: {
          smoking: {
            status: initialData.lifestyle?.smoking?.status || false,
            frequency: initialData.lifestyle?.smoking?.frequency || 'Never',
            years: initialData.lifestyle?.smoking?.years || 0
          },
          alcohol: {
            status: initialData.lifestyle?.alcohol?.status || false,
            frequency: initialData.lifestyle?.alcohol?.frequency || 'Never'
          },
          exerciseFrequency: initialData.lifestyle?.exerciseFrequency || 'Never',
          diet: initialData.lifestyle?.diet || '',
          occupation: initialData.lifestyle?.occupation || ''
        }
      });
    }
  }, [initialData, reset]);

  const smokingStatus = watch('lifestyle.smoking.status');
  const alcoholStatus = watch('lifestyle.alcohol.status');

  const { mutate: updateVitals } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.put(endpoints.patient.medicalHistory.base(), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      toast.success('Vital statistics updated successfully');
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update vital statistics');
    }
  });

  const onSubmit = (data) => {
    console.log("vitals", data)
    updateVitals(data);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Update Vital Statistics & Lifestyle
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Vital Statistics Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Vital Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          {...register('height', { valueAsNumber: true })}
                          className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.height ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter height"
                        />
                        {errors.height && (
                          <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          {...register('weight', { valueAsNumber: true })}
                          className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.weight ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter weight"
                        />
                        {errors.weight && (
                          <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700">
                          Blood Type
                        </label>
                        <select
                          {...register('bloodType')}
                          className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            errors.bloodType ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select blood type</option>
                          {BLOOD_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {errors.bloodType && (
                          <p className="mt-1 text-sm text-red-600">{errors.bloodType.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Lifestyle Information</h4>
                    
                    {/* Smoking */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('lifestyle.smoking.status')}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Smoking
                        </label>
                      </div>
                      {smokingStatus && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Frequency
                            </label>
                            <select
                              {...register('lifestyle.smoking.frequency')}
                              className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                errors.lifestyle?.smoking?.frequency ? 'border-red-300' : 'border-gray-300'
                              }`}
                            >
                              {FREQUENCY_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            {errors.lifestyle?.smoking?.frequency && (
                              <p className="mt-1 text-sm text-red-600">{errors.lifestyle.smoking.frequency.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Years
                            </label>
                            <input
                              type="number"
                              {...register('lifestyle.smoking.years', { valueAsNumber: true })}
                              className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                errors.lifestyle?.smoking?.years ? 'border-red-300' : 'border-gray-300'
                              }`}
                              min="0"
                            />
                            {errors.lifestyle?.smoking?.years && (
                              <p className="mt-1 text-sm text-red-600">{errors.lifestyle.smoking.years.message}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Alcohol */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('lifestyle.alcohol.status')}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Alcohol Use
                        </label>
                      </div>
                      {alcoholStatus && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700">
                            Frequency
                          </label>
                          <select
                            {...register('lifestyle.alcohol.frequency')}
                            className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              errors.lifestyle?.alcohol?.frequency ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            {FREQUENCY_OPTIONS.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          {errors.lifestyle?.alcohol?.frequency && (
                            <p className="mt-1 text-sm text-red-600">{errors.lifestyle.alcohol.frequency.message}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Exercise */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Exercise Frequency
                      </label>
                      <select
                        {...register('lifestyle.exerciseFrequency')}
                        className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.lifestyle?.exerciseFrequency ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        {FREQUENCY_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {errors.lifestyle?.exerciseFrequency && (
                        <p className="mt-1 text-sm text-red-600">{errors.lifestyle.exerciseFrequency.message}</p>
                      )}
                    </div>

                    {/* Diet */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Diet
                      </label>
                      <input
                        type="text"
                        {...register('lifestyle.diet')}
                        className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.lifestyle?.diet ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Vegetarian, Mediterranean, etc."
                      />
                      {errors.lifestyle?.diet && (
                        <p className="mt-1 text-sm text-red-600">{errors.lifestyle.diet.message}</p>
                      )}
                    </div>

                    {/* Occupation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Occupation
                      </label>
                      <input
                        type="text"
                        {...register('lifestyle.occupation')}
                        className={`input mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.lifestyle?.occupation ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your occupation"
                      />
                      {errors.lifestyle?.occupation && (
                        <p className="mt-1 text-sm text-red-600">{errors.lifestyle.occupation.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UpdateVitalsModal; 
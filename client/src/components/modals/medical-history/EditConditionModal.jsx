import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@api/apiClient';

const CONDITION_STATUS = ['Active', 'In Remission', 'Resolved'];

const conditionSchema = z.object({
  name: z.string().min(1, 'Condition name is required'),
  diagnosisDate: z.string().min(1, 'Diagnosis date is required'),
  isChronic: z.boolean(),
  status: z.string().refine((val) => !val || CONDITION_STATUS.includes(val), {
    message: 'Invalid status',
  }),
  resolvedDate: z.string().optional().transform(val => val === '' ? undefined : val),
}).refine((data) => {
  if (data.status === 'Resolved') {
    return !!data.resolvedDate;
  }
  return true;
}, {
  message: 'Resolved date is required when status is Resolved',
  path: ['resolvedDate'],
}).refine((data) => {
  if (data.resolvedDate && data.diagnosisDate) {
    return new Date(data.resolvedDate) >= new Date(data.diagnosisDate);
  }
  return true;
}, {
  message: 'Resolved date must be after diagnosis date',
  path: ['resolvedDate'],
});

const EditConditionModal = ({ isOpen, onClose, condition, onSuccess }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(conditionSchema),
    defaultValues: {
      name: condition?.name || '',
      diagnosisDate: condition?.diagnosisDate ? new Date(condition.diagnosisDate).toISOString().split('T')[0] : '',
      isChronic: condition?.isChronic || false,
      status: condition?.status || 'Active',
      resolvedDate: condition?.resolvedDate ? new Date(condition.resolvedDate).toISOString().split('T')[0] : '',
    },
  });

  console.log(condition)

  const isChronic = watch('isChronic');
  const status = watch("status")

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.put(`/medical-history/conditions/${condition._id}`, {
        ...data,
        conditionType: data.isChronic ? 'chronic' : 'past',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      reset();
      onSuccess();
    },
  });

  const onSubmit = (data) => {
    // Transform the data before sending to server
    const transformedData = {
      ...data,
      // Only include resolvedDate if it exists and status is Resolved
      resolvedDate: data.status === 'Resolved' ? data.resolvedDate : undefined,
      diagnosisDate: data.diagnosisDate,
    };
    console.log("transformedData", transformedData)
    mutate(transformedData);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Edit Medical Condition
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Condition Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="diagnosisDate"
                className="block text-sm font-medium text-gray-700"
              >
                Diagnosis Date
              </label>
              <input
                type="date"
                id="diagnosisDate"
                {...register('diagnosisDate')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.diagnosisDate && (
                <p className="mt-1 text-sm text-red-600">{errors.diagnosisDate.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isChronic"
                {...register('isChronic')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isChronic"
                className="ml-2 block text-sm text-gray-700"
              >
                Chronic Condition
              </label>
            </div>

            
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {CONDITION_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            {status === "Resolved" &&
              <div>
                <label
                  htmlFor="resolvedDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Resolved Date
                </label>
                <input
                  type="date"
                  id="resolvedDate"
                  {...register('resolvedDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.resolvedDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.resolvedDate.message}</p>
                )}
              </div>
            }

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditConditionModal; 
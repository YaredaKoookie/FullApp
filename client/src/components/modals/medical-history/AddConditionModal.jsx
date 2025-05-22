import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/apiClient';

const CONDITION_STATUS = ['Active', 'In Remission', 'Resolved'];

const conditionSchema = z.object({
  name: z.string().min(1, 'Condition name is required'),
  diagnosisDate: z.string().min(1, 'Diagnosis date is required'),
  isChronic: z.boolean().default(false),
  status: z.enum(CONDITION_STATUS),
  resolvedDate: z.string().optional().refine((val, ctx) => {
    if (!val || val === '') return true;
    const diagnosisDate = ctx.parent.diagnosisDate;
    if (!diagnosisDate) return true;
    return new Date(val) >= new Date(diagnosisDate);
  }, {
    message: 'Resolved date must be after diagnosis date'
  }),
}).refine((data) => {
  if (data.isChronic) {
    return !!data.status;
  }
  return true;
}, {
  message: "Status is required for chronic conditions",
  path: ["status"]
}).refine((data) => {
  if (!data.isChronic && data.status === 'Resolved') {
    return !!data.resolvedDate;
  }
  return true;
}, {
  message: "Resolved date is required when status is Resolved",
  path: ["resolvedDate"]
});

const AddConditionModal = ({ isOpen, onClose, onSuccess }) => {
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
      name: '',
      diagnosisDate: '',
      isChronic: false,
      status: 'Active',
    },
  });

  const isChronic = watch('isChronic');
  const status = watch("status");

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/medical-history/conditions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add condition');
    }
  });

  const onSubmit = (data) => {
    console.log("condition", data)
    mutate(data);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Add Medical Condition
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
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="input h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
            
             {status === "Resolved" && <div>
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
                  className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.resolvedDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.resolvedDate.message}</p>
                )}
              </div>}

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
                {isSubmitting ? 'Adding...' : 'Add Condition'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddConditionModal; 
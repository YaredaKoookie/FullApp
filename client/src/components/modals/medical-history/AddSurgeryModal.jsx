import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@api/apiClient';
import { toast } from 'react-toastify';

const surgerySchema = z.object({
  name: z.string().min(1, 'Surgery name is required'),
  date: z.string().min(1, 'Surgery date is required')
    .refine((date) => {
      return new Date(date) <= new Date();
    }, {
      message: 'Surgery date cannot be in the future',
    }),
  outcome: z.string().optional(),
  hospital: z.string().optional(),
  surgeon: z.object({
    name: z.string().optional(),
    // doctorId: z.string().optional(),
  })
});

const AddSurgeryModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(surgerySchema),
    defaultValues: {
      name: '',
      date: '',
      outcome: '',
      hospital: '',
      surgeon: {
        name: '',
      },
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/medical-history/surgeries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add surgery record');
    }
  });

  const onSubmit = (data) => {
    console.log("surgery data", data);
    mutate(data);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Add Surgical Procedure
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
                Procedure Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Appendectomy, Knee Replacement"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Surgery Date
              </label>
              <input
                type="date"
                id="date"
                {...register('date')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="outcome"
                className="block text-sm font-medium text-gray-700"
              >
                Outcome (Optional)
              </label>
              <textarea
                id="outcome"
                {...register('outcome')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Describe the outcome of the surgery"
              />
              {errors.outcome && (
                <p className="mt-1 text-sm text-red-600">{errors.outcome.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="hospital"
                className="block text-sm font-medium text-gray-700"
              >
                Hospital (Optional)
              </label>
              <input
                type="text"
                id="hospital"
                {...register('hospital')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., City General Hospital"
              />
              {errors.hospital && (
                <p className="mt-1 text-sm text-red-600">{errors.hospital.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="surgeon"
                className="block text-sm font-medium text-gray-700"
              >
                Surgeon (Optional)
              </label>
              <input
                type="text"
                id="surgeon"
                {...register('surgeon.name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Dr. John Smith"
              />
              {errors.surgeon?.name && (
                <p className="mt-1 text-sm text-red-600">{errors.surgeon.name.message}</p>
              )}
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
                {isSubmitting ? 'Adding...' : 'Add Surgery Record'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddSurgeryModal; 
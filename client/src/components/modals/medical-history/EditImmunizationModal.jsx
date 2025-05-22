import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-toastify';

const immunizationSchema = z.object({
  vaccine: z.string().min(1, 'Vaccine name is required'),
  date: z.string().min(1, 'Vaccination date is required')
    .refine((date) => {
      return new Date(date) <= new Date();
    }, {
      message: 'Vaccination date cannot be in the future',
    }),
  boosterDue: z.string().optional(),
  administeredBy: z.string().optional(),
});

const EditImmunizationModal = ({ isOpen, onClose, onSuccess, immunization }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(immunizationSchema),
    defaultValues: {
      vaccine: immunization?.vaccine || '',
      date: immunization?.date ? new Date(immunization?.date).toISOString().split('T')[0] : '',
      boosterDue: immunization?.boosterDue ? new Date(immunization?.boosterDue).toISOString().split('T')[0] : '',
      administeredBy: immunization?.administeredBy || '',
    },
  });

  console.log("immunization", immunization);

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.put(`/medical-history/immunizations/${immunization._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update immunization record');
    }
  });

  const onSubmit = (data) => {
    mutate(data);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Edit Immunization Record
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
                htmlFor="vaccine"
                className="block text-sm font-medium text-gray-700"
              >
                Vaccine Name
              </label>
              <input
                type="text"
                id="vaccine"
                {...register('vaccine')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., COVID-19, Influenza"
              />
              {errors.vaccine && (
                <p className="mt-1 text-sm text-red-600">{errors.vaccine.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Vaccination Date
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
                htmlFor="boosterDue"
                className="block text-sm font-medium text-gray-700"
              >
                Booster Due Date (Optional)
              </label>
              <input
                type="date"
                id="boosterDue"
                {...register('boosterDue')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.boosterDue && (
                <p className="mt-1 text-sm text-red-600">{errors.boosterDue.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="administeredBy"
                className="block text-sm font-medium text-gray-700"
              >
                Administered By (Optional)
              </label>
              <input
                type="text"
                id="administeredBy"
                {...register('administeredBy')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Dr. Smith, City Hospital"
              />
              {errors.administeredBy && (
                <p className="mt-1 text-sm text-red-600">{errors.administeredBy.message}</p>
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
                {isSubmitting ? 'Updating...' : 'Update Immunization Record'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditImmunizationModal; 
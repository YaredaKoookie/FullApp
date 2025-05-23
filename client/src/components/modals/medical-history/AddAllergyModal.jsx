import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@api/apiClient';

const ALLERGY_SEVERITY = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];

const allergySchema = z.object({
  substance: z.string().min(1, 'Substance is required'),
  reaction: z.string().min(1, 'Reaction is required'),
  severity: z.enum(ALLERGY_SEVERITY, {
    required_error: 'Please select a severity level',
  }),
  isCritical: z.boolean().default(false),
   firstObserved: z.string().optional()
    .refine((date) => {
      if (!date) return true;
      return new Date(date) <= new Date();
    }, {
      message: 'First observed date cannot be in the future',
    }),
});

const AddAllergyModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      substance: '',
      reaction: '',
      severity: undefined,
      isCritical: false,
      firstObserved: '',
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/medical-history/allergies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const onSubmit = (data) => {
    console.log("data", data)
    mutate(data);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Add Allergy
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
                htmlFor="substance"
                className="block text-sm font-medium text-gray-700"
              >
                Substance
              </label>
              <input
                type="text"
                id="substance"
                {...register('substance')}
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Penicillin, Peanuts"
              />
              {errors.substance && (
                <p className="mt-1 text-sm text-red-600">{errors.substance.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reaction"
                className="block text-sm font-medium text-gray-700"
              >
                Reaction
              </label>
              <input
                type="text"
                id="reaction"
                {...register('reaction')}
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Hives, Anaphylaxis"
              />
              {errors.reaction && (
                <p className="mt-1 text-sm text-red-600">{errors.reaction.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="severity"
                className="block text-sm font-medium text-gray-700"
              >
                Severity
              </label>
              <select
                id="severity"
                {...register('severity')}
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select severity</option>
                {ALLERGY_SEVERITY.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
              {errors.severity && (
                <p className="mt-1 text-sm text-red-600">{errors.severity.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isCritical"
                {...register('isCritical')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isCritical"
                className="ml-2 block text-sm text-gray-700"
              >
                Critical Allergy
              </label>
            </div>

            <div>
              <label
                htmlFor="firstObserved"
                className="block text-sm font-medium text-gray-700"
              >
                First Observed
              </label>
              <input
                type="date"
                id="firstObserved"
                {...register('firstObserved')}
                className="input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.firstObserved && (
                <p className="mt-1 text-sm text-red-600">{errors.firstObserved.message}</p>
              )}
            </div>

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
                {isSubmitting ? 'Adding...' : 'Add Allergy'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddAllergyModal; 
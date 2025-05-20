import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-toastify';

const familyHistorySchema = z.object({
  relation: z.string().min(1, 'Relationship is required'),
  condition: z.string().min(1, 'Medical condition is required'),
  ageOfOnset: z.string().optional(),
  status: z.enum(['alive', 'deceased', 'unknown']).default('alive'),
  notes: z.string().optional(),
});

const EditFamilyHistoryModal = ({ isOpen, onClose, onSuccess, familyHistory }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(familyHistorySchema),
    defaultValues: {
      relation: familyHistory?.relation || '',
      condition: familyHistory?.condition || '',
      ageOfOnset: familyHistory?.ageOfOnset || '',
      status: familyHistory?.status || 'alive',
      notes: familyHistory?.notes || '',
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.put(`/medical-history/family-history/${familyHistory.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      reset();
      onSuccess();
      toast.success('Family history record updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update family history record');
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
              Edit Family Medical History
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
                htmlFor="relation"
                className="block text-sm font-medium text-gray-700"
              >
                Relationship
              </label>
              <select
                id="relation"
                {...register('relation')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select relationship</option>
                <option value="mother">Mother</option>
                <option value="father">Father</option>
                <option value="sister">Sister</option>
                <option value="brother">Brother</option>
                <option value="maternal_grandmother">Maternal Grandmother</option>
                <option value="maternal_grandfather">Maternal Grandfather</option>
                <option value="paternal_grandmother">Paternal Grandmother</option>
                <option value="paternal_grandfather">Paternal Grandfather</option>
                <option value="aunt">Aunt</option>
                <option value="uncle">Uncle</option>
                <option value="cousin">Cousin</option>
                <option value="other">Other</option>
              </select>
              {errors.relation && (
                <p className="mt-1 text-sm text-red-600">{errors.relation.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700"
              >
                Medical Condition
              </label>
              <input
                type="text"
                id="condition"
                {...register('condition')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Type 2 Diabetes, Heart Disease"
              />
              {errors.condition && (
                <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ageOfOnset"
                  className="block text-sm font-medium text-gray-700"
                >
                  Age of Onset (Optional)
                </label>
                <input
                  type="number"
                  id="ageOfOnset"
                  {...register('ageOfOnset')}
                  min="0"
                  max="120"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Age in years"
                />
                {errors.ageOfOnset && (
                  <p className="mt-1 text-sm text-red-600">{errors.ageOfOnset.message}</p>
                )}
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
                  <option value="alive">Alive</option>
                  <option value="deceased">Deceased</option>
                  <option value="unknown">Unknown</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter any additional details about the condition or family member"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
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
                {isSubmitting ? 'Updating...' : 'Update Family History Record'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditFamilyHistoryModal; 
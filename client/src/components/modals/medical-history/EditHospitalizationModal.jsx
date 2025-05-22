import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-toastify';

const hospitalizationSchema = z.object({
  reason: z.string().min(1, 'Reason for hospitalization is required'),
  admissionDate: z.string().min(1, 'Admission date is required')
    .refine((date) => {
      return new Date(date) <= new Date();
    }, {
      message: 'Admission date cannot be in the future',
    }),
  dischargeDate: z.string().optional(),
  hospital: z.string().min(1, 'Hospital name is required'),
  department: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

const EditHospitalizationModal = ({ isOpen, onClose, onSuccess, hospitalization }) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(hospitalizationSchema),
    defaultValues: {
      reason: hospitalization?.reason || '',
      admissionDate: hospitalization?.admissionDate || '',
      dischargeDate: hospitalization?.dischargeDate || '',
      hospital: hospitalization?.hospital || '',
      department: hospitalization?.department || '',
      diagnosis: hospitalization?.diagnosis || '',
      treatment: hospitalization?.treatment || '',
      notes: hospitalization?.notes || '',
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.put(`/medical-history/hospitalizations/${hospitalization._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalHistory']);
      reset();
      onSuccess();
      toast.success('Hospitalization record updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update hospitalization record');
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
              Edit Hospitalization Record
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
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700"
              >
                Reason for Hospitalization
              </label>
              <input
                type="text"
                id="reason"
                {...register('reason')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Heart Attack, Appendicitis"
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="admissionDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admission Date
                </label>
                <input
                  type="date"
                  id="admissionDate"
                  {...register('admissionDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.admissionDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.admissionDate.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dischargeDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Discharge Date (Optional)
                </label>
                <input
                  type="date"
                  id="dischargeDate"
                  {...register('dischargeDate')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.dischargeDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dischargeDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="hospital"
                className="block text-sm font-medium text-gray-700"
              >
                Hospital Name
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
                htmlFor="department"
                className="block text-sm font-medium text-gray-700"
              >
                Department (Optional)
              </label>
              <input
                type="text"
                id="department"
                {...register('department')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., Cardiology, Emergency"
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="diagnosis"
                className="block text-sm font-medium text-gray-700"
              >
                Diagnosis (Optional)
              </label>
              <textarea
                id="diagnosis"
                {...register('diagnosis')}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter the diagnosis"
              />
              {errors.diagnosis && (
                <p className="mt-1 text-sm text-red-600">{errors.diagnosis.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="treatment"
                className="block text-sm font-medium text-gray-700"
              >
                Treatment (Optional)
              </label>
              <textarea
                id="treatment"
                {...register('treatment')}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter the treatment received"
              />
              {errors.treatment && (
                <p className="mt-1 text-sm text-red-600">{errors.treatment.message}</p>
              )}
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
                placeholder="Enter any additional notes or observations"
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
                {isSubmitting ? 'Updating...' : 'Update Hospitalization Record'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditHospitalizationModal; 
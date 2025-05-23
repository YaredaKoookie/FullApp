import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { endpoints } from '../endpoints';
import apiClient from '../apiClient';

export const useSubmitReview = (doctorId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData) => {
      const response = await apiClient.post(
        endpoints.patient.reviews.submit.replace(':doctorId', doctorId),
        reviewData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both reviews and doctor data queries
      queryClient.invalidateQueries(queryKeys.patient.reviews.all(doctorId));
      queryClient.invalidateQueries(queryKeys.patient.reviews.canReview(doctorId));
      queryClient.invalidateQueries(['doctor', doctorId]);
    }
  });
}; 
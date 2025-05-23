import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { endpoints } from '../endpoints';
import apiClient from '../apiClient';

export const useDoctorReviews = (doctorId) => {
  return useQuery({
    queryKey: queryKeys.patient.reviews.all(doctorId),
    queryFn: async () => {
      const response = await apiClient.get(endpoints.patient.reviews.base.replace(':doctorId', doctorId));
      return response.data?.reviews;
    }
  });
};

export const useCanReviewDoctor = (doctorId) => {
  return useQuery({
    queryKey: queryKeys.patient.reviews.canReview(doctorId),
    queryFn: async () => {
      const response = await apiClient.get(endpoints.patient.reviews.canReview.replace(':doctorId', doctorId));
      return response.data;
    }
  });
}; 
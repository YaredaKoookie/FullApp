import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as medicalHistoryApi from './medicalHistory.api';
import { queryKeys } from '../queryClient';

/**
 * Hook to add a new family history record
 */
export const useAddFamilyHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: medicalHistoryApi.addFamilyHistory,
        onSuccess: () => {
            // Invalidate and refetch family history queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.familyHistory.all(),
            });
            // Also invalidate genetic risk report as it depends on family history
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.familyHistory.geneticRisk(),
            });
        },
    });
};

/**
 * Hook to update a family history record
 */
export const useUpdateFamilyHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ recordId, data }) => 
            medicalHistoryApi.updateFamilyHistory(recordId, data),
        onSuccess: () => {
            // Invalidate and refetch family history queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.familyHistory.all(),
            });
            // Also invalidate genetic risk report as it depends on family history
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.familyHistory.geneticRisk(),
            });
        },
    });
};

/**
 * Hook to delete a family history record
 */
export const useDeleteFamilyHistory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: medicalHistoryApi.deleteFamilyHistory,
        onSuccess: () => {
            // Invalidate and refetch family history queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.familyHistory.all(),
            });
            // Also invalidate genetic risk report as it depends on family history
            queryClient.invalidateQueries({
                queryKey: queryKeys.patient.medicalHistory.familyHistory.geneticRisk(),
            });
        },
    });
}; 
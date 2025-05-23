import { useQuery } from '@tanstack/react-query';
import * as medicalHistoryApi from './medicalHistory.api';
import { queryKeys } from '../queryClient';

/**
 * Hook to fetch complete medical history
 */
export const useMedicalHistory = () => {
    return useQuery({
        queryKey: queryKeys.patient.medicalHistory.all(),
        queryFn: medicalHistoryApi.getMedicalHistory,
    });
};

/**
 * Hook to fetch health summary
 */
export const useHealthSummary = () => {
    return useQuery({
        queryKey: queryKeys.patient.medicalHistory.summary(),
        queryFn: medicalHistoryApi.getHealthSummary,
    });
};

/**
 * Hook to fetch medication timeline
 */
export const useMedicationTimeline = () => {
    return useQuery({
        queryKey: queryKeys.patient.medicalHistory.timeline.medications(),
        queryFn: medicalHistoryApi.getMedicationTimeline,
    });
};

/**
 * Hook to fetch hospitalization timeline
 */
export const useHospitalizationTimeline = () => {
    return useQuery({
        queryKey: queryKeys.patient.medicalHistory.timeline.hospitalizations(),
        queryFn: medicalHistoryApi.getHospitalizationTimeline,
    });
};

/**
 * Hook to fetch immunization history
 */
export const useImmunizationHistory = () => {
    return useQuery({
        queryKey: queryKeys.patient.medicalHistory.immunizations(),
        queryFn: medicalHistoryApi.getImmunizationHistory,
    });
};

/**
 * Hook to fetch family history records
 */
export const useFamilyHistory = () => {
    return useQuery({
        queryKey: queryKeys.patient.medicalHistory.familyHistory.all(),
        queryFn: medicalHistoryApi.getFamilyHistory,
    });
};

/**
 * Hook to fetch genetic risk report
 */
export const useGeneticRiskReport = () => {
    return useQuery({
        queryKey: queryKeys.patient.medicalHistory.familyHistory.geneticRisk(),
        queryFn: medicalHistoryApi.getGeneticRiskReport,
    });
}; 
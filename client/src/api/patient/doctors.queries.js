import { useQuery } from "@tanstack/react-query";
import { getDoctorById, getDoctors, getDoctorsStatistics } from "./doctors.api";
import { queryKeys } from "../queryClient";

export const useGetDoctors = (query) => {
  return useQuery({
    queryFn: () => getDoctors(query),
    queryKey: queryKeys.patient.doctors.list(),
  });
};

export const useGetDoctorById = (id) => {
    return useQuery({
      queryFn: () => getDoctorById(id),
      queryKey: queryKeys.patient.doctors.byId(id),
    });
  };

export const useGetDoctorsStatistics = () => {
  return useQuery({
    queryFn: getDoctorsStatistics,
    queryKey: queryKeys.patient.doctors.statistics(),
    staleTime: Infinity,
  });
};
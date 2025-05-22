import { useMutation, useQueryClient} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { updatePatientProfile, updatePatientProfileImage } from "./profile.api";
import { queryKeys } from "../queryClient";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updatePatientProfile(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
       toast.success(response.message || "Profile has been updated successfully");
    },
  });
};

export const useUpdateProfileImage = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (data) => updatePatientProfileImage(data),
      onError: (error) => {
          toast.error(error.message);
      },
      onSuccess: (response) => {
         queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
         toast.success(response.message || "Profile image has been updated successfully");
      },
    });
  };
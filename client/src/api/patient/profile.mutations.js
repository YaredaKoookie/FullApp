import { useMutation, useQueryClient} from "@tanstack/react-query";
import { toast } from "react-toastify";
import { addEmergencyContact, addInsurance, deleteEmergencyContact, deleteInsurance, updateEmergencyContact, updateInsurance, updatePatientProfile, updatePatientProfileImage } from "./profile.api";
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
       toast.success(response.message || "Profile has been updated ");
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
         toast.success(response.message || "Profile image has been updated ");
      },
    });
};

export const useAddInsurance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => addInsurance(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
       toast.success(response.message || "Insurance has been added ");
    },
  });
}

export const useUpdateInsurance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({insuranceId, ...data}) => updateInsurance(insuranceId, data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
       toast.success(response.message || "Insurance has been updated ");
    },
  });
};

export const useDeleteInsurance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (insuranceId) => deleteInsurance(insuranceId),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
       toast.success(response.message || "Insurance has been deleted ");
    },
  });
};
export const useAddEmergencyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => addEmergencyContact(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
       toast.success(response.message || "Emergency contact has been added");
    },
  });
}

export const useUpdateEmergencyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({contactId, ...data}) => updateEmergencyContact(contactId, data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
       toast.success(response.message || "Emergency Contact has been updated ");
    },
  });
};

export const useDeleteEmergencyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emergencyContact) => deleteEmergencyContact(emergencyContact),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: queryKeys.patient.profile()})
       toast.success(response.message || "Emergency Contact has been deleted ");
    },
  });
};
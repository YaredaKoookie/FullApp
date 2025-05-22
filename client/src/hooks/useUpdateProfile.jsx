import { updateProfile,} from "@/lib/api";
import { useMutation, useQueryClient} from "@tanstack/react-query";
import { toast } from "react-toastify";

const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateProfile(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: ["patient", "profile"]})
       toast.success(response.message || "Profile has been updated successfully");
    },
  });
};

export default useUpdateProfile;

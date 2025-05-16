import { updateProfileImage } from "@/lib/api";
import { useMutation, useQueryClient} from "@tanstack/react-query";
import { toast } from "react-toastify";

const useUpdateProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateProfileImage(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       queryClient.invalidateQueries({queryKey: ["patient", "profile"]})
       toast.success(response.message || "Profile image has been changed");
    },
  });
};

export default useUpdateProfileImage;

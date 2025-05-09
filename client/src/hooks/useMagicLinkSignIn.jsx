import { magicLinkSignIn } from "@/lib/api";
import { useMutation} from "@tanstack/react-query";
import { toast } from "react-toastify";

const useMagicLinkSignIn = () => {

  return useMutation({
    mutationFn: (data) => magicLinkSignIn(data),
    onError: (error) => {
        toast.error(error.message);
    },
    onSuccess: (response) => {
       toast.success(response.message || "Magic link has been sent to your email");
    },
  });
};

export default useMagicLinkSignIn;

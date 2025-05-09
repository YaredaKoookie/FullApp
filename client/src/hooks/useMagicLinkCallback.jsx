import { magicLinkCallback } from "@/lib/api";
import { useMutation} from "@tanstack/react-query";

const useMagicLinkCallback = () => {

  return useMutation({
    mutationFn: (token) => magicLinkCallback(token),
  });
};

export default useMagicLinkCallback;

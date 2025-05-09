import { register } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"
import { toast } from "react-toastify"

export const useRegister = () => {
    return useMutation({
        mutationFn: data => register(data),
        onSuccess: (response) => {
            toast.success(response.message || "Verification link has been sent to your email");
        }
    })
}

export default useRegister;
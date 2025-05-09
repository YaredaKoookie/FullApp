import { logout } from '@/lib/api';
import { useAuth } from '@/context/AuthContext'
import { Button } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';

const PatientLayout = () => {
  const {user, logout: logoutUser} =  useAuth();
  const logoutMutation = useMutation({
     mutationFn: logout,
     onSuccess: () => logoutUser()
  })

  return (
    <div>
        <h1>Email: {user.name}</h1>
        <Button 
        loading={logoutMutation.isPending}
        loadingText={"Please wait..."}
        onClick={logoutMutation.mutate}
        >Logout</Button>
    </div>
  )
}

export default PatientLayout
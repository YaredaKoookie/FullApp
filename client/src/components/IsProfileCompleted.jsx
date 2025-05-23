import { useAuth } from '@/context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom';
import Loading from './Loading';

const IsProfileCompleted = ({children}) => {
  const {user, isLoading} = useAuth();

  if(isLoading)
    return <Loading />

  if(!user)
    return <Navigate to="/auth/login" replace />

  console.log(user);

  if(!user.isProfileCompleted){
    return <Navigate to="/patient/complete-profile" replace />
  }

  return children || <Outlet />
}

export default IsProfileCompleted
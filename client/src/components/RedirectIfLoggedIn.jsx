import { useAuth } from '@/context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom';
import Loading from './Loading';

const RedirectIfLoggedIn = ({children}) => {
  const {user, isLoading} = useAuth();

  if(isLoading)
    return <Loading />

  if(user)
    return <Navigate to="/" replace />

  return children || <Outlet />
}

export default RedirectIfLoggedIn
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from 'hooks/useAuth';
import { GuardProps } from 'types/auth';

const SuperAdminGuard = ({ children }: GuardProps) => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn || (user as any)?.role !== 'superadmin') {
      navigate('/Chats', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);

  return children;
};

export default SuperAdminGuard;

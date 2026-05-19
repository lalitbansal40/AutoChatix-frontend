import React, { createContext, useEffect, useReducer } from 'react';

import jwtDecode from 'jwt-decode';

import { LOGIN, LOGOUT } from 'store/reducers/actions';
import authReducer from 'store/reducers/auth';

import Loader from 'components/Loader';
import axios from 'utils/axios';
import { KeyedObject } from 'types/root';
import { AuthProps, JWTContextType } from 'types/auth';

const initialState: AuthProps = {
  isLoggedIn: false,
  isInitialized: false,
  user: null,
  originalToken: null,
};

const verifyToken = (serviceToken: string): boolean => {
  if (!serviceToken) return false;
  const decoded: KeyedObject = jwtDecode(serviceToken);
  return decoded.exp > Date.now() / 1000;
};

const setSession = (serviceToken?: string | null) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    localStorage.removeItem('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: React.ReactElement }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = window.localStorage.getItem('serviceToken');
        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken);
          const response = await axios.get('/auth/me');
          const { user } = response.data;
          const originalToken = window.localStorage.getItem('originalToken');
          dispatch({
            type: LOGIN,
            payload: { isLoggedIn: true, user, originalToken }
          });
        } else {
          dispatch({ type: LOGOUT });
        }
      } catch (err) {
        console.error(err);
        dispatch({ type: LOGOUT });
      }
    };

    init();
  }, []);

  // Returns {require_otp, email} when OTP is needed, or undefined when logged in directly
  const login = async (email: string, password: string): Promise<{ require_otp: true; email: string } | undefined> => {
    const response = await axios.post('/auth/login', { email, password });
    const data = response.data;
    if (data.require_otp) {
      sessionStorage.setItem('otp_email', data.email);
      return { require_otp: true, email: data.email };
    }
    setSession(data.token);
    dispatch({ type: LOGIN, payload: { isLoggedIn: true, user: data.user } });
    return undefined;
  };

  const verifyOTP = async (email: string, otp: string) => {
    const response = await axios.post('/auth/verify-otp', { email, otp });
    const { token, user } = response.data;
    sessionStorage.removeItem('otp_email');
    setSession(token);
    dispatch({ type: LOGIN, payload: { isLoggedIn: true, user } });
  };

  // Simple register (internal/manual use). Self-service uses registerCheckout directly in AuthRegister.
  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    await axios.post('/auth/register', {
      email,
      password,
      user_name: `${firstName} ${lastName}`,
      account_name: `${firstName}'s Workspace`,
      phone: '',
    });
  };

  const logout = () => {
    localStorage.removeItem('originalToken');
    setSession(null);
    dispatch({ type: LOGOUT });
  };

  const impersonate = async (userId: string) => {
    const response = await axios.post(`/auth/impersonate/${userId}`);
    const { token } = response.data;
    const currentToken = localStorage.getItem('serviceToken');
    localStorage.setItem('originalToken', currentToken!);
    setSession(token);
    // Reload to flush all React Query caches — ensures impersonated user's data loads fresh
    window.location.reload();
  };

  const exitImpersonation = () => {
    const originalToken = localStorage.getItem('originalToken');
    if (!originalToken) return;
    localStorage.removeItem('originalToken');
    setSession(originalToken);
    // reload to re-init state with original user
    window.location.reload();
  };

  const resetPassword = async (email: string) => {
    await axios.post('/auth/forgot-password', { email });
  };

  const updateProfile = () => {};

  const isImpersonating = Boolean(state.originalToken || localStorage.getItem('originalToken'));

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <Loader />;
  }

  return (
    <JWTContext.Provider
      value={{ ...state, isImpersonating, login, verifyOTP, logout, register, resetPassword, updateProfile, impersonate, exitImpersonation }}
    >
      {children}
    </JWTContext.Provider>
  );
};

export default JWTContext;

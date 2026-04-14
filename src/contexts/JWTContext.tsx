import React, { createContext, useEffect, useReducer } from 'react';
import jwtDecode from 'jwt-decode';

import { LOGIN, LOGOUT } from 'store/reducers/actions';
import authReducer from 'store/reducers/auth';

import Loader from 'components/Loader';
import axios from 'utils/axios';
import { AuthProps, JWTContextType } from 'types/auth';

// ================= INITIAL STATE =================
const initialState: AuthProps = {
  isLoggedIn: false,
  isInitialized: false,
  user: null
};

// ================= VERIFY TOKEN =================
const verifyToken = (serviceToken: string) => {
  if (!serviceToken) return false;
  const decoded: any = jwtDecode(serviceToken);
  return decoded.exp > Date.now() / 1000;
};

// ================= SESSION =================
const setSession = (serviceToken?: string | null) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    localStorage.removeItem('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

// ================= CONTEXT =================
const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: React.ReactElement }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ================= INIT =================
  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = localStorage.getItem('serviceToken');

        if (serviceToken && verifyToken(serviceToken)) {
          setSession(serviceToken);

          const response = await axios.get('/auth/me'); // ✅ FIXED
          const { user } = response.data;

          dispatch({
            type: LOGIN,
            payload: {
              isLoggedIn: true,
              user
            }
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

  // ================= STEP 1: LOGIN (OTP SEND) =================
  const login = async (email: string, password: string) => {
    const response = await axios.post('/auth/login', { email, password });

    // 🔥 no token here
    return response.data;
  };

  // ================= STEP 2: VERIFY OTP =================
  const verifyOTP = async (email: string, otp: string) => {
    const response = await axios.post('/auth/verify-otp', { email, otp });

    const { token, user } = response.data;

    setSession(token);

    dispatch({
      type: LOGIN,
      payload: {
        isLoggedIn: true,
        user
      }
    });
  };

  // ================= LOGOUT =================
  const logout = () => {
    setSession(null);
    dispatch({ type: LOGOUT });
  };

  // ================= PLACEHOLDERS =================
  const register = async () => {};
  const resetPassword = async () => {};
  const updateProfile = () => {};

  // ================= LOADER =================
  if (!state.isInitialized) {
    return <Loader />;
  }

  return (
    <JWTContext.Provider
      value={{
        ...state,
        login,
        verifyOTP, // 🔥 IMPORTANT
        logout,
        register,
        resetPassword,
        updateProfile
      }}
    >
      {children}
    </JWTContext.Provider>
  );
};

export default JWTContext;
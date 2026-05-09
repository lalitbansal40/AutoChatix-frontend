import { ReactElement } from 'react';

// ==============================|| AUTH TYPES  ||============================== //

export type GuardProps = {
  children: ReactElement | null;
};

export type UserRole = 'superadmin' | 'owner' | 'user';

export type UserProfile = {
  id?: string;
  _id?: string;
  account_id?: string;
  email?: string;
  avatar?: string;
  image?: string;
  name?: string;
  role?: UserRole;
  tier?: string;
  account_name: string;
  permissions?: Record<string, boolean>;
  is_active?: boolean;
};

export interface AuthProps {
  isLoggedIn: boolean;
  isInitialized?: boolean;
  user?: UserProfile | null;
  token?: string | null;
  originalToken?: string | null;
}

export interface AuthActionProps {
  type: string;
  payload?: AuthProps;
}

export interface InitialLoginContextProps {
  isLoggedIn: boolean;
  isInitialized?: boolean;
  user?: UserProfile | null | undefined;
}

export interface JWTDataProps {
  userId: string;
}

export type JWTContextType = {
  isLoggedIn: boolean;
  isInitialized?: boolean;
  user?: UserProfile | null | undefined;
  isImpersonating?: boolean;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: VoidFunction;
  impersonate: (userId: string) => Promise<void>;
  exitImpersonation: () => void;
};

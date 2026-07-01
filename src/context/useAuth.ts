import { createContext, useContext } from 'react';
import type { AuthProfile, SessionUser } from '../types';

export interface AuthContextValue {
  user: SessionUser | null;
  profiles: AuthProfile[];
  login: (credential: { type: 'email'; email: string } | { type: 'phone'; phoneNumber: string }, password: string) => Promise<AuthProfile[]>;
  selectProfile: (profile: AuthProfile, allProfiles: AuthProfile[]) => void;
  switchProfile: (profile: AuthProfile) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

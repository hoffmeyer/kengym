import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as apiLogin } from '../api';
import type { SessionUser } from '../types';

const STORAGE_KEYS = {
  memberId: 'kengym_memberId',
  name: 'kengym_name',
  token: 'kengym_token',
} as const;

function readSession(): SessionUser | null {
  const memberId = sessionStorage.getItem(STORAGE_KEYS.memberId);
  const name = sessionStorage.getItem(STORAGE_KEYS.name);
  const token = sessionStorage.getItem(STORAGE_KEYS.token);
  if (memberId && name && token) {
    return { memberId: Number(memberId), name, token };
  }
  return null;
}

function writeSession(user: SessionUser) {
  sessionStorage.setItem(STORAGE_KEYS.memberId, String(user.memberId));
  sessionStorage.setItem(STORAGE_KEYS.name, user.name);
  sessionStorage.setItem(STORAGE_KEYS.token, user.token);
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEYS.memberId);
  sessionStorage.removeItem(STORAGE_KEYS.name);
  sessionStorage.removeItem(STORAGE_KEYS.token);
}

interface AuthContextValue {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession);

  async function login(email: string, password: string) {
    const profile = await apiLogin(email, password);
    const user: SessionUser = {
      memberId: profile.memberId,
      name: profile.name,
      token: profile.token,
    };
    writeSession(user);
    setUser(user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

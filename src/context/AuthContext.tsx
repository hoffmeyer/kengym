import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as apiLogin } from '../api';
import type { AuthProfile, SessionUser } from '../types';

const STORAGE_KEYS = {
  memberId: 'kengym_memberId',
  name: 'kengym_name',
  token: 'kengym_token',
  profiles: 'kengym_profiles',
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

function readProfiles(): AuthProfile[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.profiles);
    if (raw) return JSON.parse(raw) as AuthProfile[];
  } catch {
    /* ignore */
  }
  return [];
}

function writeProfiles(profiles: AuthProfile[]) {
  sessionStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEYS.memberId);
  sessionStorage.removeItem(STORAGE_KEYS.name);
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.profiles);
}

interface AuthContextValue {
  user: SessionUser | null;
  profiles: AuthProfile[];
  login: (credential: { type: 'email'; email: string } | { type: 'phone'; phoneNumber: string }, password: string) => Promise<AuthProfile[]>;
  selectProfile: (profile: AuthProfile, allProfiles: AuthProfile[]) => void;
  switchProfile: (profile: AuthProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession);
  const [profiles, setProfiles] = useState<AuthProfile[]>(readProfiles);

  async function login(
    credential: { type: 'email'; email: string } | { type: 'phone'; phoneNumber: string },
    password: string,
  ): Promise<AuthProfile[]> {
    return apiLogin(credential, password);
  }

  function selectProfile(profile: AuthProfile, allProfiles: AuthProfile[]) {
    const sessionUser: SessionUser = {
      memberId: profile.memberId,
      name: profile.name,
      token: profile.token,
    };
    writeSession(sessionUser);
    writeProfiles(allProfiles);
    setUser(sessionUser);
    setProfiles(allProfiles);
  }

  function switchProfile(profile: AuthProfile) {
    const sessionUser: SessionUser = {
      memberId: profile.memberId,
      name: profile.name,
      token: profile.token,
    };
    writeSession(sessionUser);
    setUser(sessionUser);
  }

  function logout() {
    clearSession();
    setUser(null);
    setProfiles([]);
  }

  return (
    <AuthContext.Provider value={{ user, profiles, login, selectProfile, switchProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { login as apiLogin } from '../api';
import type { AuthProfile, SessionUser } from '../types';
import { AuthContext } from './useAuth';

const STORAGE_KEYS = {
  memberId: 'kengym_memberId',
  name: 'kengym_name',
  token: 'kengym_token',
  profiles: 'kengym_profiles',
} as const;

function readSession(): SessionUser | null {
  const memberId = localStorage.getItem(STORAGE_KEYS.memberId);
  const name = localStorage.getItem(STORAGE_KEYS.name);
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (memberId && name && token) {
    return { memberId: Number(memberId), name, token };
  }
  return null;
}

function writeSession(user: SessionUser) {
  localStorage.setItem(STORAGE_KEYS.memberId, String(user.memberId));
  localStorage.setItem(STORAGE_KEYS.name, user.name);
  localStorage.setItem(STORAGE_KEYS.token, user.token);
}

function readProfiles(): AuthProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.profiles);
    if (raw) return JSON.parse(raw) as AuthProfile[];
  } catch {
    /* ignore */
  }
  return [];
}

function writeProfiles(profiles: AuthProfile[]) {
  localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.memberId);
  localStorage.removeItem(STORAGE_KEYS.name);
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.profiles);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession);
  const [profiles, setProfiles] = useState<AuthProfile[]>(readProfiles);
  const queryClient = useQueryClient();

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
    // Ensure no stale, previously-cached data (e.g. from an earlier session) is shown.
    queryClient.invalidateQueries();
  }

  function switchProfile(profile: AuthProfile) {
    const sessionUser: SessionUser = {
      memberId: profile.memberId,
      name: profile.name,
      token: profile.token,
    };
    writeSession(sessionUser);
    setUser(sessionUser);
    // Cached bookings/member data may be stale or belong to the previous profile;
    // force a fresh refetch for the newly active user.
    queryClient.invalidateQueries();
  }

  function logout() {
    clearSession();
    setUser(null);
    setProfiles([]);
    queryClient.invalidateQueries();
  }

  return (
    <AuthContext.Provider value={{ user, profiles, login, selectProfile, switchProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

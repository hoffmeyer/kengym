import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AuthProfile } from '../types';

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const { login, selectProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<AuthProfile[] | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.length === 1) {
        selectProfile(result[0]);
        onClose();
      } else {
        setProfiles(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fejlede');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectProfile(profile: AuthProfile) {
    selectProfile(profile);
    onClose();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {profiles ? 'Vælg profil' : 'Log ind'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Luk"
          >
            ✕
          </button>
        </div>

        {profiles ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              Der er flere profiler knyttet til denne konto. Vælg den profil du vil logge ind med.
            </p>
            <ul className="flex flex-col gap-2">
              {profiles.map((profile) => (
                <li key={profile.memberId}>
                  <button
                    onClick={() => handleSelectProfile(profile)}
                    className="w-full text-left rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    {profile.name}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setProfiles(null)}
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors text-left"
            >
              ← Tilbage
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Adgangskode
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Logger ind…' : 'Log ind'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

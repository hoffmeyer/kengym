import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

export default function Header() {
  const { user, profiles, switchProfile, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const canSwitchProfile = profiles.length > 1;

  return (
    <>
      <header className="bg-gray-900 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Hvidovre Atletik & Motion"
            className="h-14 w-14 rounded-full object-cover ring-2 ring-white/20"
          />
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold leading-tight">
              Kænturjon gym
            </h1>
            <p className="text-gray-400 text-sm">CrossFit – Holdtræning</p>
          </div>

          {user ? (
            <div className="relative flex flex-col items-end gap-1 shrink-0" ref={dropdownRef}>
              {canSwitchProfile ? (
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-1 text-white text-sm font-medium leading-tight hover:text-indigo-300 transition-colors"
                >
                  {user.name}
                  <svg
                    className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <path d="M6 8L1 3h10z" />
                  </svg>
                </button>
              ) : (
                <span className="text-white text-sm font-medium leading-tight">
                  {user.name}
                </span>
              )}
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Log ud
              </button>

              {canSwitchProfile && dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {profiles.map((profile) => (
                    <button
                      key={profile.memberId}
                      onClick={() => {
                        switchProfile(profile);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        profile.memberId === user.memberId
                          ? 'font-semibold text-indigo-600 bg-indigo-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {profile.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="shrink-0 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Log ind
            </button>
          )}
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

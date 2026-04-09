import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

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
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-white text-sm font-medium leading-tight">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Log ud
              </button>
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

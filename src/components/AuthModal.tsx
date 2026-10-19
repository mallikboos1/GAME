import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, LogOut, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthUser, SaveData } from '../types/game';
import { AuthService } from '../game/auth/AuthService';

interface AuthModalProps {
  currentUser: AuthUser | null;
  saveData: SaveData;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  saveData,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Instant GitHub sign-in prompt when GITHUB_CLIENT_ID is not configured in env
  const [showGithubPrompt, setShowGithubPrompt] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [githubEmail, setGithubEmail] = useState('');

  // Listen for OAuth popup completion via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
        if (event.data.token) {
          AuthService.setToken(event.data.token);
        }
        setLoading(false);
        setErrorMsg(null);
        onAuthSuccess(event.data.user as AuthUser);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setLoading(false);
        setErrorMsg(event.data.error || 'Authentication failed.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthSuccess]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const { user } = await AuthService.registerWithEmail(name, email, password, saveData);
        onAuthSuccess(user);
      } else {
        const { user } = await AuthService.loginWithEmail(email, password);
        onAuthSuccess(user);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubConnect = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const data = await AuthService.getOAuthUrl('github');
      if (!data.configured || !data.url) {
        setLoading(false);
        setShowGithubPrompt(true);
        return;
      }

      const popup = window.open(data.url, 'github_oauth_popup', 'width=600,height=700');
      if (!popup) {
        setLoading(false);
        setShowGithubPrompt(true);
      }
    } catch {
      setLoading(false);
      setShowGithubPrompt(true);
    }
  };

  const handleInstantGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanUser = githubUsername.trim() || 'github-explorer';
    const cleanMail = githubEmail.trim() || `${cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@users.noreply.github.com`;

    setLoading(true);
    try {
      const { user } = await AuthService.instantOAuthSignIn('github', cleanMail, cleanUser, saveData);
      setShowGithubPrompt(false);
      onAuthSuccess(user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'GitHub sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setInfoMsg(null);
    try {
      await AuthService.syncSaveData(saveData);
      setInfoMsg('Game progress synced to your account!');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {currentUser ? <User size={20} /> : mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-300 tracking-wide">
                {currentUser ? 'EXPLORER ACCOUNT' : mode === 'login' ? 'EXPLORER LOGIN' : 'CREATE ACCOUNT'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser
                  ? 'Cloud profile & cross-session progress'
                  : 'Sign in or register to save high scores & gold'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {currentUser ? (
            /* Signed-in Profile View */
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-xl">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate">{currentUser.name}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase font-bold">
                      {currentUser.provider}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Best Score</span>
                  <p className="text-lg font-mono font-black text-amber-400 mt-0.5">
                    {saveData.highScore.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Gold Vault</span>
                  <p className="text-lg font-mono font-black text-amber-400 mt-0.5">
                    🪙 {saveData.totalCoins.toLocaleString()}
                  </p>
                </div>
              </div>

              {infoMsg && (
                <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Syncing Progress...' : 'Sync Progress to Account'}</span>
              </button>

              <button
                onClick={() => {
                  AuthService.logout();
                  onLogout();
                }}
                className="w-full py-3 bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800/50 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated Login / Register View */
            <>
              {/* Separate Mode Switcher Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setShowGithubPrompt(false);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    mode === 'login'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn size={14} />
                  <span>LOGIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setShowGithubPrompt(false);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    mode === 'register'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus size={14} />
                  <span>REGISTER</span>
                </button>
              </div>

              {errorMsg && (
                <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Separate Email / Password Form */}
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                {mode === 'register' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-300">Explorer Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Lara Crofton"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white outline-none transition"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="explorer@jungle.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white outline-none transition"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-300">Confirm Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white outline-none transition"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  <span>
                    {loading
                      ? 'Please wait...'
                      : mode === 'login'
                      ? 'Login to Account'
                      : 'Register New Account'}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Or Continue With GitHub
                </span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* GitHub OAuth / Instant Sign-In */}
              {!showGithubPrompt ? (
                <button
                  type="button"
                  onClick={handleGithubConnect}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-3 shadow transition cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>{mode === 'login' ? 'Sign in with GitHub' : 'Register with GitHub'}</span>
                </button>
              ) : (
                <form
                  onSubmit={handleInstantGithubSubmit}
                  className="bg-slate-950 border border-slate-700 rounded-2xl p-3.5 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      GitHub Account Sign-In
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGithubPrompt(false)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="GitHub Username (e.g. octocat)"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                  <input
                    type="email"
                    value={githubEmail}
                    onChange={(e) => setGithubEmail(e.target.value)}
                    placeholder="GitHub Email (optional)"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer"
                  >
                    Continue as GitHub Explorer
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

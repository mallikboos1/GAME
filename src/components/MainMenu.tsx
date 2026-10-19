import React from 'react';
import { Play, Trophy, ShoppingBag, Users, Settings, BookOpen, Volume2, VolumeX, LogIn, UserPlus, User } from 'lucide-react';
import { AuthUser, CharacterDef, SaveData } from '../types/game';

interface MainMenuProps {
  saveData: SaveData;
  activeCharacter: CharacterDef;
  currentUser: AuthUser | null;
  onStartRun: () => void;
  onOpenShop: () => void;
  onOpenCharacters: () => void;
  onOpenSettings: () => void;
  onOpenDocs: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  activeCharacter,
  currentUser,
  onStartRun,
  onOpenShop,
  onOpenCharacters,
  onOpenSettings,
  onOpenDocs,
  onOpenAuth,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6 pointer-events-none select-none">
      {/* Top Bar: Vault, Best Stats & Account Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full pointer-events-auto">
        <div className="flex items-center gap-3 bg-slate-950/85 border border-amber-500/30 px-4 py-2 rounded-2xl shadow-xl">
          <span className="text-2xl">🪙</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gold Vault</span>
            <span className="text-lg font-mono font-extrabold text-amber-400 leading-tight">
              {saveData.totalCoins.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 px-4 py-2 rounded-2xl shadow-xl">
            <Trophy className="text-amber-400" size={18} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">All-Time High</span>
              <span className="text-base font-mono font-bold text-white leading-tight">
                {saveData.highScore.toLocaleString()} pts
              </span>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-2.5 bg-slate-950/90 hover:bg-slate-900 border border-emerald-500/40 px-3.5 py-2 rounded-2xl text-white shadow-xl transition cursor-pointer"
              title="Explorer Account"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover border border-amber-400/50"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  <User size={14} />
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider leading-none">
                  {currentUser.provider}
                </span>
                <span className="text-xs font-bold text-slate-100 max-w-[110px] truncate leading-tight">
                  {currentUser.name}
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <LogIn size={15} className="text-amber-400" />
                <span>Login</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <UserPlus size={15} />
                <span>Register</span>
              </button>
            </div>
          )}

          <button
            onClick={onToggleMute}
            className="w-11 h-11 bg-slate-900/85 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
            title="Toggle Audio"
          >
            {saveData.settings.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      {/* Center Banner: Game Title & Active Explorer Tag */}
      <div className="flex flex-col items-center text-center my-auto pointer-events-none">
        <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-mono font-bold tracking-widest uppercase mb-2">
          3D Endless Temple Runner
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]">
          JUNGLE ESCAPE 3D
        </h1>
        <p className="text-slate-300 text-sm md:text-base max-w-md mt-2 drop-shadow font-medium">
          Dodge ancient Aztec stone traps, leap across chasms, slide under ruin beams, and survive the jungle depths.
        </p>

        {/* Selected Explorer Pill */}
        <div className="mt-4 flex items-center gap-2 bg-slate-950/85 border border-emerald-500/40 px-4 py-1.5 rounded-full pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-300">
            Explorer: <strong className="text-emerald-300">{activeCharacter.name}</strong> ({activeCharacter.perk})
          </span>
        </div>
      </div>

      {/* Bottom Control Bar: Big Play Button & Modal Triggers */}
      <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto pointer-events-auto">
        {/* Main "RUN NOW" CTA */}
        <button
          onClick={onStartRun}
          className="w-full py-4 px-8 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 transition shadow-[0_6px_25px_rgba(245,158,11,0.5)] rounded-2xl flex items-center justify-center gap-3 text-slate-950 font-black text-xl tracking-wider cursor-pointer border-t-2 border-amber-200"
        >
          <Play size={24} className="fill-slate-950" />
          <span>RUN NOW</span>
        </button>

        {/* Secondary Navigation Row */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <button
            onClick={onOpenCharacters}
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition cursor-pointer text-xs font-semibold"
          >
            <Users size={18} className="text-amber-400" />
            <span>Explorers</span>
          </button>

          <button
            onClick={onOpenShop}
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition cursor-pointer text-xs font-semibold"
          >
            <ShoppingBag size={18} className="text-amber-400" />
            <span>Upgrades</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition cursor-pointer text-xs font-semibold"
          >
            <Settings size={18} className="text-amber-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={onOpenDocs}
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition cursor-pointer text-xs font-semibold"
          >
            <BookOpen size={18} className="text-emerald-400" />
            <span>Manual</span>
          </button>
        </div>

        {/* Keyboard Controls Hint */}
        <div className="text-[11px] text-slate-400/90 font-mono tracking-wide flex items-center gap-2">
          <span>⌨️ [A/D] Lanes</span>
          <span>•</span>
          <span>[W/Up] Jump</span>
          <span>•</span>
          <span>[S/Down] Slide</span>
          <span>•</span>
          <span>[Esc] Pause</span>
        </div>
      </div>
    </div>
  );
};

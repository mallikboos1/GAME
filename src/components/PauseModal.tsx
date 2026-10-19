import React from 'react';
import { Play, RotateCcw, Home, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-40 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 mb-3">
          <span className="text-2xl font-black">⏸</span>
        </div>

        <h2 className="text-2xl font-black text-amber-300 tracking-wider">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Take a breath, explorer. The ancient jungle awaits your return.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition cursor-pointer"
          >
            <Play size={20} className="fill-slate-950" />
            <span>RESUME RUN</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition cursor-pointer"
          >
            <RotateCcw size={18} className="text-amber-400" />
            <span>RESTART</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition cursor-pointer"
          >
            <Settings size={18} className="text-emerald-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-800 active:scale-98 transition cursor-pointer"
          >
            <Home size={18} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

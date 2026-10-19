import React from 'react';
import { RotateCcw, Home, Trophy, Sparkles } from 'lucide-react';
import { RunSummary } from '../types/game';

interface GameOverModalProps {
  summary: RunSummary;
  bestScore: number;
  bestDistance: number;
  onRetry: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  bestScore,
  bestDistance,
  onRetry,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 z-40 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Banner */}
        <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-3xl flex items-center justify-center text-red-400 mb-3 text-3xl">
          💥
        </div>

        <h2 className="text-2xl font-black text-red-400 tracking-wider">EXPEDITION FAILED</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">You tripped on an ancient trap!</p>

        {/* New High Score Celebratory Banner */}
        {summary.isNewHighScore && (
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 rounded-xl p-2.5 mb-4 flex items-center justify-center gap-2 text-amber-300 animate-bounce">
            <Sparkles size={18} className="text-amber-400" />
            <span className="text-xs font-black tracking-wider uppercase">NEW ALL-TIME RECORD!</span>
            <Trophy size={18} className="text-amber-400" />
          </div>
        )}

        {/* Run Stats Card */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 mb-6">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Score</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {summary.score.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="text-xs text-slate-400 uppercase font-semibold">Distance Traveled</span>
            <span className="text-sm font-mono font-bold text-white">
              {summary.distance.toLocaleString()} m
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 uppercase font-semibold">Gold Salvaged</span>
            <span className="text-sm font-mono font-bold text-amber-400 flex items-center gap-1">
              <span>🪙</span> +{summary.coins}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onRetry}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition cursor-pointer"
          >
            <RotateCcw size={20} className="stroke-[3]" />
            <span>RUN AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition cursor-pointer"
          >
            <Home size={18} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

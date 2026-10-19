import React from 'react';
import { Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Shield, Magnet, Zap } from 'lucide-react';
import { PowerUpState } from '../types/game';

interface HUDProps {
  score: number;
  distance: number;
  coins: number;
  speed: number;
  powerUps: PowerUpState[];
  onPause: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  distance,
  coins,
  speed,
  powerUps,
  onPause,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Bar Stats */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Distance & Speed */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm border border-emerald-500/30 px-3.5 py-1.5 rounded-xl shadow-lg">
            <span className="text-emerald-400 font-bold text-sm">🏃</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Distance</span>
              <span className="text-white font-mono font-bold text-base md:text-lg leading-tight">
                {distance.toLocaleString()} <span className="text-xs text-emerald-400 font-normal">m</span>
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono px-2">
            Speed: <span className="text-amber-400 font-bold">{speed}</span> m/s
          </div>
        </div>

        {/* Center: Live Score */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/85 backdrop-blur-sm border-2 border-amber-500/50 px-5 py-2 rounded-2xl shadow-2xl flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-extrabold">Score</span>
            <span className="text-2xl md:text-3xl font-extrabold font-mono text-amber-300 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
              {score.toString().padStart(6, '0')}
            </span>
          </div>
        </div>

        {/* Right: Coins Collected & Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-lg">
            <span className="text-xl animate-spin" style={{ animationDuration: '3s' }}>🪙</span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Gold</span>
              <span className="text-amber-400 font-mono font-bold text-base md:text-lg leading-tight">
                {coins}
              </span>
            </div>
          </div>

          <button
            onClick={onPause}
            className="w-11 h-11 bg-slate-900/90 hover:bg-slate-800 active:scale-95 transition border border-slate-700/80 rounded-xl flex items-center justify-center text-amber-400 shadow-xl cursor-pointer"
            title="Pause Game (Esc / Space)"
          >
            <Pause size={20} />
          </button>
        </div>
      </div>

      {/* Active Power-Up Timers (Bottom Center) */}
      <div className="flex flex-col items-center gap-2 mb-2 w-full max-w-sm mx-auto">
        {powerUps.map((p) => {
          const ratio = Math.max(0, Math.min(1, p.remainingTime / p.maxDuration));
          const isShield = p.type === 'SHIELD';
          const isMagnet = p.type === 'MAGNET';

          const colorClass = isShield ? 'bg-amber-400' : isMagnet ? 'bg-cyan-400' : 'bg-emerald-400';
          const textClass = isShield ? 'text-amber-300' : isMagnet ? 'text-cyan-300' : 'text-emerald-300';
          const Icon = isShield ? Shield : isMagnet ? Magnet : Zap;
          const label = isShield ? 'SHIELD' : isMagnet ? 'MAGNET' : 'BOOST';

          return (
            <div
              key={p.type}
              className="w-full bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded-lg p-2 shadow-xl flex items-center gap-3 animate-fade-in"
            >
              <div className={`p-1.5 rounded-md bg-slate-900 ${textClass}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold font-mono">
                  <span className={textClass}>{label}</span>
                  <span className="text-slate-300">{p.remainingTime.toFixed(1)}s</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorClass} transition-all duration-100 ease-linear rounded-full`}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile On-Screen Action Controls (Transparent, accessible for touch users) */}
      <div className="flex justify-between items-end w-full pb-2 md:hidden pointer-events-auto">
        {/* Left/Right Lane buttons */}
        <div className="flex gap-3">
          <button
            onClick={onMoveLeft}
            className="w-14 h-14 bg-slate-950/70 active:bg-amber-600/60 border border-slate-700/60 rounded-2xl flex items-center justify-center text-white active:scale-95 transition shadow-2xl"
          >
            <ArrowLeft size={26} />
          </button>
          <button
            onClick={onMoveRight}
            className="w-14 h-14 bg-slate-950/70 active:bg-amber-600/60 border border-slate-700/60 rounded-2xl flex items-center justify-center text-white active:scale-95 transition shadow-2xl"
          >
            <ArrowRight size={26} />
          </button>
        </div>

        {/* Jump / Slide buttons */}
        <div className="flex gap-3">
          <button
            onClick={onJump}
            className="w-14 h-14 bg-amber-600/80 active:bg-amber-500 border border-amber-400/60 rounded-2xl flex items-center justify-center text-white active:scale-95 transition shadow-2xl"
          >
            <ArrowUp size={26} />
          </button>
          <button
            onClick={onSlide}
            className="w-14 h-14 bg-slate-950/70 active:bg-amber-600/60 border border-slate-700/60 rounded-2xl flex items-center justify-center text-white active:scale-95 transition shadow-2xl"
          >
            <ArrowDown size={26} />
          </button>
        </div>
      </div>
    </div>
  );
};

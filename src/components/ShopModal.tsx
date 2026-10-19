import React from 'react';
import { X, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { UPGRADE_CONFIGS } from '../game/data/SaveManager';
import { SaveData } from '../types/game';

interface ShopModalProps {
  saveData: SaveData;
  onClose: () => void;
  onPurchase: (upgradeId: 'magnet' | 'shield' | 'boost' | 'coinMultiplier') => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ saveData, onClose, onPurchase }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-40 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              🛒
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-300">RELIC WORKSHOP</h2>
              <p className="text-xs text-slate-400">Upgrade ancient power-up talismans</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40 font-mono font-bold text-amber-400 text-sm">
              <span>🪙</span> {saveData.totalCoins.toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {UPGRADE_CONFIGS.map((up) => {
            const currentTier = saveData.upgrades[up.id as keyof typeof saveData.upgrades] || 1;
            const isMax = currentTier >= up.maxLevel;
            const cost = Math.floor(up.basePrice * Math.pow(up.priceMultiplier, currentTier - 1));
            const canAfford = saveData.totalCoins >= cost && !isMax;

            return (
              <div
                key={up.id}
                className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shrink-0">
                    {up.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {up.name}
                      <span className="text-xs font-mono text-amber-400">Tier {currentTier}/{up.maxLevel}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{up.description}</p>

                    {/* Level Progress Pips */}
                    <div className="flex gap-1.5 mt-2">
                      {Array.from({ length: up.maxLevel }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-6 h-1.5 rounded-full ${
                            idx < currentTier ? 'bg-amber-400' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="shrink-0 w-full md:w-auto">
                  {isMax ? (
                    <div className="px-4 py-2 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={16} />
                      <span>MAXED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onPurchase(up.id as 'magnet' | 'shield' | 'boost' | 'coinMultiplier')}
                      disabled={!canAfford}
                      className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      <span>Upgrade: {cost} 🪙</span>
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

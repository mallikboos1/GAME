import React from 'react';
import { X, Check, Lock, Shield, Zap, Sparkles } from 'lucide-react';
import { INITIAL_CHARACTERS } from '../game/data/SaveManager';
import { CharacterDef, SaveData } from '../types/game';

interface CharacterSelectModalProps {
  saveData: SaveData;
  activeCharacterId: string;
  onClose: () => void;
  onSelect: (charId: string) => void;
  onUnlock: (charDef: CharacterDef) => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  saveData,
  activeCharacterId,
  onClose,
  onSelect,
  onUnlock,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-40 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-300">EXPEDITION ROSTER</h2>
              <p className="text-xs text-slate-400">Select your explorer or recruit seasoned veterans</p>
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

        {/* Character List */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {INITIAL_CHARACTERS.map((char) => {
            const isUnlocked = saveData.unlockedCharacters.includes(char.id);
            const isSelected = activeCharacterId === char.id;
            const canAfford = saveData.totalCoins >= char.price;

            return (
              <div
                key={char.id}
                className={`bg-slate-950/80 border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Color Avatar Swatch */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner relative border-2"
                    style={{ backgroundColor: char.bodyColor, borderColor: char.accentColor }}
                  >
                    <span className="text-2xl drop-shadow">🤠</span>
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{char.name}</h3>
                      <span className="text-[11px] text-slate-400 font-medium">({char.title})</span>
                    </div>

                    <p className="text-xs text-amber-300 font-semibold mt-0.5 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>{char.perk}</span>
                    </p>

                    <div className="flex gap-4 mt-2 text-[11px] text-slate-400 font-mono">
                      <span>Speed: {Math.round(char.speedMultiplier * 100)}%</span>
                      <span>Coin Bonus: {Math.round(char.coinMultiplier * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="shrink-0 w-full md:w-auto">
                  {isSelected ? (
                    <button
                      disabled
                      className="w-full md:w-auto px-5 py-2.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>SELECTED</span>
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => onSelect(char.id)}
                      className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>SELECT</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlock(char)}
                      disabled={!canAfford}
                      className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      <Lock size={13} />
                      <span>Unlock: {char.price} 🪙</span>
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

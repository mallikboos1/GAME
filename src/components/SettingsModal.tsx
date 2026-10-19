import React from 'react';
import { X, Volume2, VolumeX, Sliders, RotateCcw } from 'lucide-react';
import { SaveData } from '../types/game';

interface SettingsModalProps {
  saveData: SaveData;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<SaveData['settings']>) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  saveData,
  onClose,
  onUpdateSettings,
  onResetData,
}) => {
  const [confirmReset, setConfirmReset] = React.useState(false);

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-40 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-300">GAME SETTINGS</h2>
              <p className="text-xs text-slate-400">Audio feedback & control calibration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Mute Audio Toggle */}
          <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              {saveData.settings.isMuted ? <VolumeX className="text-red-400" size={20} /> : <Volume2 className="text-emerald-400" size={20} />}
              <div>
                <span className="text-sm font-bold text-white block">Sound & Music Audio</span>
                <span className="text-xs text-slate-400">Toggle all procedural game audio</span>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ isMuted: !saveData.settings.isMuted })}
              className={`w-12 h-7 rounded-full p-1 transition cursor-pointer ${
                saveData.settings.isMuted ? 'bg-slate-800' : 'bg-emerald-500'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  saveData.settings.isMuted ? 'translate-x-0' : 'translate-x-5'
                }`}
              />
            </button>
          </div>

          {/* SFX Volume Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Sound Effects Volume</span>
              <span className="font-mono text-amber-400">{Math.round(saveData.settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={saveData.settings.soundVolume}
              onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Music Volume Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Jungle Ambient Rhythm Volume</span>
              <span className="font-mono text-amber-400">{Math.round(saveData.settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={saveData.settings.musicVolume}
              onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Control Sensitivity */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Swipe Gesture Sensitivity</span>
              <span className="font-mono text-amber-400">{saveData.settings.swipeSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.1"
              value={saveData.settings.swipeSensitivity}
              onChange={(e) => onUpdateSettings({ swipeSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Reset Save Data */}
          <div className="pt-2 border-t border-slate-800">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Local Save Data</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2 bg-red-950/30 border border-red-800/50 rounded-xl p-3">
                <span className="text-xs text-red-200 font-semibold text-center">
                  Reset all coins, high scores, and upgrades to default?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onResetData();
                      setConfirmReset(false);
                    }}
                    className="py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

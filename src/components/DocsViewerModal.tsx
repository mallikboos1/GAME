import React, { useState } from 'react';
import { X, FileText, Code2, ShieldAlert, Cpu } from 'lucide-react';

interface DocsViewerModalProps {
  onClose: () => void;
}

export const DocsViewerModal: React.FC<DocsViewerModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'PRD' | 'TRD' | 'FLOW' | 'UNITY'>('PRD');

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl">
              📜
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-amber-300">ENGINEERING SPECIFICATIONS</h2>
              <p className="text-xs text-slate-400">Architecture docs, PRD, TRD & Unity 6 source</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('PRD')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'PRD'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>Product Specs (PRD)</span>
          </button>

          <button
            onClick={() => setActiveTab('TRD')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'TRD'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={14} />
            <span>Technical Specs (TRD)</span>
          </button>

          <button
            onClick={() => setActiveTab('FLOW')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'FLOW'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert size={14} />
            <span>App Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('UNITY')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'UNITY'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 size={14} />
            <span>Unity 6 C#</span>
          </button>
        </div>

        {/* Content Viewer */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed space-y-4">
          {activeTab === 'PRD' && (
            <div>
              <h3 className="text-base font-bold text-amber-300 mb-2"># Jungle Escape 3D — PRD Summary</h3>
              <p>• <strong>Genre:</strong> 3D Endless Runner inspired by Temple Run 2</p>
              <p>• <strong>Lanes:</strong> 3 symmetrically spaced lanes (-2.5m, 0.0m, +2.5m)</p>
              <p>• <strong>Movement:</strong> Running, Lateral Lerp Damping, Parabolic Jump, Crouch Slide</p>
              <p>• <strong>Obstacles:</strong> Hurdle Low (Jump), Ruin Arch (Slide), Totem/Boulder (Lane Change)</p>
              <p>• <strong>Power-Ups:</strong> Golden Shield (absorb crash), Relic Magnet (pulls coins), Jaguar Boost (speed + invulnerable)</p>
              <p>• <strong>Economy:</strong> Persistent Gold Vault, Upgrade Workshop, Character Roster</p>
            </div>
          )}

          {activeTab === 'TRD' && (
            <div>
              <h3 className="text-base font-bold text-amber-300 mb-2"># Technical Architecture (TRD)</h3>
              <p>• <strong>Rendering:</strong> Three.js r182 with ACESFilmicToneMapping, SRGBColorSpace, RoomEnvironment PMREM generator</p>
              <p>• <strong>Frame Budget:</strong> 60 FPS target with clamped delta time to eliminate teleportation</p>
              <p>• <strong>Audio:</strong> Web Audio API zero-dependency procedural synthesizer (oscillators & bandpass noise)</p>
              <p>• <strong>Track Streaming:</strong> 8 modular track tiles (~192m draw distance), recycled continuously ahead of player</p>
              <p>• <strong>Collisions:</strong> Height-stratified 3D bounding envelope checks with grace invulnerability timers</p>
            </div>
          )}

          {activeTab === 'FLOW' && (
            <div>
              <h3 className="text-base font-bold text-amber-300 mb-2"># State Flow</h3>
              <p className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 whitespace-pre">
{`[Launch] -> [Load Save Profile]
   │
   ▼
[Main Menu] ──(Shop / Character Select / Settings)
   │
   ▼ (Click "RUN NOW")
[3-2-1 Countdown]
   │
   ▼
[Active Playing] ◄──► [Pause Screen]
   │
   ▼ (Fatal Collision)
[Game Over] ──► [Auto-Save Best Score & Coins] ──► [Retry / Menu]`}
              </p>
            </div>
          )}

          {activeTab === 'UNITY' && (
            <div>
              <h3 className="text-base font-bold text-emerald-300 mb-2"># Unity 6 C# Scripts Integration</h3>
              <p className="mb-3 text-slate-400">All modular C# scripts are populated in <code className="text-amber-300">Assets/Scripts/</code> for drop-in Unity 6 export:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li><code className="text-amber-300">PlayerController.cs</code> - Kinematic 3-lane interpolation, jumping and sliding</li>
                <li><code className="text-amber-300">TrackManager.cs</code> - Object pooling & endless segment recycling</li>
                <li><code className="text-amber-300">CoinManager.cs</code> - Magnetic pull physics & collection counters</li>
                <li><code className="text-amber-300">PowerUpManager.cs</code> - Status effects for Shield, Magnet, and Speed Boost</li>
                <li><code className="text-amber-300">SaveManager.cs</code> - PlayerPrefs local persistence</li>
                <li><code className="text-amber-300">RuntimeBootstrap.cs</code> - Zero-setup scene builder</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

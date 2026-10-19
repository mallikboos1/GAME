/**
 * Jungle Escape 3D - Main Application Entry
 * Renders Three.js WebGL viewport with decoupled high-performance React UI overlay.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine/GameEngine';
import { SaveManager, INITIAL_CHARACTERS } from './game/data/SaveManager';
import { SoundEffects } from './game/audio/SoundEffects';
import { AuthUser, CharacterDef, GameState, PowerUpState, RunSummary, SaveData } from './types/game';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { DocsViewerModal } from './components/DocsViewerModal';
import { AuthModal } from './components/AuthModal';
import { AuthService } from './game/auth/AuthService';
import { AutoErrorHealer } from './game/diagnostics/AutoErrorHealer';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App UI State
  const [saveData, setSaveData] = useState<SaveData>(() => SaveManager.load());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [gameState, setGameState] = useState<GameState>('MAIN_MENU');
  const [activeChar, setActiveChar] = useState<CharacterDef>(() => {
    const curSave = SaveManager.getSave();
    return INITIAL_CHARACTERS.find((c) => c.id === curSave.selectedCharacterId) || INITIAL_CHARACTERS[0];
  });

  // Gameplay Live Metrics
  const [stats, setStats] = useState({ distance: 0, score: 0, coins: 0, speed: 16 });
  const [activePowerUps, setActivePowerUps] = useState<PowerUpState[]>([]);
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);
  const [countdownNum, setCountdownNum] = useState<number>(3);

  // Active Modals
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isCharSelectOpen, setIsCharSelectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  // Swipe gesture tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Restore User Session on Mount
  useEffect(() => {
    AuthService.fetchCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        if (user.saveData) {
          const merged = SaveManager.mergeCloudSave(user.saveData);
          setSaveData({ ...merged });
          const char = INITIAL_CHARACTERS.find((c) => c.id === merged.selectedCharacterId) || INITIAL_CHARACTERS[0];
          setActiveChar(char);
          engineRef.current?.setCharacter(char);
          engineRef.current?.setUpgrades(merged.upgrades);
        }
      }
    });
  }, []);

  // Initialize Game Engine on Mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Apply audio settings
    SoundEffects.setMuted(saveData.settings.isMuted);
    SoundEffects.setSfxVolume(saveData.settings.soundVolume);
    SoundEffects.setMusicVolume(saveData.settings.musicVolume);

    const engine = new GameEngine(
      canvasMountRef.current,
      activeChar,
      {
        onStatsUpdate: (s) => setStats(s),
        onPowerUpsUpdate: (p) => setActivePowerUps(p),
        onStateChange: (st) => setGameState(st),
        onCountdownUpdate: (num) => setCountdownNum(num),
        onGameOver: (summary) => {
          const rec = SaveManager.recordRun(summary.score, summary.distance, summary.coins);
          summary.isNewHighScore = rec.isNewHighScore;
          summary.isNewBestDistance = rec.isNewBestDistance;
          setLastSummary(summary);
          const updatedSave = { ...SaveManager.getSave() };
          setSaveData(updatedSave);
          AuthService.syncSaveData(updatedSave);
        },
      },
      {
        highScore: saveData.highScore,
        bestDistance: saveData.bestDistance,
        upgrades: saveData.upgrades,
      }
    );

    engineRef.current = engine;

    // Initialize automatic error interceptor & self-healing service
    AutoErrorHealer.init({
      getGameState: () => engine.getGameState(),
      onRecoverPlayerPosition: (safeLane) => engine.recoverPlayerToSafeLane(safeLane),
      onRebuildEngine: () => engine.returnToMainMenu(),
      onClearCorruptedState: () => {
        setIsShopOpen(false);
        setIsCharSelectOpen(false);
        setIsSettingsOpen(false);
        setIsDocsOpen(false);
        setIsAuthOpen(false);
        engine.recoverPlayerToSafeLane(0);
      },
      onRefreshSaveData: () => {
        setSaveData({ ...SaveManager.load() });
      },
    });

    return () => {
      AutoErrorHealer.dispose();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShopOpen || isCharSelectOpen || isSettingsOpen || isDocsOpen || isAuthOpen) {
        if (e.key === 'Escape') {
          setIsShopOpen(false);
          setIsCharSelectOpen(false);
          setIsSettingsOpen(false);
          setIsDocsOpen(false);
          setIsAuthOpen(false);
        }
        return;
      }

      if (!engineRef.current) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          engineRef.current.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          engineRef.current.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          if (gameState === 'MAIN_MENU') {
            handleStartRun();
          } else {
            engineRef.current.jump();
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          engineRef.current.slide();
          break;
        case 'Escape':
        case 'p':
        case 'P':
          if (gameState === 'PLAYING') {
            engineRef.current.pauseGame();
          } else if (gameState === 'PAUSED') {
            engineRef.current.resumeGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isShopOpen, isCharSelectOpen, isSettingsOpen, isDocsOpen, isAuthOpen]);

  // Touch Gesture Listeners (Swipe Detection)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !engineRef.current || gameState !== 'PLAYING') return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const deadZone = 32 / saveData.settings.swipeSensitivity;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal Swipe
      if (dx > deadZone) {
        engineRef.current.moveRight();
      } else if (dx < -deadZone) {
        engineRef.current.moveLeft();
      }
    } else {
      // Vertical Swipe
      if (dy > deadZone) {
        engineRef.current.slide();
      } else if (dy < -deadZone) {
        engineRef.current.jump();
      }
    }
  };

  // Actions
  const handleStartRun = useCallback(() => {
    engineRef.current?.startRun();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pauseGame();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resumeGame();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restartGame();
  }, []);

  const handleMainMenu = useCallback(() => {
    engineRef.current?.returnToMainMenu();
  }, []);

  const handleSelectCharacter = useCallback((charId: string) => {
    SaveManager.selectCharacter(charId);
    const char = INITIAL_CHARACTERS.find((c) => c.id === charId) || INITIAL_CHARACTERS[0];
    setActiveChar(char);
    engineRef.current?.setCharacter(char);
    const updated = { ...SaveManager.getSave() };
    setSaveData(updated);
    AuthService.syncSaveData(updated);
  }, []);

  const handleUnlockCharacter = useCallback((charDef: CharacterDef) => {
    if (SaveManager.unlockCharacter(charDef)) {
      setActiveChar(charDef);
      engineRef.current?.setCharacter(charDef);
      const updated = { ...SaveManager.getSave() };
      setSaveData(updated);
      AuthService.syncSaveData(updated);
    }
  }, []);

  const handlePurchaseUpgrade = useCallback((upgradeId: 'magnet' | 'shield' | 'boost' | 'coinMultiplier') => {
    if (SaveManager.purchaseUpgrade(upgradeId)) {
      const updated = { ...SaveManager.getSave() };
      setSaveData(updated);
      engineRef.current?.setUpgrades(updated.upgrades);
      SoundEffects.playPowerUp();
      AuthService.syncSaveData(updated);
    }
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<SaveData['settings']>) => {
    SaveManager.updateSettings(newSettings);
    const updated = { ...SaveManager.getSave() };
    setSaveData(updated);

    SoundEffects.setMuted(updated.settings.isMuted);
    SoundEffects.setSfxVolume(updated.settings.soundVolume);
    SoundEffects.setMusicVolume(updated.settings.musicVolume);
    engineRef.current?.setSensitivity(updated.settings.swipeSensitivity);
    AuthService.syncSaveData(updated);
  }, []);

  const handleResetData = useCallback(() => {
    SaveManager.resetAllProgress();
    const fresh = { ...SaveManager.getSave() };
    setSaveData(fresh);
    const defChar = INITIAL_CHARACTERS[0];
    setActiveChar(defChar);
    engineRef.current?.setCharacter(defChar);
    engineRef.current?.setUpgrades(fresh.upgrades);
    engineRef.current?.setBestRecords(fresh.highScore, fresh.bestDistance);
    AuthService.syncSaveData(fresh);
  }, []);

  const handleToggleMute = useCallback(() => {
    handleUpdateSettings({ isMuted: !saveData.settings.isMuted });
  }, [saveData.settings.isMuted, handleUpdateSettings]);

  const handleOpenAuth = useCallback((mode: 'login' | 'register') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  }, []);

  const handleAuthSuccess = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    const merged = SaveManager.mergeCloudSave(user.saveData);
    setSaveData({ ...merged });
    const char = INITIAL_CHARACTERS.find((c) => c.id === merged.selectedCharacterId) || INITIAL_CHARACTERS[0];
    setActiveChar(char);
    engineRef.current?.setCharacter(char);
    engineRef.current?.setUpgrades(merged.upgrades);
    engineRef.current?.setBestRecords(merged.highScore, merged.bestDistance);
    AuthService.syncSaveData(merged);
    setIsAuthOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthOpen(false);
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js Isolated Canvas Mount (Per Three.js skill) */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Main Menu UI */}
      {gameState === 'MAIN_MENU' && (
        <MainMenu
          saveData={saveData}
          activeCharacter={activeChar}
          currentUser={currentUser}
          onStartRun={handleStartRun}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenCharacters={() => setIsCharSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenAuth={handleOpenAuth}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Countdown Overlay */}
      {gameState === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="text-7xl md:text-9xl font-black text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.8)] animate-ping">
            {countdownNum}
          </div>
        </div>
      )}

      {/* In-Game HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <HUD
          score={stats.score}
          distance={stats.distance}
          coins={stats.coins}
          speed={stats.speed}
          powerUps={activePowerUps}
          onPause={handlePause}
          onMoveLeft={() => engineRef.current?.moveLeft()}
          onMoveRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
          onSlide={() => engineRef.current?.slide()}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && lastSummary && (
        <GameOverModal
          summary={lastSummary}
          bestScore={saveData.highScore}
          bestDistance={saveData.bestDistance}
          onRetry={handleStartRun}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Sub-Modals */}
      {isShopOpen && (
        <ShopModal
          saveData={saveData}
          onClose={() => setIsShopOpen(false)}
          onPurchase={handlePurchaseUpgrade}
        />
      )}

      {isCharSelectOpen && (
        <CharacterSelectModal
          saveData={saveData}
          activeCharacterId={activeChar.id}
          onClose={() => setIsCharSelectOpen(false)}
          onSelect={handleSelectCharacter}
          onUnlock={handleUnlockCharacter}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          saveData={saveData}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateSettings={handleUpdateSettings}
          onResetData={handleResetData}
        />
      )}

      {isDocsOpen && <DocsViewerModal onClose={() => setIsDocsOpen(false)} />}

      {isAuthOpen && (
        <AuthModal
          currentUser={currentUser}
          saveData={saveData}
          initialMode={authInitialMode}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

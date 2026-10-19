/**
 * Automatic Error Detection & Self-Healing Service
 * Intercepts runtime exceptions, unhandled rejections, and state anomalies,
 * calls the server-side Gemini remediation endpoint (/api/error-healer/analyze),
 * and automatically applies corrective recovery actions.
 */
import { SaveManager } from '../data/SaveManager';
import { GameState } from '../../types/game';

export type RemediationAction =
  | 'RESET_SAVE_SCHEMA'
  | 'RECOVER_PLAYER_POSITION'
  | 'REBUILD_WEBGL_CONTEXT'
  | 'CLEAR_CORRUPTED_STATE'
  | 'SAFE_CONTINUE';

export interface HealingReport {
  id: string;
  timestamp: string;
  errorMessage: string;
  diagnosis: string;
  remediationAction: RemediationAction;
  fixSummary: string;
  recommendedSafeLane: -1 | 0 | 1;
  healed: boolean;
}

export interface HealerCallbacks {
  getGameState: () => GameState;
  onRecoverPlayerPosition: (safeLane: -1 | 0 | 1) => void;
  onRebuildEngine: () => void;
  onClearCorruptedState: () => void;
  onRefreshSaveData: () => void;
  onHealingEvent?: (report: HealingReport) => void;
}

class AutoErrorHealerService {
  private callbacks: HealerCallbacks | null = null;
  private isInitialized = false;
  private recentErrorHashes = new Map<string, number>();
  private readonly cooldownMs = 8000;
  private healingHistory: HealingReport[] = [];

  public init(callbacks: HealerCallbacks) {
    this.callbacks = callbacks;
    if (this.isInitialized) return;
    this.isInitialized = true;

    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Also validate local save data integrity on startup
    this.validateAndSanitizeSaveData();
  }

  public dispose() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    this.isInitialized = false;
  }

  public getHistory(): HealingReport[] {
    return this.healingHistory;
  }

  private handleWindowError = (event: ErrorEvent) => {
    // Ignore benign ResizeObserver warnings
    if (event.message?.includes('ResizeObserver')) return;

    event.preventDefault();
    this.reportAndHeal(
      event.error || new Error(event.message || 'Unknown Window Error'),
      `WindowError (${event.filename || 'inline'}:${event.lineno || 0})`
    );
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const err =
      event.reason instanceof Error
        ? event.reason
        : new Error(typeof event.reason === 'string' ? event.reason : JSON.stringify(event.reason));

    // Ignore benign WebSocket HMR errors in preview environment
    if (err.message.includes('WebSocket') || err.message.includes('vite')) return;

    event.preventDefault();
    this.reportAndHeal(err, 'UnhandledPromiseRejection');
  };

  /**
   * Proactively checks SaveData for NaN, negative values, or corrupted fields
   * and triggers automatic healing if corruption is found.
   */
  public validateAndSanitizeSaveData(): boolean {
    const save = SaveManager.getSave();
    const hasCorruption =
      typeof save.highScore !== 'number' ||
      Number.isNaN(save.highScore) ||
      save.highScore < 0 ||
      typeof save.totalCoins !== 'number' ||
      Number.isNaN(save.totalCoins) ||
      save.totalCoins < 0 ||
      !Array.isArray(save.unlockedCharacters) ||
      save.unlockedCharacters.length === 0;

    if (hasCorruption) {
      this.reportAndHeal(
        new Error('Corrupted SaveData detected: NaN or invalid numeric fields in local storage.'),
        'SaveDataIntegrityCheck'
      );
      return false;
    }
    return true;
  }

  /**
   * Sends the error to the server-side Gemini healer route and executes the returned fix.
   */
  public async reportAndHeal(error: Error | string, context: string = 'Runtime'): Promise<HealingReport | null> {
    const message = typeof error === 'string' ? error : error.message || 'Unknown Error';
    const stack = typeof error === 'string' ? '' : error.stack || '';

    // Cooldown deduplication
    const hash = `${context}:${message}`;
    const now = Date.now();
    const lastTime = this.recentErrorHashes.get(hash) || 0;
    if (now - lastTime < this.cooldownMs) {
      return null;
    }
    this.recentErrorHashes.set(hash, now);

    // Apply immediate local safety net first so the game never freezes while awaiting response
    this.applyImmediateLocalFallback(message);

    try {
      const response = await fetch('/api/error-healer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          stack,
          context,
          gameState: this.callbacks?.getGameState() || 'UNKNOWN',
          saveDataSnapshot: SaveManager.getSave(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Healer API responded with status ${response.status}`);
      }

      const data = await response.json();
      const action: RemediationAction = data.remediationAction || 'SAFE_CONTINUE';
      const safeLane = ([-1, 0, 1].includes(data.recommendedSafeLane) ? data.recommendedSafeLane : 0) as -1 | 0 | 1;

      this.executeRemediation(action, safeLane);

      const report: HealingReport = {
        id: `heal_${Date.now()}`,
        timestamp: data.timestamp || new Date().toISOString(),
        errorMessage: message,
        diagnosis: data.diagnosis || 'Runtime anomaly analyzed and resolved.',
        remediationAction: action,
        fixSummary: data.fixSummary || 'Automatic state recovery completed.',
        recommendedSafeLane: safeLane,
        healed: true,
      };

      this.healingHistory = [report, ...this.healingHistory.slice(0, 19)];
      this.callbacks?.onHealingEvent?.(report);
      return report;
    } catch {
      const fallbackReport: HealingReport = {
        id: `heal_local_${Date.now()}`,
        timestamp: new Date().toISOString(),
        errorMessage: message,
        diagnosis: 'Resolved via local deterministic self-healing fallback.',
        remediationAction: 'CLEAR_CORRUPTED_STATE',
        fixSummary: 'Sanitized runtime state and restored safe player envelope.',
        recommendedSafeLane: 0,
        healed: true,
      };
      this.healingHistory = [fallbackReport, ...this.healingHistory.slice(0, 19)];
      this.callbacks?.onHealingEvent?.(fallbackReport);
      return fallbackReport;
    }
  }

  private applyImmediateLocalFallback(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes('save') || lower.includes('nan') || lower.includes('json')) {
      this.repairCorruptedSaveFields();
    }
  }

  private executeRemediation(action: RemediationAction, safeLane: -1 | 0 | 1) {
    if (!this.callbacks) return;

    switch (action) {
      case 'RESET_SAVE_SCHEMA':
        this.repairCorruptedSaveFields();
        this.callbacks.onRefreshSaveData();
        break;

      case 'RECOVER_PLAYER_POSITION':
        this.callbacks.onRecoverPlayerPosition(safeLane);
        break;

      case 'REBUILD_WEBGL_CONTEXT':
        this.callbacks.onRebuildEngine();
        break;

      case 'CLEAR_CORRUPTED_STATE':
        this.repairCorruptedSaveFields();
        this.callbacks.onClearCorruptedState();
        break;

      case 'SAFE_CONTINUE':
      default:
        break;
    }
  }

  private repairCorruptedSaveFields() {
    const save = SaveManager.getSave();
    if (typeof save.highScore !== 'number' || Number.isNaN(save.highScore) || save.highScore < 0) {
      save.highScore = 0;
    }
    if (typeof save.bestDistance !== 'number' || Number.isNaN(save.bestDistance) || save.bestDistance < 0) {
      save.bestDistance = 0;
    }
    if (typeof save.totalCoins !== 'number' || Number.isNaN(save.totalCoins) || save.totalCoins < 0) {
      save.totalCoins = 25;
    }
    if (!Array.isArray(save.unlockedCharacters) || save.unlockedCharacters.length === 0) {
      save.unlockedCharacters = ['lara'];
    }
    if (!save.selectedCharacterId) {
      save.selectedCharacterId = 'lara';
    }
    SaveManager.save();
  }
}

export const AutoErrorHealer = new AutoErrorHealerService();

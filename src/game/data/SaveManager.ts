/**
 * Jungle Escape 3D - SaveManager
 * Persistent Local Storage Engine with schema validation and safe migration fallbacks.
 */
import { CharacterDef, SaveData, UpgradeConfig } from '../../types/game';

const SAVE_KEY = 'jungle_escape_3d_savedata_v1';

export const INITIAL_CHARACTERS: CharacterDef[] = [
  {
    id: 'lara',
    name: 'Lara Crofton',
    title: 'Veteran Relic Hunter',
    bodyColor: '#3b82f6', // Explorer blue jacket
    accentColor: '#92400e', // Leather straps
    hatColor: '#b45309', // Fedora
    unlocked: true,
    price: 0,
    perk: '+15% Coin Value & Score Bonus',
    speedMultiplier: 1.0,
    coinMultiplier: 1.15,
    shieldBonusSec: 0,
  },
  {
    id: 'leo',
    name: 'Leo Thorne',
    title: 'Amazonian Scout',
    bodyColor: '#15803d', // Jungle fatigue green
    accentColor: '#78350f', // Camo belt
    hatColor: '#166534', // Scout cap
    unlocked: false,
    price: 150,
    perk: '+4s Protective Shield Duration',
    speedMultiplier: 1.05,
    coinMultiplier: 1.0,
    shieldBonusSec: 4.0,
  },
  {
    id: 'ryu',
    name: 'Ryu Hayate',
    title: 'Shadow Shinobi',
    bodyColor: '#1e1b4b', // Midnight ninja garb
    accentColor: '#dc2626', // Crimson sash
    hatColor: '#dc2626', // Crimson headband
    unlocked: false,
    price: 300,
    perk: '+15% Forward Sprint Speed & Swift Dash',
    speedMultiplier: 1.15,
    coinMultiplier: 1.0,
    shieldBonusSec: 0,
  },
];

export const UPGRADE_CONFIGS: UpgradeConfig[] = [
  {
    id: 'magnet',
    name: 'Relic Magnet Duration',
    description: 'Increases the active duration of the Coin Magnet attraction field.',
    icon: '🧲',
    level: 1,
    maxLevel: 5,
    basePrice: 50,
    priceMultiplier: 1.8,
    baseDuration: 10,
    durationPerLevel: 2.5,
  },
  {
    id: 'shield',
    name: 'Ancient Aegis Shield',
    description: 'Extends how long the Golden Shield bubble protects you from fatal crashes.',
    icon: '🛡️',
    level: 1,
    maxLevel: 5,
    basePrice: 60,
    priceMultiplier: 1.9,
    baseDuration: 12,
    durationPerLevel: 3.0,
  },
  {
    id: 'boost',
    name: 'Jaguar Speed Boost',
    description: 'Extends supersonic sprint duration and obstacle invulnerability.',
    icon: '⚡',
    level: 1,
    maxLevel: 5,
    basePrice: 75,
    priceMultiplier: 2.0,
    baseDuration: 8,
    durationPerLevel: 2.0,
  },
  {
    id: 'coinMultiplier',
    name: 'Midas Coin Multiplier',
    description: 'Increases overall score points granted for every collected ancient gold relic.',
    icon: '🪙',
    level: 1,
    maxLevel: 5,
    basePrice: 100,
    priceMultiplier: 2.2,
    baseDuration: 1,
    durationPerLevel: 0.25,
  },
];

const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  highScore: 0,
  bestDistance: 0,
  totalCoins: 25, // Starter bonus coins for immediate fun
  selectedCharacterId: 'lara',
  unlockedCharacters: ['lara'],
  upgrades: {
    magnet: 1,
    shield: 1,
    boost: 1,
    coinMultiplier: 1,
  },
  settings: {
    soundVolume: 0.8,
    musicVolume: 0.6,
    isMuted: false,
    swipeSensitivity: 1.0,
  },
};

class SaveManagerService {
  private currentSave: SaveData = DEFAULT_SAVE_DATA;

  constructor() {
    this.load();
  }

  public load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults to ensure all schema keys exist safely
        this.currentSave = {
          ...DEFAULT_SAVE_DATA,
          ...parsed,
          upgrades: { ...DEFAULT_SAVE_DATA.upgrades, ...(parsed.upgrades || {}) },
          settings: { ...DEFAULT_SAVE_DATA.settings, ...(parsed.settings || {}) },
        };
      } else {
        this.currentSave = { ...DEFAULT_SAVE_DATA };
        this.save();
      }
    } catch {
      this.currentSave = { ...DEFAULT_SAVE_DATA };
    }
    return this.currentSave;
  }

  public save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.currentSave));
    } catch (e) {
      console.warn('Failed to save data to localStorage:', e);
    }
  }

  public getSave(): SaveData {
    return this.currentSave;
  }

  public recordRun(score: number, distance: number, coins: number): { isNewHighScore: boolean; isNewBestDistance: boolean } {
    let isNewHighScore = false;
    let isNewBestDistance = false;

    if (score > this.currentSave.highScore) {
      this.currentSave.highScore = score;
      isNewHighScore = true;
    }

    if (distance > this.currentSave.bestDistance) {
      this.currentSave.bestDistance = distance;
      isNewBestDistance = true;
    }

    this.currentSave.totalCoins += coins;
    this.save();

    return { isNewHighScore, isNewBestDistance };
  }

  public selectCharacter(charId: string): boolean {
    if (this.currentSave.unlockedCharacters.includes(charId)) {
      this.currentSave.selectedCharacterId = charId;
      this.save();
      return true;
    }
    return false;
  }

  public unlockCharacter(charDef: CharacterDef): boolean {
    if (this.currentSave.unlockedCharacters.includes(charDef.id)) return true;
    if (this.currentSave.totalCoins >= charDef.price) {
      this.currentSave.totalCoins -= charDef.price;
      this.currentSave.unlockedCharacters.push(charDef.id);
      this.currentSave.selectedCharacterId = charDef.id;
      this.save();
      return true;
    }
    return false;
  }

  public purchaseUpgrade(upgradeId: 'magnet' | 'shield' | 'boost' | 'coinMultiplier'): boolean {
    const currentTier = this.currentSave.upgrades[upgradeId] || 1;
    if (currentTier >= 5) return false;

    const conf = UPGRADE_CONFIGS.find((u) => u.id === upgradeId);
    if (!conf) return false;

    const cost = Math.floor(conf.basePrice * Math.pow(conf.priceMultiplier, currentTier - 1));
    if (this.currentSave.totalCoins >= cost) {
      this.currentSave.totalCoins -= cost;
      this.currentSave.upgrades[upgradeId] = currentTier + 1;
      this.save();
      return true;
    }
    return false;
  }

  public updateSettings(settings: Partial<SaveData['settings']>) {
    this.currentSave.settings = { ...this.currentSave.settings, ...settings };
    this.save();
  }

  public mergeCloudSave(cloudSave?: SaveData): SaveData {
    if (!cloudSave || typeof cloudSave !== 'object') return this.currentSave;
    const mergedUnlocked = Array.from(
      new Set([...(this.currentSave.unlockedCharacters || ['lara']), ...(cloudSave.unlockedCharacters || ['lara'])])
    );
    this.currentSave = {
      ...this.currentSave,
      highScore: Math.max(this.currentSave.highScore || 0, cloudSave.highScore || 0),
      bestDistance: Math.max(this.currentSave.bestDistance || 0, cloudSave.bestDistance || 0),
      totalCoins: Math.max(this.currentSave.totalCoins || 0, cloudSave.totalCoins || 0),
      selectedCharacterId: cloudSave.selectedCharacterId || this.currentSave.selectedCharacterId,
      unlockedCharacters: mergedUnlocked,
      upgrades: {
        magnet: Math.max(this.currentSave.upgrades.magnet || 1, cloudSave.upgrades?.magnet || 1),
        shield: Math.max(this.currentSave.upgrades.shield || 1, cloudSave.upgrades?.shield || 1),
        boost: Math.max(this.currentSave.upgrades.boost || 1, cloudSave.upgrades?.boost || 1),
        coinMultiplier: Math.max(this.currentSave.upgrades.coinMultiplier || 1, cloudSave.upgrades?.coinMultiplier || 1),
      },
    };
    this.save();
    return this.currentSave;
  }

  public resetAllProgress() {
    this.currentSave = { ...DEFAULT_SAVE_DATA };
    this.save();
  }
}

export const SaveManager = new SaveManagerService();


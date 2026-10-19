/**
 * Jungle Escape 3D - Core Type Definitions
 */

export type GameState =
  | 'LOADING'
  | 'MAIN_MENU'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER';

export type Lane = -1 | 0 | 1;

export type PowerUpType = 'SHIELD' | 'MAGNET' | 'SPEED_BOOST';

export interface PowerUpState {
  type: PowerUpType;
  remainingTime: number;
  maxDuration: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  bodyColor: string;
  accentColor: string;
  hatColor: string;
  unlocked: boolean;
  price: number;
  perk: string;
  speedMultiplier: number;
  coinMultiplier: number;
  shieldBonusSec: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  basePrice: number;
  priceMultiplier: number;
  baseDuration: number;
  durationPerLevel: number;
}

export interface SaveData {
  version: number;
  highScore: number;
  bestDistance: number;
  totalCoins: number;
  selectedCharacterId: string;
  unlockedCharacters: string[];
  upgrades: {
    magnet: number;
    shield: number;
    boost: number;
    coinMultiplier: number;
  };
  settings: {
    soundVolume: number;
    musicVolume: number;
    isMuted: boolean;
    swipeSensitivity: number;
  };
}

export interface RunSummary {
  score: number;
  distance: number;
  coins: number;
  isNewHighScore: boolean;
  isNewBestDistance: boolean;
}

export type AuthProviderType = 'email' | 'github';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: AuthProviderType;
  avatarUrl?: string;
  createdAt: string;
  saveData?: SaveData;
}


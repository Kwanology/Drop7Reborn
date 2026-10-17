/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'normal' | 'hardcore' | 'sequence' | 'blitz';

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  normal: 'Classic',
  hardcore: 'Hardcore',
  sequence: 'Sequence',
  blitz: 'Blitz',
};

export type DiscType = 'number' | 'grey';

export interface Disc {
  id: string;
  type: DiscType;
  value?: number; // 1 - 7 (for type === 'number')
  cracked?: boolean; // false = solid stone, true = cracked stone (for type === 'grey')
  isNew?: boolean; // For landing animations
  isPopping?: boolean; // For explosion animation
  isCracking?: boolean; // For grey disc crack wiggle-shrink animation
  isBreaking?: boolean; // For grey disc break into numbered circle animation
  isRevealing?: boolean; // For grey disc shatter reveal state
  revealedValue?: number; // Value to morph into at peak of break animation
  popDelay?: number;
}

export type GridColumn = (Disc | null)[]; // length 7 (index 0 is floor, 6 is top)
export type Grid = GridColumn[]; // 7 columns (index 0 is leftmost, 6 is rightmost)

export interface MatchResult {
  disc: Disc;
  x: number;
  y: number;
  matchedByRow: boolean;
  matchedByCol: boolean;
}

export interface CascadeStep {
  matches: MatchResult[];
  shatteredGreyDiscs: { x: number; y: number; newValue: number }[];
  crackedGreyDiscs: { x: number; y: number }[];
  waveScore: number;
  comboCount: number;
}

export interface ActiveGameState {
  mode: GameMode;
  score: number;
  level: number;
  dropsRemainingInLevel: number;
  totalDropsThisLevel: number;
  totalDropsThisGame: number;
  currentCombo: number;
  board: (Disc | null)[][];
  currentDisc: Disc;
  nextDisc: Disc;
  isGameOver: boolean;
  historyMoves: number;
  boardClears: number;
  highestCombo: number;
  lastUpdated: number;
}

export interface HighScoreRecord {
  rank: number;
  score: number;
  date: string;
  level: number;
  maxCombo: number;
  mode: GameMode;
}

export interface LifetimeStats {
  gamesPlayed: number;
  totalScore: number;
  highestScore: number;
  highestCombo: number;
  totalBoardClears: number;
  totalDiscsPopped: number;
  totalLevelsCompleted: number;
}

export type SoundtrackId = 
  | 'drop7_original'
  | 'drop7_original_2'
  | 'power_of_seven' 
  | 'drop_everything' 
  | 'meditative_7x7' 
  | 'retro_arcade' 
  | 'zen_drops' 
  | 'muted';

export interface GameSettings {
  backgroundColor: string; // Hex or CSS color
  soundtrack: SoundtrackId;
  musicVolume: number; // 0.0 - 1.0
  sfxVolume: number; // 0.0 - 1.0
  vibrationEnabled: boolean;
  showDropAssist: boolean;
  allowUndo: boolean;
  highContrastDiscs: boolean;
}

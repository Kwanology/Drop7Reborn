/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActiveGameState, GameMode, GameSettings, HighScoreRecord, LifetimeStats } from '../types/game';

const SETTINGS_KEY = 'drop7_settings_v1';
const STATS_KEY = 'drop7_lifetime_stats_v1';
const HIGHSCORES_KEY = 'drop7_highscores_v1';
const ACTIVE_GAME_PREFIX = 'drop7_active_game_';

export const DEFAULT_SETTINGS: GameSettings = {
  backgroundColor: '#121316', // Classic deep charcoal slate
  soundtrack: 'drop7_original',
  musicVolume: 0.55,
  sfxVolume: 0.85,
  vibrationEnabled: true,
  showDropAssist: true,
  allowUndo: false,
  highContrastDiscs: false,
};

export const DEFAULT_STATS: LifetimeStats = {
  gamesPlayed: 0,
  totalScore: 0,
  highestScore: 0,
  highestCombo: 0,
  totalBoardClears: 0,
  totalDiscsPopped: 0,
  totalLevelsCompleted: 0,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage error ignored
  }
}

export function loadStats(): LifetimeStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_STATS;
}

export function saveStats(stats: LifetimeStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignored
  }
}

export function loadHighScores(): Record<GameMode, HighScoreRecord[]> {
  const fallback: Record<GameMode, HighScoreRecord[]> = {
    normal: [],
    hardcore: [],
    sequence: [],
    blitz: [],
  };

  try {
    const raw = localStorage.getItem(HIGHSCORES_KEY);
    if (raw) {
      return { ...fallback, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return fallback;
}

export function recordScore(
  mode: GameMode,
  score: number,
  level: number,
  maxCombo: number
): { isNewHighScore: boolean; rank: number } {
  const allScores = loadHighScores();
  const list = allScores[mode] || [];

  const newRecord: HighScoreRecord = {
    rank: 1,
    score,
    date: new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    level,
    maxCombo,
    mode,
  };

  list.push(newRecord);
  list.sort((a, b) => b.score - a.score);

  // Keep top 10
  const top10 = list.slice(0, 10).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  allScores[mode] = top10;

  try {
    localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(allScores));
  } catch {
    // ignored
  }

  const rank = top10.findIndex((r) => r.score === score && r.date === newRecord.date) + 1;
  const isNewHighScore = rank === 1;

  // Update lifetime stats
  const stats = loadStats();
  stats.gamesPlayed += 1;
  stats.totalScore += score;
  if (score > stats.highestScore) stats.highestScore = score;
  if (maxCombo > stats.highestCombo) stats.highestCombo = maxCombo;
  saveStats(stats);

  return { isNewHighScore, rank: rank > 0 ? rank : top10.length };
}

export function loadActiveGame(mode: GameMode): ActiveGameState | null {
  try {
    const raw = localStorage.getItem(`${ACTIVE_GAME_PREFIX}${mode}`);
    if (raw) {
      const parsed = JSON.parse(raw) as ActiveGameState;
      if (!parsed.isGameOver) return parsed;
    }
  } catch {
    // fallback
  }
  return null;
}

export function saveActiveGame(state: ActiveGameState): void {
  try {
    localStorage.setItem(`${ACTIVE_GAME_PREFIX}${state.mode}`, JSON.stringify(state));
  } catch {
    // ignored
  }
}

export function clearActiveGame(mode: GameMode): void {
  try {
    localStorage.removeItem(`${ACTIVE_GAME_PREFIX}${mode}`);
  } catch {
    // ignored
  }
}

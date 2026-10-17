/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Disc, GameMode, Grid, MatchResult } from '../types/game';

// Cubic scoring formula: Tn = (7/6)*n^3 + 12*n^2 - (73/6)*n + 6
export function getPointsForWave(wave: number): number {
  if (wave < 1) return 0;
  const n = wave;
  const val = (7 / 6) * Math.pow(n, 3) + 12 * Math.pow(n, 2) - (73 / 6) * n + 6;
  return Math.max(7, Math.round(val));
}

// Drops required per level based on game mode
export function getDropsRequiredForLevel(level: number, mode: GameMode): number {
  if (mode === 'hardcore' || mode === 'blitz') {
    return 5;
  }
  // Normal and Sequence start at 30, reducing by 1 down to min 5
  return Math.max(5, 31 - level);
}

// Simple seeded PRNG for Sequence mode (Mulberry32)
export class SeededRNG {
  private s: number;

  constructor(seed: number = 7777777) {
    this.s = seed >>> 0;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// Global default sequence RNG instance
let sequenceRng = new SeededRNG(7007007);

export function resetSequenceSeed(): void {
  sequenceRng = new SeededRNG(7007007);
}

// Generate next disc based on mode and level pacing
export function generateDisc(mode: GameMode, allowGrey = true, level = 1): Disc {
  const id = `disc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // In Hardcore & Blitz, grey discs are never given to the player to drop
  if (mode === 'hardcore' || mode === 'blitz') {
    const val = Math.floor(Math.random() * 7) + 1;
    return { id, type: 'number', value: val };
  }

  // Original Drop7 pacing: Grey blocking circles do not appear in drops until later levels (Level 5+)
  const canDropGrey = allowGrey && level >= 5;
  const greyProbability = level >= 8 ? 0.20 : level >= 6 ? 0.14 : level >= 5 ? 0.08 : 0;

  if (mode === 'sequence') {
    // In sequence mode, use seeded PRNG with level pacing
    const isGrey = canDropGrey && sequenceRng.next() < greyProbability;
    if (isGrey) {
      return { id, type: 'grey', cracked: false };
    }
    const val = sequenceRng.nextInt(1, 7);
    return { id, type: 'number', value: val };
  }

  // Normal mode
  const isGrey = canDropGrey && Math.random() < greyProbability;
  if (isGrey) {
    return { id, type: 'grey', cracked: false };
  }
  const val = Math.floor(Math.random() * 7) + 1;
  return { id, type: 'number', value: val };
}

// Initialize empty 7x7 board
export function createEmptyBoard(): Grid {
  const board: Grid = [];
  for (let c = 0; c < 7; c++) {
    board.push(new Array(7).fill(null));
  }
  return board;
}

// Column height helper
export function getColumnHeight(board: Grid, colIndex: number): number {
  if (colIndex < 0 || colIndex >= 7) return 0;
  let count = 0;
  for (let r = 0; r < 7; r++) {
    if (board[colIndex][r] !== null) count++;
    else break; // Since discs fall with gravity
  }
  return count;
}

// Check if a disc at (x, y) can be placed in column
export function canDropInColumn(board: Grid, colIndex: number): boolean {
  if (colIndex < 0 || colIndex >= 7) return false;
  return getColumnHeight(board, colIndex) < 7;
}

// Apply vertical gravity: pull all discs down in all columns
export function applyGravity(board: Grid): { newBoard: Grid; didFall: boolean } {
  let didFall = false;
  const newBoard: Grid = [];

  for (let c = 0; c < 7; c++) {
    const newCol: (Disc | null)[] = [];
    for (let r = 0; r < 7; r++) {
      if (board[c][r] !== null) {
        newCol.push(board[c][r]);
      }
    }
    if (newCol.length !== getColumnHeight(board, c)) {
      didFall = true;
    }
    while (newCol.length < 7) {
      newCol.push(null);
    }
    newBoard.push(newCol);
  }

  return { newBoard, didFall };
}

// Calculate contiguous horizontal length for disc at (x, y)
export function getHorizontalContiguousLength(board: Grid, x: number, y: number): number {
  if (board[x][y] === null) return 0;

  let left = x;
  while (left - 1 >= 0 && board[left - 1][y] !== null) {
    left--;
  }

  let right = x;
  while (right + 1 < 7 && board[right + 1][y] !== null) {
    right++;
  }

  return right - left + 1;
}

// Scan the board for all matching discs in the current state
export function findMatches(board: Grid): MatchResult[] {
  const matches: MatchResult[] = [];

  for (let x = 0; x < 7; x++) {
    const colHeight = getColumnHeight(board, x);
    for (let y = 0; y < 7; y++) {
      const disc = board[x][y];
      if (!disc || disc.type !== 'number' || typeof disc.value !== 'number') {
        continue;
      }

      const rowLength = getHorizontalContiguousLength(board, x, y);
      const matchedByRow = disc.value === rowLength;
      const matchedByCol = disc.value === colHeight;

      if (matchedByRow || matchedByCol) {
        matches.push({
          disc,
          x,
          y,
          matchedByRow,
          matchedByCol,
        });
      }
    }
  }

  return matches;
}

// Process a single explosion wave: damage adjacent grey discs, pop matched discs
export function processExplosionWave(
  board: Grid,
  matches: MatchResult[],
  mode: GameMode
): {
  newBoard: Grid;
  shatteredGreyDiscs: { x: number; y: number; newValue: number }[];
  crackedGreyDiscs: { x: number; y: number }[];
} {
  // Deep clone board
  const newBoard: Grid = board.map((col) => col.map((d) => (d ? { ...d } : null)));
  
  // Track hit counts for each grey disc from adjacent explosions
  const greyHits = new Map<string, { x: number; y: number; count: number }>();
  const matchSet = new Set<string>();

  for (const m of matches) {
    matchSet.add(`${m.x},${m.y}`);
  }

  // Check 4 orthogonal neighbors of every match
  const offsets = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (const m of matches) {
    for (const off of offsets) {
      const nx = m.x + off.dx;
      const ny = m.y + off.dy;
      if (nx >= 0 && nx < 7 && ny >= 0 && ny < 7) {
        const neighbor = newBoard[nx][ny];
        if (neighbor && neighbor.type === 'grey') {
          const key = `${nx},${ny}`;
          const current = greyHits.get(key) || { x: nx, y: ny, count: 0 };
          current.count += 1;
          greyHits.set(key, current);
        }
      }
    }
  }

  const shatteredGreyDiscs: { x: number; y: number; newValue: number }[] = [];
  const crackedGreyDiscs: { x: number; y: number }[] = [];

  // Apply damage to grey discs
  for (const [, item] of greyHits) {
    const { x, y, count } = item;
    const disc = newBoard[x][y];
    if (!disc || disc.type !== 'grey') continue;

    if (disc.cracked) {
      // Already cracked -> shatters on 1+ hit
      const newValue =
        mode === 'sequence'
          ? sequenceRng.nextInt(1, 7)
          : Math.floor(Math.random() * 7) + 1;
      disc.type = 'number';
      disc.value = newValue;
      disc.cracked = false;
      disc.isRevealing = true;
      shatteredGreyDiscs.push({ x, y, newValue });
    } else {
      // Solid grey disc
      if (count >= 2) {
        // Multi-hit in same wave: cracks and immediately shatters!
        const newValue =
          mode === 'sequence'
            ? sequenceRng.nextInt(1, 7)
            : Math.floor(Math.random() * 7) + 1;
        disc.type = 'number';
        disc.value = newValue;
        disc.cracked = false;
        disc.isRevealing = true;
        shatteredGreyDiscs.push({ x, y, newValue });
      } else {
        // Hit 1: cracks
        disc.cracked = true;
        crackedGreyDiscs.push({ x, y });
      }
    }
  }

  // Remove exploding discs
  for (const m of matches) {
    newBoard[m.x][m.y] = null;
  }

  // Fall down after clearances
  const { newBoard: gravityBoard } = applyGravity(newBoard);

  return {
    newBoard: gravityBoard,
    shatteredGreyDiscs,
    crackedGreyDiscs,
  };
}

// Add a full bottom row of grey discs (level-up penalty or hardcore interval)
export function addBottomGreyRow(board: Grid): { newBoard: Grid; isGameOver: boolean } {
  const newBoard: Grid = [];
  let isGameOver = false;

  for (let c = 0; c < 7; c++) {
    // Check if column is already 7 discs tall
    if (getColumnHeight(board, c) >= 7) {
      isGameOver = true;
    }

    const newCol: (Disc | null)[] = [
      {
        id: `grey_row_${Date.now()}_${c}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'grey',
        cracked: false,
        isNew: true,
      },
    ];

    // Push existing discs up by 1 position
    for (let r = 0; r < 6; r++) {
      newCol.push(board[c][r]);
    }

    newBoard.push(newCol);
  }

  return { newBoard, isGameOver };
}

// Check if entire board is completely cleared of discs
export function isBoardClear(board: Grid): boolean {
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 7; r++) {
      if (board[c][r] !== null) return false;
    }
  }
  return true;
}

// Check if there are any valid columns remaining where a disc can be dropped
export function hasAvailableMoves(board: Grid): boolean {
  for (let c = 0; c < 7; c++) {
    if (canDropInColumn(board, c)) return true;
  }
  return false;
}

// Check if all 7 columns are completely filled to the top (49 discs, no places to put new circles)
export function isBoardFull(board: Grid): boolean {
  return !hasAvailableMoves(board);
}


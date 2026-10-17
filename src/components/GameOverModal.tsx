/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, HighScoreRecord, GAME_MODE_LABELS } from '../types/game';
import { Trophy, RotateCcw, Menu, Award, Home } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  level: number;
  maxCombo: number;
  mode: GameMode;
  isNewHighScore: boolean;
  highScores: HighScoreRecord[];
  onPlayAgain: () => void;
  onOpenMenu: () => void;
  onGoToMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  level,
  maxCombo,
  mode,
  isNewHighScore,
  highScores,
  onPlayAgain,
  onOpenMenu,
  onGoToMainMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white">
      <div className="w-full max-w-sm bg-[#18191E] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 items-center text-center">
        {/* Banner / Badge */}
        {isNewHighScore ? (
          <div className="flex flex-col items-center gap-1.5 animate-bounce">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>
            <span className="text-sm font-black uppercase tracking-wider text-amber-400">
              New Personal Best!
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">
              Board Overflow
            </span>
            <h2 className="text-2xl font-black tracking-tight">Game Over</h2>
          </div>
        )}

        {/* Final Score */}
        <div className="flex flex-col items-center bg-black/30 w-full py-4 rounded-2xl border border-white/5">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Final Score</span>
          <span className="text-4xl font-black font-mono tracking-tight text-white mt-1">
            {score.toLocaleString()}
          </span>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-gray-300">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Level Reached</span>
              <span className="font-bold font-mono text-sm">{level}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Max Combo</span>
              <span className="font-bold font-mono text-sm">{maxCombo}x</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-gray-400 block text-[10px] uppercase">Mode</span>
              <span className="font-bold text-sm">{GAME_MODE_LABELS[mode]}</span>
            </div>
          </div>
        </div>

        {/* Top 3 High Scores for this Mode */}
        {highScores.length > 0 && (
          <div className="w-full bg-white/5 p-3 rounded-2xl border border-white/10 flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Leaderboard ({GAME_MODE_LABELS[mode]})
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              {highScores.slice(0, 3).map((item, idx) => (
                <div
                  key={`hs_${idx}`}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg ${
                    item.score === score
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-gray-300'
                  }`}
                >
                  <span className="font-mono text-gray-400">#{idx + 1}</span>
                  <span className="font-mono font-bold">{item.score.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">Lvl {item.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 font-bold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onOpenMenu}
              className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 font-semibold text-xs text-gray-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Game Modes</span>
            </button>

            <button
              onClick={onGoToMainMenu}
              className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 font-semibold text-xs text-gray-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

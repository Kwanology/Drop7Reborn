/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode, GameSettings, HighScoreRecord, GAME_MODE_LABELS } from '../types/game';
import { DiscIcon } from './DiscIcon';
import {
  Play,
  Trophy,
  Palette,
  Music,
  HelpCircle,
  X,
  Flame,
  ListOrdered,
  Zap,
} from 'lucide-react';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  hasActiveGame: boolean;
  onResumeGame: () => void;
  activeMode: GameMode;
  highScores: Record<GameMode, HighScoreRecord[]>;
  settings: GameSettings;
  onOpenColorPalette: () => void;
  onOpenSoundtrack: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  hasActiveGame,
  onResumeGame,
  activeMode,
  highScores,
  settings,
  onOpenColorPalette,
  onOpenSoundtrack,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboards, setShowLeaderboards] = useState(false);
  const [selectedLeaderboardMode, setSelectedLeaderboardMode] = useState<GameMode>('normal');

  const modes: { id: GameMode; name: string; subtitle: string; icon: React.ReactNode }[] = [
    {
      id: 'normal',
      name: 'Classic',
      subtitle: 'Original 30-Drop Mode',
      icon: <Play className="w-5 h-5 text-emerald-500" />,
    },
    {
      id: 'hardcore',
      name: 'Hardcore',
      subtitle: '5-Drop Survival',
      icon: <Flame className="w-5 h-5 text-orange-500" />,
    },
    {
      id: 'sequence',
      name: 'Sequence',
      subtitle: 'Identical Pattern',
      icon: <ListOrdered className="w-5 h-5 text-blue-500" />,
    },
    {
      id: 'blitz',
      name: 'Blitz',
      subtitle: 'Rapid Sprints',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-y-auto"
      style={{
        background:
          settings.backgroundColor === '#121316'
            ? 'linear-gradient(180deg, #DCE9F5 0%, #BFD8EE 40%, #A8C9E4 100%)'
            : settings.backgroundColor,
      }}
    >
      <div className="w-full max-w-md h-4" />

      {/* Hero Title: Drop 7 Reborn */}
      <div className="flex flex-col items-center text-center my-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-4xl sm:text-5xl font-light tracking-tight text-[#1E3758]">
            Drop
          </span>
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center drop-shadow-md">
            <DiscIcon disc={{ id: 'logo_7', type: 'number', value: 7 }} size={50} />
          </div>
          <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1E3758]">
            Reborn
          </span>
        </div>

      </div>

      {/* Main Mode Selection Grid */}
      <div className="w-full max-w-sm flex flex-col gap-2.5 my-2">
        {hasActiveGame && (
          <button
            onClick={onResumeGame}
            className="w-full py-4 rounded-2xl bg-[#1E3758] hover:bg-[#162B46] active:scale-98 text-white font-black text-base shadow-xl flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume Game ({GAME_MODE_LABELS[activeMode]})</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => {
            const modeBest = highScores[m.id]?.[0]?.score || 0;
            return (
              <button
                key={m.id}
                onClick={() => onStartGame(m.id)}
                className="flex flex-col items-start p-3.5 rounded-2xl bg-white/75 hover:bg-white/95 active:scale-98 border border-[#1E3758]/20 shadow-sm backdrop-blur-md transition text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  {m.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3758]/60">
                    Play
                  </span>
                </div>
                <span className="text-base font-extrabold text-[#1E3758] group-hover:text-blue-900 transition">
                  {m.name}
                </span>
                <span className="text-[11px] text-[#1E3758]/70 font-medium leading-tight mb-2">
                  {m.subtitle}
                </span>
                <div className="mt-auto pt-1.5 border-t border-[#1E3758]/10 w-full flex items-center justify-between text-[11px]">
                  <span className="text-[#1E3758]/60 font-semibold flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-600" /> Best
                  </span>
                  <span className="font-mono font-bold text-[#1E3758]">
                    {modeBest > 0 ? modeBest.toLocaleString() : '—'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons: Scores, Colors, Music */}
      <div className="w-full max-w-sm flex flex-col gap-2 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowLeaderboards(true)}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white/60 hover:bg-white/90 active:scale-95 text-[#1E3758] border border-[#1E3758]/15 shadow-sm text-xs font-bold transition cursor-pointer"
          >
            <Trophy className="w-4 h-4 mb-1 text-amber-600" />
            <span>Scores</span>
          </button>

          <button
            onClick={onOpenColorPalette}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white/60 hover:bg-white/90 active:scale-95 text-[#1E3758] border border-[#1E3758]/15 shadow-sm text-xs font-bold transition cursor-pointer"
          >
            <Palette className="w-4 h-4 mb-1 text-purple-600" />
            <span>Colors</span>
          </button>

          <button
            onClick={onOpenSoundtrack}
            className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white/60 hover:bg-white/90 active:scale-95 text-[#1E3758] border border-[#1E3758]/15 shadow-sm text-xs font-bold transition cursor-pointer"
          >
            <Music className="w-4 h-4 mb-1 text-blue-600" />
            <span>Music</span>
          </button>
        </div>

        <button
          onClick={() => setShowHowToPlay(true)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/40 hover:bg-white/70 text-[#1E3758] text-xs font-bold border border-[#1E3758]/10 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>How to Play & Rules</span>
        </button>
      </div>

      <div className="h-2" />

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-white">
          <div className="w-full max-w-sm bg-[#1E3758] border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold">How to Play</h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-200 space-y-3 leading-relaxed">
              <p>
                <strong>1. The Matching Rule:</strong> Drop numbered discs (1–7) into the 7×7 grid. A disc disappears when its number matches the total count of contiguous discs in its horizontal row OR vertical column.
              </p>
              <p>
                <strong>2. Contiguous Counts:</strong> Discs are only counted horizontally if there are no empty gaps between them.
              </p>
              <p>
                <strong>3. Grey Discs:</strong>
                <br />• <em>Solid disc:</em> Takes 1 adjacent explosion hit to crack (cogwheel).
                <br />• <em>Cracked disc:</em> Takes a 2nd hit to shatter into a random number!
              </p>
              <p>
                <strong>4. Cascades & Combos:</strong> Discs fall down to fill empty spaces, triggering chain reactions with rapidly escalating combo points:
                <br />• 1st: <strong>7 pts</strong> | 2nd: <strong>39 pts</strong> | 3rd: <strong>109 pts</strong> | 4th: <strong>224 pts</strong>
              </p>
              <p>
                <strong>5. Bonuses:</strong>
                <br />• <strong>+7,000 pts:</strong> Completing a level.
                <br />• <strong>+70,000 pts:</strong> Full board clear ("Drop 7")!
              </p>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 rounded-2xl bg-white/20 hover:bg-white/30 font-bold text-sm transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-white">
          <div className="w-full max-w-sm bg-[#1E3758] border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold">High Scores</h3>
              </div>
              <button
                onClick={() => setShowLeaderboards(false)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-xl">
              {(['normal', 'hardcore', 'sequence', 'blitz'] as GameMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedLeaderboardMode(m)}
                  className={`py-1.5 text-xs font-bold rounded-lg capitalize transition ${
                    selectedLeaderboardMode === m
                      ? 'bg-white text-[#1E3758] shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {GAME_MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Scores Table */}
            <div className="flex flex-col gap-1.5 min-h-[160px]">
              {highScores[selectedLeaderboardMode].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-gray-300">
                  <span>No high scores recorded yet.</span>
                </div>
              ) : (
                highScores[selectedLeaderboardMode].map((r, i) => (
                  <div
                    key={`lb_${i}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 w-5">#{i + 1}</span>
                      <span className="font-mono font-extrabold text-sm text-white">
                        {r.score.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-[11px]">
                      <span>Lvl {r.level}</span>
                      <span>{r.maxCombo}x combo</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowLeaderboards(false)}
              className="w-full py-3 rounded-2xl bg-white/20 hover:bg-white/30 font-bold text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

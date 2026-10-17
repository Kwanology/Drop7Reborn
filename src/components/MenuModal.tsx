/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameMode, GameSettings, HighScoreRecord, LifetimeStats } from '../types/game';
import { ColorPalettePicker } from './ColorPalettePicker';
import { SoundtrackPicker } from './SoundtrackPicker';
import {
  X,
  Play,
  RotateCcw,
  Palette,
  Music,
  Sliders,
  Check,
  Flame,
  ListOrdered,
  Zap,
  Home,
} from 'lucide-react';

export type MenuTab = 'modes' | 'palette' | 'soundtrack' | 'settings';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: MenuTab;
  activeMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onRestartCurrentGame: () => void;
  onGoToMainMenu: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  highScores: Record<GameMode, HighScoreRecord[]>;
  stats: LifetimeStats;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'modes',
  activeMode,
  onSelectMode,
  onRestartCurrentGame,
  onGoToMainMenu,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<MenuTab>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const modeList: { id: GameMode; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'normal',
      title: 'Classic',
      desc: '30 drops descending. Grey rows rise on level-up.',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'hardcore',
      title: 'Hardcore',
      desc: 'Numbers only. New grey row every 5 drops.',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
    },
    {
      id: 'sequence',
      title: 'Sequence',
      desc: 'Identical drop order every single game.',
      icon: <ListOrdered className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'blitz',
      title: 'Blitz',
      desc: '5 drops per level sprint with rapid rising.',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-fade-in text-white">
      <div className="w-full max-w-md bg-[#18191E] border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-shrink-0">
          <h3 className="text-base font-black tracking-tight text-white">Drop 7 Reborn Menu</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-xl border border-white/10 flex-shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('modes')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTab === 'modes' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Modes</span>
          </button>

          <button
            onClick={() => setActiveTab('palette')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTab === 'palette' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color</span>
          </button>

          <button
            onClick={() => setActiveTab('soundtrack')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTab === 'soundtrack' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Options</span>
          </button>
        </div>

        {/* Tab Body (Clean, compact, no scrolling) */}
        <div className="flex-1 overflow-y-auto">
          {/* MODES TAB */}
          {activeTab === 'modes' && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {modeList.map((m) => {
                  const isCurrent = activeMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectMode(m.id);
                        onClose();
                      }}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600/20 border-blue-500 shadow-sm'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-0.5">
                        <div className="flex items-center gap-1.5">
                          {m.icon}
                          <span className="font-bold text-xs text-white">{m.title}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <span className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                        {m.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10 mt-1">
                <button
                  onClick={() => {
                    onRestartCurrentGame();
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-red-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Board</span>
                </button>
                <button
                  onClick={() => {
                    onGoToMainMenu();
                    onClose();
                  }}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-gray-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Main Menu</span>
                </button>
              </div>
            </div>
          )}

          {/* PALETTE TAB */}
          {activeTab === 'palette' && (
            <div className="flex flex-col gap-2">
              <ColorPalettePicker
                currentColor={settings.backgroundColor}
                onChange={(col) => onUpdateSettings({ backgroundColor: col })}
              />
            </div>
          )}

          {/* SOUNDTRACK TAB */}
          {activeTab === 'soundtrack' && (
            <div className="flex flex-col gap-2">
              <SoundtrackPicker
                currentTrack={settings.soundtrack}
                musicVolume={settings.musicVolume}
                sfxVolume={settings.sfxVolume}
                onTrackChange={(track) => onUpdateSettings({ soundtrack: track })}
                onMusicVolumeChange={(vol) => onUpdateSettings({ musicVolume: vol })}
                onSfxVolumeChange={(vol) => onUpdateSettings({ sfxVolume: vol })}
              />
            </div>
          )}

          {/* OPTIONS TAB (Simplified & compact, no scrolling) */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-2.5 text-xs">
              <label className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
                <div>
                  <span className="font-semibold block text-white">Vibration Haptics</span>
                  <span className="text-[10px] text-gray-400">Tactile buzz on drops & combos</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
                <div>
                  <span className="font-semibold block text-white">Drop Guide Beam</span>
                  <span className="text-[10px] text-gray-400">Target line while sliding</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showDropAssist}
                  onChange={(e) => onUpdateSettings({ showDropAssist: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
                <div>
                  <span className="font-semibold block text-white">Enable Undo Drop</span>
                  <span className="text-[10px] text-gray-400">Casual take-back button</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowUndo}
                  onChange={(e) => onUpdateSettings({ allowUndo: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </label>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    onGoToMainMenu();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Return to Main Menu</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Close / Resume Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 font-bold text-xs text-white shadow-md transition cursor-pointer flex-shrink-0"
        >
          Resume Game
        </button>
      </div>
    </div>
  );
};

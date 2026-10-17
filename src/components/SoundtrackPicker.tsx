/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SoundtrackId } from '../types/game';
import { audioEngine } from '../audio/audioEngine';
import { Play, Pause, Volume2, Music, Check, Disc, Upload } from 'lucide-react';

interface SoundtrackPickerProps {
  currentTrack: SoundtrackId;
  musicVolume: number;
  sfxVolume: number;
  onTrackChange: (track: SoundtrackId) => void;
  onMusicVolumeChange: (vol: number) => void;
  onSfxVolumeChange: (vol: number) => void;
}

interface TrackItem {
  id: SoundtrackId;
  title: string;
  badge?: string;
}

const TRACKS: TrackItem[] = [
  {
    id: 'drop7_original',
    title: 'Original Soundtrack',
    badge: 'd7menu',
  },
  {
    id: 'drop7_original_2',
    title: 'Original Soundtrack 2',
    badge: 'd7classic',
  },
  {
    id: 'power_of_seven',
    title: 'The Power of Seven',
    badge: '107 BPM',
  },
  {
    id: 'drop_everything',
    title: 'Drop Everything',
    badge: '136 BPM',
  },
  {
    id: 'meditative_7x7',
    title: '7x7 Meditative',
    badge: '60 BPM',
  },
  {
    id: 'retro_arcade',
    title: 'Retro 8-Bit Arcade',
    badge: '150 BPM',
  },
  {
    id: 'zen_drops',
    title: 'Zen Rain',
    badge: '88 BPM',
  },
  {
    id: 'muted',
    title: 'Muted (SFX Only)',
    badge: 'Silent',
  },
];

export const SoundtrackPicker: React.FC<SoundtrackPickerProps> = ({
  currentTrack,
  musicVolume,
  sfxVolume,
  onTrackChange,
  onMusicVolumeChange,
  onSfxVolumeChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(audioEngine.getIsPlaying());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [customClassicName, setCustomClassicName] = useState<string | null>(
    audioEngine.getCustomClassicName()
  );

  useEffect(() => {
    setIsPlaying(audioEngine.getIsPlaying());
    setCustomClassicName(audioEngine.getCustomClassicName());
  }, [currentTrack]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await audioEngine.loadCustomAudioForTrack(file, 'drop7_original_2', true);
      if (ok) {
        setCustomClassicName(file.name);
        handleSelectTrack('drop7_original_2');
      }
    }
  };

  const handleSelectTrack = (id: SoundtrackId) => {
    onTrackChange(id);
    audioEngine.setSoundtrack(id);
    if (id !== 'muted' && !audioEngine.getIsPlaying()) {
      audioEngine.startMusic();
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    const newState = audioEngine.toggleMusic();
    setIsPlaying(newState);
  };

  return (
    <div className="flex flex-col gap-3.5 text-white">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Audio & Soundtrack</span>
        </div>

        <button
          onClick={handleTogglePlay}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
            isPlaying
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3" />
              <span>Playing</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>Play</span>
            </>
          )}
        </button>
      </div>

      {/* Compact Volume Sliders */}
      <div className="grid grid-cols-2 gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-1 font-medium">
              <Music className="w-3 h-3 text-blue-400" /> Music
            </span>
            <span className="font-mono text-[11px] text-gray-300">{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={musicVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onMusicVolumeChange(val);
              audioEngine.setMusicVolume(val);
            }}
            className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-1 font-medium">
              <Volume2 className="w-3 h-3 text-emerald-400" /> Sound FX
            </span>
            <span className="font-mono text-[11px] text-gray-300">{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onSfxVolumeChange(val);
              audioEngine.setSfxVolume(val);
              audioEngine.playMatch(1);
            }}
            className="w-full accent-emerald-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Simplified, Clean Track List without attach button or verbose descriptions */}
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
        {TRACKS.map((track) => {
          const isSelected = currentTrack === track.id;
          const isCurrentlyActive = isSelected && isPlaying && track.id !== 'muted';

          return (
            <div
              key={track.id}
              onClick={() => handleSelectTrack(track.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/20 text-white shadow-sm'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Disc className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className="text-xs font-bold leading-tight">{track.title}</span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {track.id === 'drop7_original_2' }

                {track.badge && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    {track.id === 'drop7_original_2' && customClassicName ? customClassicName : track.badge}
                  </span>
                )}

                {isCurrentlyActive ? (
                  <div className="flex items-center gap-0.5 h-3 ml-1">
                    <span className="w-0.5 bg-blue-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 bg-blue-400 rounded-full animate-bounce h-3" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 bg-blue-400 rounded-full animate-bounce h-2" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 text-blue-400 ml-1" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden file input for custom MP3 upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/mp3,audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

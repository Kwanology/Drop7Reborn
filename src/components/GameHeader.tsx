import React from 'react';
import { GameMode, GAME_MODE_LABELS } from '../types/game';
import { Play, Trophy, Sparkles, Flame, Zap, Crown, Award, Infinity as InfinityIcon } from 'lucide-react';

interface GameHeaderProps {
  score: number;
  highScore: number;
  level: number;
  mode: GameMode;
  dropsRemaining: number;
  totalDropsRequired: number;
  onOpenMenu: () => void;
  cascadeWave: number;
  lastPointsAdded: number | null;
}

interface ChainAccolade {
  label: string;
  sublabel: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  shadowColor: string;
  icon: React.ReactNode;
}

function getChainAccolade(chain: number): ChainAccolade | null {
  if (chain < 2) return null;
  if (chain === 2) {
    return {
      label: 'DOUBLE',
      sublabel: '2x',
      bgGradient: 'from-emerald-600 to-teal-700',
      borderColor: 'border-emerald-300/40',
      textColor: 'text-emerald-100',
      shadowColor: 'shadow-emerald-500/30',
      icon: <Play className="w-3 h-3 fill-current" />,
    };
  }
  if (chain === 3) {
    return {
      label: 'TRIPLE',
      sublabel: '3x',
      bgGradient: 'from-cyan-600 to-blue-700',
      borderColor: 'border-cyan-300/50',
      textColor: 'text-cyan-100',
      shadowColor: 'shadow-cyan-500/40',
      icon: <Trophy className="w-3 h-3 text-cyan-200" />,
    };
  }
  if (chain === 4) {
    return {
      label: 'QUADRUPLE',
      sublabel: '4x',
      bgGradient: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-300/60',
      textColor: 'text-amber-100',
      shadowColor: 'shadow-amber-500/45',
      icon: <Sparkles className="w-3.5 h-3.5 text-yellow-200" />,
    };
  }
  if (chain === 5) {
    return {
      label: 'SUPER CHAIN',
      sublabel: '5x',
      bgGradient: 'from-rose-500 to-pink-600',
      borderColor: 'border-pink-300/60',
      textColor: 'text-pink-100',
      shadowColor: 'shadow-pink-500/50',
      icon: <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />,
    };
  }
  if (chain === 6) {
    return {
      label: 'MEGA CHAIN',
      sublabel: '6x',
      bgGradient: 'from-purple-600 to-indigo-700',
      borderColor: 'border-purple-300/70',
      textColor: 'text-purple-100',
      shadowColor: 'shadow-purple-500/55',
      icon: <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />,
    };
  }
  if (chain === 7) {
    return {
      label: 'ULTRA CHAIN',
      sublabel: '7x',
      bgGradient: 'from-violet-600 via-fuchsia-600 to-pink-600',
      borderColor: 'border-fuchsia-300/70',
      textColor: 'text-fuchsia-100',
      shadowColor: 'shadow-fuchsia-500/60',
      icon: <Zap className="w-3.5 h-3.5 text-fuchsia-200 fill-fuchsia-200 animate-pulse" />,
    };
  }
  if (chain === 8) {
    return {
      label: 'HYPER CHAIN',
      sublabel: '8x',
      bgGradient: 'from-red-600 via-orange-600 to-amber-500',
      borderColor: 'border-orange-300/80',
      textColor: 'text-orange-50',
      shadowColor: 'shadow-orange-500/65',
      icon: <Flame className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200 animate-bounce" />,
    };
  }
  if (chain === 9) {
    return {
      label: 'MONSTER CHAIN',
      sublabel: '9x',
      bgGradient: 'from-fuchsia-700 via-purple-700 to-rose-600',
      borderColor: 'border-purple-200/85',
      textColor: 'text-purple-50',
      shadowColor: 'shadow-purple-500/70',
      icon: <Award className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />,
    };
  }
  if (chain === 10) {
    return {
      label: 'FANTASTIC CHAIN',
      sublabel: '10x',
      bgGradient: 'from-amber-400 via-rose-500 to-indigo-600',
      borderColor: 'border-amber-200/90',
      textColor: 'text-amber-50',
      shadowColor: 'shadow-amber-400/75',
      icon: <Crown className="w-3.5 h-3.5 text-amber-200 fill-amber-200 animate-pulse" />,
    };
  }
  return {
    label: 'ULTIMATE CHAIN',
    sublabel: `${chain}x`,
    bgGradient: 'from-yellow-300 via-pink-500 to-purple-800',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-50',
    shadowColor: 'shadow-yellow-300/80',
    icon: <InfinityIcon className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />,
  };
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  highScore,
  level,
  mode,
  dropsRemaining,
  totalDropsRequired,
  onOpenMenu,
  cascadeWave,
  lastPointsAdded,
}) => {
  const chain = Math.max(0, cascadeWave - 1);
  const accolade = getChainAccolade(chain);

  // Dots calculation: 30 dots maximum
  const totalDots = Math.min(30, totalDropsRequired);
  const filledCount = Math.max(
    0,
    Math.min(totalDots, Math.round(((totalDropsRequired - dropsRemaining) / totalDropsRequired) * totalDots))
  );

  return (
    <div className="w-full max-w-[420px] flex flex-col items-center select-none pt-1 px-3">
      {/* Top Bar: Left (+) Button & Right Mode / Best Info aligned exactly like screenshot */}
      <div className="w-full flex items-start justify-between">
        {/* Left Circular (+) Button - opens menu */}
        <button
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-full border-2 border-[#1E3758] flex items-center justify-center text-2xl font-light text-[#1E3758] hover:bg-[#1E3758]/10 active:scale-95 transition shadow-sm cursor-pointer"
          aria-label="Open Menu"
        >
          +
        </button>

        {/* Right Corner Info: M and B vertically aligned */}
        <div className="grid grid-cols-[46px_auto] gap-x-1.5 text-sm text-[#1E3758] font-sans">
          <span className="font-normal opacity-90">Mode:</span>
          <span className="font-semibold">{GAME_MODE_LABELS[mode]}</span>
          <span className="font-normal opacity-90">Best:</span>
          <span className="font-semibold font-mono">{highScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Big Ultra-Thin Score */}
      <div className="relative flex flex-col items-center justify-center my-0.5">
        <span className="text-6xl sm:text-7xl font-extralight tracking-tight text-[#1E3758] select-none font-sans drop-shadow-sm">
          {score.toLocaleString()}
        </span>

        {/* Cascade & Accolade Notification Floating Pill */}
        {cascadeWave > 1 && (
          <div
            className={`absolute -bottom-3.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-lg animate-bounce flex items-center gap-1.5 border transition-all duration-200 ${
              accolade
                ? `bg-gradient-to-r ${accolade.bgGradient} ${accolade.borderColor} ${accolade.textColor} ${accolade.shadowColor}`
                : 'bg-[#1E3758] text-white border-white/20 shadow-blue-900/40'
            }`}
          >
            {accolade ? (
              <>
                {accolade.icon}
                <span>{accolade.label} ({accolade.sublabel})</span>
              </>
            ) : (
              <span>CASCADE {cascadeWave}x</span>
            )}
            {lastPointsAdded && (
              <span className="text-yellow-300 font-mono font-bold ml-0.5">+{lastPointsAdded}</span>
            )}
          </div>
        )}
      </div>

      {/* Level Dots & Level Number Row */}
      <div className="w-full flex flex-col items-start mt-2 px-1">
        {/* Row of 30 Dots */}
        <div className="w-full flex items-center justify-between gap-0.5 sm:gap-1">
          {Array.from({ length: totalDots }).map((_, i) => {
            const isFilled = i < filledCount;
            return (
              <span
                key={`dot_${i}`}
                className={`transition-all duration-150 ${
                  isFilled
                    ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#1E3758]'
                    : 'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-[#1E3758] bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Level Label aligned to bottom-left of dots */}
        <span className="text-[11px] font-black uppercase tracking-wider text-[#1E3758] mt-1">
          LEVEL {level}
        </span>
      </div>
    </div>
  );
};

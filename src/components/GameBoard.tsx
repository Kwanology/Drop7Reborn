/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Disc, Grid } from '../types/game';
import { getColumnHeight } from '../engine/gameEngine';
import { DiscIcon } from './DiscIcon';

interface FloatingScore {
  id: string;
  x: number;
  y: number;
  points: number;
}

export interface FallingDiscState {
  disc: Disc;
  colIndex: number;
  targetRow: number;
  durationMs: number;
}

interface GameBoardProps {
  board: Grid;
  currentDisc: Disc | null;
  nextDisc: Disc | null;
  onDropInColumn: (columnIndex: number) => void;
  isProcessing: boolean;
  activeHoverColumn: number;
  setActiveHoverColumn: (col: number) => void;
  floatingScores?: FloatingScore[];
  cascadeWave?: number;
  fallingDisc?: FallingDiscState | null;
}

// 12 radial sparkle trajectories expanding from inside the bursting circle
const SPARKLE_OFFSETS = [
  { tx: '0px', ty: '-28px', size: 12 },
  { tx: '14px', ty: '-24px', size: 9 },
  { tx: '25px', ty: '-14px', size: 11 },
  { tx: '28px', ty: '0px', size: 12 },
  { tx: '25px', ty: '14px', size: 10 },
  { tx: '14px', ty: '24px', size: 9 },
  { tx: '0px', ty: '28px', size: 12 },
  { tx: '-14px', ty: '24px', size: 9 },
  { tx: '-25px', ty: '14px', size: 11 },
  { tx: '-28px', ty: '0px', size: 12 },
  { tx: '-25px', ty: '-14px', size: 10 },
  { tx: '-14px', ty: '-24px', size: 9 },
];

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  currentDisc,
  nextDisc,
  onDropInColumn,
  isProcessing,
  activeHoverColumn,
  setActiveHoverColumn,
  floatingScores = [],
  cascadeWave = 0,
  fallingDisc = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);

  // Map pointer clientX to column index 0 - 6
  const getColumnFromX = (clientX: number): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const colWidth = rect.width / 7;
    const col = Math.floor(relX / colWidth);
    return Math.max(0, Math.min(6, col));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const col = getColumnFromX(e.clientX);
    if (col !== null) {
      setIsPointerDown(true);
      setActiveHoverColumn(col);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const col = getColumnFromX(e.clientX);
    if (col !== null) {
      setActiveHoverColumn(col);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const col = getColumnFromX(e.clientX);
    setIsPointerDown(false);
    if (col !== null) {
      setActiveHoverColumn(col);
      // Trigger drop only if board is not currently processing a cascade
      if (!isProcessing && currentDisc) {
        const height = getColumnHeight(board, col);
        if (height < 7) {
          onDropInColumn(col);
        }
      }
    }
  };

  // Generate 7 rows from top (visual row 6) down to floor (visual row 0)
  const gridCells: { x: number; y: number; disc: Disc | null }[] = [];
  for (let visualRow = 6; visualRow >= 0; visualRow--) {
    for (let col = 0; col < 7; col++) {
      gridCells.push({
        x: col,
        y: visualRow,
        disc: board[col][visualRow],
      });
    }
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        setIsPointerDown(false);
      }}
      className="w-full max-w-[420px] flex flex-col items-center select-none touch-none px-2 cursor-pointer"
    >
      {/* Centered Next Ball Hint Badge at the Top */}
      <div className="flex items-center justify-center mb-1 pointer-events-none">
        {nextDisc ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 shadow-sm text-xs font-bold text-[#1E3758] animate-fade-in">
            <span className="text-[10px] uppercase tracking-widest opacity-80 font-black">Next:</span>
            <div className="w-5 h-5 flex items-center justify-center drop-shadow-xs">
              <DiscIcon disc={nextDisc} size={20} />
            </div>
          </div>
        ) : (
          <div className="h-6" />
        )}
      </div>

      {/* 1. Translucent White Top Cells (Launcher Track with Next Disc in Center Column 3) */}
      <div className="w-full grid grid-cols-7 gap-[1.5px] p-[1.5px] bg-white/50 rounded-t-xl overflow-hidden shadow-sm">
        {Array.from({ length: 7 }).map((_, c) => {
          const isTargeted = activeHoverColumn === c;
          const isCenter = c === 3;
          const isFull = getColumnHeight(board, c) >= 7;

          return (
            <div
              key={`top_track_col_${c}`}
              className={`relative aspect-square flex items-center justify-center p-0 transition-colors ${
                isTargeted
                  ? isFull
                    ? 'bg-red-500/30'
                    : 'bg-white/45'
                  : isCenter
                  ? 'bg-white/30'
                  : 'bg-white/20'
              }`}
            >
              {/* Active Dropping Disc (Touches edges of square, moved via pointer) */}
              {isTargeted && currentDisc && !fallingDisc && (
                <div className="w-full h-full flex items-center justify-center drop-shadow-md animate-fade-in pointer-events-none z-10">
                  <DiscIcon disc={currentDisc} className="w-full h-full" />
                </div>
              )}
              {/* Note: Faded preview icon removed per user instructions */}
            </div>
          );
        })}
      </div>

      {/* 2. 7×7 Main Game Board: Crisp Lines + Circles touching square edges */}
      <div className="w-full aspect-square grid grid-cols-7 grid-rows-7 gap-[1.5px] p-[1.5px] bg-white/50 rounded-b-xl shadow-2xl relative overflow-hidden">
        {/* Render all 49 cells */}
        {gridCells.map((cell) => {
          const isTargetedCol = activeHoverColumn === cell.x;
          const isColFull = getColumnHeight(board, cell.x) >= 7;
          const disc = cell.disc;

          return (
            <div
              key={`cell_${cell.x}_${cell.y}`}
              className={`relative aspect-square flex items-center justify-center p-0 transition-colors ${
                isTargetedCol
                  ? isColFull
                    ? 'bg-[#253d5f]'
                    : 'bg-[#274872]'
                  : 'bg-[#1F3A60]'
              }`}
            >
              {/* Disc Content */}
              {disc && (
                <>
                  {/* Normal Disc (not popping, cracking, or breaking) */}
                  {!disc.isPopping && !disc.isCracking && !disc.isBreaking && (
                    <div
                      className={`w-full h-full flex items-center justify-center transition-all duration-200 ${
                        disc.isRevealing
                          ? 'scale-105'
                          : 'scale-100'
                      }`}
                    >
                      <DiscIcon disc={disc} className="w-full h-full" />
                    </div>
                  )}

                  {/* BLOCK CRACKING ANIMATION: Solid -> Cracked (grows, wiggles right, wiggles left, morphs at peak, shrinks down) */}
                  {disc.isCracking && (
                    <div className="relative w-full h-full flex items-center justify-center animate-block-crack-transition z-20 pointer-events-none">
                      {/* Old State: Solid grey disc (visible 0% - 48%) */}
                      <div className="absolute inset-0 flex items-center justify-center animate-phase-old">
                        <DiscIcon disc={{ ...disc, type: 'grey', cracked: false }} className="w-full h-full" />
                      </div>
                      {/* New State: Cracked grey disc (revealed at 49% peak, shrinks down to 100%) */}
                      <div className="absolute inset-0 flex items-center justify-center animate-phase-new">
                        <DiscIcon disc={{ ...disc, type: 'grey', cracked: true }} className="w-full h-full" />
                      </div>
                    </div>
                  )}

                  {/* BLOCK BREAKING ANIMATION: Cracked -> Numbered circle (grows like pop, wiggles right then left, morphs to number at peak, shrinks down to normal) */}
                  {disc.isBreaking && (
                    <div className="relative w-full h-full flex items-center justify-center animate-block-break-transition z-30 pointer-events-none">
                      {/* Old State: Cracked grey disc (visible 0% - 48%) */}
                      <div className="absolute inset-0 flex items-center justify-center animate-phase-old">
                        <DiscIcon disc={{ ...disc, type: 'grey', cracked: true }} className="w-full h-full" />
                      </div>
                      {/* New State: Revealed number circle (revealed at 49% peak, shrinks down to 100%) */}
                      <div className="absolute inset-0 flex items-center justify-center animate-phase-new">
                        <DiscIcon
                          disc={{
                            id: disc.id,
                            type: 'number',
                            value: disc.revealedValue || 1,
                          }}
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* BURSTING DISC ANIMATION: Expands opaque first, then sparkles radiate as it expands & fades to clear */}
                  {disc.isPopping && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* 1. Exact Image of Bursting Disc expanding while opaque, then continuing to expand while fading to clear */}
                      <div className="absolute inset-0 flex items-center justify-center animate-burst-disc z-20 pointer-events-none">
                        <DiscIcon disc={disc} className="w-full h-full" />
                      </div>

                      {/* 2. Radiating Golden Sparkle Particles shooting outward from the inside */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                        {SPARKLE_OFFSETS.map((sp, idx) => (
                          <div
                            key={`sp_${cell.x}_${cell.y}_${idx}`}
                            className="absolute animate-sparkle"
                            style={{
                              '--tx': sp.tx,
                              '--ty': sp.ty,
                            } as React.CSSProperties}
                          >
                            <svg
                              width={sp.size}
                              height={sp.size}
                              viewBox="0 0 12 12"
                              className="text-amber-200 fill-current drop-shadow-[0_0_5px_rgba(255,235,100,0.95)]"
                            >
                              <path d="M 6 0 L 7.4 4.6 L 12 6 L 7.4 7.4 L 6 12 L 4.6 7.4 L 0 6 L 4.6 4.6 Z" />
                            </svg>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Downward Falling Disc Animation with Gravitational Acceleration */}
        {fallingDisc && (
          <div
            key={`falling_${fallingDisc.disc.id}`}
            className="absolute pointer-events-none z-30 animate-falling-disc"
            style={{
              left: `${(fallingDisc.colIndex + 0.5) * (100 / 7)}%`,
              top: 0,
              width: `${100 / 7}%`,
              height: `${100 / 7}%`,
              '--target-row-visual': 6 - fallingDisc.targetRow,
              '--fall-dur': `${fallingDisc.durationMs}ms`,
            } as React.CSSProperties}
          >
            <div className="w-full h-full p-0 flex items-center justify-center">
              <DiscIcon disc={fallingDisc.disc} className="w-full h-full" />
            </div>
          </div>
        )}

        {/* Floating Cascade Scores Overlay */}
        {floatingScores.map((fs) => (
          <div
            key={fs.id}
            className="absolute pointer-events-none z-40 font-black text-sm text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-bounce"
            style={{
              left: `${(fs.x + 0.5) * (100 / 7)}%`,
              bottom: `${(fs.y + 0.5) * (100 / 7)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            +{fs.points}
          </div>
        ))}
      </div>

      {/* Active Cascade Banner */}
      {cascadeWave > 1 && (
        <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1F3A60] text-white text-xs font-black uppercase tracking-wider shadow-md animate-pulse border border-white/40">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span>Cascade Chain {cascadeWave}x</span>
        </div>
      )}
    </div>
  );
};

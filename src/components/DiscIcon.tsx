/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Disc } from '../types/game';

interface DiscIconProps {
  disc: Disc;
  size?: number | string; // size in px or CSS units (e.g. 48, '100%')
  className?: string;
  isPopping?: boolean;
}

export const DISC_PALETTE: Record<number, { bg: string; shadow: string }> = {
  1: { bg: '#4CAF50', shadow: '#2E7D32' }, // Vibrant Green
  2: { bg: '#FF7043', shadow: '#D84315' }, // Orange
  3: { bg: '#F5A623', shadow: '#C77C00' }, // Golden Yellow
  4: { bg: '#E54B4B', shadow: '#B71C1C' }, // Coral Red
  5: { bg: '#D85CA8', shadow: '#8E24AA' }, // Orchid Pink
  6: { bg: '#4FC3F7', shadow: '#0288D1' }, // Sky Cyan Blue
  7: { bg: '#2C5E8A', shadow: '#143859' }, // Navy / Royal Blue
};

// Slate grey palette for mystery solid and broken blocks
const GREY_PALETTE = {
  solid: { bg: '#768B9F', shadow: '#4D6072' },
  cracked: { bg: '#6B7F93', shadow: '#435465' },
};

// Number of steps to guarantee the shadow cleanly passes the edge of the circle
const SHADOW_STEPS = 36;
const SHADOW_STEP_PX = 0.75;

export const DiscIcon: React.FC<DiscIconProps> = ({
  disc,
  size,
  className = '',
  isPopping = false,
}) => {
  const discId = disc.id || 'disc';
  const widthAttr = size !== undefined ? size : '100%';
  const heightAttr = size !== undefined ? size : '100%';

  // GREY / SOLID / CRACKED DISCS (Matches original Drop7 aesthetic with target and dashed target)
  if (disc.type === 'grey') {
    if (disc.cracked) {
      const clipId = `clip_cracked_${discId}`;
      const colors = GREY_PALETTE.cracked;

      // BROKEN BLOCK: Target with a dashed ring large enough to reach the edge of the grey circle
      return (
        <svg
          viewBox="0 0 40 40"
          width={widthAttr}
          height={heightAttr}
          className={`select-none pointer-events-none drop-shadow-sm transition-transform duration-100 ${className} ${
            isPopping ? 'scale-125 opacity-0' : 'scale-100'
          }`}
        >
          <defs>
            <clipPath id={clipId}>
              {/* Radius 20 touches all four edges of the 40x40 square */}
              <circle cx="20" cy="20" r="20" />
            </clipPath>
          </defs>

          {/* Slate Grey Base Disc touching square edges */}
          <circle cx="20" cy="20" r="20" fill={colors.bg} />

          {/* Flat Graphic Shadow: Projected from dashed ring and target center past the edge of the circle */}
          <g clipPath={`url(#${clipId})`}>
            {Array.from({ length: SHADOW_STEPS }).map((_, step) => {
              const dx = -(step + 1) * SHADOW_STEP_PX;
              const dy = (step + 1) * SHADOW_STEP_PX;
              return (
                <g key={`cracked_sh_${discId}_${step}`}>
                  <circle
                    cx={20 + dx}
                    cy={20 + dy}
                    r="16"
                    fill="none"
                    stroke={colors.shadow}
                    strokeWidth="3.2"
                    strokeDasharray="8 5"
                  />
                  <circle cx={20 + dx} cy={20 + dy} r="4.2" fill={colors.shadow} />
                </g>
              );
            })}
          </g>

          {/* Large Dashed Target Ring Reaching Near the Edge of the Grey Circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeDasharray="8 5"
          />

          {/* Crisp White Target Center Core */}
          <circle cx="20" cy="20" r="4.2" fill="#FFFFFF" />
        </svg>
      );
    }

    // SOLID BLOCK (Uncracked mystery ball): Target with a solid ring large enough to reach the edge of the grey circle
    const clipId = `clip_solid_${discId}`;
    const colors = GREY_PALETTE.solid;

    return (
      <svg
        viewBox="0 0 40 40"
        width={widthAttr}
        height={heightAttr}
        className={`select-none pointer-events-none drop-shadow-sm transition-transform duration-100 ${className} ${
          isPopping ? 'scale-125 opacity-0' : 'scale-100'
        }`}
      >
        <defs>
          <clipPath id={clipId}>
            {/* Radius 20 touches all four edges of the 40x40 square */}
            <circle cx="20" cy="20" r="20" />
          </clipPath>
        </defs>

        {/* Slate Grey Base Disc touching square edges */}
        <circle cx="20" cy="20" r="20" fill={colors.bg} />

        {/* Flat Graphic Shadow: Projected from solid target ring and center core past the edge of the circle */}
        <g clipPath={`url(#${clipId})`}>
          {Array.from({ length: SHADOW_STEPS }).map((_, step) => {
            const dx = -(step + 1) * SHADOW_STEP_PX;
            const dy = (step + 1) * SHADOW_STEP_PX;
            return (
              <g key={`solid_sh_${discId}_${step}`}>
                <circle
                  cx={20 + dx}
                  cy={20 + dy}
                  r="16"
                  fill="none"
                  stroke={colors.shadow}
                  strokeWidth="3.2"
                />
                <circle cx={20 + dx} cy={20 + dy} r="4.2" fill={colors.shadow} />
              </g>
            );
          })}
        </g>

        {/* Large Solid Target Ring Reaching Near the Edge of the Grey Circle */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.2"
        />

        {/* Crisp White Target Center Core */}
        <circle cx="20" cy="20" r="4.2" fill="#FFFFFF" />
      </svg>
    );
  }

  // NUMBERED DISCS (1 - 7)
  const val = disc.value || 1;
  const colors = DISC_PALETTE[val] || DISC_PALETTE[1];
  const clipId = `clip_${discId}_${val}`;

  return (
    <svg
      viewBox="0 0 40 40"
      width={widthAttr}
      height={heightAttr}
      className={`select-none pointer-events-none drop-shadow-sm transition-transform duration-100 ${className} ${
        isPopping ? 'scale-125 opacity-0' : 'scale-100'
      }`}
    >
      <defs>
        <clipPath id={clipId}>
          {/* Radius 20 touches all four edges of the 40x40 square */}
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>

      {/* Main Color Disc Base - Touching all edges of 40x40 square */}
      <circle cx="20" cy="20" r="20" fill={colors.bg} />

      {/* Flat Graphic Shadow: Extended down-and-left to ensure shadow passes the edge of the circle in a clean simple color */}
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: SHADOW_STEPS }).map((_, step) => (
          <text
            key={`sh_${discId}_${step}`}
            x={20 - (step + 1) * SHADOW_STEP_PX}
            y={20.5 + (step + 1) * SHADOW_STEP_PX}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="system-ui, -apple-system, 'SF Pro Display', 'Helvetica Neue', Inter, sans-serif"
            fontWeight="300"
            fontSize="27"
            fill={colors.shadow}
            letterSpacing="-0.5"
          >
            {val}
          </text>
        ))}
      </g>

      {/* Larger, Skinnier White Numeral Centered on Top */}
      <text
        x="20"
        y="20.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="system-ui, -apple-system, 'SF Pro Display', 'Helvetica Neue', Inter, sans-serif"
        fontWeight="300"
        fontSize="27"
        fill="#FFFFFF"
        letterSpacing="-0.5"
      >
        {val}
      </text>
    </svg>
  );
};

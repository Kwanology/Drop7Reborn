/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ColorPalettePickerProps {
  currentColor: string;
  onChange: (color: string) => void;
}

const PRESETS = [
  { name: 'Classic Slate', color: '#121316' },
  { name: 'OLED Pure Black', color: '#000000' },
  { name: 'Midnight Navy', color: '#0f172a' },
  { name: 'Cyber Teal', color: '#042f2e' },
  { name: 'Deep Plum', color: '#2e1065' },
  { name: 'Espresso', color: '#1c1412' },
  { name: 'Charcoal Grey', color: '#27272a' },
  { name: 'Minimalist Clean', color: '#e5e7eb' },
];

export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  currentColor,
  onChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [brightness, setBrightness] = useState<number>(1.0);

  // Helper: HSV to RGB
  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0,
      g = 0,
      b = 0;

    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  };

  // Helper: rgb to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = Math.max(0, Math.min(255, x)).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  };

  // Render the 2D rainbow block spectrum canvas
  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      // Y goes from 0 (top = pure white & light greys) to height/2 (pure hues) to height (dark greys & black)
      const normY = y / height;

      for (let x = 0; x < width; x++) {
        const hue = (x / width) * 360;

        let sat = 1;
        let val = 1;

        if (normY < 0.45) {
          // Top section: fades from white/grey (y=0) to full saturation (y=0.45)
          const factor = normY / 0.45;
          sat = factor;
          val = 1.0;
        } else {
          // Bottom section: from full color down to greys/black
          const factor = (normY - 0.45) / 0.55;
          sat = 1.0 - factor * 0.4; // Slightly desaturates towards bottom for slate/grey feel
          val = Math.max(0, 1.0 - factor);
        }

        val = val * brightness;

        const [r, g, b] = hsvToRgb(hue, sat, val);
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw left-side dedicated grayscale vertical strip (10% of width)
    const grayWidth = Math.floor(width * 0.08);
    for (let y = 0; y < height; y++) {
      const gVal = Math.round((1 - y / height) * 255 * brightness);
      for (let x = 0; x < grayWidth; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = gVal;
        data[idx + 1] = gVal;
        data[idx + 2] = gVal;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw subtle divider line next to grayscale strip
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(grayWidth, 0, 1, height);
  }, [brightness]);

  useEffect(() => {
    drawSpectrum();
  }, [drawSpectrum]);

  // Handle color sampling at mouse/touch position
  const pickColorAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(((clientX - rect.left) / rect.width) * canvas.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(((clientY - rect.top) / rect.height) * canvas.height)));

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    setCrosshair({ x: clientX - rect.left, y: clientY - rect.top });
    onChange(hex);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    pickColorAt(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    pickColorAt(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col gap-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-gray-200">Custom Background RGB Palette</h4>
          <p className="text-xs text-gray-400">Interactive spectrum with greys, whites, and colors</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full border-2 border-white/60 shadow-md transition-transform"
            style={{ backgroundColor: currentColor }}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-gray-300">
            {currentColor}
          </span>
        </div>
      </div>

      {/* 2D Rainbow Block Canvas */}
      <div className="relative overflow-hidden rounded-xl border border-white/20 shadow-inner">
        <canvas
          ref={canvasRef}
          width={320}
          height={160}
          className="w-full h-40 cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Dynamic Crosshair Indicator */}
        {crosshair && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg"
            style={{
              left: `${crosshair.x}px`,
              top: `${crosshair.y}px`,
              backgroundColor: currentColor,
            }}
          />
        )}
      </div>

      {/* Brightness Adjustment Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-gray-300">
          <span>Overall Tone / Brightness</span>
          <span>{Math.round(brightness * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.02"
          value={brightness}
          onChange={(e) => setBrightness(parseFloat(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
        />
      </div>

      {/* Quick Color Presets */}
      <div>
        <span className="text-xs font-medium text-gray-400 mb-2 block">Quick Themes</span>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setCrosshair(null);
                onChange(preset.color);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                currentColor.toLowerCase() === preset.color.toLowerCase()
                  ? 'border-white bg-white/20 text-white shadow'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/40 flex-shrink-0"
                style={{ backgroundColor: preset.color }}
              />
              <span className="truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

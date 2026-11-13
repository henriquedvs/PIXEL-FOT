import React, { useEffect, useRef } from 'react';
import { drawPixelPortrait } from '../engine/pixelRenderer';
import { HairStyle } from '../types/game';

interface PixelPortraitProps {
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyle;
  shirtPrimary: string;
  shirtSecondary: string;
  isCoach?: boolean;
  beard?: boolean;
  size?: number;
  className?: string;
}

export const PixelPortrait: React.FC<PixelPortraitProps> = ({
  skinColor,
  hairColor,
  hairStyle,
  shirtPrimary,
  shirtSecondary,
  isCoach = false,
  beard = false,
  size = 40,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawPixelPortrait(ctx, c.width, c.height, {
      skinColor,
      hairColor,
      hairStyle,
      shirtPrimary,
      shirtSecondary,
      isCoach,
      beard,
    });
  }, [skinColor, hairColor, hairStyle, shirtPrimary, shirtSecondary, isCoach, beard]);

  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      style={{ width: size, height: size }}
      className={`pixelated rounded-lg border border-slate-700 shrink-0 ${className}`}
    />
  );
};

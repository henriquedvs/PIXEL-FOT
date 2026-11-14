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
  variant?: 'square' | 'bust';
  jerseyNumber?: number;
  crestBg?: string;
  crestAccent?: string;
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
  variant = 'square',
  jerseyNumber,
  crestBg,
  crestAccent,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const canvasW = variant === 'bust' ? 48 : 32;
  const canvasH = variant === 'bust' ? 62 : 32;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    if (variant === 'square') {
      drawPixelPortrait(ctx, c.width, c.height, {
        skinColor,
        hairColor,
        hairStyle,
        shirtPrimary,
        shirtSecondary,
        isCoach,
        beard,
      });
      return;
    }

    // Detailed 48x62 Athlete Bust Portrait (reference-style pixel portrait card)
    ctx.imageSmoothingEnabled = false;
    // Deep nocturnal stadium backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, canvasH);
    grad.addColorStop(0, '#0C1B2C');
    grad.addColorStop(1, '#060E17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle stadium floodlight rim pixels
    ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
    ctx.fillRect(4, 5, 2, 2);
    ctx.fillRect(42, 6, 2, 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.10)';
    ctx.fillRect(0, 42, canvasW, 20);

    // Jersey Torso & Shoulders
    ctx.fillStyle = shirtPrimary;
    ctx.fillRect(7, 41, 34, 21);
    ctx.fillRect(11, 38, 26, 4);

    // Shoulder/side stripes
    ctx.fillStyle = shirtSecondary;
    ctx.fillRect(7, 41, 5, 21);
    ctx.fillRect(36, 41, 5, 21);
    ctx.fillRect(15, 42, 4, 20);
    ctx.fillRect(29, 42, 4, 20);

    // Collar trim
    ctx.fillStyle = shirtSecondary;
    ctx.fillRect(17, 38, 14, 3);
    ctx.fillStyle = '#09111B';
    ctx.fillRect(20, 39, 8, 2);

    // Mini Pixel Club Crest on Left Chest
    const badgeFill = crestBg || shirtSecondary || '#FACC15';
    const badgeInner = crestAccent || shirtPrimary;
    ctx.fillStyle = '#09111B';
    ctx.fillRect(28, 45, 9, 10);
    ctx.fillStyle = badgeFill;
    ctx.fillRect(29, 46, 7, 7);
    ctx.fillRect(30, 53, 5, 1);
    ctx.fillStyle = badgeInner;
    ctx.fillRect(31, 47, 3, 5);

    // Subtle jersey number pixel hint on chest/trim
    if (jerseyNumber !== undefined) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(14, 49, 4, 1);
      ctx.fillRect(14, 51, 4, 1);
    }

    // Neck + shadow
    ctx.fillStyle = skinColor;
    ctx.fillRect(19, 31, 10, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(19, 31, 10, 3);
    ctx.fillRect(19, 31, 2, 8);

    // Ear pixels
    ctx.fillStyle = skinColor;
    ctx.fillRect(12, 18, 2, 6);
    ctx.fillRect(34, 18, 2, 6);

    // Head base
    ctx.fillStyle = skinColor;
    ctx.fillRect(14, 10, 20, 22);
    ctx.fillRect(16, 32, 16, 2);

    // Facial shading (right/cheekbone depth + highlight)
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(14, 10, 3, 22);
    ctx.fillRect(16, 30, 16, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(27, 13, 5, 6);

    // Eyebrows & Eyes
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(18, 17, 4, 1);
    ctx.fillRect(26, 17, 4, 1);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(18, 19, 4, 2);
    ctx.fillRect(26, 19, 4, 2);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(19, 19, 2, 2);
    ctx.fillRect(27, 19, 2, 2);

    // Nose shadow & mouth
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fillRect(23, 21, 2, 4);
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(21, 27, 6, 1);

    // Beard / Stubble
    if (beard) {
      ctx.fillStyle = hairColor;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(14, 24, 2, 7);
      ctx.fillRect(32, 24, 2, 7);
      ctx.fillRect(16, 28, 16, 5);
      ctx.fillRect(20, 25, 8, 2);
      ctx.globalAlpha = 1;
    }

    // Hair Styles
    ctx.fillStyle = hairColor;
    if (hairStyle === 'Raspado') {
      ctx.fillRect(15, 9, 18, 3);
    } else if (hairStyle === 'Moicano') {
      ctx.fillRect(20, 3, 8, 9);
      ctx.fillRect(18, 8, 12, 3);
    } else if (hairStyle === 'BlackPower') {
      ctx.fillRect(10, 4, 28, 10);
      ctx.fillRect(11, 13, 4, 6);
      ctx.fillRect(33, 13, 4, 6);
    } else if (hairStyle === 'Topete') {
      ctx.fillRect(13, 6, 22, 6);
      ctx.fillRect(18, 4, 14, 4);
      ctx.fillRect(13, 11, 2, 6);
      ctx.fillRect(33, 11, 2, 5);
    } else if (hairStyle === 'Longo' || hairStyle === 'Tranças') {
      ctx.fillRect(12, 7, 24, 6);
      ctx.fillRect(11, 12, 3, 18);
      ctx.fillRect(34, 12, 3, 18);
    } else if (hairStyle === 'Cacheado') {
      ctx.fillRect(12, 5, 24, 8);
      ctx.fillRect(11, 10, 3, 7);
      ctx.fillRect(34, 10, 3, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(16, 6, 3, 2);
      ctx.fillRect(26, 7, 3, 2);
    } else {
      // Curto / Franja
      ctx.fillRect(13, 7, 22, 5);
      ctx.fillRect(13, 11, 2, 6);
      ctx.fillRect(33, 11, 2, 6);
      if (hairStyle === 'Franja') {
        ctx.fillRect(16, 12, 13, 3);
      }
    }
  }, [
    skinColor,
    hairColor,
    hairStyle,
    shirtPrimary,
    shirtSecondary,
    isCoach,
    beard,
    variant,
    jerseyNumber,
    crestBg,
    crestAccent,
    canvasW,
    canvasH,
  ]);

  const widthPx = size;
  const heightPx = variant === 'bust' ? Math.round(size * 1.29) : size;

  return (
    <canvas
      ref={ref}
      width={canvasW}
      height={canvasH}
      style={{ width: widthPx, height: heightPx }}
      className={`pixelated rounded-[2px] border border-[#243B4F] shrink-0 ${className}`}
    />
  );
};

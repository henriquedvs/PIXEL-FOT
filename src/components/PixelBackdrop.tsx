import React, { useEffect, useRef } from 'react';
import { getClubById } from '../data/clubs';
import { drawPixelStadium, generateCrowd, PITCH_GEO } from '../engine/pixelRenderer';
import { ClubKit } from '../types/game';

interface PixelBackdropProps {
  homeKit?: ClubKit;
  awayKit?: ClubKit;
  animated?: boolean;
  dimOpacity?: number;
  className?: string;
}

/**
 * Shared nocturnal pixel-art stadium backdrop used across all non-match screens
 * so every menu shares the same atmospheric Pixel Football stadium identity.
 */
export const PixelBackdrop: React.FC<PixelBackdropProps> = ({
  homeKit,
  awayKit,
  animated = false,
  dimOpacity = 0.78,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const defaultHome = homeKit || getClubById('palmeiras_verde').kit;
    const defaultAway = awayKit || getClubById('corinthians_preto').kit;
    const crowd = generateCrowd(defaultHome.primary, defaultHome.secondary, defaultAway.primary, 'medium', {
      awaySecondary: defaultAway.secondary,
      capacity: 42000,
      importance: 0.75,
    });

    const drawScene = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#071019';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      const zoom = Math.max(w / 1380, h / 820);
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-PITCH_GEO.worldW / 2, -PITCH_GEO.worldH / 2 + 30);

      drawPixelStadium(ctx, crowd, t, 0.25, 0, 0, 'medium', {
        homeKit: defaultHome,
        awayKit: defaultAway,
        homeShort: 'PIX',
        awayShort: 'FUT',
        homeScore: 0,
        awayScore: 0,
        matchMinuteStr: 'NOITE',
        crowdMood: 'excited',
        showMosaic: false,
        environmentalEffects: true,
        effectsIntensity: 0.6,
      });

      ctx.restore();

      // Atmospheric floodlight flares top corners
      const flareLeft = ctx.createRadialGradient(w * 0.08, h * 0.06, 4, w * 0.08, h * 0.06, w * 0.26);
      flareLeft.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
      flareLeft.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = flareLeft;
      ctx.fillRect(0, 0, w, h);

      const flareRight = ctx.createRadialGradient(w * 0.92, h * 0.06, 4, w * 0.92, h * 0.06, w * 0.26);
      flareRight.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
      flareRight.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = flareRight;
      ctx.fillRect(0, 0, w, h);
    };

    if (!animated) {
      drawScene(1.2);
      return;
    }

    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      drawScene(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [homeKit, awayKit, animated]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`} aria-hidden="true">
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="w-full h-full object-cover pixelated opacity-80"
      />
      <div
        className="absolute inset-0 px-scanlines"
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(7, 16, 25, ${Math.max(
            0.48,
            dimOpacity - 0.16
          )}) 0%, rgba(6, 13, 21, ${dimOpacity}) 65%, rgba(5, 10, 16, 0.94) 100%)`,
        }}
      />
    </div>
  );
};

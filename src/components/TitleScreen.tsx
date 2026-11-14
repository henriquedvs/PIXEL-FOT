import React, { useEffect, useRef } from 'react';
import { Maximize2, Minimize2, Play, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS } from '../data/clubs';
import {
  drawPixelBall,
  drawPixelPlayerSprite,
  drawPixelStadium,
  generateCrowd,
  PITCH_GEO,
} from '../engine/pixelRenderer';
import { GameSettings } from '../types/game';
import { useFullscreenState } from '../utils/fullscreen';

interface TitleScreenProps {
  settings: GameSettings;
  onToggleMusic: () => void;
  onPlay: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  settings,
  onToggleMusic,
  onPlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreen, toggleFullscreen] = useFullscreenState();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const crowd = generateCrowd(
      CLUBS[8].kit.primary,
      CLUBS[8].kit.secondary,
      CLUBS[13].kit.primary,
      'high',
      { awaySecondary: CLUBS[13].kit.secondary, capacity: 72000, importance: 0.96 }
    );

    const sparkles = Array.from({ length: 48 }, (_, idx) => ({
      x: ((idx * 173) % 1000) / 1000,
      y: ((idx * 257) % 1000) / 1000,
      spd: 0.04 + (idx % 5) * 0.015,
      color: ['#10B981', '#FACC15', '#38BDF8', '#F8FAFC'][idx % 4],
      size: idx % 3 === 0 ? 4 : 3,
    }));

    let rafId = 0;
    let t = 0;
    let last = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      t += dt;

      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#081018';
      ctx.fillRect(0, 0, w, h);

      const zoom = Math.max(w / 1140, h / 690);
      const camX = PITCH_GEO.worldW / 2 + Math.sin(t * 0.24) * 145;
      const camY = PITCH_GEO.worldH / 2 + Math.cos(t * 0.18) * 58;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, -camY);

      drawPixelStadium(ctx, crowd, t, 0.72, 0, 0, 'high', {
        homeKit: CLUBS[8].kit,
        awayKit: CLUBS[13].kit,
        homeShort: CLUBS[8].shortName,
        awayShort: CLUBS[13].shortName,
        homeScore: 2,
        awayScore: 1,
        matchMinuteStr: 'PRÉ-JOGO',
        mascot: CLUBS[8].mascot,
        crowdMood: 'excited',
        showMosaic: true,
        mosaicProgress: 1,
      });

      // Diving goalkeeper warmup drill inside left penalty box
      const gkDiveCycle = Math.sin(t * 1.9);
      const gkDiving = Math.abs(gkDiveCycle) > 0.72;
      drawPixelPlayerSprite(
        ctx,
        PITCH_GEO.pitchX + 95,
        PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2 + gkDiveCycle * 46,
        2.15,
        {
          appearance: {
            skinColor: '#C68642',
            hairStyle: 'Curto',
            hairColor: '#1B1717',
            faceStyle: 'Determinado',
            eyeStyle: 'Padrão',
            eyebrowStyle: 'Grossa',
            beardStyle: 'Nenhuma',
            mustacheStyle: 'Nenhum',
            bodyType: 'Atlético',
            visualHeightScale: 1.03,
          },
          gear: {
            jerseyNumber: 1,
            dominantFoot: 'Direito',
            bootModel: 'Controle',
            bootColor: '#10B981',
            sleeveLength: 'Longa',
            sockType: 'Alta',
            accessory: 'Luvas',
          },
          kit: CLUBS[8].kit,
          isGoalkeeper: true,
          isUserControlled: false,
          facingAngle: 0,
          animPhase: t * 8,
          isSprinting: false,
          isDribbling: false,
          hasBall: false,
          action: gkDiving ? 'dive' : 'idle',
          zOffset: gkDiving ? 5 : 0,
        },
        'match'
      );

      // Animated pixel exhibition players warming up & passing
      for (let i = 0; i < 6; i++) {
        const px = PITCH_GEO.pitchX + 360 + Math.sin(t * 1.15 + i * 1.2) * 185;
        const py = PITCH_GEO.pitchY + 170 + i * 68 + Math.cos(t * 1.45 + i) * 34;
        const kit = i % 2 === 0 ? CLUBS[8].kit : CLUBS[13].kit;
        drawPixelPlayerSprite(
          ctx,
          px,
          py,
          2.1,
          {
            appearance: {
              skinColor: i % 3 === 0 ? '#8D5524' : '#D19A6E',
              hairStyle: i % 2 === 0 ? 'Moicano' : 'Topete',
              hairColor: '#1B1717',
              faceStyle: 'Determinado',
              eyeStyle: 'Padrão',
              eyebrowStyle: 'Grossa',
              beardStyle: 'Nenhuma',
              mustacheStyle: 'Nenhum',
              bodyType: 'Atlético',
              visualHeightScale: 1,
            },
            gear: {
              jerseyNumber: i + 7,
              dominantFoot: 'Direito',
              bootModel: 'Velocidade',
              bootColor: '#FACC15',
              sleeveLength: 'Curta',
              sockType: 'Alta',
              accessory: 'Nenhum',
            },
            kit,
            isGoalkeeper: false,
            isUserControlled: false,
            facingAngle: Math.cos(t * 1.15 + i * 1.2) >= 0 ? 0 : Math.PI,
            animPhase: t * 8.5 + i,
            isSprinting: i % 3 === 0,
            isDribbling: i % 2 === 1,
            hasBall: false,
            action: i === 0 && Math.sin(t * 2.2) > 0.75 ? 'kick' : 'run',
          },
          'match'
        );
      }

      drawPixelBall(
        ctx,
        PITCH_GEO.pitchX + PITCH_GEO.pitchW / 2 + Math.sin(t * 1.7) * 95,
        PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2 + Math.cos(t * 1.25) * 42,
        Math.abs(Math.sin(t * 3.6)) * 20,
        t * 6.5
      );

      ctx.restore();

      // Stadium floodlight beams & drifting pixel confetti
      const beamAlpha = 0.085 + Math.sin(t * 1.5) * 0.025;
      ctx.fillStyle = `rgba(255, 250, 220, ${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.45, h);
      ctx.lineTo(w * 0.15, h);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w * 0.85, h);
      ctx.lineTo(w * 0.55, h);
      ctx.closePath();
      ctx.fill();

      sparkles.forEach((sp, i) => {
        const sx = ((sp.x * w + Math.sin(t * 1.2 + i) * 18) + w) % w;
        const sy = ((sp.y + t * sp.spd) % 1) * h;
        ctx.fillStyle = sp.color;
        ctx.fillRect(Math.round(sx), Math.round(sy), sp.size, sp.size);
      });

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handlePlayClick = () => {
    soundEngine.unlock();
    soundEngine.play('menu');
    soundEngine.startMenuMusic();
    onPlay();
  };

  const handleMusicClick = () => {
    soundEngine.unlock();
    soundEngine.play('menu');
    onToggleMusic();
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#081018] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pixelated"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#081018]/92 via-[#081018]/50 to-[#081018]/78" />

      {/* Top right audio & fullscreen controls (Fullscreen strictly on Title & Settings) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.unlock();
            soundEngine.play('menu');
            toggleFullscreen();
          }}
          className="px-btn-secondary flex items-center justify-center p-2 min-w-[38px] min-h-[38px] cursor-pointer"
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Colocar em tela cheia'}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? (
            <Minimize2 size={16} className="text-emerald-400" />
          ) : (
            <Maximize2 size={16} className="text-slate-300" />
          )}
        </button>

        <button
          type="button"
          onClick={handleMusicClick}
          className="px-btn-secondary flex items-center gap-2 px-3.5 py-2 min-h-[38px] cursor-pointer whitespace-nowrap"
          aria-label="Alternar música de abertura"
        >
          {settings.audio.musicEnabled ? (
            <Volume2 size={17} className="text-emerald-400" />
          ) : (
            <VolumeX size={17} className="text-slate-400" />
          )}
          <span className="text-xs font-display font-semibold tracking-wide">
            {settings.audio.musicEnabled ? 'MÚSICA ON' : 'MÚSICA OFF'}
          </span>
        </button>
      </div>

      {/* Center Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl animate-fadeIn">
        {/* Crisp Pixel Football Crest */}
        <svg
          width="88"
          height="88"
          viewBox="0 0 64 64"
          className="mb-3 drop-shadow-[0_12px_28px_rgba(16,185,129,0.38)] pixelated"
          aria-hidden="true"
        >
          <path
            d="M10 8 H54 V34 C54 46 32 58 32 58 C32 58 10 46 10 34 Z"
            fill="#0F172A"
            stroke="#22C55E"
            strokeWidth="3.5"
          />
          <rect x="20" y="16" width="24" height="24" fill="#22C55E" />
          <rect x="24" y="20" width="16" height="16" fill="#F8FAFC" />
          <rect x="28" y="24" width="8" height="8" fill="#0F172A" />
          <rect x="24" y="20" width="4" height="4" fill="#0F172A" />
          <rect x="36" y="20" width="4" height="4" fill="#0F172A" />
          <rect x="24" y="32" width="4" height="4" fill="#0F172A" />
          <rect x="36" y="32" width="4" height="4" fill="#0F172A" />
          <rect x="29" y="11" width="6" height="3" fill="#FACC15" />
        </svg>

        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-wider text-white drop-shadow-[0_4px_0_rgba(4,9,16,0.9)]">
          PIXEL <span className="text-emerald-400">FOOTBALL</span>
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-slate-200 max-w-lg font-medium">
          Carreira profissional de jogador em Pixel Art · Brasileirão Série A e B, Copa do Brasil, Supercopa e partidas 11v11.
        </p>

        <button
          type="button"
          onClick={handlePlayClick}
          className="px-btn-primary mt-6 flex items-center gap-3 px-12 py-3.5 text-lg cursor-pointer whitespace-nowrap"
        >
          <Play size={20} fill="currentColor" />
          JOGAR
        </button>

        <p className="mt-4 font-mono-num text-[11px] text-slate-300/85 tracking-wide">
          ANALÓGICO PARA MOVER · PASSE DIRECIONADO · MODO CARREIRA
        </p>
      </div>
    </div>
  );
};

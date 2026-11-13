import React, { useEffect, useRef } from 'react';
import { Maximize2, Minimize2, Play, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { useFullscreenState } from '../utils/fullscreen';
import {
  drawPixelBall,
  drawPixelPlayerSprite,
  drawPixelStadium,
  generateCrowd,
  PITCH_GEO,
} from '../engine/pixelRenderer';
import { CLUBS } from '../data/clubs';
import { GameSettings } from '../types/game';

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
      CLUBS[0].kit.primary,
      CLUBS[0].kit.secondary,
      CLUBS[1].kit.primary,
      'medium'
    );

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

      const zoom = Math.max(w / 1120, h / 680);
      const camX = PITCH_GEO.worldW / 2 + Math.sin(t * 0.25) * 140;
      const camY = PITCH_GEO.worldH / 2 + Math.cos(t * 0.18) * 55;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, -camY);

      drawPixelStadium(ctx, crowd, t, 0, 0, 0, 'medium');

      // Animated pixel exhibition players warming up
      for (let i = 0; i < 6; i++) {
        const px = PITCH_GEO.pitchX + 350 + Math.sin(t * 1.1 + i * 1.2) * 170;
        const py = PITCH_GEO.pitchY + 180 + i * 65 + Math.cos(t * 1.4 + i) * 35;
        const kit = i % 2 === 0 ? CLUBS[0].kit : CLUBS[1].kit;
        drawPixelPlayerSprite(
          ctx,
          px,
          py,
          2.1,
          {
            appearance: {
              skinColor: '#D19A6E',
              hairStyle: i % 2 === 0 ? 'Moicano' : 'Curto',
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
            facingAngle: Math.cos(t * 1.1 + i * 1.2) >= 0 ? 0 : Math.PI,
            animPhase: t * 8 + i,
            isSprinting: false,
            isDribbling: false,
            hasBall: false,
          },
          'match'
        );
      }

      drawPixelBall(
        ctx,
        PITCH_GEO.pitchX + PITCH_GEO.pitchW / 2 + Math.sin(t * 1.6) * 90,
        PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2 + Math.cos(t * 1.2) * 40,
        Math.abs(Math.sin(t * 3.5)) * 18,
        t * 6
      );

      ctx.restore();
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
      <div className="absolute inset-0 bg-gradient-to-t from-[#081018]/92 via-[#081018]/55 to-[#081018]/75" />

      {/* Top right audio & fullscreen controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.unlock();
            soundEngine.play('menu');
            toggleFullscreen();
          }}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-900/85 border border-slate-700/70 text-slate-200 hover:border-emerald-400/60 transition-colors cursor-pointer"
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Colocar em tela cheia'}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? (
            <Minimize2 size={17} className="text-emerald-400" />
          ) : (
            <Maximize2 size={17} className="text-slate-300" />
          )}
        </button>

        <button
          type="button"
          onClick={handleMusicClick}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900/85 border border-slate-700/70 text-slate-200 hover:border-emerald-400/60 transition-colors cursor-pointer whitespace-nowrap"
          aria-label="Alternar música de abertura"
        >
          {settings.audio.musicEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-slate-400" />}
          <span className="text-xs font-medium">
            {settings.audio.musicEnabled ? 'Música Ativa' : 'Música Muda'}
          </span>
        </button>
      </div>

      {/* Center Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl animate-fadeIn">
        {/* Original Pixel Football SVG Crest */}
        <svg
          width="88"
          height="88"
          viewBox="0 0 64 64"
          className="mb-3 drop-shadow-[0_10px_25px_rgba(16,185,129,0.35)]"
          aria-hidden="true"
        >
          <path
            d="M10 8 H54 V34 C54 46 32 58 32 58 C32 58 10 46 10 34 Z"
            fill="#0F172A"
            stroke="#10B981"
            strokeWidth="3.5"
          />
          <rect x="20" y="16" width="24" height="24" fill="#10B981" />
          <rect x="24" y="20" width="16" height="16" fill="#F8FAFC" />
          <rect x="28" y="24" width="8" height="8" fill="#0F172A" />
          <rect x="24" y="20" width="4" height="4" fill="#0F172A" />
          <rect x="36" y="20" width="4" height="4" fill="#0F172A" />
          <rect x="24" y="32" width="4" height="4" fill="#0F172A" />
          <rect x="36" y="32" width="4" height="4" fill="#0F172A" />
        </svg>

        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-md text-balance">
          PIXEL <span className="text-emerald-400">FOOTBALL</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md">
          Futebol clássico em Pixel Art 2D com carreira profissional completa e partidas 11v11 por toque.
        </p>

        <button
          type="button"
          onClick={handlePlayClick}
          className="mt-6 flex items-center gap-3 px-10 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-display font-extrabold text-lg tracking-wide shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all cursor-pointer whitespace-nowrap"
        >
          <Play size={22} fill="currentColor" />
          JOGAR
        </button>

        <p className="mt-4 text-xs text-slate-400 tracking-wide">
          Toque e arraste para mover · Toque no companheiro para passar · Mire no gol para finalizar
        </p>
      </div>
    </div>
  );
};

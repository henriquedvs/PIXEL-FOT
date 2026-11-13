import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CloudRain,
  FastForward,
  MapPin,
  Moon,
  Play,
  Sun,
  Sunset,
  Thermometer,
  Users,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getPositionMeta } from '../data/positions';
import {
  drawPixelPlayerSprite,
  drawPixelStadium,
  drawWeatherAndLightingOverlay,
  generateCrowd,
  PITCH_GEO,
} from '../engine/pixelRenderer';
import { Club, MatchEnvironment, PlayerCareer } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelPortrait } from './PixelPortrait';

interface PreMatchPresentationProps {
  career: PlayerCareer;
  homeClub: Club;
  awayClub: Club;
  env: MatchEnvironment;
  onStartMatch: () => void;
}

type IntroStep = 'STADIUM' | 'LINEUPS' | 'ENTRANCE';

const INTRO_SHOTS = [
  { label: 'Estádio & Iluminação', duration: 3.2 },
  { label: 'Torcida & Bandeiras', duration: 3.2 },
  { label: 'Mosaico & Bandeirão', duration: 3.4 },
  { label: 'Túnel & Comissões Técnicas', duration: 3.2 },
];

export const PreMatchPresentation: React.FC<PreMatchPresentationProps> = ({
  career,
  homeClub,
  awayClub,
  env,
  onStartMatch,
}) => {
  const [step, setStep] = useState<IntroStep>('STADIUM');
  const [shotIdx, setShotIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSpecialMatch =
    env.competitionName.includes('Final') ||
    env.competitionName.includes('Supercopa') ||
    env.competitionName.includes('Copa');

  // Auto-advance cinematic shots in STADIUM step (with manual advance/skip available)
  useEffect(() => {
    if (step !== 'STADIUM') return;
    soundEngine.play(shotIdx === 2 ? 'flagWave' : shotIdx === 1 ? 'crowdChant' : 'crowd');
    const timer = window.setTimeout(() => {
      setShotIdx((prev) => (prev + 1) % INTRO_SHOTS.length);
    }, INTRO_SHOTS[shotIdx].duration * 1000);
    return () => window.clearTimeout(timer);
  }, [step, shotIdx]);

  // Animated Pixel Art Stadium Cinematography (Step 1) and Tunnel Entrance (Step 3)
  useEffect(() => {
    if (step === 'LINEUPS') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const crowd = generateCrowd(
      homeClub.kit.primary,
      homeClub.kit.secondary,
      awayClub.kit.primary,
      'high',
      {
        awaySecondary: awayClub.kit.secondary,
        capacity: env.stadium.capacity,
        importance: isSpecialMatch ? 0.98 : 0.78,
      }
    );

    let raf = 0;
    let t = 0;
    let shotElapsed = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      t += dt;
      shotElapsed += dt;

      const w = canvas.width;
      const h = canvas.height;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#081018';
      ctx.fillRect(0, 0, w, h);

      let zoom = Math.max(w / 1380, h / 840);
      let camX = PITCH_GEO.worldW / 2;
      let camY = PITCH_GEO.worldH / 2;

      if (step === 'STADIUM') {
        if (shotIdx === 0) {
          // Wide aerial stadium & floodlight sweep
          zoom = Math.max(w / 1460, h / 880);
          camX = PITCH_GEO.worldW / 2 + Math.sin(t * 0.45) * 140;
          camY = 380 + Math.cos(t * 0.35) * 90;
        } else if (shotIdx === 1) {
          // Close-up on waving flags & organized West/North crowd
          zoom = Math.max(w / 820, h / 500);
          camX = 320 + Math.sin(t * 0.5) * 110;
          camY = 230;
        } else if (shotIdx === 2) {
          // Unfurling Mascot Mosaic / Bandeirão on North stand
          zoom = Math.max(w / 880, h / 520);
          camX = PITCH_GEO.worldW / 2;
          camY = 175;
        } else {
          // Dugouts, coaches & player entrance tunnel
          zoom = Math.max(w / 920, h / 540);
          camX = PITCH_GEO.worldW / 2 + Math.sin(t * 0.4) * 90;
          camY = PITCH_GEO.worldH - 220;
        }
      } else {
        // ENTRANCE: follow players marching from tunnel to midfield formation
        const walkProgress = Math.min(1, t / 3.2);
        zoom = Math.max(w / (900 + walkProgress * 320), h / (540 + walkProgress * 200));
        camX = PITCH_GEO.pitchX + PITCH_GEO.pitchW / 2;
        camY =
          PITCH_GEO.worldH -
          210 -
          walkProgress * (PITCH_GEO.worldH - 210 - (PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2));
      }

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-Math.round(camX), -Math.round(camY));

      const mosaicProg = shotIdx === 2 ? Math.min(1, shotElapsed / 1.4) : 1;

      drawPixelStadium(ctx, crowd, t, step === 'ENTRANCE' ? 0.65 : 0.4, 0, 0, 'high', {
        stadium: env.stadium,
        homeKit: homeClub.kit,
        awayKit: awayClub.kit,
        homeShort: homeClub.shortName,
        awayShort: awayClub.shortName,
        homeScore: 0,
        awayScore: 0,
        matchMinuteStr: 'PRÉ-JOGO',
        mascot: homeClub.mascot,
        crowdMood: 'excited',
        showMosaic: step === 'ENTRANCE' || shotIdx >= 2,
        mosaicProgress: mosaicProg,
        env,
        environmentalEffects: true,
        effectsIntensity: 1.0,
      });

      if (step === 'ENTRANCE') {
        const walkProgress = Math.min(1, t / 3.0);
        const startY = PITCH_GEO.worldH - 135;
        const targetMidY = PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2;
        const midX = PITCH_GEO.pitchX + PITCH_GEO.pitchW / 2;

        const userGroup = getPositionMeta(career.position).group;
        const userSlotIdx =
          userGroup === 'GOLEIRO'
            ? 0
            : userGroup === 'DEFESA'
            ? 2
            : userGroup === 'MEIO_CAMPO'
            ? 6
            : 9;

        for (let i = 0; i < 11; i++) {
          const yOff = startY - walkProgress * (startY - targetMidY) + i * 24;
          const clampedY = Math.min(PITCH_GEO.worldH - 120, yOff);
          const spreadX = Math.max(0, (walkProgress - 0.55) / 0.45);

          const hm = homeClub.squad[i];
          const isHomeUser = homeClub.id === career.clubId && i === userSlotIdx;
          const homeAppearance = isHomeUser
            ? career.appearance
            : {
                ...career.appearance,
                skinColor: hm?.skinColor || career.appearance.skinColor,
                hairColor: hm?.hairColor || career.appearance.hairColor,
                hairStyle: hm?.hairStyle || career.appearance.hairStyle,
                beardStyle: 'Nenhuma' as const,
              };

          drawPixelPlayerSprite(
            ctx,
            midX - 24 - i * 26 * spreadX,
            clampedY - spreadX * (i * 18),
            2.1,
            {
              appearance: homeAppearance,
              gear: {
                ...career.gear,
                jerseyNumber: isHomeUser ? career.gear.jerseyNumber : hm?.number ?? i + 1,
              },
              kit: homeClub.kit,
              isGoalkeeper: i === 0,
              isUserControlled: isHomeUser,
              facingAngle: -Math.PI / 2,
              animPhase: walkProgress < 0.96 ? t * 9 + i : 0,
              isSprinting: false,
              isDribbling: false,
              hasBall: false,
              action: walkProgress < 0.96 ? 'walk' : 'idle',
            },
            'match'
          );

          const am = awayClub.squad[i];
          const isAwayUser = awayClub.id === career.clubId && i === userSlotIdx;
          const awayAppearance = isAwayUser
            ? career.appearance
            : {
                ...career.appearance,
                skinColor: am?.skinColor || career.appearance.skinColor,
                hairColor: am?.hairColor || career.appearance.hairColor,
                hairStyle: am?.hairStyle || career.appearance.hairStyle,
                beardStyle: 'Nenhuma' as const,
              };

          drawPixelPlayerSprite(
            ctx,
            midX + 24 + i * 26 * spreadX,
            clampedY - spreadX * (i * 18),
            2.1,
            {
              appearance: awayAppearance,
              gear: {
                ...career.gear,
                jerseyNumber: isAwayUser ? career.gear.jerseyNumber : am?.number ?? i + 1,
              },
              kit: awayClub.kit,
              isGoalkeeper: i === 0,
              isUserControlled: isAwayUser,
              facingAngle: -Math.PI / 2,
              animPhase: walkProgress < 0.96 ? t * 9 + i : 0,
              isSprinting: false,
              isDribbling: false,
              hasBall: false,
              action: walkProgress < 0.96 ? 'walk' : 'idle',
            },
            'match'
          );
        }
      }

      ctx.restore();
      drawWeatherAndLightingOverlay(ctx, w, h, t, env, true, 0.95);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [step, shotIdx, homeClub, awayClub, env, career, isSpecialMatch]);

  const WeatherIcon = env.weather.includes('Chuva')
    ? CloudRain
    : env.timeOfDay === 'Noite'
    ? Moon
    : env.timeOfDay === 'Fim de tarde'
    ? Sunset
    : Sun;

  return (
    <div className="w-full h-[100dvh] bg-[#081018] text-slate-100 flex flex-col overflow-hidden relative">
      {/* Top Broadcast Strip */}
      <header className="relative z-20 px-4 py-2.5 bg-[#0D1624]/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`text-xs font-extrabold tracking-wide uppercase whitespace-nowrap ${
              isSpecialMatch ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isSpecialMatch ? 'Transmissão Especial' : 'Transmissão Oficial'}
          </span>
          <span className="text-xs text-slate-300 truncate">
            {env.competitionName} · {env.roundLabel} · {env.dateStr} às {env.kickoffTime}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('whistle');
            onStartMatch();
          }}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
        >
          Ir para o Jogo
        </button>
      </header>

      {/* STEP 1: CINEMATIC STADIUM, CROWD, MOSAIC & TUNNEL SHOTS */}
      {step === 'STADIUM' && (
        <div className="relative flex-1 flex items-end p-4 sm:p-6 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1080}
            height={600}
            className="absolute inset-0 w-full h-full object-cover pixelated"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081018] via-[#081018]/25 to-transparent" />

          {/* Cinematic Shot Indicator */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0D1624]/88 border border-slate-700/80 rounded-lg px-3 py-1.5">
            <span className="text-[11px] font-bold text-emerald-400 font-mono-num">
              CENA {shotIdx + 1}/{INTRO_SHOTS.length}
            </span>
            <span className="text-xs text-white font-medium">{INTRO_SHOTS[shotIdx].label}</span>
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setShotIdx((prev) => (prev + 1) % INTRO_SHOTS.length);
              }}
              className="ml-1 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              aria-label="Próxima cena"
            >
              <FastForward size={13} />
            </button>
          </div>

          <div
            className={`relative z-10 w-full max-w-5xl mx-auto bg-[#0D1624]/92 border rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${
              isSpecialMatch ? 'border-amber-400/50' : 'border-slate-700/80'
            }`}
          >
            <div className="md:col-span-5 flex items-center justify-between gap-3 bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
              <div className="flex flex-col items-center text-center w-2/5">
                <ClubCrest club={homeClub} size={52} />
                <span className="font-display font-bold text-xs sm:text-sm text-white mt-1.5 truncate w-full">
                  {homeClub.name}
                </span>
                <span className="text-[10px] text-slate-400">Téc. {homeClub.coachName}</span>
              </div>
              <span className="font-display font-extrabold text-lg text-emerald-400">VS</span>
              <div className="flex flex-col items-center text-center w-2/5">
                <ClubCrest club={awayClub} size={52} />
                <span className="font-display font-bold text-xs sm:text-sm text-white mt-1.5 truncate w-full">
                  {awayClub.name}
                </span>
                <span className="text-[10px] text-slate-400">Téc. {awayClub.coachName}</span>
              </div>
            </div>

            <div className="md:col-span-4 space-y-1.5 text-xs">
              <div className="font-display font-bold text-base text-white">
                {env.stadium.name}
              </div>
              <div className="text-slate-300 flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-400 shrink-0" />
                {env.stadium.city}, {env.stadium.state} · Mosaico: {homeClub.mascotName}
              </div>
              <div className="text-slate-300 flex flex-wrap items-center gap-3 pt-1">
                <span className="flex items-center gap-1">
                  <WeatherIcon size={14} className="text-amber-300" />
                  {env.weather} ({env.timeOfDay})
                </span>
                <span className="flex items-center gap-1 font-mono-num">
                  <Thermometer size={14} className="text-sky-300" />
                  {env.temperatureC}°C
                </span>
                <span className="flex items-center gap-1 font-mono-num">
                  <Users size={14} className="text-emerald-300" />
                  {env.stadium.capacity.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setStep('LINEUPS');
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Ver Escalações
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: STARTING XI LINEUPS WITH PIXEL PORTRAITS & COACHES */}
      {step === 'LINEUPS' && (
        <div className="flex-1 overflow-y-auto custom-scroll p-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { club: homeClub, label: 'Mandante' },
                { club: awayClub, label: 'Visitante' },
              ].map(({ club, label }) => {
                const isUserClub = club.id === career.clubId;
                return (
                  <section
                    key={club.id}
                    className="bg-[#111B2B] border border-slate-800 rounded-xl p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <ClubCrest club={club} size={36} />
                        <div>
                          <div className="font-display font-bold text-sm text-white">
                            {club.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {label} · Formação {club.formation}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <PixelPortrait
                          skinColor="#D19A6E"
                          hairColor="#334155"
                          hairStyle="Curto"
                          shirtPrimary={club.kit.primary}
                          shirtSecondary={club.kit.secondary}
                          isCoach
                          size={30}
                        />
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Treinador</div>
                          <div className="text-xs font-semibold text-white">{club.coachName}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {club.squad.map((m, idx) => {
                        const isUserSlot =
                          isUserClub &&
                          ((getPositionMeta(career.position).group === 'GOLEIRO' && idx === 0) ||
                            (getPositionMeta(career.position).group === 'DEFESA' && idx === 2) ||
                            (getPositionMeta(career.position).group === 'MEIO_CAMPO' && idx === 6) ||
                            (getPositionMeta(career.position).group === 'ATAQUE' && idx === 9));

                        const displayName = isUserSlot
                          ? career.personal.nickname || career.personal.firstName
                          : m.name;
                        const displayNum = isUserSlot ? career.gear.jerseyNumber : m.number;
                        const displayOvr = isUserSlot ? career.ovr : m.ovr;
                        const posCode = isUserSlot
                          ? getPositionMeta(career.position).code
                          : getPositionMeta(m.position).code;

                        return (
                          <div
                            key={m.id}
                            className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border ${
                              isUserSlot
                                ? 'bg-emerald-500/15 border-emerald-500/60'
                                : 'bg-slate-900/60 border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <PixelPortrait
                                skinColor={isUserSlot ? career.appearance.skinColor : m.skinColor}
                                hairColor={isUserSlot ? career.appearance.hairColor : m.hairColor}
                                hairStyle={isUserSlot ? career.appearance.hairStyle : m.hairStyle}
                                shirtPrimary={idx === 0 ? club.kit.gkPrimary : club.kit.primary}
                                shirtSecondary={club.kit.secondary}
                                size={28}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  #{displayNum} {displayName}
                                  {idx === 1 ? ' (C)' : ''}
                                </div>
                                <div className="text-[10px] text-slate-400">{posCode}</div>
                              </div>
                            </div>
                            <span className="font-mono-num text-xs font-bold text-emerald-400 pr-1">
                              {displayOvr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('goalRoar');
                  soundEngine.play('flagWave');
                  setStep('ENTRANCE');
                }}
                className="px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm flex items-center gap-2 cursor-pointer"
              >
                Entrada dos Jogadores em Campo
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: CINEMATIC WALKOUT FROM TUNNEL TO MIDFIELD */}
      {step === 'ENTRANCE' && (
        <div className="relative flex-1 flex items-end justify-center p-6 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1080}
            height={600}
            className="absolute inset-0 w-full h-full object-cover pixelated"
          />
          <div className="relative z-10 bg-[#0D1624]/92 border border-emerald-500/50 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
            <div className="text-center sm:text-left">
              <div className="text-xs font-bold text-emerald-400 uppercase">
                Times em Campo · {env.stadium.name}
              </div>
              <div className="font-display font-bold text-lg text-white">
                {homeClub.name} x {awayClub.name}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.play('whistle');
                onStartMatch();
              }}
              className="px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Play size={16} fill="currentColor" />
              Apitar Início da Partida
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

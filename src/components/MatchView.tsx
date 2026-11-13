import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Settings, Trophy } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { generateMatchEnvironment } from '../data/stadiums';
import { MatchEngine, MatchHudSnapshot } from '../engine/matchEngine';
import { PITCH_GEO } from '../engine/pixelRenderer';
import { GameSettings, MatchStatLine, PlayerCareer, WeatherCondition } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PreMatchPresentation } from './PreMatchPresentation';

interface MatchViewProps {
  career: PlayerCareer;
  homeClubId: string;
  awayClubId: string;
  competitionName?: string;
  settings: GameSettings;
  onOpenSettings: () => void;
  onMatchFinished: (result: {
    homeClubId: string;
    awayClubId: string;
    homeScore: number;
    awayScore: number;
    playerStats: MatchStatLine;
    rating: number;
    motm: boolean;
    competition: string;
    stadiumName: string;
    weather: WeatherCondition;
  }) => void;
  onAbandonMatch: () => void;
}

export const MatchView: React.FC<MatchViewProps> = ({
  career,
  homeClubId,
  awayClubId,
  competitionName = 'Liga Nacional',
  settings,
  onOpenSettings,
  onMatchFinished,
  onAbandonMatch,
}) => {
  const [introDone, setIntroDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MatchEngine | null>(null);
  const keysHeld = useRef<Set<string>>(new Set());

  const joyState = useRef<{
    pointerId: number | null;
    originX: number;
    originY: number;
    curX: number;
    curY: number;
    startTime: number;
    moved: boolean;
  }>({
    pointerId: null,
    originX: 0,
    originY: 0,
    curX: 0,
    curY: 0,
    startTime: 0,
    moved: false,
  });

  const shootDragState = useRef<{ pointerId: number | null }>({ pointerId: null });
  const sprintPtrRef = useRef<number | null>(null);
  const dribblePtrRef = useRef<number | null>(null);
  const passPtrRef = useRef<number | null>(null);
  const shootPtrRef = useRef<number | null>(null);

  const [pressedBtns, setPressedBtns] = useState<{
    sprint: boolean;
    dribble: boolean;
    pass: boolean;
    shoot: boolean;
  }>({
    sprint: false,
    dribble: false,
    pass: false,
    shoot: false,
  });

  const [hud, setHud] = useState<MatchHudSnapshot | null>(null);
  const [pauseModal, setPauseModal] = useState(false);
  const [joyVisual, setJoyVisual] = useState<{
    active: boolean;
    ox: number;
    oy: number;
    cx: number;
    cy: number;
  }>({
    active: false,
    ox: 0,
    oy: 0,
    cx: 0,
    cy: 0,
  });

  const homeClub = getClubById(homeClubId);
  const awayClub = getClubById(awayClubId);

  const env = useMemo(() => {
    const matchDay = career.calendar.find((d) => d.roundRef === career.round);
    return generateMatchEnvironment({
      homeClub,
      competitionName: matchDay?.competition || competitionName,
      roundLabel: `Rodada ${career.round}`,
      dateStr: matchDay?.dateLabel || `Rod. ${career.round}`,
      seed: career.season * 31 + career.round * 7,
    });
  }, [homeClub, career.calendar, career.round, career.season, competitionName]);

  const releaseAllTouchControls = () => {
    joyState.current.pointerId = null;
    shootDragState.current.pointerId = null;
    sprintPtrRef.current = null;
    dribblePtrRef.current = null;
    passPtrRef.current = null;
    shootPtrRef.current = null;
    setJoyVisual({ active: false, ox: 0, oy: 0, cx: 0, cy: 0 });
    setPressedBtns({ sprint: false, dribble: false, pass: false, shoot: false });
    if (engineRef.current) {
      engineRef.current.moveInput = { x: 0, y: 0 };
      engineRef.current.sprintHeld = false;
      engineRef.current.markHeld = false;
      if (engineRef.current.isAimingShot) {
        engineRef.current.isAimingShot = false;
      }
    }
  };

  useEffect(() => {
    if (!introDone) return;
    const eng = new MatchEngine(career, homeClub, awayClub, settings, env);
    engineRef.current = eng;
    setHud(eng.getHudSnapshot());
    soundEngine.startMatchAudio();

    return () => {
      soundEngine.startMenuMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.settings = settings;
    }
  }, [settings]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysHeld.current.add(e.code);
      const eng = engineRef.current;
      if (!eng) return;
      if (e.code === 'Escape') {
        setPauseModal((p) => {
          const next = !p;
          eng.paused = next;
          if (next) releaseAllTouchControls();
          return next;
        });
      } else if (e.code === 'Space') {
        e.preventDefault();
        eng.triggerDribbleOrTackle();
      } else if (e.code === 'KeyE') {
        eng.triggerQuickPass();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        eng.sprintHeld = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && engineRef.current) {
        engineRef.current.sprintHeld = false;
      }
    };
    const onBlur = () => {
      keysHeld.current.clear();
      releaseAllTouchControls();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (!introDone) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let last = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      const eng = engineRef.current;
      if (eng) {
        if (joyState.current.pointerId === null) {
          let kx = 0;
          let ky = 0;
          if (keysHeld.current.has('KeyA') || keysHeld.current.has('ArrowLeft')) kx -= 1;
          if (keysHeld.current.has('KeyD') || keysHeld.current.has('ArrowRight')) kx += 1;
          if (keysHeld.current.has('KeyW') || keysHeld.current.has('ArrowUp')) ky -= 1;
          if (keysHeld.current.has('KeyS') || keysHeld.current.has('ArrowDown')) ky += 1;
          eng.moveInput = { x: kx, y: ky };
        }

        eng.step(dt);
        eng.render(ctx, canvas.width, canvas.height);

        hudTimer += dt;
        if (hudTimer >= 0.08) {
          hudTimer = 0;
          setHud(eng.getHudSnapshot());
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [introDone]);

  if (!introDone) {
    return (
      <PreMatchPresentation
        career={career}
        homeClub={homeClub}
        awayClub={awayClub}
        env={env}
        onStartMatch={() => setIntroDone(true)}
      />
    );
  }

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    soundEngine.unlock();
    const eng = engineRef.current;
    const canvas = canvasRef.current;
    if (!eng || !canvas || eng.paused) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported for synthetic events
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = eng.screenToWorld(sx, sy, canvas.width, canvas.height);

    const user = eng.getUserPlayer();
    if (eng.ball.ownerId === user.id && eng.phase === 'PLAYING') {
      const tappedMate = eng.players.find(
        (m) =>
          m.team === user.team &&
          m.id !== user.id &&
          !m.redCard &&
          Math.hypot(world.x - m.x, world.y - m.y) < 55
      );
      if (tappedMate) {
        eng.handleCanvasTap(world.x, world.y);
        return;
      }

      const dir = eng.getAttackDir(user.team);
      const inFinish =
        dir === 1
          ? world.x > PITCH_GEO.pitchX + PITCH_GEO.pitchW * 0.56
          : world.x < PITCH_GEO.pitchX + PITCH_GEO.pitchW * 0.44;
      if (inFinish && sx > canvas.width * 0.45 && shootDragState.current.pointerId === null) {
        shootDragState.current.pointerId = e.pointerId;
        eng.startShotAim(world.x, world.y);
        return;
      }
    }

    if (joyState.current.pointerId === null) {
      joyState.current = {
        pointerId: e.pointerId,
        originX: sx,
        originY: sy,
        curX: sx,
        curY: sy,
        startTime: performance.now(),
        moved: false,
      };
      setJoyVisual({ active: true, ox: sx, oy: sy, cx: sx, cy: sy });
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    const canvas = canvasRef.current;
    if (!eng || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (shootDragState.current.pointerId === e.pointerId) {
      const world = eng.screenToWorld(sx, sy, canvas.width, canvas.height);
      eng.updateShotAim(world.x, world.y);
      return;
    }

    if (joyState.current.pointerId === e.pointerId) {
      const dx = sx - joyState.current.originX;
      const dy = sy - joyState.current.originY;
      const maxR = 46;
      const d = Math.hypot(dx, dy);
      if (d > 8) joyState.current.moved = true;
      const clampedD = Math.min(d, maxR);
      const ang = Math.atan2(dy, dx);
      const cx = joyState.current.originX + Math.cos(ang) * clampedD;
      const cy = joyState.current.originY + Math.sin(ang) * clampedD;
      joyState.current.curX = cx;
      joyState.current.curY = cy;
      eng.moveInput = {
        x: d > 4 ? Math.cos(ang) * (clampedD / maxR) : 0,
        y: d > 4 ? Math.sin(ang) * (clampedD / maxR) : 0,
      };
      setJoyVisual({ active: true, ox: joyState.current.originX, oy: joyState.current.originY, cx, cy });
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eng = engineRef.current;
    const canvas = canvasRef.current;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }
    if (!eng || !canvas) return;

    if (shootDragState.current.pointerId === e.pointerId) {
      shootDragState.current.pointerId = null;
      eng.releaseShotAim();
      return;
    }

    if (joyState.current.pointerId === e.pointerId) {
      const elapsed = performance.now() - joyState.current.startTime;
      const wasQuickTap = !joyState.current.moved && elapsed < 220;
      joyState.current.pointerId = null;
      eng.moveInput = { x: 0, y: 0 };
      setJoyVisual({ active: false, ox: 0, oy: 0, cx: 0, cy: 0 });

      if (wasQuickTap) {
        const rect = canvas.getBoundingClientRect();
        const world = eng.screenToWorld(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
        eng.handleCanvasTap(world.x, world.y);
      }
    }
  };

  const captureBtnPointer = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.unlock();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
  };

  const releaseBtnPointer = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }
  };

  const handleSprintDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    captureBtnPointer(e);
    if (sprintPtrRef.current !== null) return;
    sprintPtrRef.current = e.pointerId;
    setPressedBtns((p) => ({ ...p, sprint: true }));
    if (engineRef.current) engineRef.current.sprintHeld = true;
  };

  const handleSprintUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    releaseBtnPointer(e);
    if (sprintPtrRef.current !== e.pointerId) return;
    sprintPtrRef.current = null;
    setPressedBtns((p) => ({ ...p, sprint: false }));
    if (engineRef.current) engineRef.current.sprintHeld = false;
  };

  const handleDribbleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    captureBtnPointer(e);
    if (dribblePtrRef.current !== null) return;
    dribblePtrRef.current = e.pointerId;
    setPressedBtns((p) => ({ ...p, dribble: true }));
    const eng = engineRef.current;
    if (eng) {
      eng.markHeld = eng.ball.ownerId !== eng.getUserPlayer().id;
      eng.triggerDribbleOrTackle();
    }
  };

  const handleDribbleUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    releaseBtnPointer(e);
    if (dribblePtrRef.current !== e.pointerId) return;
    dribblePtrRef.current = null;
    setPressedBtns((p) => ({ ...p, dribble: false }));
    if (engineRef.current) engineRef.current.markHeld = false;
  };

  const handlePassDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    captureBtnPointer(e);
    if (passPtrRef.current !== null) return;
    passPtrRef.current = e.pointerId;
    setPressedBtns((p) => ({ ...p, pass: true }));
    engineRef.current?.triggerQuickPass();
  };

  const handlePassUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    releaseBtnPointer(e);
    if (passPtrRef.current !== e.pointerId) return;
    passPtrRef.current = null;
    setPressedBtns((p) => ({ ...p, pass: false }));
  };

  const handleShootBtnDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    captureBtnPointer(e);
    if (shootPtrRef.current !== null) return;
    shootPtrRef.current = e.pointerId;
    setPressedBtns((p) => ({ ...p, shoot: true }));
    const eng = engineRef.current;
    if (!eng) return;
    const user = eng.getUserPlayer();
    if (eng.ball.ownerId === user.id) {
      const dir = eng.getAttackDir(user.team);
      const goalX = dir === 1 ? PITCH_GEO.pitchX + PITCH_GEO.pitchW : PITCH_GEO.pitchX;
      const goalY = PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2;
      eng.startShotAim(goalX, goalY);
    } else {
      eng.triggerCallForPass();
    }
  };

  const handleShootBtnMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (shootPtrRef.current !== e.pointerId) return;
    const eng = engineRef.current;
    if (!eng || !eng.isAimingShot) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const user = eng.getUserPlayer();
    const dir = eng.getAttackDir(user.team);
    const goalX = dir === 1 ? PITCH_GEO.pitchX + PITCH_GEO.pitchW : PITCH_GEO.pitchX;
    const goalY =
      PITCH_GEO.pitchY +
      PITCH_GEO.pitchH / 2 +
      Math.max(-1, Math.min(1, dy)) * (PITCH_GEO.goalH * 0.45);
    eng.updateShotAim(goalX, goalY);
  };

  const handleShootBtnUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    releaseBtnPointer(e);
    if (shootPtrRef.current !== e.pointerId) return;
    shootPtrRef.current = null;
    setPressedBtns((p) => ({ ...p, shoot: false }));
    engineRef.current?.releaseShotAim();
  };

  const togglePause = () => {
    soundEngine.play('menu');
    const next = !pauseModal;
    setPauseModal(next);
    if (next) releaseAllTouchControls();
    if (engineRef.current) engineRef.current.paused = next;
  };

  const finishAndSave = () => {
    const eng = engineRef.current;
    if (!eng) return;
    soundEngine.play('menu');
    const userGoals = eng.stats.goals;
    const motm = eng.rating >= 7.6 || userGoals >= 2;
    onMatchFinished({
      homeClubId,
      awayClubId,
      homeScore: eng.homeScore,
      awayScore: eng.awayScore,
      playerStats: { ...eng.stats, matches: 1, minutesPlayed: 90, ratingSum: eng.rating },
      rating: eng.rating,
      motm,
      competition: env.competitionName,
      stadiumName: env.stadium.name,
      weather: env.weather,
    });
  };

  const isLarge = settings.buttonSize === 'large';
  const btnGap = settings.controlPosition === 'compact' ? 'gap-2 bottom-3 right-3' : 'gap-2.5 bottom-4 right-4';
  const hudBg = settings.highContrastHud
    ? 'bg-black/95 border-white/80'
    : 'bg-[#0B121D]/90 border-slate-700/80';

  const bannerStyle = (() => {
    switch (hud?.eventTone) {
      case 'goal':
        return 'bg-emerald-500 text-slate-950 border-2 border-amber-300 shadow-[0_6px_24px_rgba(16,185,129,0.5)]';
      case 'card':
        return 'bg-red-600 text-white border border-amber-300 shadow-lg';
      case 'save':
        return 'bg-amber-400 text-slate-950 border border-white/70 shadow-lg';
      case 'sub':
        return 'bg-sky-500 text-slate-950 border border-sky-200 shadow-lg';
      default:
        return 'bg-slate-900/95 text-white border border-slate-600 shadow-lg';
    }
  })();

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#081018] select-none touch-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        className="w-full h-full block pixelated touch-none"
      />

      {/* Left-thumb virtual analog anchor guide when idle */}
      {hud && hud.phase !== 'HALFTIME' && hud.phase !== 'FULLTIME' && !joyVisual.active && (
        <div className="pointer-events-none fixed bottom-6 left-6 z-10 flex items-center justify-center w-[84px] h-[84px] rounded-full border-2 border-white/20 bg-slate-950/20">
          <div className="w-8 h-8 rounded-full bg-white/25 border border-white/40" />
        </div>
      )}

      {joyVisual.active && (
        <div className="pointer-events-none fixed inset-0 z-10">
          <div
            style={{ left: joyVisual.ox - 42, top: joyVisual.oy - 42 }}
            className="absolute w-[84px] h-[84px] rounded-full border-2 border-emerald-400/65 bg-slate-900/30"
          />
          <div
            style={{ left: joyVisual.cx - 18, top: joyVisual.cy - 18 }}
            className="absolute w-[36px] h-[36px] rounded-full bg-emerald-400/85 border-2 border-white/85"
          />
        </div>
      )}

      {hud && (
        <div className="pointer-events-none absolute top-2.5 inset-x-3 z-20 flex items-start justify-between gap-2">
          <div className={`pointer-events-auto flex items-center gap-2.5 border rounded-lg px-2.5 py-1.5 shadow-lg ${hudBg}`}>
            <span
              className="w-1.5 h-5 rounded-sm shrink-0"
              style={{ backgroundColor: homeClub.kit.primary }}
            />
            <div className="flex items-center gap-1.5">
              <ClubCrest club={homeClub} size={22} />
              <span className="font-display font-bold text-xs text-white whitespace-nowrap">{homeClub.shortName}</span>
            </div>
            <div className="font-mono-num text-base font-extrabold text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 whitespace-nowrap">
              {hud.homeScore} - {hud.awayScore}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs text-white whitespace-nowrap">{awayClub.shortName}</span>
              <ClubCrest club={awayClub} size={22} />
            </div>
            <span
              className="w-1.5 h-5 rounded-sm shrink-0"
              style={{ backgroundColor: awayClub.kit.primary }}
            />
            <div className="border-l border-slate-700 pl-2 font-mono-num text-xs font-bold text-emerald-400 whitespace-nowrap">
              {hud.matchMinute}&apos;
              {hud.addedTime > 0 ? `+${hud.addedTime}` : ''}
            </div>
            <div className="hidden sm:block border-l border-slate-700 pl-2 text-[11px] text-slate-300 font-mono-num whitespace-nowrap">
              POSSE {hud.possessionHomePct}%
            </div>
            <div className="hidden lg:block border-l border-slate-700 pl-2 text-[11px] text-slate-300 font-mono-num whitespace-nowrap">
              {env.weather} · {env.temperatureC}°C
            </div>
          </div>

          {hud.eventBanner && (
            <div className={`px-4 py-1.5 rounded-lg font-display font-extrabold text-xs sm:text-sm tracking-wide whitespace-nowrap ${bannerStyle}`}>
              {hud.eventBanner}
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-2">
            <div className={`border rounded-lg px-2.5 py-1.5 flex items-center gap-2 ${hudBg}`}>
              <div className="text-right">
                <div className="text-[11px] font-bold text-white leading-none whitespace-nowrap">
                  #{career.gear.jerseyNumber} {career.personal.nickname}
                </div>
                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all ${
                      hud.userStamina > 30 ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${hud.userStamina}%` }}
                  />
                </div>
              </div>
              <span className="font-mono-num text-xs font-bold text-amber-300">
                {hud.rating.toFixed(1)}
              </span>
            </div>

            <button
              type="button"
              onClick={togglePause}
              className={`p-2.5 rounded-lg border text-white hover:border-emerald-400 cursor-pointer ${hudBg}`}
              aria-label="Pausar partida"
            >
              <Pause size={16} />
            </button>
          </div>
        </div>
      )}

      {hud?.isAimingShot && (
        <div className="pointer-events-none absolute bottom-32 right-6 z-20 bg-[#0B121D]/90 border border-amber-400/70 rounded-lg p-2 w-32">
          <div className="text-[10px] font-bold text-amber-300 flex justify-between mb-1">
            <span>FORÇA DO CHUTE</span>
            <span className="font-mono-num">{hud.shotPower}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500"
              style={{ width: `${hud.shotPower}%` }}
            />
          </div>
        </div>
      )}

      {hud && hud.phase !== 'HALFTIME' && hud.phase !== 'FULLTIME' && (
        <div className={`pointer-events-none absolute z-20 flex items-end ${btnGap}`}>
          {settings.showMatchHints && (
            <div className="hidden lg:block text-[11px] text-slate-300/85 bg-slate-950/65 px-2.5 py-1 rounded mr-2 whitespace-nowrap">
              {hud.userHasBall
                ? 'PASSAR / toque no colega · Segure CHUTAR e mire'
                : 'Arraste p/ mover · DESARMAR ou PEDIR PASSE'}
            </div>
          )}

          {/* Sprint button (independent multitouch capture) */}
          <button
            type="button"
            onPointerDown={handleSprintDown}
            onPointerUp={handleSprintUp}
            onPointerCancel={handleSprintUp}
            className={`pointer-events-auto touch-none rounded-full border-2 font-display font-bold text-[10px] flex items-center justify-center shadow-lg cursor-pointer transition-transform ${
              pressedBtns.sprint
                ? 'bg-sky-400 text-slate-950 border-white scale-95'
                : 'bg-slate-900/85 border-sky-400/80 text-sky-200'
            } ${isLarge ? 'w-16 h-16' : 'w-14 h-14'}`}
          >
            CORRER
          </button>

          {/* Dribble / Tackle / GK Dive button */}
          <button
            type="button"
            onPointerDown={handleDribbleDown}
            onPointerUp={handleDribbleUp}
            onPointerCancel={handleDribbleUp}
            className={`pointer-events-auto touch-none rounded-full border-2 font-display font-bold text-[10px] flex items-center justify-center shadow-lg cursor-pointer transition-transform ${
              pressedBtns.dribble
                ? 'bg-amber-400 text-slate-950 border-white scale-95'
                : 'bg-slate-900/85 border-amber-400/85 text-amber-200'
            } ${isLarge ? 'w-[68px] h-[68px]' : 'w-[60px] h-[60px]'}`}
          >
            {hud.userIsGk && !hud.userHasBall
              ? 'DEFENDER'
              : hud.userHasBall
              ? 'DRIBLE'
              : 'DESARMAR'}
          </button>

          {/* Dedicated PASSAR / PEDIR PASSE button for full multitouch play */}
          <button
            type="button"
            onPointerDown={handlePassDown}
            onPointerUp={handlePassUp}
            onPointerCancel={handlePassUp}
            className={`pointer-events-auto touch-none rounded-full border-2 font-display font-bold text-[10px] text-center leading-tight flex items-center justify-center shadow-lg cursor-pointer px-1 transition-transform ${
              pressedBtns.pass
                ? 'bg-teal-400 text-slate-950 border-white scale-95'
                : 'bg-slate-900/85 border-teal-400/85 text-teal-200'
            } ${isLarge ? 'w-[68px] h-[68px]' : 'w-[60px] h-[60px]'}`}
          >
            {hud.userHasBall ? 'PASSAR' : 'PEDIR'}
          </button>

          {/* Primary Shoot / Clear / Call button */}
          <button
            type="button"
            onPointerDown={handleShootBtnDown}
            onPointerMove={handleShootBtnMove}
            onPointerUp={handleShootBtnUp}
            onPointerCancel={handleShootBtnUp}
            className={`pointer-events-auto touch-none rounded-full border-2 font-display font-extrabold text-xs text-center leading-tight flex items-center justify-center shadow-xl cursor-pointer px-1 transition-transform ${
              hud.userHasBall
                ? pressedBtns.shoot
                  ? 'bg-emerald-300 text-slate-950 border-white scale-95'
                  : 'bg-emerald-500 text-slate-950 border-white'
                : pressedBtns.shoot
                ? 'bg-emerald-500 text-slate-950 border-white scale-95'
                : 'bg-slate-900/85 border-emerald-400/85 text-emerald-300'
            } ${isLarge ? 'w-20 h-20' : 'w-16 h-16'}`}
          >
            {hud.userHasBall ? (hud.userIsGk ? 'REPOR' : 'CHUTAR') : 'PEDIR PASSE'}
          </button>
        </div>
      )}

      {/* Halftime Broadcast Stats Modal */}
      {hud?.phase === 'HALFTIME' && (
        <div className="absolute inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4">
          <div className="bg-[#111B2B] border border-slate-700 rounded-2xl p-5 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-400">Intervalo</span>
              <span className="text-xs text-slate-400">{env.stadium.name}</span>
            </div>
            <div className="font-display text-3xl font-extrabold text-white font-mono-num text-center bg-slate-900/80 py-2.5 rounded-xl border border-slate-800">
              {homeClub.shortName} {hud.homeScore} x {hud.awayScore} {awayClub.shortName}
            </div>

            <div className="space-y-2 text-xs">
              <StatCompare label="Posse de Bola" left={`${hud.possessionHomePct}%`} right={`${100 - hud.possessionHomePct}%`} />
              <StatCompare label="Finalizações" left={hud.teamShotsHome} right={hud.teamShotsAway} />
              <StatCompare label="Passes Trocados" left={hud.teamPassesHome} right={hud.teamPassesAway} />
            </div>

            <div className="p-3 rounded-lg bg-slate-900/75 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Seu desempenho: <strong className="text-white">{hud.stats.goals}G · {hud.stats.assists}A · {hud.stats.passesCompleted} passes</strong>
              </span>
              <span className="font-mono-num font-bold text-amber-300">Nota {hud.rating.toFixed(1)}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                engineRef.current?.resumeSecondHalf();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              Iniciar 2º Tempo
            </button>
          </div>
        </div>
      )}

      {/* Fulltime Post-Match Evaluation Modal */}
      {hud?.phase === 'FULLTIME' && (
        <div className="absolute inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4">
          <div className="bg-[#111B2B] border border-emerald-500/50 rounded-2xl p-5 max-w-xl w-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <Trophy size={15} />
                Fim de Partida · {env.competitionName}
              </span>
              <span className="font-mono-num text-base font-extrabold text-amber-300">
                Nota Final: {hud.rating.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-5 py-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <ClubCrest club={homeClub} size={36} />
                <span className="font-display font-bold text-base text-white">{homeClub.shortName}</span>
              </div>
              <div className="font-mono-num text-3xl font-extrabold text-white">
                {hud.homeScore} - {hud.awayScore}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-white">{awayClub.shortName}</span>
                <ClubCrest club={awayClub} size={36} />
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <StatMini label="Gols" val={hud.stats.goals} />
              <StatMini label="Assist." val={hud.stats.assists} />
              <StatMini label="Chutes" val={`${hud.stats.shotsOnTarget}/${hud.stats.shots}`} />
              <StatMini label="Passes" val={`${hud.stats.passesCompleted}/${hud.stats.passesCompleted + hud.stats.passesMissed}`} />
              <StatMini label="Dribles" val={hud.stats.dribblesCompleted} />
              <StatMini label="Desarmes" val={hud.stats.tackles + hud.stats.interceptions} />
            </div>

            <button
              type="button"
              onClick={finishAndSave}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
            >
              Salvar Estatísticas e Voltar à Carreira
            </button>
          </div>
        </div>
      )}

      {pauseModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-[#111B2B] border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-3">
            <h2 className="font-display text-xl font-bold text-white text-center">
              Partida Pausada
            </h2>
            <button
              type="button"
              onClick={togglePause}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm cursor-pointer"
            >
              Continuar Partida
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onOpenSettings();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings size={15} />
              Configurações e Controles
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onAbandonMatch();
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 font-semibold text-sm cursor-pointer"
            >
              Sair da Partida
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function StatMini({ label, val }: { label: string; val: string | number }) {
  return (
    <div className="p-2 rounded-lg bg-slate-900/75 border border-slate-800">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="font-mono-num text-sm font-bold text-white mt-0.5">{val}</div>
    </div>
  );
}

function StatCompare({ label, left, right }: { label: string; left: string | number; right: string | number }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
      <span className="font-mono-num font-bold text-emerald-400">{left}</span>
      <span className="text-slate-300">{label}</span>
      <span className="font-mono-num font-bold text-sky-400">{right}</span>
    </div>
  );
}

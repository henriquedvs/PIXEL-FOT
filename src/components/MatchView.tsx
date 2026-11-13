import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pause, Play, RefreshCw, Settings, Shield, Trophy, ZoomIn } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import { generateMatchEnvironment } from '../data/stadiums';
import {
  CameraZoomPreset,
  MatchEngine,
  MatchHudSnapshot,
  TeamTacticId,
} from '../engine/matchEngine';
import { PITCH_GEO } from '../engine/pixelRenderer';
import { ClubKit, GameSettings, MatchStatLine, PlayerCareer, WeatherCondition } from '../types/game';
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
  const callPtrRef = useRef<number | null>(null);
  const shootPtrRef = useRef<number | null>(null);

  const [pressedBtns, setPressedBtns] = useState<{
    sprint: boolean;
    dribble: boolean;
    pass: boolean;
    call: boolean;
    shoot: boolean;
  }>({
    sprint: false,
    dribble: false,
    pass: false,
    call: false,
    shoot: false,
  });

  const [hud, setHud] = useState<MatchHudSnapshot | null>(null);
  const [pauseModal, setPauseModal] = useState(false);
  const [showRadar, setShowRadar] = useState(true);
  const [kitOverrides, setKitOverrides] = useState<{
    homeKitOverride: ClubKit;
    awayKitOverride: ClubKit;
  } | null>(null);
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
    callPtrRef.current = null;
    shootPtrRef.current = null;
    setJoyVisual({ active: false, ox: 0, oy: 0, cx: 0, cy: 0 });
    setPressedBtns({ sprint: false, dribble: false, pass: false, call: false, shoot: false });
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
    const eng = new MatchEngine(
      career,
      homeClub,
      awayClub,
      settings,
      env,
      kitOverrides || undefined
    );
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
      } else if (e.code === 'KeyQ') {
        eng.triggerCallForPass();
      } else if (e.code === 'KeyF' && !e.repeat) {
        const user = eng.getUserPlayer();
        const dir = eng.getAttackDir(user.team);
        const goalX = dir === 1 ? PITCH_GEO.pitchX + PITCH_GEO.pitchW : PITCH_GEO.pitchX;
        eng.startShotAim(goalX, PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2);
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        eng.sprintHeld = true;
      } else if (e.code === 'Digit1') {
        eng.setTeamTactic('DEFENSIVO');
      } else if (e.code === 'Digit2') {
        eng.setTeamTactic('EQUILIBRADO');
      } else if (e.code === 'Digit3') {
        eng.setTeamTactic('OFENSIVO');
      } else if (e.code === 'Digit4') {
        eng.setTeamTactic('PRESSAO_ALTA');
      } else if (e.code === 'KeyZ') {
        eng.cycleZoomPreset();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && engineRef.current) {
        engineRef.current.sprintHeld = false;
      } else if (e.code === 'KeyF' && engineRef.current) {
        engineRef.current.releaseShotAim();
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
        onStartMatch={(kits) => {
          if (kits) setKitOverrides(kits);
          setIntroDone(true);
        }}
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

    if (joyState.current.pointerId === null && sx <= canvas.width * 0.56) {
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
      const deadzone = 6;
      const d = Math.hypot(dx, dy);
      if (d > 8) joyState.current.moved = true;
      const clampedD = Math.min(d, maxR);
      const ang = Math.atan2(dy, dx);
      const cx = joyState.current.originX + Math.cos(ang) * clampedD;
      const cy = joyState.current.originY + Math.sin(ang) * clampedD;
      joyState.current.curX = cx;
      joyState.current.curY = cy;
      const normalized = d > deadzone ? (clampedD - deadzone) / (maxR - deadzone) : 0;
      eng.moveInput = {
        x: Math.cos(ang) * normalized,
        y: Math.sin(ang) * normalized,
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

  const handleCallDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    captureBtnPointer(e);
    if (callPtrRef.current !== null) return;
    callPtrRef.current = e.pointerId;
    setPressedBtns((p) => ({ ...p, call: true }));
    engineRef.current?.triggerCallForPass();
  };

  const handleCallUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    releaseBtnPointer(e);
    if (callPtrRef.current !== e.pointerId) return;
    callPtrRef.current = null;
    setPressedBtns((p) => ({ ...p, call: false }));
  };

  const handleShootBtnDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    captureBtnPointer(e);
    if (shootPtrRef.current !== null) return;
    shootPtrRef.current = e.pointerId;
    setPressedBtns((p) => ({ ...p, shoot: true }));
    const eng = engineRef.current;
    if (!eng) return;
    const user = eng.getUserPlayer();
    const dir = eng.getAttackDir(user.team);
    const goalX = dir === 1 ? PITCH_GEO.pitchX + PITCH_GEO.pitchW : PITCH_GEO.pitchX;
    const goalY = PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2;
    eng.startShotAim(goalX, goalY);
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
        onLostPointerCapture={handleCanvasPointerUp}
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
          <div className="pointer-events-auto flex flex-col gap-1">
            <div className={`flex items-center gap-2.5 border rounded-lg px-2.5 py-1.5 shadow-lg ${hudBg}`}>
              <span
                className="w-1.5 h-5 rounded-sm shrink-0"
                style={{ backgroundColor: engineRef.current?.activeHomeKit.primary || homeClub.kit.primary }}
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
                style={{ backgroundColor: engineRef.current?.activeAwayKit.primary || awayClub.kit.primary }}
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

            {/* Live Match Momentum Bar */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ritmo</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-900/90 border border-slate-700/80 flex">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(8, Math.min(92, 50 + hud.momentum * 0.5))}%`,
                    backgroundColor: engineRef.current?.activeHomeKit.primary || homeClub.kit.primary,
                  }}
                />
                <div
                  className="h-full flex-1 transition-all duration-300"
                  style={{
                    backgroundColor: engineRef.current?.activeAwayKit.primary || awayClub.kit.primary,
                  }}
                />
              </div>
              {hud.advantageActive && (
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-display font-extrabold text-[9px] tracking-wide uppercase">
                  Vantagem
                </span>
              )}
            </div>
          </div>

          {hud.eventBanner && (
            <div className={`px-4 py-1.5 rounded-lg font-display font-extrabold text-xs sm:text-sm tracking-wide whitespace-nowrap ${bannerStyle}`}>
              {hud.eventBanner}
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-1.5">
            {/* Live Team Tactic Quick Toggle */}
            <button
              type="button"
              onClick={() => {
                const eng = engineRef.current;
                if (!eng) return;
                const order: TeamTacticId[] = ['DEFENSIVO', 'EQUILIBRADO', 'OFENSIVO', 'PRESSAO_ALTA'];
                const next = order[(order.indexOf(eng.userTactic) + 1) % order.length];
                eng.setTeamTactic(next);
                setHud(eng.getHudSnapshot());
              }}
              className={`px-2.5 py-2 rounded-lg border text-[10px] font-bold text-slate-200 hover:border-emerald-400 cursor-pointer hidden md:flex items-center gap-1 whitespace-nowrap ${hudBg}`}
              title="Alterar Tática da Equipe (Teclas 1-4)"
            >
              <Shield size={13} className="text-emerald-400" />
              {hud.tactic === 'DEFENSIVO'
                ? 'DEF'
                : hud.tactic === 'OFENSIVO'
                ? 'OFN'
                : hud.tactic === 'PRESSAO_ALTA'
                ? 'PRS'
                : 'EQL'}
            </button>

            {/* Camera Zoom Cycle */}
            <button
              type="button"
              onClick={() => {
                const eng = engineRef.current;
                if (!eng) return;
                eng.cycleZoomPreset();
                setHud(eng.getHudSnapshot());
              }}
              className={`p-2 rounded-lg border text-slate-200 hover:border-emerald-400 cursor-pointer hidden sm:flex items-center gap-1 text-[10px] font-bold ${hudBg}`}
              title="Zoom da Câmera (Tecla Z)"
            >
              <ZoomIn size={13} className="text-sky-400" />
              <span className="hidden lg:inline">
                {hud.zoomPreset === 'close' ? 'Próxima' : hud.zoomPreset === 'wide' ? 'Ampla' : 'Padrão'}
              </span>
            </button>

            {/* Minimap Radar Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setShowRadar((r) => !r);
              }}
              className={`p-2 rounded-lg border cursor-pointer hidden sm:flex items-center gap-1 text-[10px] font-bold ${
                showRadar ? 'text-emerald-300' : 'text-slate-400'
              } ${hudBg}`}
              title="Mostrar/Ocultar Radar Tático"
            >
              <Eye size={13} />
            </button>

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

      {/* Live Tactical Radar / Minimap */}
      {showRadar &&
        hud &&
        (hud.phase === 'PLAYING' || hud.phase === 'KICKOFF' || hud.phase === 'SET_PIECE') && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-15 hidden sm:block">
            <svg
              viewBox="0 0 140 82"
              className="w-[146px] h-[86px] rounded-lg border border-slate-600/80 bg-[#0A2F1C]/85 shadow-lg"
            >
              <rect x="4" y="4" width="132" height="74" fill="none" stroke="rgba(248,250,252,0.45)" strokeWidth="1" />
              <line x1="70" y1="4" x2="70" y2="78" stroke="rgba(248,250,252,0.35)" strokeWidth="1" />
              <circle cx="70" cy="41" r="10" fill="none" stroke="rgba(248,250,252,0.35)" strokeWidth="1" />
              <rect x="4" y="21" width="16" height="40" fill="none" stroke="rgba(248,250,252,0.35)" strokeWidth="1" />
              <rect x="120" y="21" width="16" height="40" fill="none" stroke="rgba(248,250,252,0.35)" strokeWidth="1" />
              {hud.radar.players.map((rp, idx) => (
                <circle
                  key={idx}
                  cx={4 + rp.nx * 132}
                  cy={4 + rp.ny * 74}
                  r={rp.isUser ? 3.2 : 2.1}
                  fill={
                    rp.isUser
                      ? '#34D399'
                      : rp.team === 'home'
                      ? engineRef.current?.activeHomeKit.primary || homeClub.kit.primary
                      : engineRef.current?.activeAwayKit.primary || awayClub.kit.primary
                  }
                  stroke={rp.isUser ? '#FFFFFF' : rp.isGk ? '#FACC15' : '#0F172A'}
                  strokeWidth={rp.isUser ? '1.1' : '0.6'}
                />
              ))}
              <circle
                cx={4 + hud.radar.ballX * 132}
                cy={4 + hud.radar.ballY * 74}
                r="2.4"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="0.8"
              />
            </svg>
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

      {hud?.phase === 'GOAL_CELEBRATION' && (
        <div className="absolute bottom-6 right-6 z-25 flex items-center gap-2">
          {hud.hasReplayAvailable && (
            <button
              type="button"
              onClick={() => engineRef.current?.startGoalReplayNow()}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-xs shadow-lg cursor-pointer"
            >
              Ver Replay
            </button>
          )}
          <button
            type="button"
            onClick={() => engineRef.current?.skipCelebration()}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/70 text-amber-200 font-display font-bold text-xs shadow-lg cursor-pointer"
          >
            Pular Comemoração ›
          </button>
        </div>
      )}

      {hud?.phase === 'GOAL_REPLAY' && (
        <button
          type="button"
          onClick={() => engineRef.current?.skipCelebration()}
          className="absolute bottom-6 right-6 z-25 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/70 text-amber-200 font-display font-bold text-xs shadow-lg cursor-pointer"
        >
          Pular Replay ›
        </button>
      )}

      {/* Interactive Knockout Penalty Shootout HUD */}
      {hud?.phase === 'PENALTY_SHOOTOUT' && hud.penaltyShootout && (
        <div className="absolute inset-x-0 bottom-5 z-30 flex flex-col items-center gap-3 px-4">
          <div className="bg-[#0B121D]/95 border border-amber-400/60 rounded-2xl p-4 max-w-md w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 uppercase">Disputa de Pênaltis</span>
              <span className="font-mono-num font-bold text-white">
                {homeClub.shortName} {hud.penaltyShootout.homeScore} x {hud.penaltyShootout.awayScore}{' '}
                {awayClub.shortName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] bg-slate-900/80 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-300">{homeClub.shortName}</span>
                {Array.from({ length: Math.max(5, hud.penaltyShootout.homeKicks.length) }).map((_, i) => {
                  const res = hud.penaltyShootout?.homeKicks[i];
                  return (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full border ${
                        res === 'G'
                          ? 'bg-emerald-400 border-emerald-200'
                          : res === 'M'
                          ? 'bg-red-500 border-red-300'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.max(5, hud.penaltyShootout.awayKicks.length) }).map((_, i) => {
                  const res = hud.penaltyShootout?.awayKicks[i];
                  return (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full border ${
                        res === 'G'
                          ? 'bg-emerald-400 border-emerald-200'
                          : res === 'M'
                          ? 'bg-red-500 border-red-300'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    />
                  );
                })}
                <span className="font-bold text-slate-300">{awayClub.shortName}</span>
              </div>
            </div>

            {hud.penaltyShootout.step === 'WAIT_USER' ? (
              <div className="space-y-2">
                <div className="text-center text-xs font-semibold text-white">
                  {hud.penaltyShootout.userRole === 'KICKER'
                    ? `Cobrança de ${hud.penaltyShootout.kickerName} — Escolha o canto:`
                    : 'Defenda o pênalti — Escolha onde o goleiro vai pular:'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { dir: 'left', label: 'Esquerda' },
                      { dir: 'center', label: 'Centro' },
                      { dir: 'right', label: 'Direita' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.dir}
                      type="button"
                      onClick={() => engineRef.current?.submitPenaltyChoice(opt.dir)}
                      className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-300 py-1">Cobrança em andamento...</div>
            )}
          </div>
        </div>
      )}

      {hud &&
        hud.phase !== 'HALFTIME' &&
        hud.phase !== 'FULLTIME' &&
        hud.phase !== 'GOAL_CELEBRATION' &&
        hud.phase !== 'GOAL_REPLAY' &&
        hud.phase !== 'PENALTY_SHOOTOUT' && (
        <div className={`pointer-events-none absolute z-20 flex flex-col items-end ${btnGap}`}>
          {settings.showMatchHints && (
            <div className="hidden lg:block text-[11px] text-slate-300/85 bg-slate-950/65 px-2.5 py-1 rounded whitespace-nowrap">
              {hud.userTeamHasSetPiece
                ? 'Bola parada: mire com o analógico e toque PASSAR ou CHUTAR'
                : hud.userHasBall
                ? 'PASSAR / toque no colega · Segure CHUTAR (≥78% = Chute Forte)'
                : 'Arraste à esquerda p/ mover · PEDIR BOLA · DESARMAR'}
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Sprint button (independent multitouch capture) */}
            <button
              type="button"
              onPointerDown={handleSprintDown}
              onPointerUp={handleSprintUp}
              onPointerCancel={handleSprintUp}
              onLostPointerCapture={handleSprintUp}
              className={`pointer-events-auto touch-none rounded-full border-2 font-display font-bold text-[10px] flex items-center justify-center shadow-lg cursor-pointer transition-transform ${
                pressedBtns.sprint
                  ? 'bg-sky-400 text-slate-950 border-white scale-95'
                  : 'bg-slate-900/85 border-sky-400/80 text-sky-200'
              } ${isLarge ? 'w-16 h-16' : 'w-[54px] h-[54px]'}`}
            >
              CORRER
            </button>

            {/* Dribble / Tackle / GK Dive button */}
            <button
              type="button"
              onPointerDown={handleDribbleDown}
              onPointerUp={handleDribbleUp}
              onPointerCancel={handleDribbleUp}
              onLostPointerCapture={handleDribbleUp}
              className={`pointer-events-auto touch-none rounded-full border-2 font-display font-bold text-[10px] flex items-center justify-center shadow-lg cursor-pointer transition-transform ${
                pressedBtns.dribble
                  ? 'bg-amber-400 text-slate-950 border-white scale-95'
                  : 'bg-slate-900/85 border-amber-400/85 text-amber-200'
              } ${isLarge ? 'w-[66px] h-[66px]' : 'w-[58px] h-[58px]'}`}
            >
              {hud.userIsGk && !hud.userHasBall
                ? 'DEFENDER'
                : hud.userHasBall
                ? 'DRIBLE'
                : 'DESARMAR'}
            </button>

            {/* Dedicated PASSAR button (only passes / queues one-touch pass) */}
            <button
              type="button"
              onPointerDown={handlePassDown}
              onPointerUp={handlePassUp}
              onPointerCancel={handlePassUp}
              onLostPointerCapture={handlePassUp}
              className={`pointer-events-auto touch-none rounded-full border-2 font-display font-bold text-[10px] text-center leading-tight flex items-center justify-center shadow-lg cursor-pointer px-1 transition-transform ${
                pressedBtns.pass
                  ? 'bg-teal-400 text-slate-950 border-white scale-95'
                  : hud.userHasBall
                  ? 'bg-teal-500/25 border-teal-300 text-teal-100'
                  : 'bg-slate-900/80 border-teal-500/50 text-teal-300/80'
              } ${isLarge ? 'w-[66px] h-[66px]' : 'w-[58px] h-[58px]'}`}
            >
              PASSAR
            </button>

            {/* Single dedicated PEDIR BOLA button */}
            <button
              type="button"
              onPointerDown={handleCallDown}
              onPointerUp={handleCallUp}
              onPointerCancel={handleCallUp}
              onLostPointerCapture={handleCallUp}
              className={`pointer-events-auto touch-none rounded-full border-2 font-display font-bold text-[10px] text-center leading-tight flex items-center justify-center shadow-lg cursor-pointer px-1 transition-transform ${
                pressedBtns.call
                  ? 'bg-indigo-400 text-slate-950 border-white scale-95'
                  : hud.userHasBall
                  ? 'bg-slate-900/60 border-slate-600/60 text-slate-400'
                  : 'bg-indigo-500/25 border-indigo-300 text-indigo-100'
              } ${isLarge ? 'w-[66px] h-[66px]' : 'w-[58px] h-[58px]'}`}
            >
              PEDIR BOLA
            </button>

            {/* Dedicated CHUTAR / REPOR button (always shoots / queues first-time strike) */}
            <button
              type="button"
              onPointerDown={handleShootBtnDown}
              onPointerMove={handleShootBtnMove}
              onPointerUp={handleShootBtnUp}
              onPointerCancel={handleShootBtnUp}
              onLostPointerCapture={handleShootBtnUp}
              className={`pointer-events-auto touch-none rounded-full border-2 font-display font-extrabold text-xs text-center leading-tight flex items-center justify-center shadow-xl cursor-pointer px-1 transition-transform ${
                pressedBtns.shoot
                  ? 'bg-emerald-300 text-slate-950 border-white scale-95'
                  : hud.userHasBall
                  ? 'bg-emerald-500 text-slate-950 border-white'
                  : 'bg-slate-900/85 border-emerald-400/85 text-emerald-200'
              } ${isLarge ? 'w-20 h-20' : 'w-16 h-16'}`}
            >
              {hud.userIsGk ? 'REPOR' : 'CHUTAR'}
            </button>
          </div>
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
              <div className="font-mono-num text-3xl font-extrabold text-white text-center">
                {hud.homeScore} - {hud.awayScore}
                {(hud.penHomeScore > 0 || hud.penAwayScore > 0) && (
                  <div className="text-xs text-amber-300 font-bold mt-0.5">
                    Pênaltis: {hud.penHomeScore} - {hud.penAwayScore}
                  </div>
                )}
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

      {pauseModal && hud && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-[#111B2B] border border-slate-700 rounded-2xl p-4 sm:p-5 max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 space-y-3">
              <h2 className="font-display text-xl font-bold text-white">Partida Pausada</h2>

              {/* Live Team Tactics Selector */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400">Tática da Equipe</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'DEFENSIVO', label: 'Defensivo' },
                      { id: 'EQUILIBRADO', label: 'Equilibrado' },
                      { id: 'OFENSIVO', label: 'Ofensivo' },
                      { id: 'PRESSAO_ALTA', label: 'Pressão Alta' },
                    ] as { id: TeamTacticId; label: string }[]
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const eng = engineRef.current;
                        if (!eng) return;
                        eng.setTeamTactic(t.id);
                        setHud(eng.getHudSnapshot());
                      }}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                        hud.tactic === t.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Zoom Preset */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400">Zoom da Câmera</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'close', label: 'Próxima' },
                      { id: 'normal', label: 'Padrão' },
                      { id: 'wide', label: 'Ampla' },
                    ] as { id: CameraZoomPreset; label: string }[]
                  ).map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        const eng = engineRef.current;
                        if (!eng) return;
                        eng.setZoomPreset(z.id);
                        setHud(eng.getHudSnapshot());
                      }}
                      className={`py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                        hud.zoomPreset === z.id
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tactical Bench Substitution */}
              <button
                type="button"
                disabled={hud.benchCountUser === 0 || hud.subsUsedUser >= 5}
                onClick={() => {
                  const eng = engineRef.current;
                  if (!eng) return;
                  eng.performSubstitution(eng.userTeam);
                  setHud(eng.getHudSnapshot());
                }}
                className="w-full py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 border border-sky-400/50 text-sky-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                Substituir Cansado ({5 - hud.subsUsedUser} rest.)
              </button>

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

            {/* Live Match Telemetry & Starting XI Stamina/Ratings */}
            <div className="md:col-span-7 space-y-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div className="text-xs font-bold text-slate-300">Estatísticas ao Vivo</div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <StatCompare label="Posse" left={`${hud.possessionHomePct}%`} right={`${100 - hud.possessionHomePct}%`} />
                <StatCompare label="Chutes" left={hud.teamShotsHome} right={hud.teamShotsAway} />
                <StatCompare label="Passes" left={hud.teamPassesHome} right={hud.teamPassesAway} />
                <StatCompare label="Escanteios" left={hud.teamCornersHome} right={hud.teamCornersAway} />
                <StatCompare label="Impedim." left={hud.teamOffsidesHome} right={hud.teamOffsidesAway} />
                <StatCompare label="Faltas" left={hud.teamFoulsHome} right={hud.teamFoulsAway} />
              </div>

              <div className="text-xs font-bold text-slate-300">Notas & Energia (11 em Campo)</div>
              <div className="max-h-52 overflow-y-auto custom-scroll space-y-1 pr-1">
                {hud.userLineupRatings.map((pl) => (
                  <div
                    key={pl.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] ${
                      pl.isUser
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-900/70 border-slate-800 text-slate-200'
                    }`}
                  >
                    <span className="truncate font-medium">
                      #{pl.number} {pl.name} · {getPositionMeta(pl.position).code}
                    </span>
                    <div className="flex items-center gap-2.5 shrink-0 font-mono-num">
                      <span className={pl.stamina < 35 ? 'text-amber-400' : 'text-emerald-400'}>
                        {pl.stamina}%
                      </span>
                      <span className="font-bold text-amber-300">{pl.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

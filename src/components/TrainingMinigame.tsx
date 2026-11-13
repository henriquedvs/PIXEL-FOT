import React, { useEffect, useRef, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { drawPixelBall, drawPixelPlayerSprite } from '../engine/pixelRenderer';
import { PlayerCareer, TrainingDrill } from '../types/game';

interface TrainingMinigameProps {
  drill: TrainingDrill;
  career: PlayerCareer;
  onComplete: (medal: 'Ouro' | 'Prata' | 'Bronze', score: number) => void;
  onCancel: () => void;
}

export const TrainingMinigame: React.FC<TrainingMinigameProps> = ({
  drill,
  career,
  onComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(18);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const scoreRef = useRef(0);
  const stateRef = useRef({
    px: 140,
    py: 190,
    tx: 140,
    ty: 190,
    targetX: 460,
    targetY: 160,
    gkY: 160,
    gkDir: 1,
    ballX: 180,
    ballY: 190,
    ballVx: 0,
    ballVy: 0,
    ballActive: false,
    cones: [
      { x: 240, y: 110, hit: false },
      { x: 340, y: 240, hit: false },
      { x: 440, y: 110, hit: false },
      { x: 520, y: 210, hit: false },
    ],
    gateIdx: 0,
    phase: 0,
  });

  const club = getClubById(career.clubId);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(timer);
          setFinished(true);
          soundEngine.play('whistleLong');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const st = stateRef.current;
      st.phase += dt * 7;

      const W = canvas.width;
      const H = canvas.height;
      ctx.imageSmoothingEnabled = false;

      // Pixel training pitch
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1B6E3A' : '#1F7A41';
        ctx.fillRect(i * (W / 10), 0, Math.ceil(W / 10), H);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, W - 36, H - 36);

      if (drill.minigame === 'SHOOTING') {
        // Goal on right side
        const goalTop = 95;
        const goalH = 150;
        ctx.fillStyle = 'rgba(15,23,42,0.4)';
        ctx.fillRect(W - 46, goalTop, 28, goalH);
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeRect(W - 46, goalTop, 28, goalH);

        // Moving target zone inside goal
        st.targetY = goalTop + 26 + ((Math.sin(st.phase * 0.45) + 1) / 2) * (goalH - 52);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(W - 42, Math.round(st.targetY - 16), 20, 32);

        // Moving Pixel GK
        st.gkY += st.gkDir * 95 * dt;
        if (st.gkY < goalTop + 22) st.gkDir = 1;
        if (st.gkY > goalTop + goalH - 22) st.gkDir = -1;
        drawPixelPlayerSprite(
          ctx,
          W - 60,
          st.gkY,
          2.2,
          {
            appearance: { ...career.appearance, skinColor: '#D19A6E' },
            gear: { ...career.gear, jerseyNumber: 1, accessory: 'Luvas' },
            kit: club.kit,
            isGoalkeeper: true,
            isUserControlled: false,
            facingAngle: Math.PI,
            animPhase: st.phase,
            isSprinting: false,
            isDribbling: false,
            hasBall: false,
          },
          'match'
        );

        // User shooter
        drawPixelPlayerSprite(
          ctx,
          120,
          170,
          2.3,
          {
            appearance: career.appearance,
            gear: career.gear,
            kit: club.kit,
            isGoalkeeper: false,
            isUserControlled: true,
            facingAngle: 0,
            animPhase: st.phase * 0.5,
            isSprinting: false,
            isDribbling: false,
            hasBall: !st.ballActive,
          },
          'match'
        );

        if (st.ballActive) {
          st.ballX += st.ballVx * dt;
          st.ballY += st.ballVy * dt;
          // Check GK block
          if (Math.abs(st.ballX - (W - 60)) < 16 && Math.abs(st.ballY - st.gkY) < 22) {
            st.ballActive = false;
            soundEngine.play('ball');
          } else if (st.ballX >= W - 46) {
            st.ballActive = false;
            if (st.ballY >= goalTop && st.ballY <= goalTop + goalH) {
              const bullseye = Math.abs(st.ballY - st.targetY) < 24;
              scoreRef.current += bullseye ? 20 : 10;
              setScore(scoreRef.current);
              soundEngine.play('net');
              soundEngine.play('trainingHit');
            } else {
              soundEngine.play('post');
            }
          } else if (st.ballY < 10 || st.ballY > H - 10) {
            st.ballActive = false;
          }
          drawPixelBall(ctx, st.ballX, st.ballY, 4, st.phase * 2);
        } else {
          drawPixelBall(ctx, 138, 170, 0, 0);
        }
      } else if (drill.minigame === 'PASSING') {
        // Player in center, tap highlighted pixel target rings
        drawPixelPlayerSprite(
          ctx,
          110,
          H / 2,
          2.3,
          {
            appearance: career.appearance,
            gear: career.gear,
            kit: club.kit,
            isGoalkeeper: false,
            isUserControlled: true,
            facingAngle: 0,
            animPhase: st.phase * 0.4,
            isSprinting: false,
            isDribbling: false,
            hasBall: !st.ballActive,
          },
          'match'
        );

        // Target Ring + Pixel Receiver
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(st.targetX, st.targetY, 24, 0, Math.PI * 2);
        ctx.stroke();

        drawPixelPlayerSprite(
          ctx,
          st.targetX,
          st.targetY,
          2.1,
          {
            appearance: career.appearance,
            gear: { ...career.gear, jerseyNumber: 9 },
            kit: club.kit,
            isGoalkeeper: false,
            isUserControlled: false,
            facingAngle: Math.PI,
            animPhase: st.phase,
            isSprinting: false,
            isDribbling: false,
            hasBall: false,
          },
          'match'
        );

        if (st.ballActive) {
          st.ballX += st.ballVx * dt;
          st.ballY += st.ballVy * dt;
          if (Math.hypot(st.ballX - st.targetX, st.ballY - st.targetY) < 24) {
            st.ballActive = false;
            scoreRef.current += 15;
            setScore(scoreRef.current);
            soundEngine.play('trainingHit');
            st.targetX = 280 + Math.random() * (W - 340);
            st.targetY = 55 + Math.random() * (H - 110);
          } else if (st.ballX > W || st.ballY < 0 || st.ballY > H) {
            st.ballActive = false;
          }
          drawPixelBall(ctx, st.ballX, st.ballY, 3, st.phase * 2);
        } else {
          drawPixelBall(ctx, 128, H / 2, 0, 0);
        }
      } else if (drill.minigame === 'DRIBBLE_SPEED') {
        // Move pixel player toward pointer target through glowing gates
        const dx = st.tx - st.px;
        const dy = st.ty - st.py;
        const d = Math.hypot(dx, dy);
        if (d > 4) {
          const spd = 230;
          st.px += (dx / d) * Math.min(spd * dt, d);
          st.py += (dy / d) * Math.min(spd * dt, d);
        }

        // Draw cones & active target gate
        st.cones.forEach((cone, idx) => {
          const isTarget = idx === st.gateIdx;
          ctx.fillStyle = isTarget ? '#10B981' : '#F97316';
          ctx.fillRect(cone.x - 10, cone.y - 10, 20, 20);
          if (isTarget) {
            ctx.strokeStyle = '#FACC15';
            ctx.lineWidth = 3;
            ctx.strokeRect(cone.x - 16, cone.y - 16, 32, 32);
            if (Math.hypot(st.px - cone.x, st.py - cone.y) < 26) {
              scoreRef.current += 15;
              setScore(scoreRef.current);
              soundEngine.play('trainingHit');
              st.gateIdx = (st.gateIdx + 1) % st.cones.length;
            }
          }
        });

        drawPixelPlayerSprite(
          ctx,
          st.px,
          st.py,
          2.3,
          {
            appearance: career.appearance,
            gear: career.gear,
            kit: club.kit,
            isGoalkeeper: false,
            isUserControlled: true,
            facingAngle: Math.atan2(dy, dx),
            animPhase: st.phase * 1.6,
            isSprinting: true,
            isDribbling: true,
            hasBall: true,
          },
          'match'
        );
        drawPixelBall(ctx, st.px + 12, st.py + 4, 0, st.phase * 2);
      } else {
        // DEFENSE_GK: intercept/save incoming balls launched from right
        const dy = st.ty - st.py;
        st.py += clamp(dy, -280 * dt, 280 * dt);

        if (!st.ballActive) {
          st.ballActive = true;
          st.ballX = W - 60;
          st.ballY = 60 + Math.random() * (H - 120);
          const targetY = 55 + Math.random() * (H - 110);
          const ang = Math.atan2(targetY - st.ballY, 85 - st.ballX);
          st.ballVx = Math.cos(ang) * 320;
          st.ballVy = Math.sin(ang) * 320;
          soundEngine.play('kick');
        } else {
          st.ballX += st.ballVx * dt;
          st.ballY += st.ballVy * dt;
          if (Math.hypot(st.ballX - 95, st.ballY - st.py) < 28) {
            st.ballActive = false;
            scoreRef.current += 15;
            setScore(scoreRef.current);
            soundEngine.play('trainingHit');
          } else if (st.ballX < 20) {
            st.ballActive = false;
            soundEngine.play('net');
          }
          drawPixelBall(ctx, st.ballX, st.ballY, 4, st.phase * 2);
        }

        drawPixelPlayerSprite(
          ctx,
          95,
          st.py,
          2.4,
          {
            appearance: career.appearance,
            gear: career.gear,
            kit: club.kit,
            isGoalkeeper: true,
            isUserControlled: true,
            facingAngle: 0,
            animPhase: st.phase,
            isSprinting: false,
            isDribbling: false,
            hasBall: false,
          },
          'match'
        );
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drill.minigame, career.appearance, career.gear, club.kit]);

  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (finished) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const st = stateRef.current;

    if (drill.minigame === 'SHOOTING' && !st.ballActive) {
      st.ballActive = true;
      st.ballX = 138;
      st.ballY = 170;
      const ang = Math.atan2(sy - 170, Math.max(200, sx) - 138);
      st.ballVx = Math.cos(ang) * 480;
      st.ballVy = Math.sin(ang) * 480;
      soundEngine.play('kick');
    } else if (drill.minigame === 'PASSING' && !st.ballActive) {
      st.ballActive = true;
      st.ballX = 128;
      st.ballY = canvas.height / 2;
      const ang = Math.atan2(sy - st.ballY, sx - st.ballX);
      st.ballVx = Math.cos(ang) * 460;
      st.ballVy = Math.sin(ang) * 460;
      soundEngine.play('pass');
    } else if (drill.minigame === 'DRIBBLE_SPEED' || drill.minigame === 'DEFENSE_GK') {
      st.tx = sx;
      st.ty = sy;
    }
  };

  const medal: 'Ouro' | 'Prata' | 'Bronze' =
    score >= 75 ? 'Ouro' : score >= 40 ? 'Prata' : 'Bronze';

  const hintText =
    drill.minigame === 'SHOOTING'
      ? 'Toque no alvo amarelo dentro do gol para finalizar!'
      : drill.minigame === 'PASSING'
      ? 'Toque exatamente no companheiro destacado!'
      : drill.minigame === 'DRIBBLE_SPEED'
      ? 'Arraste ou toque para guiar seu jogador pelos quadrados amarelos!'
      : 'Arraste verticalmente na esquerda para defender/interceptar as bolas!';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#111B2B] border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden flex flex-col">
        <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-400">{drill.category} · Minijogo</div>
            <h3 className="font-display font-bold text-base text-white">{drill.name}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="font-mono-num text-sm font-bold text-amber-300">
              Pontos: {score}
            </div>
            <div className="font-mono-num text-sm font-bold text-white bg-slate-800 px-2.5 py-1 rounded">
              {timeLeft}s
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              aria-label="Fechar treino"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="relative p-3 bg-[#0B121D] flex flex-col items-center">
          <canvas
            ref={canvasRef}
            width={620}
            height={320}
            onPointerDown={handlePointer}
            onPointerMove={(e) => {
              if (e.buttons > 0 || e.pointerType === 'touch') handlePointer(e);
            }}
            className="w-full max-w-[620px] aspect-[620/320] rounded-xl border border-slate-700 pixelated touch-none cursor-crosshair"
          />
          <p className="text-xs text-slate-300 mt-2">{hintText}</p>

          {finished && (
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Trophy
                size={40}
                className={
                  medal === 'Ouro'
                    ? 'text-amber-400'
                    : medal === 'Prata'
                    ? 'text-slate-300'
                    : 'text-orange-400'
                }
              />
              <h4 className="font-display text-2xl font-extrabold text-white">
                Treino Concluído · Medalha {medal}
              </h4>
              <p className="text-sm text-slate-300">
                Pontuação: {score} · Recompensa de experiência e evolução aplicada aos atributos.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('celebration');
                  onComplete(medal, score);
                }}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
              >
                Registrar Evolução
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

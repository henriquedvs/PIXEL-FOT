import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Award, Paintbrush, Play, Shield, UserCheck } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { ATTRIBUTE_LABELS, getPositionMeta } from '../data/positions';
import { drawPixelPlayerSprite } from '../engine/pixelRenderer';
import { PlayerCareer } from '../types/game';
import { calculateAge } from '../utils/storage';
import { ClubCrest } from './ClubCrest';
import { EvolutionChart } from './EvolutionChart';
import { PixelPortrait } from './PixelPortrait';

interface PlayerProfileScreenProps {
  career: PlayerCareer | null;
  onBack: () => void;
  onStartNewCareer: () => void;
  onCustomize: () => void;
}

export const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  career,
  onBack,
  onStartNewCareer,
  onCustomize,
}) => {
  const spriteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!career) return;
    const canvas = spriteCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const club = getClubById(career.clubId);
    let raf = 0;
    let phase = 0;
    const render = () => {
      phase += 0.06;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0D1726';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#186A3B';
      ctx.fillRect(16, canvas.height - 36, canvas.width - 32, 20);

      drawPixelPlayerSprite(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + 16 + Math.sin(phase) * 1.1,
        6.5,
        {
          appearance: career.appearance,
          gear: career.gear,
          kit: club.kit,
          isGoalkeeper: career.position === 'GK_TRAD' || career.position === 'GK_SWEEPER',
          isUserControlled: false,
          facingAngle: 0,
          animPhase: phase,
          isSprinting: false,
          isDribbling: false,
          hasBall: false,
          viewAngle: 'front',
        },
        'preview'
      );
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [career]);

  if (!career) {
    return (
      <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
        <header className="px-4 py-3 border-b border-slate-800 bg-[#0D1624] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <ArrowLeft size={15} />
            Menu
          </button>
          <h1 className="font-display font-bold text-base sm:text-lg text-white">Meu Jogador</h1>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111B2B] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <UserCheck size={40} className="mx-auto text-emerald-400" />
            <h2 className="font-display font-bold text-xl text-white">
              Nenhum Atleta Criado Ainda
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inicie sua Carreira de Jogador para personalizar aparência, posição, chuteiras e acompanhar a evolução do seu craque.
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onStartNewCareer();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              Criar Meu Jogador
            </button>
          </div>
        </div>
      </div>
    );
  }

  const club = getClubById(career.clubId);
  const posMeta = getPositionMeta(career.position);
  const age = calculateAge(career.personal.birthDate);
  const avgRating =
    career.careerStats.matches > 0
      ? (career.careerStats.ratingSum / career.careerStats.matches).toFixed(2)
      : '—';

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
      <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <ArrowLeft size={15} />
            Menu
          </button>
          <h1 className="font-display font-bold text-base sm:text-lg text-white">
            Meu Jogador · Ficha Completa
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('menu');
            onCustomize();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs cursor-pointer"
        >
          <Paintbrush size={14} />
          Editar Aparência & Chuteira
        </button>
      </header>

      <main className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Identity Hero Card */}
          <section className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4 flex items-center gap-3">
              <canvas
                ref={spriteCanvasRef}
                width={150}
                height={150}
                className="w-28 h-28 rounded-xl border border-slate-700 pixelated bg-[#0D1726] shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <PixelPortrait
                    skinColor={career.appearance.skinColor}
                    hairColor={career.appearance.hairColor}
                    hairStyle={career.appearance.hairStyle}
                    shirtPrimary={club.kit.primary}
                    shirtSecondary={club.kit.secondary}
                    size={36}
                  />
                  <ClubCrest club={club} size={34} />
                </div>
                <div className="font-display font-extrabold text-lg text-white truncate">
                  {career.personal.nickname || career.personal.firstName}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {career.personal.firstName} {career.personal.lastName} · #{career.gear.jerseyNumber}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  {club.name} · {posMeta.code}
                </div>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatCard label="Overall (OVR)" value={String(career.ovr)} accent />
              <StatCard label="Idade" value={`${age} anos`} />
              <StatCard label="Altura / Peso" value={`${career.personal.heightCm}cm · ${career.personal.weightKg}kg`} />
              <StatCard label="Pé Dominante" value={career.gear.dominantFoot} />
              <StatCard label="Jogos Carreira" value={String(career.careerStats.matches)} />
              <StatCard label="Gols / Assist." value={`${career.careerStats.goals}G · ${career.careerStats.assists}A`} accent />
              <StatCard label="Nota Média" value={avgRating} />
              <StatCard
                label="Seleção Brasileira"
                value={career.nationalTeamCalled ? 'Convocado' : 'Em observação'}
              />
            </div>
          </section>

          {/* Evolution Chart */}
          <EvolutionChart points={career.evolutionHistory || []} />

          {/* Attributes + Awards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="lg:col-span-8 bg-[#111B2B] border border-slate-800 rounded-xl p-4">
              <h2 className="font-display font-bold text-sm text-white mb-3 flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" />
                Atributos Atuais ({posMeta.name} · {career.playstyle})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ATTRIBUTE_LABELS.map((item) => {
                  const val = career.attributes[item.key];
                  return (
                    <div key={item.key} className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="font-mono-num font-bold text-emerald-400">{val}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="lg:col-span-4 bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <Award size={16} className="text-amber-400" />
                Títulos & Prêmios ({career.awards.length})
              </h2>
              {career.awards.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Conquiste troféus pelo Brasileirão, Copa Nacional ou prêmios individuais ao longo da carreira.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {career.awards.map((aw) => (
                    <div key={aw.id} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                      <div className="font-bold">{aw.title}</div>
                      <div className="text-[11px] text-amber-200/80">{aw.clubName}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-2.5 rounded-xl bg-slate-900/75 border border-slate-800">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`font-mono-num text-sm font-bold truncate mt-0.5 ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

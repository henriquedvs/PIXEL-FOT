import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Award, Paintbrush, Play, Shield, TrendingUp, UserCheck } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { ATTRIBUTE_LABELS, getPositionMeta } from '../data/positions';
import { drawPixelPlayerSprite } from '../engine/pixelRenderer';
import { PlayerCareer } from '../types/game';
import { calculateAge } from '../utils/storage';
import { ClubCrest } from './ClubCrest';
import { EvolutionChart } from './EvolutionChart';
import { PixelBootIcon, PixelTrophyIcon } from './PixelIcons';
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

  const winRatePct = useMemo(() => {
    if (!career || career.recentMatches.length === 0) return '—';
    let pts = 0;
    for (const m of career.recentMatches) {
      const isHome = m.homeClubId === m.playerClubId;
      const us = isHome ? m.homeScore : m.awayScore;
      const opp = isHome ? m.awayScore : m.homeScore;
      if (us > opp) pts += 3;
      else if (us === opp) pts += 1;
    }
    return `${Math.round((pts / (career.recentMatches.length * 3)) * 100)}%`;
  }, [career]);

  if (!career) {
    return (
      <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden animate-fadeIn">
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
              Inicie sua Carreira de Jogador para personalizar aparência, posição, chuteiras e acompanhar estatísticas e evolução completas.
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
  const goalInvolvements = career.careerStats.goals + career.careerStats.assists;
  const startsCount = career.startsCount ?? career.careerStats.matches;
  const compEntries = Object.entries(career.competitionStats || {});

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden animate-fadeIn">
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
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
              Meu Jogador · Perfil Profissional
            </h1>
            <p className="text-[11px] text-slate-400">
              {career.personal.hometown} ({career.personal.nationality}) · Contrato até {career.contract.signedSeason + career.contract.yearsRemaining}
            </p>
          </div>
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
          {/* Identity & Advanced KPI Hero Card */}
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
                  {club.name} · {posMeta.code} · {career.contract.role}
                </div>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatCard label="Overall (OVR)" value={String(career.ovr)} accent />
              <StatCard label="Idade / País" value={`${age} anos · ${career.personal.nationality}`} />
              <StatCard label="Físico / Pé" value={`${career.personal.heightCm}cm · ${career.gear.dominantFoot}`} />
              <StatCard label="Salário Semanal" value={`R$ ${career.contract.weeklySalary.toLocaleString('pt-BR')}`} />
              <StatCard label="Jogos (Titular)" value={`${career.careerStats.matches} (${startsCount})`} />
              <StatCard label="Gols · Assist." value={`${career.careerStats.goals}G · ${career.careerStats.assists}A`} accent />
              <StatCard label="Partic. em Gol" value={String(goalInvolvements)} accent />
              <StatCard label="Nota Média / Aprov." value={`${avgRating} · ${winRatePct}`} />
            </div>
          </section>

          {/* Per-Competition Stats Breakdown */}
          <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <PixelTrophyIcon size={17} />
                Desempenho por Competição (Temporada {career.season})
              </h2>
              <span className="text-[11px] text-slate-400 font-mono-num">
                {career.careerStats.minutesPlayed} min totais na carreira
              </span>
            </div>

            {compEntries.length === 0 ? (
              <p className="text-xs text-slate-400">
                Dispute partidas pelo Brasileirão Série A, Copa do Brasil ou Supercopa para detalhar seus números por torneio.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2">Competição</th>
                      <th className="py-2 text-center">Jogos</th>
                      <th className="py-2 text-center">Gols</th>
                      <th className="py-2 text-center">Assist.</th>
                      <th className="py-2 text-center">Chutes (Gol)</th>
                      <th className="py-2 text-center">Desarmes</th>
                      <th className="py-2 text-right">Nota Média</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {compEntries.map(([comp, st]) => {
                      const compAvg = st.matches > 0 ? (st.ratingSum / st.matches).toFixed(2) : '—';
                      return (
                        <tr key={comp} className="text-slate-200">
                          <td className="py-2 font-semibold text-white">{comp}</td>
                          <td className="py-2 text-center font-mono-num">{st.matches}</td>
                          <td className="py-2 text-center font-mono-num text-emerald-400 font-bold">{st.goals}</td>
                          <td className="py-2 text-center font-mono-num text-sky-400 font-bold">{st.assists}</td>
                          <td className="py-2 text-center font-mono-num">
                            {st.shots} ({st.shotsOnTarget})
                          </td>
                          <td className="py-2 text-center font-mono-num">{st.tackles + st.interceptions}</td>
                          <td className="py-2 text-right font-mono-num font-bold text-amber-300">{compAvg}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Evolution Chart */}
          <EvolutionChart points={career.evolutionHistory || []} />

          {/* Attributes + Club History + Trophies */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="lg:col-span-7 bg-[#111B2B] border border-slate-800 rounded-xl p-4">
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

            <section className="lg:col-span-5 space-y-4">
              <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
                <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Award size={16} className="text-amber-400" />
                  Títulos & Prêmios ({career.awards.length})
                </h2>
                {career.awards.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Conquiste troféus pelo Brasileirão, Copa do Brasil, Supercopa ou prêmios individuais.
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
              </div>

              <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-sky-400" />
                  Histórico por Temporada
                </h2>
                {career.history.length === 0 ? (
                  <div className="p-2.5 rounded-lg bg-slate-900/75 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-white font-semibold">
                      <PixelBootIcon size={16} />
                      {career.season} · {club.shortName} (Em curso)
                    </span>
                    <span className="font-mono-num text-emerald-400">
                      {career.seasonStats.matches}J · {career.seasonStats.goals}G · {career.seasonStats.assists}A
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {career.history.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900/75 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-white font-semibold">
                          {h.season} · {h.clubName}
                        </span>
                        <span className="font-mono-num text-emerald-400">
                          {h.matches}J · {h.goals}G · {h.assists}A · {h.avgRating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

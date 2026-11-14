import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Award, Paintbrush, Play, Shield, TrendingUp, UserCheck } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { ATTRIBUTE_CATEGORIES, ATTRIBUTE_LABELS, getPositionMeta } from '../data/positions';
import { drawPixelPlayerSprite } from '../engine/pixelRenderer';
import { PlayerCareer } from '../types/game';
import { calculateAge } from '../utils/storage';
import { ClubCrest } from './ClubCrest';
import { EvolutionChart } from './EvolutionChart';
import { PixelBackdrop } from './PixelBackdrop';
import { PixelBootIcon, PixelFlag, PixelTrophyIcon } from './PixelIcons';
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
      ctx.fillStyle = '#07111B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#14532D';
      ctx.fillRect(14, canvas.height - 34, canvas.width - 28, 18);
      ctx.fillStyle = '#1E7A42';
      ctx.fillRect(20, canvas.height - 30, canvas.width - 40, 10);

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
      <div className="px-shell animate-fadeIn">
        <PixelBackdrop dimOpacity={0.86} />
        <header className="relative z-10 px-header px-4 py-2.5 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase cursor-pointer"
          >
            <ArrowLeft size={15} />
            Menu
          </button>
          <div className="px-flag-stripe-br" />
          <h1 className="font-display font-bold text-base sm:text-lg text-white uppercase">
            Meu Jogador
          </h1>
        </header>

        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full px-panel p-6 text-center space-y-4">
            <UserCheck size={40} className="mx-auto text-emerald-400" />
            <h2 className="font-display font-bold text-xl text-white uppercase">
              Nenhum Atleta Criado Ainda
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Inicie sua Carreira de Jogador para personalizar aparência, posição, chuteiras e acompanhar estatísticas e evolução completas.
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                onStartNewCareer();
              }}
              className="px-btn-primary w-full py-3 text-sm uppercase flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="px-shell animate-fadeIn">
      <PixelBackdrop homeKit={club.kit} awayKit={club.awayKit} dimOpacity={0.86} />

      <header className="relative z-10 px-header px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase cursor-pointer shrink-0"
          >
            <ArrowLeft size={15} />
            Menu
          </button>
          <div className="px-flag-stripe-br shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight uppercase truncate">
              Meu Jogador · Ficha Profissional
            </h1>
            <p className="text-[11px] font-mono-num text-slate-400 truncate">
              {career.personal.hometown} ({career.personal.nationality}
              {career.personal.secondaryNationality ? ` / ${career.personal.secondaryNationality}` : ''}) ·{' '}
              {career.division || 'Série A'} · Contrato até{' '}
              {career.contract.signedSeason + career.contract.yearsRemaining}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('menu');
            onCustomize();
          }}
          className="px-btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs uppercase cursor-pointer shrink-0"
        >
          <Paintbrush size={14} />
          Editar Aparência & Chuteira
        </button>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Identity & Advanced KPI Hero Card */}
          <section className="px-panel p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 flex items-center gap-3.5">
              <PixelPortrait
                variant="bust"
                skinColor={career.appearance.skinColor}
                hairColor={career.appearance.hairColor}
                hairStyle={career.appearance.hairStyle}
                shirtPrimary={club.kit.primary}
                shirtSecondary={club.kit.secondary}
                beard={career.appearance.beardStyle !== 'Nenhuma'}
                jerseyNumber={career.gear.jerseyNumber}
                crestBg={club.kit.primary}
                crestAccent={club.kit.secondary}
                size={88}
              />
              <canvas
                ref={spriteCanvasRef}
                width={120}
                height={140}
                className="hidden sm:block w-24 h-28 border border-[#243B4F] rounded-[2px] pixelated bg-[#07111B] shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <PixelFlag nationality={career.personal.nationality} width={22} />
                  <ClubCrest club={club} size={26} />
                  <span className="font-mono-num text-xs font-bold text-[#E6B84C]">
                    #{career.gear.jerseyNumber}
                  </span>
                </div>
                <div className="font-display font-extrabold text-xl text-white truncate uppercase">
                  {career.personal.nickname || career.personal.firstName}
                </div>
                <div className="text-[11px] font-mono-num text-slate-400 truncate">
                  {career.personal.firstName} {career.personal.lastName}
                </div>
                <div className="text-xs text-emerald-400 font-display uppercase tracking-wide font-bold">
                  {club.shortName} · {posMeta.code} · {career.contract.role}
                </div>
                {career.secondaryPositions && career.secondaryPositions.length > 0 && (
                  <div className="text-[10px] font-mono-num text-slate-400">
                    SEC: {career.secondaryPositions.map((p) => getPositionMeta(p).code).join(' / ')}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard
                label="OVR / Potencial"
                value={`${career.ovr} / ${career.potential ?? career.ovr}`}
                accent
              />
              <StatCard label="Idade / País" value={`${age}a · ${career.personal.nationality}`} />
              <StatCard
                label="Valor Mercado"
                value={formatCurrency(career.marketValue ?? 950000)}
                accent
              />
              <StatCard
                label="Salário Sem."
                value={`R$ ${career.contract.weeklySalary.toLocaleString('pt-BR')}`}
              />
              <StatCard label="Jogos (Tit.)" value={`${career.careerStats.matches} (${startsCount})`} />
              <StatCard label="Gols · Assist." value={`${career.careerStats.goals}G · ${career.careerStats.assists}A`} accent />
              <StatCard label="Partic. Gol" value={String(goalInvolvements)} accent />
              <StatCard label="Nota · Aprov." value={`${avgRating} · ${winRatePct}`} />
            </div>
          </section>

          {/* Traits & Relationships Strip */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 px-panel p-4 space-y-2.5">
              <h2 className="font-display font-bold text-sm text-white uppercase">
                Especialidades & Perfil Técnico
              </h2>
              <div className="text-xs text-slate-300 font-mono-num">
                Estilo: <span className="text-emerald-400 font-bold">{career.playstyle}</span> ·{' '}
                <span>
                  {career.personal.heightCm}cm · Pé {career.gear.dominantFoot}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(career.traits && career.traits.length > 0 ? career.traits : [career.playstyle]).map((tr) => (
                  <span
                    key={tr}
                    className="px-2.5 py-1 rounded-[2px] bg-emerald-500/12 border border-emerald-500/40 text-[11px] font-display font-bold uppercase text-emerald-300"
                  >
                    {tr}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 px-panel p-4 space-y-2.5">
              <h2 className="font-display font-bold text-sm text-white uppercase">
                Status no Clube & Reputação
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <RelationBar label="Moral" value={career.morale} color="bg-emerald-500" />
                <RelationBar label="Treinador" value={career.coachTrust} color="bg-sky-500" />
                <RelationBar label="Entros." value={career.teamChemistry ?? 70} color="bg-indigo-500" />
                <RelationBar label="Imprensa" value={career.pressRelation ?? 65} color="bg-amber-400" />
                <RelationBar label="Torcida" value={career.fanSupport ?? 65} color="bg-teal-400" />
              </div>
            </div>
          </section>

          {/* Per-Competition Stats Breakdown */}
          <section className="px-panel p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-bold text-sm text-white uppercase flex items-center gap-2">
                <PixelTrophyIcon size={17} />
                Desempenho por Competição (Temporada {career.season})
              </h2>
              <span className="text-[11px] text-slate-400 font-mono-num">
                {career.careerStats.minutesPlayed} min totais
              </span>
            </div>

            {compEntries.length === 0 ? (
              <p className="text-xs text-slate-400">
                Dispute partidas pelo Brasileirão {career.division || 'Série A'}, Copa do Brasil ou Supercopa para detalhar seus números por torneio.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] font-mono-num uppercase text-slate-400 border-b border-[#1E3346]">
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
                  <tbody className="divide-y divide-[#1A2D3E]">
                    {compEntries.map(([comp, st]) => {
                      const compAvg = st.matches > 0 ? (st.ratingSum / st.matches).toFixed(2) : '—';
                      return (
                        <tr key={comp} className="text-slate-200">
                          <td className="py-2 font-display font-bold text-white uppercase">{comp}</td>
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
            <section className="lg:col-span-7 px-panel p-4">
              <h2 className="font-display font-bold text-sm text-white uppercase mb-3 flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" />
                Atributos Atuais ({posMeta.name} · {career.playstyle})
              </h2>
              <div className="space-y-3">
                {ATTRIBUTE_CATEGORIES.map((category) => {
                  const items = ATTRIBUTE_LABELS.filter((a) => a.category === category);
                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="text-[10px] font-mono-num font-bold uppercase tracking-wider text-emerald-400 border-b border-[#1E3346] pb-1">
                        {category}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((item) => {
                          const val = career.attributes[item.key];
                          return (
                            <div key={item.key} className="px-panel-soft p-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-300">{item.label}</span>
                                <span className="font-mono-num font-bold text-emerald-400">{val}</span>
                              </div>
                              <div className="w-full h-2 bg-[#060E17] border border-[#1E3346] overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="lg:col-span-5 space-y-4">
              <div className="px-panel p-4 space-y-3">
                <h2 className="font-display font-bold text-sm text-white uppercase flex items-center gap-2">
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
                      <div key={aw.id} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-[2px] p-2.5">
                        <div className="font-display font-bold uppercase">{aw.title}</div>
                        <div className="text-[11px] font-mono-num text-amber-200/80">{aw.clubName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-panel p-4 space-y-2.5">
                <h2 className="font-display font-bold text-sm text-white uppercase flex items-center gap-2">
                  <TrendingUp size={16} className="text-sky-400" />
                  Histórico por Temporada
                </h2>
                {career.history.length === 0 ? (
                  <div className="px-panel-soft p-2.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-white font-display font-bold uppercase">
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
                      <div key={i} className="px-panel-soft p-2.5 flex items-center justify-between text-xs">
                        <span className="text-white font-display font-bold uppercase">
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
    <div className="px-panel-soft p-2.5">
      <div className="text-[10px] font-mono-num uppercase text-slate-400 truncate">{label}</div>
      <div className={`font-mono-num text-sm font-bold truncate mt-0.5 ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function RelationBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-panel-soft p-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono-num">
        <span className="text-slate-400 uppercase truncate">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="h-2 bg-[#060E17] border border-[#1E3346] overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
  return `R$ ${Math.round(val / 1000)} mil`;
}

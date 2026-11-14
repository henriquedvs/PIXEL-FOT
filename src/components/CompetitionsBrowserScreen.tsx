import React, { useMemo, useState } from 'react';
import { ArrowLeft, Award, Shield, Trophy } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS, SERIE_B_CLUBS, getClubById } from '../data/clubs';
import {
  buildEmptyStandings,
  createCopaBracket,
  createInitialSupercopa,
} from '../engine/competitions';
import { CopaStageId, PlayerCareer } from '../types/game';
import { ClubCrest } from './ClubCrest';
import { PixelBackdrop } from './PixelBackdrop';
import { PixelBrazilMap, PixelMedalIcon, PixelShieldIcon, PixelTrophyIcon } from './PixelIcons';

interface CompetitionsBrowserScreenProps {
  career: PlayerCareer | null;
  onBack?: () => void;
}

type CompTab = 'SERIE_A' | 'SERIE_B' | 'COPA' | 'SUPERCOPA' | 'ARTILHARIA';

export const CompetitionsBrowserScreen: React.FC<CompetitionsBrowserScreenProps> = ({
  career,
  onBack,
}) => {
  const [tab, setTab] = useState<CompTab>(
    career?.division === 'Série B' ? 'SERIE_B' : 'SERIE_A'
  );
  const [selectedRound, setSelectedRound] = useState<number>(
    Math.max(1, (career?.round || 1) - 1)
  );

  const serieAStandings = useMemo(() => {
    if (career?.standings && career.standings.length >= 20) {
      return career.standings;
    }
    return buildEmptyStandings(CLUBS);
  }, [career]);

  const serieBStandings = useMemo(() => {
    if (career?.serieBStandings && career.serieBStandings.length >= 20) {
      return career.serieBStandings;
    }
    return buildEmptyStandings(SERIE_B_CLUBS);
  }, [career]);

  const copaBracket = useMemo(() => {
    if (career?.copaBracket) return career.copaBracket;
    return createCopaBracket(2026, CLUBS[8].id);
  }, [career]);

  const supercopa = useMemo(() => {
    if (career?.supercopa) return career.supercopa;
    return createInitialSupercopa(2026);
  }, [career]);

  const activeCompKeyword = tab === 'SERIE_B' ? 'Série B' : 'Série A';

  const roundNumbers = useMemo(() => {
    const rounds = new Set<number>();
    (career?.roundResults || []).forEach((r) => {
      if (r.competition.includes(activeCompKeyword)) rounds.add(r.round);
    });
    return Array.from(rounds).sort((a, b) => b - a);
  }, [career?.roundResults, activeCompKeyword]);

  const activeRoundFilter = roundNumbers.includes(selectedRound)
    ? selectedRound
    : roundNumbers[0] ?? 1;

  const filteredRoundResults = useMemo(() => {
    return (career?.roundResults || []).filter(
      (r) => r.competition.includes(activeCompKeyword) && r.round === activeRoundFilter
    );
  }, [career?.roundResults, activeRoundFilter, activeCompKeyword]);

  const topScorers = useMemo(() => {
    return [...(career?.leagueLeaders || [])]
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 12);
  }, [career?.leagueLeaders]);

  const topAssists = useMemo(() => {
    return [...(career?.leagueLeaders || [])]
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
      .slice(0, 12);
  }, [career?.leagueLeaders]);

  const supLeagueClub = getClubById(supercopa.leagueChampId);
  const supCopaClub = getClubById(supercopa.copaChampId);
  const userClub = career ? getClubById(career.clubId) : CLUBS[0];

  const tabBar = (
    <div className="flex items-center gap-1 bg-[#081018] p-1 rounded-[2px] border border-[#22384C] overflow-x-auto">
      {(
        [
          { id: 'SERIE_A', label: 'Série A' },
          { id: 'SERIE_B', label: 'Série B' },
          { id: 'COPA', label: 'Copa do Brasil' },
          { id: 'SUPERCOPA', label: 'Supercopa' },
          { id: 'ARTILHARIA', label: 'Artilharia' },
        ] as { id: CompTab; label: string }[]
      ).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            soundEngine.play('menu');
            setTab(t.id);
          }}
          className={`px-3 py-1 rounded-[2px] text-xs font-display font-bold uppercase cursor-pointer whitespace-nowrap ${
            tab === t.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={
        onBack
          ? 'px-shell animate-fadeIn'
          : 'w-full h-full flex flex-col overflow-hidden animate-fadeIn'
      }
    >
      {onBack && <PixelBackdrop homeKit={userClub.kit} awayKit={userClub.awayKit} dimOpacity={0.86} />}

      {onBack ? (
        <header className="relative z-10 px-header px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
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
            <div className="px-flag-stripe-br shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight uppercase truncate">
                Competições Oficiais
              </h1>
              <p className="text-[11px] font-mono-num text-slate-400 truncate">
                {career
                  ? `Temporada ${career.season} · ${career.division || 'Série A'} · Rodada ${career.round}/38 · Copa: ${career.copaStage}`
                  : 'Brasileirão Série A & B (20 clubes cada), Copa do Brasil e Supercopa do Brasil'}
              </p>
            </div>
          </div>

          {tabBar}
        </header>
      ) : (
        <div className="px-panel px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 mb-3">
          <div className="flex items-center gap-2.5">
            <PixelBrazilMap size={24} />
            <div>
              <h2 className="font-display font-bold text-sm text-white uppercase">
                Competições Nacionais · Temporada {career?.season || 2026}
              </h2>
              <p className="text-[10px] font-mono-num text-slate-400">
                {career
                  ? `${career.division || 'Série A'} · Rodada ${career.round}/38 · Copa: ${career.copaStage}`
                  : 'Série A, Série B, Copa do Brasil e Supercopa'}
              </p>
            </div>
          </div>
          {tabBar}
        </div>
      )}

      <main className={`relative z-10 flex-1 overflow-y-auto custom-scroll ${onBack ? 'p-4' : 'p-1'}`}>
        <div className="max-w-6xl mx-auto space-y-4">
          {tab === 'SERIE_A' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-8 px-panel p-4 overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="font-display font-bold text-base text-white uppercase flex items-center gap-2">
                    <PixelTrophyIcon size={18} />
                    Brasileirão Série A — 20 Clubes
                  </h2>
                  <div className="flex items-center gap-3 text-[10px] font-mono-num uppercase">
                    <span className="text-emerald-400">G-4 Continental</span>
                    <span className="text-rose-400">Z-4 Rebaixamento</span>
                  </div>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] font-mono-num uppercase text-slate-400 border-b border-[#1E3346]">
                    <tr>
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2">Clube</th>
                      <th className="py-2 text-center">J</th>
                      <th className="py-2 text-center">V</th>
                      <th className="py-2 text-center">E</th>
                      <th className="py-2 text-center">D</th>
                      <th className="py-2 text-center">GP</th>
                      <th className="py-2 text-center">GC</th>
                      <th className="py-2 text-center">SG</th>
                      <th className="py-2 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17293B]">
                    {serieAStandings.map((row, idx) => {
                      const c = getClubById(row.clubId);
                      const isMine = career?.clubId === row.clubId;
                      const zoneColor =
                        idx < 4
                          ? 'text-emerald-400'
                          : idx >= 16
                          ? 'text-rose-400'
                          : 'text-slate-400';
                      return (
                        <tr
                          key={row.clubId}
                          className={
                            isMine
                              ? 'bg-emerald-500/20 text-emerald-200 font-semibold border-y border-emerald-400/50'
                              : 'text-slate-300'
                          }
                        >
                          <td className={`py-2 pr-2 font-mono-num font-bold ${zoneColor}`}>{idx + 1}</td>
                          <td className="py-2 flex items-center gap-2">
                            <ClubCrest club={c} size={20} />
                            <span className="font-display uppercase truncate max-w-[160px]">{c.name}</span>
                          </td>
                          <td className="py-2 text-center font-mono-num">{row.played}</td>
                          <td className="py-2 text-center font-mono-num">{row.won}</td>
                          <td className="py-2 text-center font-mono-num">{row.drawn}</td>
                          <td className="py-2 text-center font-mono-num">{row.lost}</td>
                          <td className="py-2 text-center font-mono-num">{row.gf}</td>
                          <td className="py-2 text-center font-mono-num">{row.ga}</td>
                          <td className="py-2 text-center font-mono-num">{row.gf - row.ga}</td>
                          <td className="py-2 text-right font-mono-num font-bold text-white">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-4 px-panel p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-white uppercase">
                    Resultados da Rodada
                  </h3>
                  {roundNumbers.length > 0 && (
                    <select
                      value={activeRoundFilter}
                      onChange={(e) => setSelectedRound(Number(e.target.value))}
                      className="px-2 py-1 rounded-[2px] bg-[#081018] border border-[#22384C] text-xs text-white font-mono-num"
                      aria-label="Selecionar rodada"
                    >
                      {roundNumbers.map((r) => (
                        <option key={r} value={r}>
                          Rodada {r}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {filteredRoundResults.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Dispute partidas da Série A para visualizar todos os placares da rodada aqui.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scroll pr-1">
                    {filteredRoundResults.map((res) => {
                      const hc = getClubById(res.homeClubId);
                      const ac = getClubById(res.awayClubId);
                      const involvesUser =
                        career && (res.homeClubId === career.clubId || res.awayClubId === career.clubId);
                      return (
                        <div
                          key={res.id}
                          className={`p-2 flex items-center justify-between text-xs ${
                            involvesUser ? 'px-panel-active' : 'px-panel-soft'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-display font-bold text-white w-2/5 truncate">
                            <ClubCrest club={hc} size={16} />
                            {hc.shortName}
                          </span>
                          <span className="font-mono-num font-extrabold text-emerald-400">
                            {res.homeScore} x {res.awayScore}
                          </span>
                          <span className="flex items-center justify-end gap-1.5 font-display font-bold text-white w-2/5 truncate">
                            {ac.shortName}
                            <ClubCrest club={ac} size={16} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'SERIE_B' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-8 px-panel p-4 overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="font-display font-bold text-base text-white uppercase flex items-center gap-2">
                      <PixelShieldIcon size={18} />
                      Brasileirão Série B — 20 Clubes
                    </h2>
                    <p className="text-xs text-slate-400">
                      Os 4 primeiros conquistam o acesso à Série A na temporada seguinte.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono-num uppercase">
                    <span className="text-sky-400">G-4 Acesso Série A</span>
                    <span className="text-rose-400">Z-4 Rebaixamento</span>
                  </div>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] font-mono-num uppercase text-slate-400 border-b border-[#1E3346]">
                    <tr>
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2">Clube</th>
                      <th className="py-2 text-center">J</th>
                      <th className="py-2 text-center">V</th>
                      <th className="py-2 text-center">E</th>
                      <th className="py-2 text-center">D</th>
                      <th className="py-2 text-center">GP</th>
                      <th className="py-2 text-center">GC</th>
                      <th className="py-2 text-center">SG</th>
                      <th className="py-2 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17293B]">
                    {serieBStandings.map((row, idx) => {
                      const c = getClubById(row.clubId);
                      const isMine = career?.clubId === row.clubId;
                      const zoneColor =
                        idx < 4
                          ? 'text-sky-400'
                          : idx >= 16
                          ? 'text-rose-400'
                          : 'text-slate-400';
                      return (
                        <tr
                          key={row.clubId}
                          className={
                            isMine
                              ? 'bg-emerald-500/20 text-emerald-200 font-semibold border-y border-emerald-400/50'
                              : 'text-slate-300'
                          }
                        >
                          <td className={`py-2 pr-2 font-mono-num font-bold ${zoneColor}`}>{idx + 1}</td>
                          <td className="py-2 flex items-center gap-2">
                            <ClubCrest club={c} size={20} />
                            <span className="font-display uppercase truncate max-w-[160px]">{c.name}</span>
                          </td>
                          <td className="py-2 text-center font-mono-num">{row.played}</td>
                          <td className="py-2 text-center font-mono-num">{row.won}</td>
                          <td className="py-2 text-center font-mono-num">{row.drawn}</td>
                          <td className="py-2 text-center font-mono-num">{row.lost}</td>
                          <td className="py-2 text-center font-mono-num">{row.gf}</td>
                          <td className="py-2 text-center font-mono-num">{row.ga}</td>
                          <td className="py-2 text-center font-mono-num">{row.gf - row.ga}</td>
                          <td className="py-2 text-right font-mono-num font-bold text-white">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-4 px-panel p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-white uppercase">
                    Resultados da Série B
                  </h3>
                  {roundNumbers.length > 0 && (
                    <select
                      value={activeRoundFilter}
                      onChange={(e) => setSelectedRound(Number(e.target.value))}
                      className="px-2 py-1 rounded-[2px] bg-[#081018] border border-[#22384C] text-xs text-white font-mono-num"
                      aria-label="Selecionar rodada da Série B"
                    >
                      {roundNumbers.map((r) => (
                        <option key={r} value={r}>
                          Rodada {r}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {filteredRoundResults.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Os placares da Série B aparecem automaticamente conforme as rodadas avançam.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scroll pr-1">
                    {filteredRoundResults.map((res) => {
                      const hc = getClubById(res.homeClubId);
                      const ac = getClubById(res.awayClubId);
                      const involvesUser =
                        career && (res.homeClubId === career.clubId || res.awayClubId === career.clubId);
                      return (
                        <div
                          key={res.id}
                          className={`p-2 flex items-center justify-between text-xs ${
                            involvesUser ? 'px-panel-active' : 'px-panel-soft'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-display font-bold text-white w-2/5 truncate">
                            <ClubCrest club={hc} size={16} />
                            {hc.shortName}
                          </span>
                          <span className="font-mono-num font-extrabold text-emerald-400">
                            {res.homeScore} x {res.awayScore}
                          </span>
                          <span className="flex items-center justify-end gap-1.5 font-display font-bold text-white w-2/5 truncate">
                            {ac.shortName}
                            <ClubCrest club={ac} size={16} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'COPA' && (
            <div className="px-panel p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-base text-white uppercase flex items-center gap-2">
                    <PixelMedalIcon size={18} />
                    Copa do Brasil — Chaveamento Oficial (16 Clubes)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Oitavas, Quartas e Semifinais em ida e volta; Final em jogo único (com pênaltis em caso de empate).
                  </p>
                </div>
                <span className="text-xs font-mono-num font-bold uppercase text-emerald-400">
                  Fase Atual: {copaBracket.currentStage}
                </span>
              </div>

              {copaBracket.championClubId && (
                <div className="p-3.5 rounded-[2px] bg-amber-500/15 border border-amber-400/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ClubCrest club={getClubById(copaBracket.championClubId)} size={40} />
                    <div>
                      <div className="text-[11px] font-mono-num font-bold uppercase text-amber-300">
                        Campeão da Copa do Brasil {copaBracket.season}
                      </div>
                      <div className="font-display font-extrabold text-base text-white uppercase">
                        {getClubById(copaBracket.championClubId).name}
                      </div>
                    </div>
                  </div>
                  <Trophy size={24} className="text-[#E6B84C]" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                {(['Oitavas', 'Quartas', 'Semifinal', 'Final'] as CopaStageId[]).map((stage) => {
                  const stageTies = copaBracket.ties
                    .filter((t) => t.stage === stage)
                    .sort((a, b) => a.slotIndex - b.slotIndex);
                  const active = copaBracket.currentStage === stage;
                  return (
                    <div
                      key={stage}
                      className={`p-3 space-y-2 ${active ? 'px-panel-active' : 'px-panel-soft'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-bold uppercase text-[#E6B84C]">
                          {stage}
                        </span>
                        <span className="text-[10px] font-mono-num text-slate-400">
                          {stage === 'Final' ? 'Jogo Único' : 'Ida e Volta'}
                        </span>
                      </div>

                      {stageTies.length === 0 ? (
                        <div className="p-3 rounded-[2px] bg-[#071019] border border-[#1A2D3E] text-[11px] text-slate-500 text-center">
                          Aguardando definição da fase anterior
                        </div>
                      ) : (
                        stageTies.map((tie) => {
                          const c1 = getClubById(tie.homeClubId);
                          const c2 = getClubById(tie.awayClubId);
                          const hasUser =
                            career &&
                            (tie.homeClubId === career.clubId || tie.awayClubId === career.clubId);
                          const agg1 = (tie.homeScoreLeg1 ?? 0) + (tie.awayScoreLeg2 ?? 0);
                          const agg2 = (tie.awayScoreLeg1 ?? 0) + (tie.homeScoreLeg2 ?? 0);
                          return (
                            <div
                              key={tie.id}
                              className={`p-2.5 rounded-[2px] border text-[11px] space-y-1.5 ${
                                hasUser
                                  ? 'bg-emerald-500/15 border-emerald-500/60'
                                  : 'bg-[#071019] border-[#1D3144]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`flex items-center gap-1.5 font-display font-bold ${
                                    tie.winnerClubId === c1.id ? 'text-emerald-300' : 'text-white'
                                  }`}
                                >
                                  <ClubCrest club={c1} size={16} />
                                  {c1.shortName}
                                </span>
                                <span className="font-mono-num text-slate-300">
                                  {tie.playedLeg1 ? `${tie.homeScoreLeg1} - ${tie.awayScoreLeg1}` : '—'}
                                </span>
                                <span
                                  className={`flex items-center gap-1.5 font-display font-bold ${
                                    tie.winnerClubId === c2.id ? 'text-emerald-300' : 'text-white'
                                  }`}
                                >
                                  {c2.shortName}
                                  <ClubCrest club={c2} size={16} />
                                </span>
                              </div>

                              {tie.twoLegged && tie.playedLeg2 && (
                                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-[#1A2D3E] pt-1 font-mono-num">
                                  <span>
                                    Volta: {tie.awayScoreLeg2}-{tie.homeScoreLeg2}
                                  </span>
                                  <span className="text-emerald-400 font-bold">
                                    Agg {agg1}x{agg2}
                                  </span>
                                </div>
                              )}
                              {tie.penHome !== undefined && tie.penAway !== undefined && (
                                <div className="text-[10px] text-[#E6B84C] font-mono-num text-center">
                                  Pênaltis: {tie.penHome} x {tie.penAway}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'SUPERCOPA' && (
            <div className="space-y-4">
              <div className="px-panel border-amber-500/40 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <PixelTrophyIcon size={28} />
                  <div>
                    <h2 className="font-display font-extrabold text-lg text-white uppercase">
                      Supercopa do Brasil {supercopa.season}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Duelo único em campo neutro reunindo o Campeão Brasileiro e o Campeão da Copa do Brasil.
                    </p>
                  </div>
                </div>

                <div className="px-panel-soft p-5 flex items-center justify-around gap-4">
                  <div className="flex flex-col items-center text-center">
                    <ClubCrest club={supLeagueClub} size={64} />
                    <div className="font-display font-bold text-sm text-white uppercase mt-2">
                      {supLeagueClub.name}
                    </div>
                    <div className="text-[10px] font-mono-num uppercase text-[#E6B84C]">
                      Campeão Brasileiro
                    </div>
                  </div>

                  <div className="text-center">
                    {supercopa.played ? (
                      <>
                        <div className="font-mono-num font-extrabold text-3xl text-white">
                          {supercopa.homeScore} - {supercopa.awayScore}
                        </div>
                        {supercopa.penHome !== undefined && supercopa.penAway !== undefined && (
                          <div className="text-xs font-mono-num text-[#E6B84C] mt-1">
                            Pênaltis: {supercopa.penHome} x {supercopa.penAway}
                          </div>
                        )}
                        {supercopa.winnerClubId && (
                          <div className="text-xs font-display font-bold uppercase text-emerald-400 mt-1">
                            Campeão: {getClubById(supercopa.winnerClubId).shortName}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="font-display font-extrabold text-2xl text-[#E6B84C]">VS</div>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <ClubCrest club={supCopaClub} size={64} />
                    <div className="font-display font-bold text-sm text-white uppercase mt-2">
                      {supCopaClub.name}
                    </div>
                    <div className="text-[10px] font-mono-num uppercase text-emerald-400">
                      Campeão da Copa
                    </div>
                  </div>
                </div>
              </div>

              {(career?.championsHistory || []).length > 0 && (
                <div className="px-panel p-4 space-y-2.5">
                  <h3 className="font-display font-bold text-sm text-white uppercase flex items-center gap-2">
                    <Award size={16} className="text-[#E6B84C]" />
                    Galeria de Campeões Recentes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(career?.championsHistory || []).map((ch, idx) => {
                      const champ = getClubById(ch.championClubId);
                      return (
                        <div
                          key={idx}
                          className="px-panel-soft p-3 flex items-center gap-3"
                        >
                          <ClubCrest club={champ} size={32} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono-num font-bold uppercase text-[#E6B84C]">
                              {ch.competition} · {ch.season}
                            </div>
                            <div className="font-display font-bold text-xs text-white uppercase truncate">
                              {champ.name}
                            </div>
                            {ch.scoreSummary && (
                              <div className="text-[10px] text-slate-400 font-mono-num truncate">
                                {ch.scoreSummary}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'ARTILHARIA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="px-panel p-4 space-y-2.5">
                <h2 className="font-display font-bold text-sm text-white uppercase flex items-center gap-2">
                  <Trophy size={16} className="text-[#E6B84C]" />
                  Artilheiros da Temporada
                </h2>
                {topScorers.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Inicie uma carreira e jogue rodadas para acompanhar os artilheiros.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {topScorers.map((p, idx) => (
                      <div
                        key={p.playerId}
                        className={`flex items-center justify-between text-xs px-3 py-2 ${
                          p.playerId === 'user_player'
                            ? 'px-panel-active text-emerald-300 font-bold'
                            : 'px-panel-soft text-slate-300'
                        }`}
                      >
                        <span className="truncate font-display">
                          {idx + 1}. {p.name} ({getClubById(p.clubId).shortName})
                        </span>
                        <span className="font-mono-num font-bold text-white shrink-0">
                          {p.goals} gols
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="px-panel p-4 space-y-2.5">
                <h2 className="font-display font-bold text-sm text-white uppercase flex items-center gap-2">
                  <Shield size={16} className="text-sky-400" />
                  Líderes em Assistências
                </h2>
                {topAssists.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Inicie uma carreira e jogue rodadas para acompanhar as assistências.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {topAssists.map((p, idx) => (
                      <div
                        key={p.playerId}
                        className={`flex items-center justify-between text-xs px-3 py-2 ${
                          p.playerId === 'user_player'
                            ? 'px-panel-active text-emerald-300 font-bold'
                            : 'px-panel-soft text-slate-300'
                        }`}
                      >
                        <span className="truncate font-display">
                          {idx + 1}. {p.name} ({getClubById(p.clubId).shortName})
                        </span>
                        <span className="font-mono-num font-bold text-white shrink-0">
                          {p.assists} assist.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

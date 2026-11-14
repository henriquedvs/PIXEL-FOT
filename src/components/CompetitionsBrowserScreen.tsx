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
import { PixelMedalIcon, PixelShieldIcon, PixelTrophyIcon } from './PixelIcons';

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

  return (
    <div
      className={`w-full ${
        onBack ? 'h-[100dvh]' : 'h-full'
      } bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden animate-fadeIn`}
    >
      <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
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
          )}
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
              Competições Oficiais
            </h1>
            <p className="text-[11px] text-slate-400">
              {career
                ? `Temporada ${career.season} · ${career.division || 'Série A'} · Rodada ${career.round}/38 · Copa: ${career.copaStage}`
                : 'Brasileirão Série A & B (20 clubes cada), Copa do Brasil e Supercopa do Brasil'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto">
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
              className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                tab === t.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scroll p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {tab === 'SERIE_A' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-8 bg-[#111B2B] border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <PixelTrophyIcon size={18} />
                    Brasileirão Série A — 20 Clubes (38 Rodadas)
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="text-emerald-400">G-4 Continental</span>
                    <span className="text-rose-400">Z-4 Rebaixamento</span>
                  </div>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
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
                  <tbody className="divide-y divide-slate-800/70">
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
                            isMine ? 'bg-emerald-500/15 text-emerald-200 font-semibold' : 'text-slate-300'
                          }
                        >
                          <td className={`py-2 pr-2 font-mono-num font-bold ${zoneColor}`}>{idx + 1}</td>
                          <td className="py-2 flex items-center gap-2">
                            <ClubCrest club={c} size={20} />
                            <span className="truncate max-w-[160px]">{c.name}</span>
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

              <div className="lg:col-span-4 bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-white">
                    Resultados da Rodada
                  </h3>
                  {roundNumbers.length > 0 && (
                    <select
                      value={activeRoundFilter}
                      onChange={(e) => setSelectedRound(Number(e.target.value))}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono-num"
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
                          className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                            involvesUser
                              ? 'bg-emerald-500/15 border-emerald-500/40'
                              : 'bg-slate-900/75 border-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-semibold text-white w-2/5 truncate">
                            <ClubCrest club={hc} size={16} />
                            {hc.shortName}
                          </span>
                          <span className="font-mono-num font-extrabold text-emerald-400">
                            {res.homeScore} x {res.awayScore}
                          </span>
                          <span className="flex items-center justify-end gap-1.5 font-semibold text-white w-2/5 truncate">
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
              <div className="lg:col-span-8 bg-[#111B2B] border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <PixelShieldIcon size={18} />
                      Brasileirão Série B — 20 Clubes (38 Rodadas)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Os 4 primeiros conquistam o acesso à Série A na temporada seguinte.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="text-sky-400">G-4 Acesso à Série A</span>
                    <span className="text-rose-400">Z-4 Rebaixamento</span>
                  </div>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
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
                  <tbody className="divide-y divide-slate-800/70">
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
                            isMine ? 'bg-emerald-500/15 text-emerald-200 font-semibold' : 'text-slate-300'
                          }
                        >
                          <td className={`py-2 pr-2 font-mono-num font-bold ${zoneColor}`}>{idx + 1}</td>
                          <td className="py-2 flex items-center gap-2">
                            <ClubCrest club={c} size={20} />
                            <span className="truncate max-w-[160px]">{c.name}</span>
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

              <div className="lg:col-span-4 bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-white">
                    Resultados da Série B
                  </h3>
                  {roundNumbers.length > 0 && (
                    <select
                      value={activeRoundFilter}
                      onChange={(e) => setSelectedRound(Number(e.target.value))}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono-num"
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
                          className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                            involvesUser
                              ? 'bg-emerald-500/15 border-emerald-500/40'
                              : 'bg-slate-900/75 border-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-semibold text-white w-2/5 truncate">
                            <ClubCrest club={hc} size={16} />
                            {hc.shortName}
                          </span>
                          <span className="font-mono-num font-extrabold text-emerald-400">
                            {res.homeScore} x {res.awayScore}
                          </span>
                          <span className="flex items-center justify-end gap-1.5 font-semibold text-white w-2/5 truncate">
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
            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <PixelMedalIcon size={18} />
                    Copa do Brasil — Chaveamento Oficial (16 Clubes)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Oitavas, Quartas e Semifinais em ida e volta; Final em jogo único (com pênaltis em caso de empate).
                  </p>
                </div>
                <span className="text-xs font-mono-num font-bold text-emerald-400">
                  Fase Atual: {copaBracket.currentStage}
                </span>
              </div>

              {copaBracket.championClubId && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ClubCrest club={getClubById(copaBracket.championClubId)} size={40} />
                    <div>
                      <div className="text-[11px] font-bold uppercase text-amber-300">
                        Campeão da Copa do Brasil {copaBracket.season}
                      </div>
                      <div className="font-display font-extrabold text-base text-white">
                        {getClubById(copaBracket.championClubId).name}
                      </div>
                    </div>
                  </div>
                  <Trophy size={24} className="text-amber-400" />
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
                      className={`p-3 rounded-xl border space-y-2 ${
                        active ? 'bg-emerald-500/10 border-emerald-500/60' : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-amber-400">{stage}</span>
                        <span className="text-[10px] text-slate-400">
                          {stage === 'Final' ? 'Jogo Único' : 'Ida e Volta'}
                        </span>
                      </div>

                      {stageTies.length === 0 ? (
                        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70 text-[11px] text-slate-500 text-center">
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
                              className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
                                hasUser
                                  ? 'bg-emerald-500/15 border-emerald-500/60'
                                  : 'bg-slate-950/80 border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`flex items-center gap-1.5 font-semibold ${
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
                                  className={`flex items-center gap-1.5 font-semibold ${
                                    tie.winnerClubId === c2.id ? 'text-emerald-300' : 'text-white'
                                  }`}
                                >
                                  {c2.shortName}
                                  <ClubCrest club={c2} size={16} />
                                </span>
                              </div>

                              {tie.twoLegged && tie.playedLeg2 && (
                                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 font-mono-num">
                                  <span>
                                    Volta: {tie.awayScoreLeg2}-{tie.homeScoreLeg2}
                                  </span>
                                  <span className="text-emerald-400 font-bold">
                                    Agg {agg1}x{agg2}
                                  </span>
                                </div>
                              )}
                              {tie.penHome !== undefined && tie.penAway !== undefined && (
                                <div className="text-[10px] text-amber-300 font-mono-num text-center">
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
              <div className="bg-[#111B2B] border border-amber-500/35 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <PixelTrophyIcon size={28} />
                  <div>
                    <h2 className="font-display font-extrabold text-lg text-white">
                      Supercopa do Brasil {supercopa.season}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Duelo único em campo neutro reunindo o Campeão Brasileiro e o Campeão da Copa do Brasil.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-5 flex items-center justify-around gap-4">
                  <div className="flex flex-col items-center text-center">
                    <ClubCrest club={supLeagueClub} size={64} />
                    <div className="font-display font-bold text-sm text-white mt-2">
                      {supLeagueClub.name}
                    </div>
                    <div className="text-[11px] text-amber-400">Campeão Brasileiro</div>
                  </div>

                  <div className="text-center">
                    {supercopa.played ? (
                      <>
                        <div className="font-mono-num font-extrabold text-3xl text-white">
                          {supercopa.homeScore} - {supercopa.awayScore}
                        </div>
                        {supercopa.penHome !== undefined && supercopa.penAway !== undefined && (
                          <div className="text-xs font-mono-num text-amber-300 mt-1">
                            Pênaltis: {supercopa.penHome} x {supercopa.penAway}
                          </div>
                        )}
                        {supercopa.winnerClubId && (
                          <div className="text-xs font-bold text-emerald-400 mt-1">
                            Campeão: {getClubById(supercopa.winnerClubId).shortName}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="font-display font-extrabold text-2xl text-amber-400">VS</div>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <ClubCrest club={supCopaClub} size={64} />
                    <div className="font-display font-bold text-sm text-white mt-2">
                      {supCopaClub.name}
                    </div>
                    <div className="text-[11px] text-emerald-400">Campeão da Copa</div>
                  </div>
                </div>
              </div>

              {(career?.championsHistory || []).length > 0 && (
                <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    <Award size={16} className="text-amber-400" />
                    Galeria de Campeões Recentes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(career?.championsHistory || []).map((ch, idx) => {
                      const champ = getClubById(ch.championClubId);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/75 border border-slate-800 flex items-center gap-3"
                        >
                          <ClubCrest club={champ} size={32} />
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold uppercase text-amber-400">
                              {ch.competition} · {ch.season}
                            </div>
                            <div className="font-display font-bold text-xs text-white truncate">
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
              <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" />
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
                        className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
                          p.playerId === 'user_player'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-slate-900/75 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate">
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

              <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
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
                        className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
                          p.playerId === 'user_player'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-slate-900/75 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate">
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

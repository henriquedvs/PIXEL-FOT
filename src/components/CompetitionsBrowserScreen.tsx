import React, { useMemo, useState } from 'react';
import { ArrowLeft, Award, Shield, Trophy } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CLUBS, SERIE_B_CLUBS, getClubById } from '../data/clubs';
import { PlayerCareer } from '../types/game';
import { ClubCrest } from './ClubCrest';

interface CompetitionsBrowserScreenProps {
  career: PlayerCareer | null;
  onBack: () => void;
}

type CompTab = 'SERIE_A' | 'SERIE_B' | 'COPA' | 'SUPERCOPA';

export const CompetitionsBrowserScreen: React.FC<CompetitionsBrowserScreenProps> = ({
  career,
  onBack,
}) => {
  const [tab, setTab] = useState<CompTab>('SERIE_A');

  const serieAStandings = useMemo(() => {
    if (career?.standings && career.standings.length >= 20) {
      return career.standings;
    }
    return CLUBS.map((c) => ({
      clubId: c.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    }));
  }, [career]);

  const topClubs = useMemo(() => {
    return CLUBS.slice(0, 8);
  }, []);

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
          <div>
            <h1 className="font-display font-bold text-base sm:text-lg text-white leading-tight">
              Competições Nacionais
            </h1>
            <p className="text-[11px] text-slate-400">
              {career
                ? `Temporada ${career.season} · Rodada ${career.round}/38`
                : 'Brasileirão Série A (20 clubes, 38 rodadas), Série B, Copa Nacional e Supercopa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto">
          {(
            [
              { id: 'SERIE_A', label: 'Série A' },
              { id: 'SERIE_B', label: 'Série B' },
              { id: 'COPA', label: 'Copa Nacional' },
              { id: 'SUPERCOPA', label: 'Supercopa' },
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
            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Trophy size={17} className="text-emerald-400" />
                  Brasileirão Série A — 20 Clubes (Turno e Returno · 38 Rodadas)
                </h2>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="text-emerald-400">■ G-4 Continental</span>
                  <span className="text-rose-400">■ Z-4 Rebaixamento</span>
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
                        className={isMine ? 'bg-emerald-500/15 text-emerald-200 font-semibold' : 'text-slate-300'}
                      >
                        <td className={`py-2 pr-2 font-mono-num font-bold ${zoneColor}`}>{idx + 1}</td>
                        <td className="py-2 flex items-center gap-2">
                          <ClubCrest club={c} size={20} />
                          <span>{c.name}</span>
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
          )}

          {tab === 'SERIE_B' && (
            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Shield size={17} className="text-sky-400" />
                Brasileirão Série B — Acesso & Clubes Participantes
              </h2>
              <p className="text-xs text-slate-400">
                Os melhores colocados da Série B garantem acesso à elite na temporada seguinte.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SERIE_B_CLUBS.map((c, idx) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-900/75 border border-slate-800 flex items-center gap-3"
                  >
                    <span className="font-mono-num text-xs font-bold text-sky-400 w-4">{idx + 1}</span>
                    <ClubCrest club={c} size={36} />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-xs text-white truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {c.city}/{c.state} · OVR {c.squadQuality}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'COPA' && (
            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <Award size={17} className="text-amber-400" />
                  Copa Nacional — Mata-Mata Oficial
                </h2>
                <span className="text-xs font-mono-num font-bold text-emerald-400">
                  Fase Atual: {career ? career.copaStage : 'Oitavas de Final'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {(['Oitavas', 'Quartas', 'Semifinal', 'Final'] as const).map((stage, sIdx) => {
                  const active = career?.copaStage === stage;
                  return (
                    <div
                      key={stage}
                      className={`p-3 rounded-xl border space-y-2 ${
                        active ? 'bg-emerald-500/15 border-emerald-500' : 'bg-slate-900/70 border-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold uppercase text-amber-400">{stage}</div>
                      {Array.from({ length: Math.max(1, 4 - sIdx) }).map((_, mIdx) => {
                        const c1 = topClubs[(mIdx * 2 + sIdx) % topClubs.length];
                        const c2 = topClubs[(mIdx * 2 + sIdx + 1) % topClubs.length];
                        return (
                          <div key={mIdx} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-white font-semibold">
                                <ClubCrest club={c1} size={16} />
                                {c1.shortName}
                              </span>
                              <span className="text-slate-500">vs</span>
                              <span className="flex items-center gap-1.5 text-white font-semibold">
                                {c2.shortName}
                                <ClubCrest club={c2} size={16} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'SUPERCOPA' && (
            <div className="bg-[#111B2B] border border-amber-500/35 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Trophy size={26} className="text-amber-400" />
                <div>
                  <h2 className="font-display font-extrabold text-lg text-white">
                    Supercopa Nacional
                  </h2>
                  <p className="text-xs text-slate-400">
                    Duelo único em campo neutro reunindo o Campeão do Brasileirão Série A contra o Campeão da Copa Nacional.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-center justify-around gap-4">
                <div className="flex flex-col items-center text-center">
                  <ClubCrest club={CLUBS[8]} size={64} />
                  <div className="font-display font-bold text-sm text-white mt-2">{CLUBS[8].name}</div>
                  <div className="text-[11px] text-amber-400">Campeão Brasileiro</div>
                </div>
                <div className="font-display font-extrabold text-2xl text-amber-400">VS</div>
                <div className="flex flex-col items-center text-center">
                  <ClubCrest club={CLUBS[13]} size={64} />
                  <div className="font-display font-bold text-sm text-white mt-2">{CLUBS[13].name}</div>
                  <div className="text-[11px] text-emerald-400">Campeão da Copa</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

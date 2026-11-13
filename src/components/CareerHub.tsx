import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronRight,
  Dumbbell,
  FastForward,
  Home,
  Play,
  Settings,
  Shield,
  Trophy,
  User,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { ATTRIBUTE_LABELS, getPositionMeta } from '../data/positions';
import { generateMatchEnvironment, getStadiumForClub } from '../data/stadiums';
import { TRAINING_DRILLS } from '../data/trainingDrills';
import {
  MatchStatLine,
  PlayerCareer,
  TrainingCategory,
  TrainingDrill,
  TransferOffer,
} from '../types/game';
import { calculateAge } from '../utils/storage';
import { ClubCrest } from './ClubCrest';
import { EvolutionChart } from './EvolutionChart';
import { TrainingMinigame } from './TrainingMinigame';

interface CareerHubProps {
  career: PlayerCareer;
  onPlayMatch: (homeClubId: string, awayClubId: string, competitionName?: string) => void;
  onSimulateInjurySkip: (homeClubId: string, awayClubId: string) => void;
  onAdvanceDay: () => void;
  onCompleteDrill: (drill: TrainingDrill, medal: 'Ouro' | 'Prata' | 'Bronze') => void;
  onAcceptOffer: (offer: TransferOffer) => void;
  onOpenSettings: () => void;
  onBackToMenu: () => void;
}

type HubTab =
  | 'PARTIDA'
  | 'CALENDARIO'
  | 'TREINO'
  | 'COMPETICOES'
  | 'PERFIL'
  | 'CONTRATO'
  | 'ESTATS';

export const CareerHub: React.FC<CareerHubProps> = ({
  career,
  onPlayMatch,
  onSimulateInjurySkip,
  onAdvanceDay,
  onCompleteDrill,
  onAcceptOffer,
  onOpenSettings,
  onBackToMenu,
}) => {
  const [tab, setTab] = useState<HubTab>('PARTIDA');
  const [statScope, setStatScope] = useState<'TEMPORADA' | 'CARREIRA'>('TEMPORADA');
  const [drillCat, setDrillCat] = useState<'TODAS' | TrainingCategory>('TODAS');
  const [activeDrill, setActiveDrill] = useState<TrainingDrill | null>(null);

  const club = getClubById(career.clubId);
  const posMeta = getPositionMeta(career.position);
  const age = calculateAge(career.personal.birthDate);
  const maxRound = career.schedule.reduce((m, f) => Math.max(m, f.round), 38);

  const nextFixture = useMemo(() => {
    return (
      career.schedule.find(
        (f) =>
          f.round === career.round &&
          (f.homeClubId === career.clubId || f.awayClubId === career.clubId)
      ) || career.schedule[0]
    );
  }, [career.schedule, career.round, career.clubId]);

  const homeClub = getClubById(nextFixture.homeClubId);
  const awayClub = getClubById(nextFixture.awayClubId);
  const stadium = getStadiumForClub(homeClub);
  const currentDay = career.calendar[career.currentDayIndex];
  const nextEnv = useMemo(() => {
    return generateMatchEnvironment({
      homeClub,
      competitionName: nextFixture.competition || 'Liga Nacional',
      roundLabel: `Rodada ${career.round}`,
      dateStr: currentDay?.dateLabel || `Rod. ${career.round}`,
      seed: career.season * 31 + career.round * 7,
    });
  }, [homeClub, nextFixture.competition, career.round, career.season, currentDay?.dateLabel]);

  const activeStats: MatchStatLine =
    statScope === 'TEMPORADA' ? career.seasonStats : career.careerStats;

  const avgRating =
    activeStats.matches > 0
      ? (activeStats.ratingSum / activeStats.matches).toFixed(2)
      : '—';

  const topScorers = useMemo(() => {
    return [...career.leagueLeaders]
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 8);
  }, [career.leagueLeaders]);

  const topAssists = useMemo(() => {
    return [...career.leagueLeaders]
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
      .slice(0, 8);
  }, [career.leagueLeaders]);

  const clickSfx = () => soundEngine.play('menu');

  const visibleDrills =
    drillCat === 'TODAS'
      ? TRAINING_DRILLS
      : TRAINING_DRILLS.filter((d) => d.category === drillCat);

  const calendarWindow = career.calendar.slice(
    Math.max(0, career.currentDayIndex - 2),
    career.currentDayIndex + 10
  );

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <ClubCrest club={club} size={36} className="shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold text-sm sm:text-base text-white truncate">
              {career.personal.nickname || career.personal.firstName} · #{career.gear.jerseyNumber}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {club.name} · {posMeta.code} · OVR {career.ovr} · Fadiga {career.fatigue}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentDay && (
            <span className="hidden sm:inline-block text-xs font-mono-num text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              {currentDay.weekday} {currentDay.dateLabel} · {currentDay.title}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              clickSfx();
              onOpenSettings();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            aria-label="Configurações"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              clickSfx();
              onBackToMenu();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Home size={14} />
            Menu
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="px-3 py-2 border-b border-slate-800 bg-[#0E1623] flex items-center gap-1.5 overflow-x-auto shrink-0">
        {(
          [
            { id: 'PARTIDA', label: 'Próxima Partida', icon: Play },
            { id: 'CALENDARIO', label: 'Calendário & Rotina', icon: Calendar },
            { id: 'TREINO', label: `Treinos (${career.trainingPoints})`, icon: Dumbbell },
            { id: 'COMPETICOES', label: 'Competições', icon: Trophy },
            { id: 'PERFIL', label: 'Meu Jogador', icon: User },
            { id: 'CONTRATO', label: `Contrato (${career.offers.length})`, icon: Briefcase },
            { id: 'ESTATS', label: 'Estatísticas', icon: BarChart3 },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                clickSfx();
                setTab(t.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/75 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scroll p-4">
        {tab === 'PARTIDA' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Next Fixture & Environmental Preview */}
            <section className="lg:col-span-6 bg-[#111B2B] border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400">
                    {nextEnv.competitionName} · Rodada {career.round}/{maxRound}
                  </span>
                  <span>
                    {nextEnv.weather} · {nextEnv.temperatureC}°C · {nextEnv.kickoffTime}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 bg-slate-900/75 border border-slate-800 rounded-xl p-4">
                  <div className="flex flex-col items-center text-center w-2/5">
                    <ClubCrest club={homeClub} size={52} />
                    <div className="font-display font-bold text-sm text-white mt-2 truncate w-full">
                      {homeClub.name}
                    </div>
                    <div className="text-[11px] text-slate-400">Téc. {homeClub.coachName}</div>
                  </div>

                  <div className="font-display font-extrabold text-xl text-slate-500">VS</div>

                  <div className="flex flex-col items-center text-center w-2/5">
                    <ClubCrest club={awayClub} size={52} />
                    <div className="font-display font-bold text-sm text-white mt-2 truncate w-full">
                      {awayClub.name}
                    </div>
                    <div className="text-[11px] text-slate-400">Téc. {awayClub.coachName}</div>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-white">
                    {stadium.name} ({stadium.city}/{stadium.state}) · Cap. {stadium.capacity.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[11px] text-slate-400">{stadium.description}</div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <MiniMeter label="Moral" value={career.morale} />
                  <MiniMeter label="Confiança" value={career.coachTrust} />
                  <MiniMeter label="Fadiga" value={career.fatigue} />
                  <MiniMeter label="XP Nível" value={career.xp} />
                </div>

                {career.injuryMatchesRemaining > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                    <Activity size={16} className="shrink-0 text-amber-400" />
                    <span>
                      Departamento Médico: {career.injuryType} ({career.injuryMatchesRemaining} jogo restante)
                    </span>
                  </div>
                )}
              </div>

              {career.injuryMatchesRemaining > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    onSimulateInjurySkip(nextFixture.homeClubId, nextFixture.awayClubId);
                  }}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Recuperar-se e Avançar Rodada
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.play('whistle');
                    onPlayMatch(nextFixture.homeClubId, nextFixture.awayClubId, nextEnv.competitionName);
                  }}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Play size={18} fill="currentColor" />
                  Ir para o Estádio (Partida 11v11)
                </button>
              )}
            </section>

            {/* Right: Club Identity + Quick Table */}
            <section className="lg:col-span-6 space-y-4">
              <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClubCrest club={club} size={46} />
                  <div>
                    <div className="font-display font-bold text-base text-white">{club.name}</div>
                    <div className="text-xs text-slate-400">
                      {club.division} · Formação {club.formation} · Mascote: {club.mascotName}
                    </div>
                  </div>
                </div>
                <Shield size={20} className="text-emerald-400 shrink-0" />
              </div>

              <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <h2 className="font-display font-bold text-sm text-white mb-2.5">
                  Classificação Geral ({career.season})
                </h2>
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 pr-2">#</th>
                      <th className="py-1.5">Clube</th>
                      <th className="py-1.5 text-center">J</th>
                      <th className="py-1.5 text-center">V</th>
                      <th className="py-1.5 text-center">SG</th>
                      <th className="py-1.5 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {career.standings.slice(0, 8).map((row, idx) => {
                      const c = getClubById(row.clubId);
                      const isMine = row.clubId === career.clubId;
                      return (
                        <tr
                          key={row.clubId}
                          className={isMine ? 'bg-emerald-500/12 text-emerald-300 font-semibold' : 'text-slate-300'}
                        >
                          <td className="py-1.5 pr-2 font-mono-num">{idx + 1}</td>
                          <td className="py-1.5 flex items-center gap-2">
                            <ClubCrest club={c} size={18} />
                            <span className="truncate max-w-[160px]">{c.name}</span>
                          </td>
                          <td className="py-1.5 text-center font-mono-num">{row.played}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.won}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.gf - row.ga}</td>
                          <td className="py-1.5 text-right font-mono-num font-bold">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === 'CALENDARIO' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase">
                  Rotina Semanal · Temporada {career.season}
                </div>
                <h2 className="font-display font-bold text-lg text-white">
                  {currentDay ? `${currentDay.weekday} ${currentDay.dateLabel} — ${currentDay.title}` : 'Agenda'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{currentDay?.note}</p>
              </div>

              {currentDay?.activity === 'PARTIDA' ? (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.play('whistle');
                    onPlayMatch(nextFixture.homeClubId, nextFixture.awayClubId, currentDay.competition);
                  }}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Play size={16} fill="currentColor" />
                  Jogar Compromisso de Hoje
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    onAdvanceDay();
                  }}
                  className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <FastForward size={16} />
                  Concluir Dia e Avançar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {calendarWindow.map((day) => {
                const isToday = day.dayIndex === career.currentDayIndex;
                return (
                  <div
                    key={day.dayIndex}
                    className={`p-3 rounded-xl border ${
                      isToday
                        ? 'bg-emerald-500/15 border-emerald-500'
                        : day.completed
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-65'
                        : 'bg-[#111B2B] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-num font-bold text-emerald-400">
                        {day.weekday} · {day.dateLabel}
                      </span>
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        {day.activity}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-white mt-1">
                      {day.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{day.note}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'TREINO' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-white">
                  Centro de Treinamento & Minijogos em Pixel Art
                </h2>
                <p className="text-xs text-slate-400">
                  Seu desempenho nos minijogos gera XP gradual para evolução equilibrada. Descanse no calendário se a fadiga passar de 75%.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono-num text-xl font-extrabold text-emerald-400">
                    {career.trainingPoints}
                  </div>
                  <div className="text-[10px] text-slate-400">Sessões</div>
                </div>
                <div className="text-right">
                  <div className={`font-mono-num text-xl font-extrabold ${career.fatigue > 75 ? 'text-amber-400' : 'text-sky-400'}`}>
                    {career.fatigue}%
                  </div>
                  <div className="text-[10px] text-slate-400">Fadiga</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(['TODAS', 'FISICO', 'TECNICO', 'TATICO', 'GOLEIRO'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    clickSfx();
                    setDrillCat(cat);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    drillCat === cat
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {cat === 'TODAS' ? 'Todas Categorias' : cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleDrills.map((drill) => {
                const blocked = career.trainingPoints <= 0 || career.fatigue >= 90;
                return (
                  <div
                    key={drill.id}
                    className="p-4 rounded-xl bg-[#111B2B] border border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">{drill.category}</span>
                        <span className="text-slate-400 font-mono-num">
                          {drill.durationMin} min · {drill.difficulty}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-white mt-1">
                        {drill.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{drill.description}</p>
                      <div className="mt-2.5 text-[11px] text-slate-300 space-y-0.5">
                        <div>Evolução: <strong className="text-emerald-400">{drill.estimatedGain}</strong></div>
                        <div>XP: +{drill.xpReward} · Fadiga: +{drill.fatigueCost}%</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => {
                        clickSfx();
                        setActiveDrill(drill);
                      }}
                      className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 font-display font-bold text-xs cursor-pointer"
                    >
                      {career.fatigue >= 90
                        ? 'Fadiga Alta — Descanse'
                        : career.trainingPoints <= 0
                        ? 'Sem sessões'
                        : 'Iniciar Minijogo'}
                    </button>
                  </div>
                );
              })}
            </div>

            {career.trainingLog.length > 0 && (
              <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4">
                <h3 className="font-display font-bold text-sm text-white mb-2">
                  Treinamentos Realizados
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {career.trainingLog.slice(0, 6).map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-800"
                    >
                      <span className="text-slate-300 truncate">
                        {log.dayLabel} · {log.drillName}
                      </span>
                      <span className="font-mono-num text-emerald-400 font-semibold shrink-0 pl-2">
                        {log.medal} · {log.gainText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'COMPETICOES' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCell label="Brasileirão" value={`${club.division} · Rod. ${career.round}/${maxRound}`} highlight />
              <InfoCell label="Copa Nacional" value={career.copaStage} />
              <InfoCell label="Campeonato Estadual" value={career.estadualStage} />
              <InfoCell label="Supercopa Nacional" value={career.season > 2026 ? 'Classificado' : 'Aguardando campeões'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <section className="lg:col-span-7 bg-[#111B2B] border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <h2 className="font-display font-bold text-sm text-white mb-3">
                  Tabela Completa — Brasileirão Série A ({career.season})
                </h2>
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 pr-2">#</th>
                      <th className="py-1.5">Clube</th>
                      <th className="py-1.5 text-center">J</th>
                      <th className="py-1.5 text-center">V</th>
                      <th className="py-1.5 text-center">E</th>
                      <th className="py-1.5 text-center">D</th>
                      <th className="py-1.5 text-center">GP</th>
                      <th className="py-1.5 text-center">GC</th>
                      <th className="py-1.5 text-center">SG</th>
                      <th className="py-1.5 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {career.standings.map((row, idx) => {
                      const c = getClubById(row.clubId);
                      const isMine = row.clubId === career.clubId;
                      return (
                        <tr
                          key={row.clubId}
                          className={isMine ? 'bg-emerald-500/12 text-emerald-300 font-semibold' : 'text-slate-300'}
                        >
                          <td className="py-1.5 pr-2 font-mono-num">{idx + 1}</td>
                          <td className="py-1.5 flex items-center gap-2">
                            <ClubCrest club={c} size={18} />
                            <span className="truncate max-w-[150px]">{c.name}</span>
                          </td>
                          <td className="py-1.5 text-center font-mono-num">{row.played}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.won}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.drawn}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.lost}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.gf}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.ga}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.gf - row.ga}</td>
                          <td className="py-1.5 text-right font-mono-num font-bold">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              <section className="lg:col-span-5 space-y-4">
                <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4">
                  <h3 className="font-display font-bold text-sm text-white mb-2.5">
                    Artilharia da Temporada
                  </h3>
                  <div className="space-y-1.5">
                    {topScorers.map((p, idx) => (
                      <div key={p.playerId} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-900/70">
                        <span className={p.playerId === 'user_player' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {idx + 1}. {p.name} ({getClubById(p.clubId).shortName})
                        </span>
                        <span className="font-mono-num font-bold text-white">{p.goals} gols</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4">
                  <h3 className="font-display font-bold text-sm text-white mb-2.5">
                    Líderes em Assistências
                  </h3>
                  <div className="space-y-1.5">
                    {topAssists.map((p, idx) => (
                      <div key={p.playerId} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-900/70">
                        <span className={p.playerId === 'user_player' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {idx + 1}. {p.name} ({getClubById(p.clubId).shortName})
                        </span>
                        <span className="font-mono-num font-bold text-white">{p.assists} assist.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'PERFIL' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCell
                label="Nome Completo"
                value={`${career.personal.firstName} ${career.personal.lastName}`}
              />
              <InfoCell label="Idade / Nascimento" value={`${age} anos (${career.personal.birthDate})`} />
              <InfoCell label="Naturalidade" value={`${career.personal.hometown} (${career.personal.nationality})`} />
              <InfoCell label="Físico & Pé" value={`${career.personal.heightCm}cm · ${career.personal.weightKg}kg · ${career.gear.dominantFoot}`} />
              <InfoCell label="Posição & Estilo" value={`${posMeta.name} (${career.playstyle})`} />
              <InfoCell label="Overall Atual" value={`${career.ovr} / 99`} highlight />
              <InfoCell
                label="Seleção Nacional"
                value={career.nationalTeamCalled ? 'Convocado!' : 'Em observação'}
                highlight={career.nationalTeamCalled}
              />
              <InfoCell
                label="Condição Física"
                value={career.injuryMatchesRemaining > 0 ? career.injuryType || 'Lesionado' : '100% Apto'}
              />
            </div>

            <EvolutionChart points={career.evolutionHistory || []} />

            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4">
              <h2 className="font-display font-bold text-sm text-white mb-3">
                Mapa Completo de Atributos (0–100)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ATTRIBUTE_LABELS.map((item) => {
                  const val = career.attributes[item.key];
                  return (
                    <div
                      key={item.key}
                      className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="font-mono-num font-bold text-emerald-400">{val}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'CONTRATO' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="font-display font-bold text-base text-white">Contrato Atual</h2>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/75 border border-slate-800">
                <ClubCrest club={club} size={46} />
                <div>
                  <div className="font-display font-bold text-sm text-white">{club.name}</div>
                  <div className="text-xs text-slate-400">{club.division} · Status: {career.contract.role}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoCell
                  label="Salário Semanal"
                  value={`R$ ${career.contract.weeklySalary.toLocaleString('pt-BR')}`}
                  highlight
                />
                <InfoCell
                  label="Duração Restante"
                  value={`${career.contract.yearsRemaining} ano(s)`}
                />
              </div>
            </section>

            <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="font-display font-bold text-base text-white">
                Propostas & Interesse de Clubes
              </h2>
              {career.offers.length === 0 ? (
                <p className="text-xs text-slate-400 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  Nenhuma proposta ativa nesta rodada. Boas atuações e gols atraem olheiros de novos clubes a cada 3 rodadas!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {career.offers.map((off) => (
                    <div
                      key={off.id}
                      className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-400">{off.type} · {off.division}</div>
                        <div className="font-display font-bold text-sm text-white truncate">{off.clubName}</div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          R$ {off.weeklySalary.toLocaleString('pt-BR')}/sem · {off.years} ano(s) · {off.role}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.play('celebration');
                          onAcceptOffer(off);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        Assinar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'ESTATS' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-white">
                Estatísticas Individuais
              </h2>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['TEMPORADA', 'CARREIRA'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => {
                      clickSfx();
                      setStatScope(sc);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                      statScope === sc ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    {sc === 'TEMPORADA' ? `Temporada ${career.season}` : 'Toda Carreira'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
              <InfoCell label="Partidas" value={String(activeStats.matches)} />
              <InfoCell label="Gols" value={String(activeStats.goals)} highlight />
              <InfoCell label="Assistências" value={String(activeStats.assists)} highlight />
              <InfoCell
                label="Passes Certos/Err."
                value={`${activeStats.passesCompleted}/${activeStats.passesMissed}`}
              />
              <InfoCell
                label="Chutes (No Gol)"
                value={`${activeStats.shots} (${activeStats.shotsOnTarget})`}
              />
              <InfoCell label="Dribles Certos" value={String(activeStats.dribblesCompleted)} />
              <InfoCell label="Desarmes" value={String(activeStats.tackles)} />
              <InfoCell label="Interceptações" value={String(activeStats.interceptions)} />
              <InfoCell
                label="Cartões (AM/VM)"
                value={`${activeStats.yellowCards}/${activeStats.redCards}`}
              />
              <InfoCell label="Minutos Jogados" value={String(activeStats.minutesPlayed)} />
              <InfoCell label="Nota Média" value={avgRating} highlight />
              <InfoCell label="Defesas (GOL)" value={String(activeStats.saves)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4">
                <h3 className="font-display font-bold text-sm text-white mb-2.5">
                  Histórico de Partidas Recentes
                </h3>
                {career.recentMatches.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma partida disputada ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll">
                    {career.recentMatches.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-slate-900/75 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white font-mono-num">
                            {m.homeName} {m.homeScore} x {m.awayScore} {m.awayName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {m.competition} · Rod. {m.round} · {m.stadiumName} ({m.weather})
                          </div>
                        </div>
                        <div className="text-right font-mono-num">
                          <div className="font-bold text-emerald-400">Nota {m.rating.toFixed(1)}</div>
                          {m.motm && <div className="text-[10px] text-amber-400">Craque do Jogo</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <Award size={16} className="text-amber-400" />
                  Prêmios & Histórico Profissional
                </h3>
                {career.awards.length > 0 && (
                  <div className="space-y-1.5">
                    {career.awards.map((aw) => (
                      <div key={aw.id} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
                        {aw.title} — {aw.clubName}
                      </div>
                    ))}
                  </div>
                )}
                {career.history.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    O resumo por temporada será registrado ao concluir as {maxRound} rodadas.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {career.history.map((h, i) => (
                      <div key={i} className="text-xs text-slate-300 flex justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg">
                        <span>{h.season} · {h.clubName}</span>
                        <span className="font-mono-num">{h.matches}J · {h.goals}G · {h.assists}A · {h.avgRating}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {activeDrill && (
        <TrainingMinigame
          drill={activeDrill}
          career={career}
          onComplete={(medal) => {
            onCompleteDrill(activeDrill, medal);
            setActiveDrill(null);
          }}
          onCancel={() => setActiveDrill(null)}
        />
      )}
    </div>
  );
};

function MiniMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className="font-mono-num text-sm font-bold text-white">{value}%</div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-slate-900/75 border border-slate-800">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div
        className={`text-xs sm:text-sm font-bold truncate mt-0.5 font-mono-num ${
          highlight ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

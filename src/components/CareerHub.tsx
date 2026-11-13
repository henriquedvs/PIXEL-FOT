import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  FastForward,
  Home,
  LayoutDashboard,
  Newspaper,
  Play,
  Settings,
  SkipForward,
  Target,
  Trophy,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { ATTRIBUTE_LABELS, getPositionMeta } from '../data/positions';
import { generateMatchEnvironment, getStadiumForClub } from '../data/stadiums';
import { TRAINING_DRILLS } from '../data/trainingDrills';
import { buildAutoHighlights } from '../engine/competitions';
import {
  MatchStatLine,
  NewsCategory,
  PlayerCareer,
  TrainingCategory,
  TrainingDrill,
  TransferOffer,
} from '../types/game';
import { calculateAge } from '../utils/storage';
import { ClubCrest } from './ClubCrest';
import { CompetitionsBrowserScreen } from './CompetitionsBrowserScreen';
import { EvolutionChart } from './EvolutionChart';
import {
  PixelNewspaperIcon,
  PixelStadiumIcon,
  PixelTargetIcon,
  PixelTrophyIcon,
} from './PixelIcons';
import { PixelPortrait } from './PixelPortrait';
import { SeasonCalendarView } from './SeasonCalendarView';
import { TrainingMinigame } from './TrainingMinigame';

interface CareerHubProps {
  career: PlayerCareer;
  onPlayMatch: (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => void;
  onSimulateInjurySkip: (homeClubId: string, awayClubId: string) => void;
  onAdvanceDay: () => void;
  onAdvanceToNextMatch: () => void;
  onCompleteDrill: (drill: TrainingDrill, medal: 'Ouro' | 'Prata' | 'Bronze') => void;
  onAcceptOffer: (offer: TransferOffer) => void;
  onOpenSettings: () => void;
  onBackToMenu: () => void;
}

type HubTab =
  | 'CENTRAL'
  | 'CALENDARIO'
  | 'TREINO'
  | 'COMPETICOES'
  | 'NOTICIAS'
  | 'OBJETIVOS'
  | 'ESTATS'
  | 'CONTRATO';

export const CareerHub: React.FC<CareerHubProps> = ({
  career,
  onPlayMatch,
  onSimulateInjurySkip,
  onAdvanceDay,
  onAdvanceToNextMatch,
  onCompleteDrill,
  onAcceptOffer,
  onOpenSettings,
  onBackToMenu,
}) => {
  const [tab, setTab] = useState<HubTab>('CENTRAL');
  const [statScope, setStatScope] = useState<'TEMPORADA' | 'CARREIRA'>('TEMPORADA');
  const [drillCat, setDrillCat] = useState<'TODAS' | TrainingCategory>('TODAS');
  const [newsFilter, setNewsFilter] = useState<'TODAS' | NewsCategory>('TODAS');
  const [activeDrill, setActiveDrill] = useState<TrainingDrill | null>(null);

  const club = getClubById(career.clubId);
  const posMeta = getPositionMeta(career.position);
  const age = calculateAge(career.personal.birthDate);
  const maxRound = career.schedule.reduce((m, f) => Math.max(m, f.round), 38);
  const currentDay = career.calendar[career.currentDayIndex];

  // Resolve next fixture cleanly: if current or upcoming calendar day is PARTIDA (e.g., Supercopa / Copa do Brasil / Brasileirão) use it!
  const nextCalendarMatch = useMemo(() => {
    return career.calendar.find(
      (d, idx) => idx >= career.currentDayIndex && !d.completed && d.activity === 'PARTIDA'
    );
  }, [career.calendar, career.currentDayIndex]);

  const nextScheduleFixture = useMemo(() => {
    return (
      career.schedule.find(
        (f) =>
          f.round === career.round &&
          (f.homeClubId === career.clubId || f.awayClubId === career.clubId)
      ) || career.schedule[0]
    );
  }, [career.schedule, career.round, career.clubId]);

  const nextFixture = useMemo(() => {
    if (nextCalendarMatch && nextCalendarMatch.opponentClubId) {
      const homeClubId = nextCalendarMatch.isHome ? career.clubId : nextCalendarMatch.opponentClubId;
      const awayClubId = nextCalendarMatch.isHome ? nextCalendarMatch.opponentClubId : career.clubId;
      return {
        homeClubId,
        awayClubId,
        competition: nextCalendarMatch.competition || 'Brasileirão Série A',
        fixtureId: nextCalendarMatch.matchId,
        dateLabel: nextCalendarMatch.dateLabel,
      };
    }
    return {
      homeClubId: nextScheduleFixture.homeClubId,
      awayClubId: nextScheduleFixture.awayClubId,
      competition: nextScheduleFixture.competition || 'Brasileirão Série A',
      fixtureId: `serieA_${career.season}_r${career.round}`,
      dateLabel: currentDay?.dateLabel || `Rod. ${career.round}`,
    };
  }, [nextCalendarMatch, nextScheduleFixture, career.clubId, career.season, career.round, currentDay?.dateLabel]);

  const homeClub = getClubById(nextFixture.homeClubId);
  const awayClub = getClubById(nextFixture.awayClubId);
  const stadium = getStadiumForClub(homeClub);

  const nextEnv = useMemo(() => {
    return generateMatchEnvironment({
      homeClub,
      competitionName: nextFixture.competition,
      roundLabel: nextFixture.competition.includes('Série A')
        ? `Rodada ${career.round}`
        : nextFixture.competition,
      dateStr: nextFixture.dateLabel,
      seed: career.season * 31 + career.round * 7 + (nextCalendarMatch?.dayIndex ?? 0),
    });
  }, [homeClub, nextFixture, career.round, career.season, nextCalendarMatch?.dayIndex]);

  const highlights = useMemo(() => buildAutoHighlights(career), [career]);
  const leaguePos = career.standings.findIndex((s) => s.clubId === career.clubId) + 1;

  // Compact table slice around user's club or Top 6
  const quickTableRows = useMemo(() => {
    const top5 = career.standings.slice(0, 6);
    if (leaguePos > 6) {
      const myRow = career.standings[leaguePos - 1];
      if (myRow) return [...top5.slice(0, 5), myRow];
    }
    return top5;
  }, [career.standings, leaguePos]);

  const activeStats: MatchStatLine =
    statScope === 'TEMPORADA' ? career.seasonStats : career.careerStats;

  const avgRating =
    activeStats.matches > 0
      ? (activeStats.ratingSum / activeStats.matches).toFixed(2)
      : '—';

  const clickSfx = () => soundEngine.play('menu');

  const visibleDrills =
    drillCat === 'TODAS'
      ? TRAINING_DRILLS
      : TRAINING_DRILLS.filter((d) => d.category === drillCat);

  const visibleNews =
    newsFilter === 'TODAS'
      ? career.news || []
      : (career.news || []).filter((n) => n.category === newsFilter);

  const isTodayMatchDay = currentDay?.activity === 'PARTIDA' && !currentDay.completed;
  const completedObjectivesCount = (career.objectives || []).filter((o) => o.completed).length;

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden animate-fadeIn">
      {/* Top Bar */}
      <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <PixelPortrait
            skinColor={career.appearance.skinColor}
            hairColor={career.appearance.hairColor}
            hairStyle={career.appearance.hairStyle}
            shirtPrimary={club.kit.primary}
            shirtSecondary={club.kit.secondary}
            size={36}
          />
          <ClubCrest club={club} size={34} className="shrink-0" />
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
            <span className="hidden md:inline-block text-xs font-mono-num text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
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
            { id: 'CENTRAL', label: 'Central da Carreira', icon: LayoutDashboard },
            { id: 'CALENDARIO', label: 'Calendário', icon: Calendar },
            { id: 'TREINO', label: `Treinos (${career.trainingPoints})`, icon: Dumbbell },
            { id: 'COMPETICOES', label: 'Competições', icon: Trophy },
            { id: 'NOTICIAS', label: `Notícias (${(career.news || []).length})`, icon: Newspaper },
            {
              id: 'OBJETIVOS',
              label: `Objetivos (${completedObjectivesCount}/${(career.objectives || []).length})`,
              icon: Target,
            },
            { id: 'ESTATS', label: 'Perfil & Estats', icon: BarChart3 },
            { id: 'CONTRATO', label: `Contrato (${career.offers.length})`, icon: Briefcase },
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
      <main className="flex-1 overflow-y-auto custom-scroll">
        {tab === 'CENTRAL' && (
          <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Player Identity Card + Auto Highlights + Next Match */}
            <div className="lg:col-span-7 space-y-4">
              {/* Player Card */}
              <section className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <PixelPortrait
                    skinColor={career.appearance.skinColor}
                    hairColor={career.appearance.hairColor}
                    hairStyle={career.appearance.hairStyle}
                    shirtPrimary={club.kit.primary}
                    shirtSecondary={club.kit.secondary}
                    size={56}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase text-emerald-400">
                      Temp. {career.season} · {career.contract.role} · #{career.gear.jerseyNumber}
                    </div>
                    <h1 className="font-display font-extrabold text-lg text-white truncate">
                      {career.personal.nickname || `${career.personal.firstName} ${career.personal.lastName}`}
                    </h1>
                    <div className="text-xs text-slate-400 truncate">
                      {age} anos · {career.personal.nationality} · {posMeta.name} · {club.name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 shrink-0">
                  <MiniMeter label="OVR" value={career.ovr} unit="" highlight />
                  <MiniMeter label="Série A" value={leaguePos || 1} unit="º" />
                  <MiniMeter label="Gols" value={career.seasonStats.goals} unit="" />
                  <MiniMeter label="Assist." value={career.seasonStats.assists} unit="" />
                </div>
              </section>

              {/* Auto Highlights Feed */}
              <section className="bg-[#111B2B] border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <PixelTrophyIcon size={16} />
                  Destaques da Semana
                </h2>
                <ul className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <li
                      key={i}
                      className="text-xs text-slate-200 bg-slate-900/75 border border-slate-800/90 rounded-lg px-3 py-2 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Next Match Card + Calendar Controls */}
              <section className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-emerald-400">
                    {nextEnv.competitionName} · {nextFixture.dateLabel}
                  </span>
                  <span className="text-slate-400">
                    {nextEnv.weather} · {nextEnv.temperatureC}°C · {nextEnv.kickoffTime}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex flex-col items-center text-center w-2/5">
                    <ClubCrest club={homeClub} size={50} />
                    <div className="font-display font-bold text-sm text-white mt-1.5 truncate w-full">
                      {homeClub.name}
                    </div>
                    <div className="text-[10px] text-slate-400">Mandante</div>
                  </div>

                  <div className="text-center">
                    <div className="font-display font-extrabold text-xl text-slate-500">VS</div>
                    <div className="text-[10px] text-slate-400 mt-1">{stadium.name}</div>
                  </div>

                  <div className="flex flex-col items-center text-center w-2/5">
                    <ClubCrest club={awayClub} size={50} />
                    <div className="font-display font-bold text-sm text-white mt-1.5 truncate w-full">
                      {awayClub.name}
                    </div>
                    <div className="text-[10px] text-slate-400">Visitante</div>
                  </div>
                </div>

                {career.injuryMatchesRemaining > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                    <Activity size={16} className="shrink-0 text-amber-400" />
                    <span>
                      Departamento Médico: {career.injuryType} ({career.injuryMatchesRemaining} jogo restante)
                    </span>
                  </div>
                )}

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
                ) : isTodayMatchDay ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.play('whistle');
                      onPlayMatch(
                        nextFixture.homeClubId,
                        nextFixture.awayClubId,
                        nextEnv.competitionName,
                        nextFixture.fixtureId
                      );
                    }}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Play size={18} fill="currentColor" />
                    Ir para o Estádio (Partida 11v11)
                  </button>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        clickSfx();
                        onAdvanceDay();
                      }}
                      className="py-3 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FastForward size={14} />
                      Avançar 1 Dia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clickSfx();
                        onAdvanceToNextMatch();
                      }}
                      className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <SkipForward size={14} />
                      Ir até Dia do Jogo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.play('whistle');
                        onPlayMatch(
                          nextFixture.homeClubId,
                          nextFixture.awayClubId,
                          nextEnv.competitionName,
                          nextFixture.fixtureId
                        );
                      }}
                      className="py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play size={14} fill="currentColor" />
                      Jogar Agora
                    </button>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Quick Standings + Recent Results + Objectives + News */}
            <div className="lg:col-span-5 space-y-4">
              {/* Quick Standings */}
              <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display font-bold text-sm text-white">
                    Brasileirão Série A · Rodada {career.round}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      clickSfx();
                      setTab('COMPETICOES');
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Ver completa
                  </button>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-1 pr-2">#</th>
                      <th className="py-1">Clube</th>
                      <th className="py-1 text-center">J</th>
                      <th className="py-1 text-center">SG</th>
                      <th className="py-1 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {quickTableRows.map((row) => {
                      const rank = career.standings.findIndex((s) => s.clubId === row.clubId) + 1;
                      const c = getClubById(row.clubId);
                      const isMine = row.clubId === career.clubId;
                      return (
                        <tr
                          key={row.clubId}
                          className={isMine ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-slate-300'}
                        >
                          <td className="py-1.5 pr-2 font-mono-num">{rank}</td>
                          <td className="py-1.5 flex items-center gap-2">
                            <ClubCrest club={c} size={17} />
                            <span className="truncate max-w-[140px]">{c.name}</span>
                          </td>
                          <td className="py-1.5 text-center font-mono-num">{row.played}</td>
                          <td className="py-1.5 text-center font-mono-num">{row.gf - row.ga}</td>
                          <td className="py-1.5 text-right font-mono-num font-bold text-white">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              {/* Season Objectives Summary */}
              <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    <PixelTargetIcon size={16} />
                    Objetivos da Temporada
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      clickSfx();
                      setTab('OBJETIVOS');
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Todos ({completedObjectivesCount}/{(career.objectives || []).length})
                  </button>
                </div>
                <div className="space-y-2">
                  {(career.objectives || []).slice(0, 3).map((obj) => {
                    const pct =
                      obj.kind === 'LEAGUE_POS'
                        ? obj.current <= obj.target
                          ? 100
                          : Math.max(10, Math.round((obj.target / Math.max(1, obj.current)) * 100))
                        : Math.min(100, Math.round((obj.current / Math.max(1, obj.target)) * 100));
                    return (
                      <div key={obj.id} className="p-2.5 rounded-lg bg-slate-900/75 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white truncate">{obj.title}</span>
                          <span className="font-mono-num text-[11px] text-emerald-400 shrink-0 pl-2">
                            {obj.completed
                              ? 'Concluído'
                              : obj.kind === 'LEAGUE_POS'
                              ? `${obj.current}º / Top ${obj.target}`
                              : `${obj.current}/${obj.target}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${obj.completed ? 'bg-amber-400' : 'bg-emerald-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Recent News + Latest Results */}
              <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    <PixelNewspaperIcon size={16} />
                    Notícias Recentes
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      clickSfx();
                      setTab('NOTICIAS');
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Abrir Portal
                  </button>
                </div>
                <div className="space-y-2">
                  {(career.news || []).slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-slate-900/75 border border-slate-800 flex items-start gap-2.5"
                    >
                      <ClubCrest club={getClubById(n.clubId || career.clubId)} size={26} className="shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase font-mono-num">
                          {n.category} · {n.dateLabel}
                        </div>
                        <div className="text-xs font-semibold text-white leading-snug line-clamp-2">
                          {n.headline}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'CALENDARIO' && (
          <SeasonCalendarView
            career={career}
            onPlayMatch={onPlayMatch}
            onAdvanceDay={onAdvanceDay}
            onAdvanceToNextMatch={onAdvanceToNextMatch}
          />
        )}

        {tab === 'TREINO' && (
          <div className="max-w-6xl mx-auto p-4 space-y-4">
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
                    drillCat === cat ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
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
                        <div>
                          Evolução: <strong className="text-emerald-400">{drill.estimatedGain}</strong>
                        </div>
                        <div>
                          XP: +{drill.xpReward} · Fadiga: +{drill.fatigueCost}%
                        </div>
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

        {tab === 'COMPETICOES' && <CompetitionsBrowserScreen career={career} />}

        {tab === 'NOTICIAS' && (
          <div className="max-w-5xl mx-auto p-4 space-y-4">
            <div className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PixelNewspaperIcon size={28} />
                <div>
                  <h2 className="font-display font-extrabold text-base text-white">
                    Portal de Notícias Pixel Football
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cobertura automática da temporada {career.season}, copa, artilharia e mercado
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {(['TODAS', 'RODADA', 'COPA', 'SUPERCOPA', 'ARTILHARIA', 'MERCADO', 'DESTAQUE'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        clickSfx();
                        setNewsFilter(cat);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        newsFilter === cat
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {visibleNews.length === 0 ? (
              <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
                Nenhuma notícia registrada nesta categoria ainda. Dispute jogos e avançe no calendário!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleNews.map((item) => {
                  const mainClub = item.clubId ? getClubById(item.clubId) : club;
                  const opp = item.opponentClubId ? getClubById(item.opponentClubId) : null;
                  return (
                    <article
                      key={item.id}
                      className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 flex gap-3.5 items-start"
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 relative">
                        {item.artKind === 'trophy' ? (
                          <PixelTrophyIcon size={32} />
                        ) : item.artKind === 'stadium' ? (
                          <PixelStadiumIcon size={32} />
                        ) : (
                          <ClubCrest club={mainClub} size={38} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono-num">
                          <span className="font-bold uppercase text-emerald-400">{item.category}</span>
                          <span className="text-slate-400">
                            {item.dateLabel} · T{item.season}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-sm text-white leading-snug">
                          {item.headline}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.summary}</p>
                        {opp && (
                          <div className="text-[10px] text-slate-500 pt-1">
                            {mainClub.shortName} · {opp.shortName}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'OBJETIVOS' && (
          <div className="max-w-5xl mx-auto p-4 space-y-4">
            <div className="bg-[#111B2B] border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PixelTargetIcon size={28} />
                <div>
                  <h2 className="font-display font-extrabold text-base text-white">
                    Metas da Temporada {career.season}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Conclua objetivos individuais e coletivos para ganhar XP, moral e confiança do treinador
                  </p>
                </div>
              </div>
              <div className="font-mono-num text-sm font-extrabold text-emerald-400">
                {completedObjectivesCount} / {(career.objectives || []).length} concluídos
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(career.objectives || []).map((obj) => {
                const pct =
                  obj.kind === 'LEAGUE_POS'
                    ? obj.current <= obj.target
                      ? 100
                      : Math.max(10, Math.round((obj.target / Math.max(1, obj.current)) * 100))
                    : Math.min(100, Math.round((obj.current / Math.max(1, obj.target)) * 100));
                return (
                  <div
                    key={obj.id}
                    className={`p-4 rounded-xl border space-y-2.5 ${
                      obj.completed
                        ? 'bg-emerald-500/12 border-emerald-500/50'
                        : 'bg-[#111B2B] border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                          {obj.completed && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
                          {obj.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{obj.description}</p>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-emerald-400 shrink-0">
                        {obj.kind === 'LEAGUE_POS'
                          ? `${obj.current}º / Top ${obj.target}`
                          : `${obj.current}/${obj.target}`}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          obj.completed ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Recompensa: {obj.rewardText}</span>
                      <span className={obj.completed ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                        {obj.completed ? 'Meta Alcançada' : 'Em Progresso'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'ESTATS' && (
          <div className="max-w-6xl mx-auto p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold text-base text-white">
                Estatísticas, Evolução & Histórico Profissional
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
              <InfoCell label="Titularidades" value={String(career.startsCount ?? activeStats.matches)} />
              <InfoCell label="Gols" value={String(activeStats.goals)} highlight />
              <InfoCell label="Assistências" value={String(activeStats.assists)} highlight />
              <InfoCell
                label="Participações (G+A)"
                value={String(activeStats.goals + activeStats.assists)}
                highlight
              />
              <InfoCell label="Nota Média" value={avgRating} highlight />
              <InfoCell
                label="Passes Certos/Err."
                value={`${activeStats.passesCompleted}/${activeStats.passesMissed}`}
              />
              <InfoCell
                label="Chutes (No Gol)"
                value={`${activeStats.shots} (${activeStats.shotsOnTarget})`}
              />
              <InfoCell label="Dribles Certos" value={String(activeStats.dribblesCompleted)} />
              <InfoCell label="Desarmes + Interc." value={String(activeStats.tackles + activeStats.interceptions)} />
              <InfoCell
                label="Cartões (AM/VM)"
                value={`${activeStats.yellowCards}/${activeStats.redCards}`}
              />
              <InfoCell label="Minutos Jogados" value={String(activeStats.minutesPlayed)} />
            </div>

            <EvolutionChart points={career.evolutionHistory || []} />

            <div className="bg-[#111B2B] border border-slate-800 rounded-xl p-4">
              <h3 className="font-display font-bold text-sm text-white mb-3">
                Mapa Completo de Atributos ({posMeta.name} · {career.playstyle})
              </h3>
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
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
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
                            {m.penHomeScore !== undefined && m.penAwayScore !== undefined && m.homeScore === m.awayScore
                              ? ` (${m.penHomeScore}-${m.penAwayScore} pên.)`
                              : ''}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {m.competition} · {m.stadiumName} ({m.weather})
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
                  Títulos, Prêmios & Clubes
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
                    O resumo anual por clube será arquivado ao concluir as {maxRound} rodadas.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {career.history.map((h, i) => (
                      <div key={i} className="text-xs text-slate-300 flex justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg">
                        <span>
                          {h.season} · {h.clubName}
                        </span>
                        <span className="font-mono-num">
                          {h.matches}J · {h.goals}G · {h.assists}A · {h.avgRating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {tab === 'CONTRATO' && (
          <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="font-display font-bold text-base text-white">Contrato Atual</h2>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/75 border border-slate-800">
                <ClubCrest club={club} size={46} />
                <div>
                  <div className="font-display font-bold text-sm text-white">{club.name}</div>
                  <div className="text-xs text-slate-400">
                    {club.division} · Status: {career.contract.role}
                  </div>
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
                        <div className="text-xs font-bold text-emerald-400">
                          {off.type} · {off.division}
                        </div>
                        <div className="font-display font-bold text-sm text-white truncate">
                          {off.clubName}
                        </div>
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

function MiniMeter({
  label,
  value,
  unit = '%',
  highlight = false,
}: {
  label: string;
  value: number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-2 rounded-lg bg-slate-900/75 border border-slate-800 text-center min-w-[54px]">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`font-mono-num text-sm font-extrabold ${highlight ? 'text-emerald-400' : 'text-white'}`}>
        {value}
        {unit}
      </div>
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

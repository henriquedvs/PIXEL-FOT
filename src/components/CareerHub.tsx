import React, { useEffect, useMemo, useState } from 'react';
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
  MessageSquare,
  Newspaper,
  Play,
  Settings,
  SkipForward,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import { ATTRIBUTE_LABELS, getPositionMeta } from '../data/positions';
import { generateMatchEnvironment, getStadiumForClub } from '../data/stadiums';
import { TRAINING_DRILLS } from '../data/trainingDrills';
import { buildAutoHighlights } from '../engine/competitions';
import {
  CalendarDay,
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
import { CareerHubTab } from './MainMenu';
import {
  PixelNewspaperIcon,
  PixelStadiumIcon,
  PixelTargetIcon,
  PixelTrophyIcon,
} from './PixelIcons';
import { PixelPortrait } from './PixelPortrait';
import { SeasonCalendarView } from './SeasonCalendarView';
import { SquadBrowserScreen } from './SquadBrowserScreen';
import { TrainingMinigame } from './TrainingMinigame';
import './CareerHub.css';

interface CareerHubProps {
  career: PlayerCareer;
  initialTab?: CareerHubTab;
  onPlayMatch: (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => void;
  onSimulateMatch: (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => void;
  onTriggerNarrativeEvent: (day: CalendarDay) => void;
  onSimulateInjurySkip: (homeClubId: string, awayClubId: string) => void;
  onAdvanceDay: () => void;
  onAdvanceToNextMatch: () => void;
  onCompleteDrill: (drill: TrainingDrill, medal: 'Ouro' | 'Prata' | 'Bronze') => void;
  onAcceptOffer: (offer: TransferOffer) => void;
  onOpenSettings: () => void;
  onBackToMenu: () => void;
}

export const CareerHub: React.FC<CareerHubProps> = ({
  career,
  initialTab,
  onPlayMatch,
  onSimulateMatch,
  onTriggerNarrativeEvent,
  onSimulateInjurySkip,
  onAdvanceDay,
  onAdvanceToNextMatch,
  onCompleteDrill,
  onAcceptOffer,
  onOpenSettings,
  onBackToMenu,
}) => {
  const [tab, setTab] = useState<CareerHubTab>(initialTab || 'CENTRAL');
  const [statScope, setStatScope] = useState<'TEMPORADA' | 'CARREIRA'>('TEMPORADA');
  const [drillCat, setDrillCat] = useState<'TODAS' | TrainingCategory>('TODAS');
  const [newsFilter, setNewsFilter] = useState<'TODAS' | NewsCategory>('TODAS');
  const [activeDrill, setActiveDrill] = useState<TrainingDrill | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const club = getClubById(career.clubId);
  const posMeta = getPositionMeta(career.position);
  const age = calculateAge(career.personal.birthDate);
  const activeDivision = career.division || 'Série A';
  const activeStandings =
    activeDivision === 'Série B' && career.serieBStandings?.length
      ? career.serieBStandings
      : career.standings;
  const activeSchedule =
    activeDivision === 'Série B' && career.serieBSchedule?.length
      ? career.serieBSchedule
      : career.schedule;
  const maxRound = activeSchedule.reduce((m, f) => Math.max(m, f.round), 38);
  const currentDay = career.calendar[career.currentDayIndex];

  // Resolve next fixture dynamically for Série A, Série B, Copa do Brasil, or Supercopa
  const nextCalendarMatch = useMemo(() => {
    return career.calendar.find(
      (d, idx) => idx >= career.currentDayIndex && !d.completed && d.activity === 'PARTIDA'
    );
  }, [career.calendar, career.currentDayIndex]);

  const nextScheduleFixture = useMemo(() => {
    return (
      activeSchedule.find(
        (f) =>
          f.round === career.round &&
          (f.homeClubId === career.clubId || f.awayClubId === career.clubId)
      ) || activeSchedule[0]
    );
  }, [activeSchedule, career.round, career.clubId]);

  const nextFixture = useMemo(() => {
    const defaultComp = `Brasileirão ${activeDivision}`;
    if (nextCalendarMatch && nextCalendarMatch.opponentClubId) {
      const homeClubId = nextCalendarMatch.isHome ? career.clubId : nextCalendarMatch.opponentClubId;
      const awayClubId = nextCalendarMatch.isHome ? nextCalendarMatch.opponentClubId : career.clubId;
      return {
        homeClubId,
        awayClubId,
        competition: nextCalendarMatch.competition || defaultComp,
        fixtureId: nextCalendarMatch.matchId,
        dateLabel: nextCalendarMatch.dateLabel,
      };
    }
    const prefix = activeDivision === 'Série B' ? 'serieB' : 'serieA';
    return {
      homeClubId: nextScheduleFixture.homeClubId,
      awayClubId: nextScheduleFixture.awayClubId,
      competition: nextScheduleFixture.competition || defaultComp,
      fixtureId: `${prefix}_${career.season}_r${career.round}`,
      dateLabel: currentDay?.dateLabel || `Rod. ${career.round}`,
    };
  }, [
    nextCalendarMatch,
    nextScheduleFixture,
    career.clubId,
    career.season,
    career.round,
    currentDay?.dateLabel,
    activeDivision,
  ]);

  const homeClub = getClubById(nextFixture.homeClubId);
  const awayClub = getClubById(nextFixture.awayClubId);
  const stadium = getStadiumForClub(homeClub);

  const nextEnv = useMemo(() => {
    return generateMatchEnvironment({
      homeClub,
      competitionName: nextFixture.competition,
      roundLabel:
        nextFixture.competition.includes('Série A') || nextFixture.competition.includes('Série B')
          ? `Rodada ${career.round}`
          : nextFixture.competition,
      dateStr: nextFixture.dateLabel,
      seed: career.season * 31 + career.round * 7 + (nextCalendarMatch?.dayIndex ?? 0),
    });
  }, [homeClub, nextFixture, career.round, career.season, nextCalendarMatch?.dayIndex]);

  const highlights = useMemo(() => buildAutoHighlights(career), [career]);
  const leaguePos = activeStandings.findIndex((s) => s.clubId === career.clubId) + 1;

  // Compact table slice around user's club or Top 6
  const quickTableRows = useMemo(() => {
    const top6 = activeStandings.slice(0, 6);
    if (leaguePos > 6) {
      const myRow = activeStandings[leaguePos - 1];
      if (myRow) return [...top6.slice(0, 5), myRow];
    }
    return top6;
  }, [activeStandings, leaguePos]);

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
  const canTriggerTodayEvent =
    Boolean(currentDay) &&
    !currentDay!.completed &&
    !currentDay!.narrativeEventId &&
    ['COMPROMISSO', 'ESPECIAL', 'TREINO', 'VIAGEM'].includes(currentDay!.activity);
  const completedObjectivesCount = (career.objectives || []).filter((o) => o.completed).length;
  const marketValueM = career.marketValue
    ? `R$ ${(career.marketValue / 1000000).toFixed(1)}M`
    : '—';

  return (
    <div className="career-hub-shell animate-fadeIn">
      <header className="career-topbar">
        <div className="career-club-identity">
          <ClubCrest club={club} size={32} />
          <div className="career-club-copy">
            <strong>{club.shortName || club.name}</strong>
            <span>
              {club.name} · {career.contract.role} · {activeDivision}
            </span>
          </div>
        </div>
        <div className="career-date-chip">
          <Calendar size={15} />
          <span>
            {currentDay
              ? `${currentDay.dateLabel} · ${currentDay.weekday} · T${career.season}`
              : `TEMPORADA ${career.season}`}
          </span>
        </div>
        <div className="career-top-actions">
          <button
            type="button"
            className="career-icon-button"
            onClick={() => {
              clickSfx();
              onOpenSettings();
            }}
            aria-label="Configurações"
            title="Configurações"
          >
            <Settings size={17} />
          </button>
          <button
            type="button"
            className="career-menu-button"
            onClick={() => {
              clickSfx();
              onBackToMenu();
            }}
          >
            <Home size={15} /> <span>Menu</span>
          </button>
        </div>
      </header>

      <main className="career-main custom-scroll">
        {tab === 'CENTRAL' && (
          <div className="career-overview">
            <section className="career-panel career-player-panel">
              <div className="career-panel-kicker">
                TEMPORADA {career.season} <span>·</span> {career.contract.role.toUpperCase()}
              </div>
              <div className="career-player-heading">
                <div className="career-player-avatar">
                  <PixelPortrait
                    skinColor={career.appearance.skinColor}
                    hairColor={career.appearance.hairColor}
                    hairStyle={career.appearance.hairStyle}
                    shirtPrimary={club.kit.primary}
                    shirtSecondary={club.kit.secondary}
                    size={74}
                  />
                </div>
                <div className="career-player-nameblock">
                  <h1>
                    {career.personal.nickname ||
                      `${career.personal.firstName} ${career.personal.lastName}`}
                  </h1>
                  <p>
                    #{career.gear.jerseyNumber} <span>·</span> {posMeta.name}
                    {career.secondaryPositions && career.secondaryPositions.length > 0
                      ? ` (${career.secondaryPositions.map((p) => getPositionMeta(p).code).join('/')})`
                      : ''}
                  </p>
                  <small>
                    {age} anos <span>·</span> {career.personal.nationality}
                    {career.personal.secondaryNationality
                      ? ` / ${career.personal.secondaryNationality}`
                      : ''}
                  </small>
                </div>
              </div>

              <div className="career-player-rating-row">
                <div className="career-overall">
                  <small>OVR / POT</small>
                  <strong>
                    {career.ovr}
                    <em>/{career.potential ?? career.ovr}</em>
                  </strong>
                </div>
                <div className="career-stat">
                  <small>GOLS / ASS.</small>
                  <strong>
                    {career.seasonStats.goals}/{career.seasonStats.assists}
                  </strong>
                </div>
                <div className="career-stat">
                  <small>MERCADO</small>
                  <strong>{marketValueM}</strong>
                </div>
              </div>

              <div className="career-club-row">
                <ClubCrest club={club} size={21} />
                <span>{club.name}</span>
                <b>
                  {leaguePos || 1}º na {activeDivision}
                </b>
              </div>

              {career.traits && career.traits.length > 0 && (
                <div className="career-traits-line">
                  {career.traits.slice(0, 2).join(' · ')}
                </div>
              )}

              <div className="career-fatigue-row">
                <span>FADIGA</span>
                <div>
                  <i style={{ width: `${Math.max(0, Math.min(100, career.fatigue))}%` }} />
                </div>
                <b>{career.fatigue}%</b>
              </div>
            </section>

            <section className="career-panel career-match-panel">
              <div className="career-panel-heading">
                <div>
                  <span className="career-eyebrow">
                    {nextEnv.competitionName} · {nextFixture.dateLabel}
                  </span>
                  <h2>PRÓXIMO JOGO</h2>
                </div>
                <span className="career-weather">
                  {nextEnv.weather} · {nextEnv.temperatureC}°
                </span>
              </div>
              <div className="career-fixture">
                <div className="career-team">
                  <ClubCrest club={homeClub} size={43} />
                  <strong>{homeClub.shortName || homeClub.name}</strong>
                  <small>{homeClub.name}</small>
                </div>
                <div className="career-versus">
                  VS<span>{stadium.name}</span>
                </div>
                <div className="career-team">
                  <ClubCrest club={awayClub} size={43} />
                  <strong>{awayClub.shortName || awayClub.name}</strong>
                  <small>{awayClub.name}</small>
                </div>
              </div>
              <div className="career-match-meta">
                <PixelStadiumIcon size={17} />
                <span>
                  {stadium.city || homeClub.city} · {nextEnv.kickoffTime}
                  {currentDay && !isTodayMatchDay ? ` · Hoje: ${currentDay.title}` : ''}
                </span>
              </div>
              {career.injuryMatchesRemaining > 0 && (
                <div className="career-injury-note">
                  <Activity size={14} /> Departamento Médico: {career.injuryType} ·{' '}
                  {career.injuryMatchesRemaining} jogo(s)
                </div>
              )}
              <div className="career-match-actions">
                {career.injuryMatchesRemaining > 0 ? (
                  <button
                    type="button"
                    className="career-action-primary is-warning"
                    onClick={() => {
                      clickSfx();
                      onSimulateInjurySkip(nextFixture.homeClubId, nextFixture.awayClubId);
                    }}
                  >
                    RECUPERAR E AVANÇAR <ChevronRight size={16} />
                  </button>
                ) : isTodayMatchDay ? (
                  <>
                    <button
                      type="button"
                      className="career-action-primary"
                      onClick={() => {
                        soundEngine.play('whistle');
                        onPlayMatch(
                          nextFixture.homeClubId,
                          nextFixture.awayClubId,
                          nextEnv.competitionName,
                          nextFixture.fixtureId
                        );
                      }}
                    >
                      <Play size={15} fill="currentColor" /> JOGAR PARTIDA
                    </button>
                    <button
                      type="button"
                      className="career-action-secondary"
                      onClick={() => {
                        clickSfx();
                        onSimulateMatch(
                          nextFixture.homeClubId,
                          nextFixture.awayClubId,
                          nextEnv.competitionName,
                          nextFixture.fixtureId
                        );
                      }}
                    >
                      <FastForward size={15} /> SIMULAR PARTIDA
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="career-action-primary"
                      onClick={() => {
                        soundEngine.play('whistle');
                        onPlayMatch(
                          nextFixture.homeClubId,
                          nextFixture.awayClubId,
                          nextEnv.competitionName,
                          nextFixture.fixtureId
                        );
                      }}
                    >
                      <Play size={15} fill="currentColor" /> JOGAR
                    </button>
                    <button
                      type="button"
                      className="career-action-secondary"
                      onClick={() => {
                        clickSfx();
                        onSimulateMatch(
                          nextFixture.homeClubId,
                          nextFixture.awayClubId,
                          nextEnv.competitionName,
                          nextFixture.fixtureId
                        );
                      }}
                    >
                      <FastForward size={14} /> SIMULAR
                    </button>
                    {canTriggerTodayEvent && currentDay ? (
                      <button
                        type="button"
                        className="career-action-event"
                        onClick={() => {
                          clickSfx();
                          onTriggerNarrativeEvent(currentDay);
                        }}
                      >
                        <MessageSquare size={14} /> EVENTO
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="career-action-tertiary"
                        onClick={() => {
                          clickSfx();
                          onAdvanceDay();
                        }}
                      >
                        <FastForward size={14} /> AVANÇAR DIA
                      </button>
                    )}
                    <button
                      type="button"
                      className="career-action-tertiary"
                      onClick={() => {
                        clickSfx();
                        onAdvanceToNextMatch();
                      }}
                    >
                      <SkipForward size={14} /> DIA DO JOGO
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="career-panel career-standings-panel">
              <div className="career-standings-heading">
                <div>
                  <Trophy size={17} />
                  <h2>CLASSIFICAÇÃO</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    setTab('COMPETICOES');
                  }}
                >
                  {activeDivision.toUpperCase()} <ChevronRight size={13} />
                </button>
              </div>
              <div className="career-table-head">
                <span>#</span>
                <span>CLUBE</span>
                <span>J</span>
                <span>SG</span>
                <span>PTS</span>
              </div>
              <div className="career-table-body">
                {quickTableRows.map((row) => {
                  const rank = activeStandings.findIndex((s) => s.clubId === row.clubId) + 1;
                  const rowClub = getClubById(row.clubId);
                  const isMine = row.clubId === career.clubId;
                  return (
                    <div
                      key={row.clubId}
                      className={`career-table-row${isMine ? ' is-current' : ''}`}
                    >
                      <span>{rank}</span>
                      <span className="career-table-team">
                        <ClubCrest club={rowClub} size={18} />
                        <b>{rowClub.shortName || rowClub.name}</b>
                      </span>
                      <span>{row.played}</span>
                      <span>{row.gf - row.ga}</span>
                      <strong>{row.points}</strong>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="career-full-table"
                onClick={() => {
                  clickSfx();
                  setTab('COMPETICOES');
                }}
              >
                VER TABELA COMPLETA <ChevronRight size={14} />
              </button>
            </section>

            <section className="career-activity-strip">
              <article className="career-activity-panel">
                <button
                  type="button"
                  className="career-activity-title"
                  onClick={() => {
                    clickSfx();
                    setTab('NOTICIAS');
                  }}
                >
                  <span>
                    <PixelTrophyIcon size={15} /> DESTAQUES DA SEMANA
                  </span>
                  <ChevronRight size={14} />
                </button>
                <ul>
                  {highlights.map((highlight, index) => (
                    <li key={`${index}-${highlight}`}>
                      <i />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="career-activity-panel">
                <button
                  type="button"
                  className="career-activity-title"
                  onClick={() => {
                    clickSfx();
                    setTab('OBJETIVOS');
                  }}
                >
                  <span>
                    <PixelTargetIcon size={15} /> OBJETIVOS DA TEMPORADA
                  </span>
                  <small>
                    {completedObjectivesCount}/{(career.objectives || []).length}
                  </small>
                </button>
                {(career.objectives || []).slice(0, 3).map((objective) => {
                  const progress =
                    objective.kind === 'LEAGUE_POS'
                      ? objective.current <= objective.target
                        ? 100
                        : Math.max(
                            10,
                            Math.round((objective.target / Math.max(1, objective.current)) * 100)
                          )
                      : Math.min(
                          100,
                          Math.round((objective.current / Math.max(1, objective.target)) * 100)
                        );
                  return (
                    <div className="career-objective-mini" key={objective.id}>
                      <div>
                        <span>{objective.title}</span>
                        <b>
                          {objective.completed
                            ? 'OK'
                            : objective.kind === 'LEAGUE_POS'
                            ? `${objective.current}º / Top ${objective.target}`
                            : `${objective.current}/${objective.target}`}
                        </b>
                      </div>
                      <i>
                        <em style={{ width: `${progress}%` }} />
                      </i>
                    </div>
                  );
                })}
              </article>
              <article className="career-activity-panel">
                <button
                  type="button"
                  className="career-activity-title"
                  onClick={() => {
                    clickSfx();
                    setTab('NOTICIAS');
                  }}
                >
                  <span>
                    <PixelNewspaperIcon size={15} /> NOTÍCIAS RECENTES
                  </span>
                  <ChevronRight size={14} />
                </button>
                {(career.news || []).slice(0, 3).map((item) => (
                  <button
                    type="button"
                    className="career-news-mini"
                    key={item.id}
                    onClick={() => {
                      clickSfx();
                      setTab('NOTICIAS');
                    }}
                  >
                    <small>
                      {item.category} · {item.dateLabel}
                    </small>
                    <span>{item.headline}</span>
                  </button>
                ))}
                {(career.news || []).length === 0 && (
                  <p className="career-empty-mini">As notícias da temporada aparecerão aqui.</p>
                )}
              </article>
            </section>
          </div>
        )}

        {tab === 'ELENCO' && <SquadBrowserScreen career={career} embedded />}

        {tab === 'CALENDARIO' && (
          <SeasonCalendarView
            career={career}
            onPlayMatch={onPlayMatch}
            onSimulateMatch={onSimulateMatch}
            onTriggerNarrativeEvent={onTriggerNarrativeEvent}
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
                  <div
                    className={`font-mono-num text-xl font-extrabold ${
                      career.fatigue > 75 ? 'text-amber-400' : 'text-sky-400'
                    }`}
                  >
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
                      className="w-full min-h-[42px] py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 font-display font-bold text-xs cursor-pointer"
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
                          {obj.completed && (
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          )}
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
                Perfil Profissional, Evolução & Reputação
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

            {/* Potential, Value, Secondary Positions, Traits & Relationships */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-display font-bold text-sm text-white">
                  Projeção & Especialidades
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <InfoCell label="OVR Atual" value={String(career.ovr)} highlight />
                  <InfoCell label="Potencial" value={String(career.potential ?? career.ovr)} />
                  <InfoCell label="Valor Mercado" value={marketValueM} highlight />
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400">Posições Secundárias:</span>{' '}
                    {career.secondaryPositions && career.secondaryPositions.length > 0
                      ? career.secondaryPositions.map((p) => getPositionMeta(p).name).join(', ')
                      : 'Nenhuma definida'}
                  </div>
                  <div>
                    <span className="text-slate-400">Especialidades:</span>{' '}
                    <span className="text-amber-300 font-semibold">
                      {(career.traits || []).join(' · ') || career.playstyle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#111B2B] border border-slate-800 rounded-xl p-4 space-y-2.5">
                <h3 className="font-display font-bold text-sm text-white">
                  Clima & Relacionamentos na Carreira
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <MeterBar label="Moral do Atleta" value={career.morale} />
                  <MeterBar label="Confiança do Treinador" value={career.coachTrust} />
                  <MeterBar label="Entrosamento do Elenco" value={career.teamChemistry ?? 70} />
                  <MeterBar label="Apoio da Torcida" value={career.fanSupport ?? 65} />
                  <MeterBar label="Relação com a Imprensa" value={career.pressRelation ?? 65} />
                  <MeterBar label="Popularidade Geral" value={career.popularity} />
                </div>
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
              <InfoCell
                label="Desarmes + Interc."
                value={String(activeStats.tackles + activeStats.interceptions)}
              />
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
                            {m.penHomeScore !== undefined &&
                            m.penAwayScore !== undefined &&
                            m.homeScore === m.awayScore
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
                  Títulos, Prêmios & Decisões
                </h3>
                {career.awards.length > 0 && (
                  <div className="space-y-1.5">
                    {career.awards.map((aw) => (
                      <div
                        key={aw.id}
                        className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5"
                      >
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
                      <div
                        key={i}
                        className="text-xs text-slate-300 flex justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg"
                      >
                        <span>
                          {h.season} · {h.clubName} ({h.division})
                        </span>
                        <span className="font-mono-num">
                          {h.matches}J · {h.goals}G · {h.assists}A · {h.avgRating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {career.narrativeHistory && career.narrativeHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase text-emerald-400">
                      Registro de Entrevistas & Vestiário
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto custom-scroll">
                      {career.narrativeHistory.slice(0, 6).map((nh) => (
                        <div
                          key={`${nh.eventId}_${nh.dayIndex}`}
                          className="text-[11px] bg-slate-900/65 border border-slate-800/80 rounded-lg px-2.5 py-1.5"
                        >
                          <div className="font-semibold text-white">
                            {nh.dateLabel} · {nh.title}
                          </div>
                          <div className="text-slate-400">{nh.choiceLabel}</div>
                        </div>
                      ))}
                    </div>
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
                    {activeDivision} · Status: {career.contract.role}
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
                <InfoCell label="Valor de Mercado" value={marketValueM} highlight />
                <InfoCell label="Potencial" value={String(career.potential ?? career.ovr)} />
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
                        className="min-h-[40px] px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shrink-0 whitespace-nowrap"
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

      <nav className="career-bottom-nav" aria-label="Navegação da carreira">
        {(
          [
            { id: 'CENTRAL', label: 'CARREIRA', icon: LayoutDashboard },
            { id: 'ELENCO', label: 'ELENCO', icon: Users },
            { id: 'CALENDARIO', label: 'CALENDÁRIO', icon: Calendar },
            { id: 'TREINO', label: 'TREINOS', icon: Dumbbell },
            { id: 'COMPETICOES', label: 'COMPETIÇÕES', icon: Trophy },
            { id: 'NOTICIAS', label: 'NOTÍCIAS', icon: Newspaper },
            { id: 'OBJETIVOS', label: 'OBJETIVOS', icon: Target },
            { id: 'ESTATS', label: 'PERFIL', icon: BarChart3 },
            { id: 'CONTRATO', label: 'CONTRATO', icon: Briefcase },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`career-nav-item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                clickSfx();
                setTab(item.id);
              }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
              {item.id === 'TREINO' && career.trainingPoints > 0 && (
                <i className="career-nav-badge">{career.trainingPoints}</i>
              )}
            </button>
          );
        })}
      </nav>

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

function MeterBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono-num font-bold text-emerald-400">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

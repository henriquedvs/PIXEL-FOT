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
import { ClubCrest } from './ClubCrest';
import { CompetitionsBrowserScreen } from './CompetitionsBrowserScreen';
import { EvolutionChart } from './EvolutionChart';
import { CareerHubTab } from './MainMenu';
import { PixelBackdrop } from './PixelBackdrop';
import {
  PixelBrazilMap,
  PixelCalendarIcon,
  PixelFlag,
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

  // 5-row standings slice centered around user's club (like #11–15 in reference)
  const quickTableRows = useMemo(() => {
    if (activeStandings.length <= 5) return activeStandings;
    const myIdx = Math.max(0, leaguePos - 1);
    let start = Math.max(0, myIdx - 2);
    if (start + 5 > activeStandings.length) {
      start = Math.max(0, activeStandings.length - 5);
    }
    return activeStandings.slice(start, start + 5);
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
      <PixelBackdrop homeKit={club.kit} awayKit={awayClub.kit} dimOpacity={0.78} />

      {/* Top Reference Header Bar */}
      <header className="career-topbar">
        <div className="career-club-identity">
          <ClubCrest club={club} size={32} />
          <span className="career-club-name">{club.shortName || club.name}</span>
          <div className="px-divider-v h-7 hidden sm:block" />
          <div className="career-club-motto hidden sm:block">
            <div>MAIS QUE FUTEBOL</div>
            <div>{club.city.toUpperCase()} · {activeDivision.toUpperCase()}</div>
          </div>
        </div>

        <div className="career-top-right">
          <div className="career-date-meta hidden md:flex">
            <PixelCalendarIcon size={18} />
            <div>
              <span>
                {currentDay ? `${currentDay.dateLabel} ${career.season}` : `TEMPORADA ${career.season}`}
              </span>
              <small>{currentDay ? currentDay.weekday : `RODADA ${career.round}`}</small>
            </div>
          </div>

          <div className="px-divider-v h-7 hidden lg:block" />
          <div className="career-mode-stamp hidden lg:block">
            <div>CARREIRA</div>
            <div>JOGADOR</div>
          </div>

          <button
            type="button"
            onClick={() => {
              clickSfx();
              onOpenSettings();
            }}
            className="px-btn-secondary w-[36px] h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Configurações"
            title="Configurações"
          >
            <Settings size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              clickSfx();
              onBackToMenu();
            }}
            className="px-btn-secondary px-3 h-[36px] text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Home size={14} />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </header>

      <main className="career-main custom-scroll">
        {tab === 'CENTRAL' && (
          <div className="career-overview-wrap">
            {/* 3-Column Reference Hero */}
            <div className="career-hero-3col">
              {/* LEFT: Player Bust Portrait + Vitals + Season Stats + Motto */}
              <section className="career-card">
                <div className="career-player-top">
                  <PixelPortrait
                    variant="bust"
                    size={98}
                    skinColor={career.appearance.skinColor}
                    hairColor={career.appearance.hairColor}
                    hairStyle={career.appearance.hairStyle}
                    shirtPrimary={club.kit.primary}
                    shirtSecondary={club.kit.secondary}
                    beard={career.appearance.beardStyle !== 'Nenhuma'}
                    jerseyNumber={career.gear.jerseyNumber}
                    crestBg={club.kit.primary}
                    crestAccent={club.kit.secondary}
                  />
                  <div className="career-player-vitals">
                    <PixelFlag nationality={career.personal.nationality} width={22} className="mb-1" />
                    <h1 className="career-player-nick">
                      {career.personal.nickname || career.personal.firstName}
                    </h1>
                    <div className="career-player-num">#{career.gear.jerseyNumber}</div>
                    <div className="career-player-pos">{posMeta.name}</div>

                    <div className="career-ovr-block">
                      <div className="career-ovr-label">OVR</div>
                      <div className="career-ovr-num">{career.ovr}</div>
                    </div>
                  </div>
                </div>

                <div className="career-season-rule">TEMPORADA {career.season}</div>

                <div className="career-goals-split">
                  <div className="career-goals-cell">
                    <strong>{career.seasonStats.goals}</strong>
                    <span>GOLS</span>
                  </div>
                  <div className="career-goals-cell">
                    <strong>{career.seasonStats.assists}</strong>
                    <span>ASSIST.</span>
                  </div>
                </div>

                {/* Compact Club & Fatigue Bar */}
                <div className="pt-2.5 flex items-center justify-between text-[11px] font-mono-num text-slate-300">
                  <span className="flex items-center gap-1.5 truncate">
                    <ClubCrest club={club} size={16} />
                    {club.name}
                  </span>
                  <span className={career.fatigue > 75 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    FADIGA {career.fatigue}%
                  </span>
                </div>

                <div className="career-motto-quote">
                  <div>DISCIPLINA</div>
                  <div>HOJE,</div>
                  <div>GRANDES CONQUISTAS</div>
                  <div>AMANHÃ.</div>
                </div>
              </section>

              {/* CENTER: PRÓXIMO JOGO */}
              <section className="career-card career-match-card">
                {/* Faint Stadium Pitch Watermark */}
                <svg
                  viewBox="0 0 400 220"
                  className="career-pitch-watermark"
                  aria-hidden="true"
                >
                  <rect x="8" y="8" width="384" height="204" fill="none" stroke="#4ADE80" strokeWidth="2" />
                  <line x1="200" y1="8" x2="200" y2="212" stroke="#4ADE80" strokeWidth="2" />
                  <circle cx="200" cy="110" r="36" fill="none" stroke="#4ADE80" strokeWidth="2" />
                  <rect x="8" y="56" width="54" height="108" fill="none" stroke="#4ADE80" strokeWidth="2" />
                  <rect x="338" y="56" width="54" height="108" fill="none" stroke="#4ADE80" strokeWidth="2" />
                </svg>

                <div className="career-next-header">
                  <div className="career-next-title">
                    <PixelCalendarIcon size={20} />
                    <span>PRÓXIMO JOGO</span>
                  </div>
                  <div className="career-next-badge">
                    <span className="px-flag-stripe-br" />
                    <div>
                      <div>BRASILEIRÃO</div>
                      <div>É PAIXÃO</div>
                    </div>
                  </div>
                </div>

                <div className="career-fixture-stage">
                  <div className="career-comp-line">
                    {nextEnv.competitionName} · {nextFixture.dateLabel}
                  </div>

                  <div className="career-crests-vs">
                    <div className="career-crest-side">
                      <ClubCrest club={homeClub} size={74} />
                      <strong>{homeClub.shortName || homeClub.name}</strong>
                    </div>
                    <div className="career-vs-x">X</div>
                    <div className="career-crest-side">
                      <ClubCrest club={awayClub} size={74} />
                      <strong>{awayClub.shortName || awayClub.name}</strong>
                    </div>
                  </div>

                  <div className="career-match-details">
                    <div className="career-match-detail-row">
                      <PixelStadiumIcon size={18} />
                      <div>
                        <span>{stadium.name}</span>
                        <small>
                          {stadium.city} - {stadium.state}
                        </small>
                      </div>
                    </div>
                    <div className="career-match-detail-row">
                      <PixelCalendarIcon size={17} />
                      <span>
                        {nextFixture.dateLabel} · {nextEnv.kickoffTime} · {nextEnv.weather} ({nextEnv.temperatureC}°)
                      </span>
                    </div>
                  </div>
                </div>

                {career.injuryMatchesRemaining > 0 && (
                  <div className="relative z-10 mb-2 p-2.5 px-panel-soft border-amber-500/50 flex items-center gap-2 text-xs text-amber-300">
                    <Activity size={14} />
                    Departamento Médico: {career.injuryType} ({career.injuryMatchesRemaining} jogo(s))
                  </div>
                )}

                <div className="career-actions-bar">
                  {career.injuryMatchesRemaining > 0 ? (
                    <button
                      type="button"
                      className="px-btn-gold flex-1 py-3 px-4 text-xs flex items-center justify-center gap-2 cursor-pointer"
                      onClick={() => {
                        clickSfx();
                        onSimulateInjurySkip(nextFixture.homeClubId, nextFixture.awayClubId);
                      }}
                    >
                      RECUPERAR E AVANÇAR <ChevronRight size={15} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="px-btn-primary flex-1 min-w-[165px] py-3 px-4 text-sm flex items-center justify-center gap-2 cursor-pointer"
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
                        <Play size={14} fill="currentColor" /> JOGAR PARTIDA
                      </button>

                      {!isTodayMatchDay && canTriggerTodayEvent && currentDay ? (
                        <button
                          type="button"
                          className="px-btn-gold py-3 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          onClick={() => {
                            clickSfx();
                            onTriggerNarrativeEvent(currentDay);
                          }}
                        >
                          <MessageSquare size={14} /> EVENTO
                        </button>
                      ) : !isTodayMatchDay ? (
                        <button
                          type="button"
                          className="px-btn-secondary py-3 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          onClick={() => {
                            clickSfx();
                            onAdvanceDay();
                          }}
                        >
                          <FastForward size={14} /> AVANÇAR DIA
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="px-btn-secondary py-3 px-3.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                        <FastForward size={13} /> SIMULAR
                      </button>

                      {!isTodayMatchDay && (
                        <button
                          type="button"
                          className="px-btn-secondary py-3 px-3.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          onClick={() => {
                            clickSfx();
                            onAdvanceToNextMatch();
                          }}
                        >
                          <SkipForward size={13} /> IR AO JOGO
                        </button>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* RIGHT: CLASSIFICAÇÃO + Brazil Pixel Map Footer */}
              <section className="career-card">
                <div className="career-standings-head">
                  <div className="career-standings-title">
                    <PixelTrophyIcon size={20} />
                    <span>CLASSIFICAÇÃO</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clickSfx();
                      setTab('COMPETICOES');
                    }}
                    className="font-mono-num text-[11px] font-bold text-slate-300 hover:text-emerald-400 cursor-pointer flex items-center gap-1"
                  >
                    {activeDivision} <ChevronRight size={12} />
                  </button>
                </div>

                <div className="career-table-head">
                  <span>#</span>
                  <span>TIME</span>
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
                        <div className="career-table-club">
                          <ClubCrest club={rowClub} size={18} />
                          <span>{(rowClub.shortName || rowClub.name).toUpperCase()}</span>
                        </div>
                        <span className="career-table-pts">{row.points}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="career-standings-foot text-left"
                  onClick={() => {
                    clickSfx();
                    setTab('COMPETICOES');
                  }}
                >
                  <PixelBrazilMap size={34} />
                  <div className="career-standings-foot-copy flex-1">
                    <div>BRASILEIRÃO {activeDivision.toUpperCase()}</div>
                    <div>JUNTOS POR UM FUTEBOL MAIOR</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </button>
              </section>
            </div>

            {/* Secondary Pixel Activity Row */}
            <section className="career-secondary-strip">
              <article className="px-panel p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    setTab('NOTICIAS');
                  }}
                  className="w-full flex items-center justify-between text-xs font-display font-bold text-emerald-400 tracking-wide cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <PixelTrophyIcon size={15} /> DESTAQUES DA SEMANA
                  </span>
                  <ChevronRight size={14} />
                </button>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {highlights.slice(0, 3).map((highlight, index) => (
                    <li key={`${index}-${highlight}`} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="px-panel p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    setTab('OBJETIVOS');
                  }}
                  className="w-full flex items-center justify-between text-xs font-display font-bold text-amber-300 tracking-wide cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <PixelTargetIcon size={15} /> OBJETIVOS DA TEMPORADA
                  </span>
                  <span className="font-mono-num text-[11px] text-slate-300">
                    {completedObjectivesCount}/{(career.objectives || []).length}
                  </span>
                </button>
                <div className="space-y-2">
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
                      <div key={objective.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-200 truncate">{objective.title}</span>
                          <span className="font-mono-num font-bold text-emerald-400 shrink-0 pl-2">
                            {objective.completed
                              ? 'OK'
                              : objective.kind === 'LEAGUE_POS'
                              ? `${objective.current}º`
                              : `${objective.current}/${objective.target}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#060D14] border border-[#1B2F41]">
                          <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="px-panel p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    clickSfx();
                    setTab('NOTICIAS');
                  }}
                  className="w-full flex items-center justify-between text-xs font-display font-bold text-sky-300 tracking-wide cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <PixelNewspaperIcon size={15} /> NOTÍCIAS RECENTES
                  </span>
                  <ChevronRight size={14} />
                </button>
                <div className="space-y-1.5">
                  {(career.news || []).slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        clickSfx();
                        setTab('NOTICIAS');
                      }}
                      className="w-full text-left p-1.5 px-panel-soft hover:border-emerald-400/60 cursor-pointer"
                    >
                      <div className="font-mono-num text-[9px] text-emerald-400">
                        {item.category} · {item.dateLabel}
                      </div>
                      <div className="text-[11px] text-slate-200 truncate">{item.headline}</div>
                    </button>
                  ))}
                  {(career.news || []).length === 0 && (
                    <p className="text-xs text-slate-400">As notícias da temporada aparecerão aqui.</p>
                  )}
                </div>
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
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="px-panel p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-white">
                  CENTRO DE TREINAMENTO &amp; MINIJOGOS PIXEL
                </h2>
                <p className="text-xs text-slate-400">
                  Treinos geram XP para evolução gradual. Descanse no calendário se a fadiga passar de 75%.
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
                  className={`px-3 py-1.5 text-xs font-display font-semibold cursor-pointer ${
                    drillCat === cat ? 'px-btn-primary' : 'px-btn-secondary'
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
                  <div key={drill.id} className="px-panel p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">{drill.category}</span>
                        <span className="text-slate-400 font-mono-num">
                          {drill.durationMin} min · {drill.difficulty}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-white mt-1">{drill.name}</h3>
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
                      className="px-btn-primary w-full min-h-[40px] py-2 text-xs disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="px-panel p-4">
                <h3 className="font-display font-bold text-sm text-white mb-2">
                  TREINAMENTOS REALIZADOS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {career.trainingLog.slice(0, 6).map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs px-3 py-2 px-panel-soft"
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
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="px-panel p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PixelNewspaperIcon size={28} />
                <div>
                  <h2 className="font-display font-bold text-base text-white">
                    PORTAL DE NOTÍCIAS PIXEL FOOTBALL
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
                      className={`px-2.5 py-1 text-[11px] font-display font-semibold cursor-pointer ${
                        newsFilter === cat ? 'px-btn-primary' : 'px-btn-secondary'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {visibleNews.length === 0 ? (
              <div className="px-panel p-6 text-center text-xs text-slate-400">
                Nenhuma notícia registrada nesta categoria ainda. Dispute jogos e avançe no calendário!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleNews.map((item) => {
                  const mainClub = item.clubId ? getClubById(item.clubId) : club;
                  const opp = item.opponentClubId ? getClubById(item.opponentClubId) : null;
                  return (
                    <article key={item.id} className="px-panel p-4 flex gap-3.5 items-start">
                      <div className="w-16 h-16 px-panel-soft flex items-center justify-center shrink-0">
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
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="px-panel p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PixelTargetIcon size={28} />
                <div>
                  <h2 className="font-display font-bold text-base text-white">
                    METAS DA TEMPORADA {career.season}
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
                    className={`p-4 space-y-2.5 ${obj.completed ? 'px-panel-active' : 'px-panel'}`}
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

                    <div className="w-full h-2 bg-[#060D14] border border-[#1B2F41]">
                      <div
                        className={`h-full transition-all ${
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
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold text-base text-white">
                PERFIL PROFISSIONAL, EVOLUÇÃO &amp; REPUTAÇÃO
              </h2>
              <div className="flex gap-1">
                {(['TEMPORADA', 'CARREIRA'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => {
                      clickSfx();
                      setStatScope(sc);
                    }}
                    className={`px-3 py-1 text-xs font-display font-semibold cursor-pointer ${
                      statScope === sc ? 'px-btn-primary' : 'px-btn-secondary'
                    }`}
                  >
                    {sc === 'TEMPORADA' ? `Temporada ${career.season}` : 'Toda Carreira'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 px-panel p-4 space-y-3">
                <h3 className="font-display font-bold text-sm text-white">PROJEÇÃO &amp; ESPECIALIDADES</h3>
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

              <div className="lg:col-span-7 px-panel p-4 space-y-2.5">
                <h3 className="font-display font-bold text-sm text-white">
                  CLIMA &amp; RELACIONAMENTOS NA CARREIRA
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

            <div className="px-panel p-4">
              <h3 className="font-display font-bold text-sm text-white mb-3">
                MAPA COMPLETO DE ATRIBUTOS ({posMeta.name} · {career.playstyle})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ATTRIBUTE_LABELS.map((item) => {
                  const val = career.attributes[item.key];
                  return (
                    <div key={item.key} className="p-2.5 px-panel-soft">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="font-mono-num font-bold text-emerald-400">{val}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#060D14] border border-[#1B2F41]">
                        <div className="h-full bg-emerald-500" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="px-panel p-4">
                <h3 className="font-display font-bold text-sm text-white mb-2.5">
                  HISTÓRICO DE PARTIDAS RECENTES
                </h3>
                {career.recentMatches.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma partida disputada ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll">
                    {career.recentMatches.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 px-panel-soft flex items-center justify-between text-xs"
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

              <section className="px-panel p-4 space-y-3">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <Award size={16} className="text-amber-400" />
                  TÍTULOS, PRÊMIOS &amp; DECISÕES
                </h3>
                {career.awards.length > 0 && (
                  <div className="space-y-1.5">
                    {career.awards.map((aw) => (
                      <div
                        key={aw.id}
                        className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-[2px] px-3 py-1.5"
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
                        className="text-xs text-slate-300 flex justify-between px-panel-soft px-3 py-1.5"
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
                  <div className="pt-2 border-t border-[#1D3143] space-y-1.5">
                    <div className="text-[11px] font-bold uppercase text-emerald-400">
                      Registro de Entrevistas &amp; Vestiário
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto custom-scroll">
                      {career.narrativeHistory.slice(0, 6).map((nh) => (
                        <div
                          key={`${nh.eventId}_${nh.dayIndex}`}
                          className="text-[11px] px-panel-soft px-2.5 py-1.5"
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
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="px-panel p-4 space-y-3">
              <h2 className="font-display font-bold text-base text-white">CONTRATO ATUAL</h2>
              <div className="flex items-center gap-3 p-3 px-panel-soft">
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
                <InfoCell label="Duração Restante" value={`${career.contract.yearsRemaining} ano(s)`} />
                <InfoCell label="Valor de Mercado" value={marketValueM} highlight />
                <InfoCell label="Potencial" value={String(career.potential ?? career.ovr)} />
              </div>
            </section>

            <section className="px-panel p-4 space-y-3">
              <h2 className="font-display font-bold text-base text-white">
                PROPOSTAS &amp; INTERESSE DE CLUBES
              </h2>
              {career.offers.length === 0 ? (
                <p className="text-xs text-slate-400 p-3 px-panel-soft">
                  Nenhuma proposta ativa nesta rodada. Boas atuações e gols atraem olheiros de novos clubes a cada 3 rodadas!
                </p>
              ) : (
                <div className="space-y-2.5">
                  {career.offers.map((off) => (
                    <div key={off.id} className="p-3 px-panel-soft flex items-center justify-between gap-3">
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
                        className="px-btn-primary min-h-[38px] px-3.5 py-2 text-xs cursor-pointer shrink-0 whitespace-nowrap"
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

      {/* Bottom Pixel Dock matching reference */}
      <nav className="career-bottom-dock" aria-label="Navegação da carreira">
        <div className="career-dock-tabs">
          {(
            [
              { id: 'CENTRAL', label: 'CARREIRA', icon: LayoutDashboard },
              { id: 'CALENDARIO', label: 'CALENDÁRIO', icon: Calendar },
              { id: 'TREINO', label: 'TREINOS', icon: Dumbbell },
              { id: 'COMPETICOES', label: 'COMPETIÇÕES', icon: Trophy },
              { id: 'ELENCO', label: 'ELENCO', icon: Users },
              { id: 'NOTICIAS', label: 'NOTÍCIAS', icon: Newspaper },
              { id: 'CONTRATO', label: 'CONTRATO', icon: Briefcase },
              { id: 'OBJETIVOS', label: 'OBJETIVOS', icon: Target },
              { id: 'ESTATS', label: 'PERFIL', icon: BarChart3 },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`career-dock-item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  clickSfx();
                  setTab(item.id);
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.id === 'TREINO' && career.trainingPoints > 0 && (
                  <i className="career-dock-badge">{career.trainingPoints}</i>
                )}
              </button>
            );
          })}
        </div>

        <div className="career-dock-motto">
          <div>SONHOS</div>
          <div>DISCIPLINA</div>
          <div>EVOLUÇÃO</div>
        </div>
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
    <div className="p-2.5 px-panel-soft">
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
    <div className="p-2.5 px-panel-soft space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono-num font-bold text-emerald-400">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#060D14] border border-[#1B2F41]">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

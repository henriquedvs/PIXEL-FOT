import { CLUBS, SERIE_B_CLUBS, getAllClubs, getClubById, resolveClubId } from '../data/clubs';
import {
  calculateMarketValue,
  calculateOverall,
  derivePlayerTraits,
  estimatePotential,
  getPositionMeta,
  normalizeAttributes,
} from '../data/positions';
import {
  applyMatchToStandings,
  buildEmptyStandings,
  buildInitialNews,
  buildRoundRobinSchedule,
  buildTopScorersForDivision,
  createCopaBracket,
  createInitialSupercopa,
  createMatchNewsItem,
  createSeasonObjectives,
  evaluateObjectives,
  getDivisionClubsFromIds,
  resolveTieWinner,
  simulateAiMatch,
  simulateCopaStageLeg,
  sortStandings,
} from '../engine/competitions';
import {
  AttributeCreationMode,
  CalendarActivityType,
  CalendarDay,
  Club,
  CopaBracketState,
  CopaStageId,
  EvolutionPoint,
  GameSettings,
  LeagueLeader,
  LeagueStanding,
  MatchRecord,
  MatchSimReport,
  MatchStatLine,
  NarrativeChoice,
  NarrativeEvent,
  NewsItem,
  PlayerAppearance,
  PlayerAttributes,
  PlayerCareer,
  PlayerPersonalInfo,
  PlaystyleId,
  PositionId,
  RoundMatchResult,
  SportGear,
  SupercopaState,
  TrainingDrill,
  TransferOffer,
  WeatherCondition,
} from '../types/game';

const SETTINGS_KEY = 'pixel_football_settings_v1';
const CAREER_KEY = 'pixel_football_career_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  audio: {
    musicEnabled: true,
    musicVolume: 0.22,
    sfxEnabled: true,
    sfxVolume: 0.8,
    ballVolume: 0.75,
    kickVolume: 0.85,
    passVolume: 0.75,
    netVolume: 0.9,
    crowdVolume: 0.55,
    whistleVolume: 0.8,
    celebrationVolume: 0.85,
    menuVolume: 0.65,
    footstepVolume: 0.5,
  },
  controlSensitivity: 1.0,
  graphicsQuality: 'high',
  effectsIntensity: 0.9,
  crowdDetail: 'high',
  environmentalEffects: true,
  buttonSize: 'normal',
  controlPosition: 'standard',
  aimAssist: true,
  highContrastHud: false,
  showMatchHints: true,
  vibration: true,
  language: 'pt-BR',
  orientation: 'landscape-auto',
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      audio: {
        ...DEFAULT_SETTINGS.audio,
        ...(parsed.audio || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota issues
  }
}

function makeEvolutionSnapshot(
  season: number,
  round: number,
  ovr: number,
  attributes: PlayerAttributes
): EvolutionPoint {
  return {
    season,
    round,
    ovr,
    velocidade: attributes.velocidade,
    finalizacao: attributes.finalizacao,
    passeCurto: attributes.passeCurto,
    drible: attributes.drible,
    marcacao: attributes.marcacao,
    reflexos: attributes.reflexos,
  };
}

function pushEvolutionSnapshot(career: PlayerCareer): EvolutionPoint[] {
  const prev = career.evolutionHistory ? [...career.evolutionHistory] : [];
  const snap = makeEvolutionSnapshot(career.season, career.round, career.ovr, career.attributes);
  const existingIdx = prev.findIndex((p) => p.season === snap.season && p.round === snap.round);
  if (existingIdx >= 0) {
    prev[existingIdx] = snap;
  } else {
    prev.push(snap);
  }
  return prev.slice(-64);
}

const COPA_CALENDAR_SLOTS: { afterRound: number; stage: CopaStageId; leg: 1 | 2; label: string }[] = [
  { afterRound: 5, stage: 'Oitavas', leg: 1, label: 'Oitavas de Final · Ida' },
  { afterRound: 8, stage: 'Oitavas', leg: 2, label: 'Oitavas de Final · Volta' },
  { afterRound: 13, stage: 'Quartas', leg: 1, label: 'Quartas de Final · Ida' },
  { afterRound: 16, stage: 'Quartas', leg: 2, label: 'Quartas de Final · Volta' },
  { afterRound: 22, stage: 'Semifinal', leg: 1, label: 'Semifinal · Ida' },
  { afterRound: 25, stage: 'Semifinal', leg: 2, label: 'Semifinal · Volta' },
  { afterRound: 31, stage: 'Final', leg: 1, label: 'Final Nacional · Jogo Único' },
];

export function syncCalendarCopaFixtures(
  calendar: CalendarDay[],
  copaBracket: CopaBracketState,
  userClubId: string
): CalendarDay[] {
  return calendar.map((day) => {
    if (!day.copaStage || day.completed) return day;
    const tie = copaBracket.ties.find(
      (t) =>
        t.stage === day.copaStage &&
        (t.homeClubId === userClubId || t.awayClubId === userClubId)
    );
    if (tie) {
      const leg = day.copaLeg || 1;
      const isHome = leg === 1 ? tie.homeClubId === userClubId : tie.awayClubId === userClubId;
      const oppId = tie.homeClubId === userClubId ? tie.awayClubId : tie.homeClubId;
      const opp = getClubById(oppId);
      const userClub = getClubById(userClubId);
      const legTag = tie.twoLegged ? (leg === 1 ? 'Ida' : 'Volta') : 'Final';
      return {
        ...day,
        activity: 'PARTIDA',
        matchId: `${tie.id}_leg${leg}`,
        competition: `Copa do Brasil · ${day.copaStage} (${legTag})`,
        opponentClubId: oppId,
        isHome,
        kickoffTime: day.copaStage === 'Final' ? '16:00' : '21:30',
        title: `Copa do Brasil (${day.copaStage}): vs ${opp.shortName}`,
        note: isHome
          ? `${day.copaStage} (${legTag}) em casa · ${userClub.stadiumName}`
          : `${day.copaStage} (${legTag}) fora · ${opp.stadiumName}`,
      };
    }

    // If user is not in this tie (or bracket hasn't reached it yet vs user already eliminated)
    const stageBuilt = copaBracket.ties.some((t) => t.stage === day.copaStage);
    if (stageBuilt) {
      // User was eliminated before this stage -> turn day into training / Copa watch day
      return {
        ...day,
        activity: 'TREINO',
        matchId: undefined,
        opponentClubId: undefined,
        title: `Treino Tático · Semana de ${day.copaStage}`,
        note: `Seu clube foca no Brasileirão enquanto ocorre a ${day.copaStage} da Copa do Brasil.`,
      };
    }
    return day;
  });
}

export function loadCareer(): PlayerCareer | null {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerCareer>;
    if (!parsed.clubId || !parsed.schedule) return null;

    const resolvedClubId = resolveClubId(parsed.clubId);
    const resolvedClub = getClubById(resolvedClubId);

    const serieAClubIds =
      parsed.serieAClubIds && parsed.serieAClubIds.length >= 20
        ? parsed.serieAClubIds.map(resolveClubId)
        : CLUBS.map((c) => c.id);
    const serieBClubIds =
      parsed.serieBClubIds && parsed.serieBClubIds.length >= 20
        ? parsed.serieBClubIds.map(resolveClubId)
        : SERIE_B_CLUBS.map((c) => c.id);

    const activeDivision: 'Série A' | 'Série B' =
      parsed.division === 'Série A' || parsed.division === 'Série B'
        ? parsed.division
        : serieBClubIds.includes(resolvedClubId)
        ? 'Série B'
        : 'Série A';

    const serieAClubs = getDivisionClubsFromIds(serieAClubIds, CLUBS);
    const serieBClubs = getDivisionClubsFromIds(serieBClubIds, SERIE_B_CLUBS);

    const migratedSchedule = (parsed.schedule || []).map((f) => ({
      ...f,
      homeClubId: resolveClubId(f.homeClubId),
      awayClubId: resolveClubId(f.awayClubId),
      competition: 'Brasileirão Série A',
    }));

    const standingMap = new Map<string, LeagueStanding>();
    for (const s of parsed.standings || []) {
      const rId = resolveClubId(s.clubId);
      if (!standingMap.has(rId)) {
        standingMap.set(rId, { ...s, clubId: rId });
      }
    }
    for (const c of serieAClubs) {
      if (!standingMap.has(c.id)) {
        standingMap.set(c.id, {
          clubId: c.id,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          points: 0,
        });
      }
    }
    const migratedStandings = sortStandings(Array.from(standingMap.values()));

    const serieBMap = new Map<string, LeagueStanding>();
    for (const s of parsed.serieBStandings || []) {
      const rId = resolveClubId(s.clubId);
      if (!serieBMap.has(rId)) serieBMap.set(rId, { ...s, clubId: rId });
    }
    for (const c of serieBClubs) {
      if (!serieBMap.has(c.id)) {
        serieBMap.set(c.id, {
          clubId: c.id,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          points: 0,
        });
      }
    }
    const migratedSerieBStandings = sortStandings(Array.from(serieBMap.values()));
    const migratedSerieBSchedule =
      parsed.serieBSchedule && parsed.serieBSchedule.length > 0
        ? parsed.serieBSchedule.map((f) => ({
            ...f,
            homeClubId: resolveClubId(f.homeClubId),
            awayClubId: resolveClubId(f.awayClubId),
            competition: 'Brasileirão Série B',
          }))
        : generateSchedule(serieBClubs, 'Brasileirão Série B');

    const appearance: PlayerAppearance = {
      ...(parsed.appearance as PlayerAppearance),
      faceShape: parsed.appearance?.faceShape ?? 'Oval',
      facialDetail: parsed.appearance?.facialDetail ?? 'Nenhuma',
    };

    const gear: SportGear = {
      ...(parsed.gear as SportGear),
      shirtName:
        parsed.gear?.shirtName ??
        (parsed.personal?.nickname || parsed.personal?.lastName || 'CRAQUE').toUpperCase(),
      collarStyle: parsed.gear?.collarStyle ?? 'Redonda',
      celebrationId: parsed.gear?.celebrationId ?? 'knee_slide',
    };

    const position: PositionId = parsed.position || 'ST';
    const playstyle: PlaystyleId = parsed.playstyle || 'COMPLETO';
    const normalizedAttrs = normalizeAttributes(parsed.attributes, position);
    const ovr = calculateOverall(normalizedAttrs, position);
    const age = parsed.personal?.birthDate ? calculateAge(parsed.personal.birthDate) : 19;
    const potential = parsed.potential ?? estimatePotential(ovr, age);
    const marketValue = parsed.marketValue ?? calculateMarketValue(ovr, potential, age, position);
    const traits =
      parsed.traits && parsed.traits.length > 0
        ? parsed.traits
        : derivePlayerTraits(normalizedAttrs, position, playstyle);

    const season = parsed.season ?? 2026;
    const round = parsed.round ?? 1;

    const copaBracket = parsed.copaBracket || createCopaBracket(season, resolvedClubId);
    const supercopa = parsed.supercopa || createInitialSupercopa(season);
    const activeSchedule = activeDivision === 'Série B' ? migratedSerieBSchedule : migratedSchedule;

    const rawCalendar =
      parsed.calendar && parsed.calendar.length > 0
        ? parsed.calendar.map((d) => ({
            ...d,
            opponentClubId: d.opponentClubId ? resolveClubId(d.opponentClubId) : undefined,
          }))
        : generateSeasonCalendar(activeSchedule, resolvedClubId, season, copaBracket, supercopa);

    const syncedCalendar = syncCalendarCopaFixtures(rawCalendar, copaBracket, resolvedClubId);

    const migrated: PlayerCareer = {
      ...(parsed as PlayerCareer),
      clubId: resolvedClubId,
      division: activeDivision,
      serieAClubIds,
      serieBClubIds,
      position,
      secondaryPositions: parsed.secondaryPositions ?? [],
      playstyle,
      creationMode: parsed.creationMode ?? 'automatico',
      attributes: normalizedAttrs,
      ovr,
      potential,
      marketValue,
      traits,
      contract: {
        ...(parsed.contract || {
          clubId: resolvedClubId,
          clubName: resolvedClub.name,
          weeklySalary: 12000,
          yearsRemaining: 2,
          role: 'Titular',
          signedSeason: season,
        }),
        clubId: resolvedClubId,
        clubName: resolvedClub.name,
      },
      appearance,
      gear,
      xp: parsed.xp ?? 0,
      fatigue: parsed.fatigue ?? 12,
      trainingLog: parsed.trainingLog ?? [],
      pressRelation: parsed.pressRelation ?? 65,
      teamChemistry: parsed.teamChemistry ?? 70,
      fanSupport: parsed.fanSupport ?? 65,
      narrativeHistory: parsed.narrativeHistory ?? [],
      lastSimReport: parsed.lastSimReport ?? null,
      copaStage: parsed.copaStage ?? 'Oitavas',
      estadualStage: parsed.estadualStage ?? 'Fase de Grupos',
      standings: migratedStandings,
      serieBStandings: migratedSerieBStandings,
      schedule: migratedSchedule,
      serieBSchedule: migratedSerieBSchedule,
      copaBracket,
      supercopa,
      championsHistory: parsed.championsHistory ?? [],
      roundResults: parsed.roundResults ?? [],
      playedMatchIds: parsed.playedMatchIds ?? [],
      competitionStats: parsed.competitionStats ?? {},
      startsCount: parsed.startsCount ?? (parsed.seasonStats?.matches || 0),
      recentMatches: (parsed.recentMatches || []).map((m) => ({
        ...m,
        homeClubId: resolveClubId(m.homeClubId),
        awayClubId: resolveClubId(m.awayClubId),
        playerClubId: resolveClubId(m.playerClubId),
      })),
      leagueLeaders: (
        parsed.leagueLeaders ??
        generateInitialLeaders(
          resolvedClubId,
          parsed.personal?.nickname || 'Você',
          activeDivision === 'Série B' ? serieBClubs : serieAClubs
        )
      ).map((l) => ({ ...l, clubId: resolveClubId(l.clubId) })),
      calendar: syncedCalendar,
      currentDayIndex: Math.min(syncedCalendar.length - 1, parsed.currentDayIndex ?? 0),
      evolutionHistory:
        parsed.evolutionHistory && parsed.evolutionHistory.length > 0
          ? parsed.evolutionHistory
          : [makeEvolutionSnapshot(season, round, ovr, normalizedAttrs)],
    };

    migrated.objectives = evaluateObjectives(migrated);
    if (!migrated.news || migrated.news.length === 0) {
      migrated.news = buildInitialNews(migrated);
    }

    return migrated;
  } catch {
    return null;
  }
}

export function saveCareer(career: PlayerCareer): void {
  try {
    localStorage.setItem(CAREER_KEY, JSON.stringify(career));
  } catch {
    // ignore
  }
}

export function clearCareer(): void {
  try {
    localStorage.removeItem(CAREER_KEY);
  } catch {
    // ignore
  }
}

export function calculateAge(birthDateStr: string): number {
  const today = new Date('2026-11-12');
  const dob = new Date(birthDateStr);
  if (isNaN(dob.getTime())) return 18;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(15, Math.min(45, age));
}

export function emptyStats(): MatchStatLine {
  return {
    matches: 0,
    goals: 0,
    assists: 0,
    passesCompleted: 0,
    passesMissed: 0,
    shots: 0,
    shotsOnTarget: 0,
    dribblesCompleted: 0,
    tackles: 0,
    interceptions: 0,
    yellowCards: 0,
    redCards: 0,
    minutesPlayed: 0,
    ratingSum: 0,
    saves: 0,
  };
}

export function mergeStats(a: MatchStatLine, b: MatchStatLine): MatchStatLine {
  return {
    matches: a.matches + b.matches,
    goals: a.goals + b.goals,
    assists: a.assists + b.assists,
    passesCompleted: a.passesCompleted + b.passesCompleted,
    passesMissed: a.passesMissed + b.passesMissed,
    shots: a.shots + b.shots,
    shotsOnTarget: a.shotsOnTarget + b.shotsOnTarget,
    dribblesCompleted: a.dribblesCompleted + b.dribblesCompleted,
    tackles: a.tackles + b.tackles,
    interceptions: a.interceptions + b.interceptions,
    yellowCards: a.yellowCards + b.yellowCards,
    redCards: a.redCards + b.redCards,
    minutesPlayed: a.minutesPlayed + b.minutesPlayed,
    ratingSum: a.ratingSum + b.ratingSum,
    saves: a.saves + b.saves,
  };
}

export function generateSchedule(
  clubs: Club[],
  competition: 'Brasileirão Série A' | 'Brasileirão Série B' = 'Brasileirão Série A'
): { round: number; homeClubId: string; awayClubId: string; competition: string }[] {
  return buildRoundRobinSchedule(clubs).map((f) => ({
    ...f,
    competition,
  }));
}

export function generateSeasonCalendar(
  schedule: { round: number; homeClubId: string; awayClubId: string; competition?: string }[],
  clubId: string,
  season: number,
  copaBracket?: CopaBracketState,
  supercopa?: SupercopaState
): CalendarDay[] {
  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const clubFixtures = schedule
    .filter((f) => f.homeClubId === clubId || f.awayClubId === clubId)
    .sort((a, b) => a.round - b.round);
  const days: CalendarDay[] = [];
  const startDate = new Date(season, 0, 14); // Jan 14 pre-season

  let dayIdx = 0;
  let dateCursorDays = 0;

  const pushDay = (
    stepDays: number,
    entry: Omit<CalendarDay, 'dayIndex' | 'dateLabel' | 'monthIndex' | 'weekday'>
  ) => {
    dateCursorDays += stepDays;
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + dateCursorDays);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    days.push({
      ...entry,
      dayIndex: dayIdx,
      dateLabel: `${dd}/${mm}`,
      monthIndex: d.getMonth(),
      weekday: weekdays[d.getDay() === 0 ? 6 : d.getDay() - 1],
    });
    dayIdx++;
  };

  // Pre-season opening + Supercopa do Brasil (18/01)
  pushDay(0, {
    activity: 'TREINO',
    title: 'Reapresentação & Treino Físico',
    completed: false,
    note: 'Avaliação física inicial e trabalho com bola no CT.',
  });

  const sup = supercopa || createInitialSupercopa(season);
  const supUserPlays = sup.leagueChampId === clubId || sup.copaChampId === clubId;
  const supOppId = sup.leagueChampId === clubId ? sup.copaChampId : sup.leagueChampId;
  const supHomeClub = getClubById(sup.leagueChampId);
  const supAwayClub = getClubById(sup.copaChampId);

  pushDay(4, {
    activity: supUserPlays ? 'PARTIDA' : 'ESPECIAL',
    title: supUserPlays
      ? `Supercopa do Brasil: vs ${getClubById(supOppId).shortName}`
      : `Supercopa do Brasil: ${supHomeClub.shortName} x ${supAwayClub.shortName}`,
    completed: false,
    isSupercopa: true,
    matchId: `supercopa_${season}`,
    competition: 'Supercopa do Brasil',
    opponentClubId: supUserPlays ? supOppId : undefined,
    isHome: sup.leagueChampId === clubId,
    kickoffTime: '16:00',
    note: supUserPlays
      ? 'Decisão em jogo único entre Campeão Brasileiro e Campeão da Copa.'
      : 'Abertura oficial da temporada entre os atuais campeões nacionais.',
  });

  pushDay(2, {
    activity: 'RECUPERACAO',
    title: 'Ajuste Tático Pré-Brasileirão',
    completed: false,
    note: 'Preparação final da equipe antes da estreia na Série A.',
  });

  // 38 League Rounds + Interleaved Copa do Brasil Windows
  for (let r = 0; r < clubFixtures.length; r++) {
    const fx = clubFixtures[r];
    const isHome = fx.homeClubId === clubId;
    const oppId = isHome ? fx.awayClubId : fx.homeClubId;
    const opp = getClubById(oppId);
    const comp = fx.competition || 'Brasileirão Série A';

    const cycle: {
      stepDays: number;
      act: CalendarActivityType;
      title: string;
      note: string;
      isMatch?: boolean;
    }[] = [
      {
        stepDays: 2,
        act: 'TREINO',
        title: 'Treino no CT',
        note: 'Sessão técnica e tática visando a próxima rodada.',
      },
      {
        stepDays: 2,
        act: isHome ? 'COMPROMISSO' : 'VIAGEM',
        title: isHome ? 'Coletiva & Concentração' : `Viagem para ${opp.city}`,
        note: isHome
          ? 'Preparação tática pré-jogo e atendimento à imprensa.'
          : `Deslocamento com a delegação para enfrentar ${opp.shortName}.`,
      },
      {
        stepDays: 2,
        act: 'PARTIDA',
        title: `${comp}: vs ${opp.shortName}`,
        note: isHome
          ? `Rodada ${fx.round} em casa · ${getClubById(clubId).stadiumName}`
          : `Rodada ${fx.round} fora · ${opp.stadiumName}`,
        isMatch: true,
      },
      {
        stepDays: 1,
        act: r % 4 === 3 ? 'ESPECIAL' : r % 2 === 0 ? 'RECUPERACAO' : 'DESCANSO',
        title:
          r % 4 === 3
            ? 'Evento com Torcedores'
            : r % 2 === 0
            ? 'Recuperação Física'
            : 'Dia de Descanso',
        note:
          r % 4 === 3
            ? 'Sessão de autógrafos que eleva sua popularidade.'
            : 'Fisioterapia, crioterapia e regeneração muscular.',
      },
    ];

    const prefix = comp.includes('Série B') ? 'serieB' : 'serieA';
    for (const item of cycle) {
      pushDay(item.stepDays, {
        activity: item.act,
        title: item.title,
        completed: false,
        matchId: item.isMatch ? `${prefix}_${season}_r${fx.round}` : undefined,
        roundRef: item.isMatch ? fx.round : undefined,
        competition: item.isMatch ? comp : undefined,
        opponentClubId: item.isMatch ? oppId : undefined,
        isHome: item.isMatch ? isHome : undefined,
        kickoffTime: item.isMatch ? ['16:00', '18:30', '21:00', '11:00'][fx.round % 4] : undefined,
        note: item.note,
      });
    }

    // Check if there is a Copa do Brasil slot right after this round
    const copaSlot = COPA_CALENDAR_SLOTS.find((s) => s.afterRound === fx.round);
    if (copaSlot) {
      pushDay(1, {
        activity: 'TREINO',
        title: `Preparação · Copa do Brasil`,
        completed: false,
        note: `Ajustes para a fase ${copaSlot.label}.`,
      });
      pushDay(1, {
        activity: 'ESPECIAL',
        title: `Copa do Brasil · ${copaSlot.label}`,
        completed: false,
        competition: `Copa do Brasil · ${copaSlot.stage}`,
        copaStage: copaSlot.stage,
        copaLeg: copaSlot.leg,
        roundRef: fx.round,
        note: 'Data reservada para confrontos da Copa do Brasil.',
      });
    }
  }

  return copaBracket ? syncCalendarCopaFixtures(days, copaBracket, clubId) : days;
}

function generateInitialLeaders(
  userClubId: string,
  userName: string,
  divisionClubs: Club[] = CLUBS
): LeagueLeader[] {
  return buildTopScorersForDivision(divisionClubs, userClubId, userName);
}

export function createInitialCareer(params: {
  personal: PlayerPersonalInfo;
  appearance: PlayerAppearance;
  gear: SportGear;
  position: PositionId;
  secondaryPositions?: PositionId[];
  playstyle: PlaystyleId;
  creationMode?: AttributeCreationMode;
  attributes: PlayerAttributes;
  club: Club;
}): PlayerCareer {
  const safeAttrs = normalizeAttributes(params.attributes, params.position);
  const ovr = calculateOverall(safeAttrs, params.position);
  const age = calculateAge(params.personal.birthDate);
  const potential = estimatePotential(ovr, age);
  const marketValue = calculateMarketValue(ovr, potential, age, params.position);
  const traits = derivePlayerTraits(safeAttrs, params.position, params.playstyle);

  const baseSalary = Math.max(
    3500,
    Math.round((params.club.squadQuality * 140 + ovr * 95) / 100) * 100
  );
  const role =
    ovr >= params.club.squadQuality - 3
      ? 'Titular'
      : ovr >= params.club.squadQuality - 10
      ? 'Rotação'
      : 'Reserva';

  const division: 'Série A' | 'Série B' =
    params.club.division === 'Série B' ? 'Série B' : 'Série A';
  const serieAClubIds = CLUBS.map((c) => c.id);
  const serieBClubIds = SERIE_B_CLUBS.map((c) => c.id);

  const standings = buildEmptyStandings(CLUBS);
  const serieBStandings = buildEmptyStandings(SERIE_B_CLUBS);
  const schedule = generateSchedule(CLUBS, 'Brasileirão Série A');
  const serieBSchedule = generateSchedule(SERIE_B_CLUBS, 'Brasileirão Série B');
  const activeSchedule = division === 'Série B' ? serieBSchedule : schedule;
  const activeClubs = division === 'Série B' ? SERIE_B_CLUBS : CLUBS;

  const season = 2026;
  const copaBracket = createCopaBracket(season, params.club.id);
  const supercopa = createInitialSupercopa(season);
  const calendar = generateSeasonCalendar(
    activeSchedule,
    params.club.id,
    season,
    copaBracket,
    supercopa
  );

  const normalizedAppearance: PlayerAppearance = {
    ...params.appearance,
    faceShape: params.appearance.faceShape ?? 'Oval',
    facialDetail: params.appearance.facialDetail ?? 'Nenhuma',
  };
  const normalizedGear: SportGear = {
    ...params.gear,
    shirtName:
      params.gear.shirtName ??
      (params.personal.nickname || params.personal.lastName || 'CRAQUE').toUpperCase(),
    collarStyle: params.gear.collarStyle ?? 'Redonda',
    celebrationId: params.gear.celebrationId ?? 'knee_slide',
  };

  const career: PlayerCareer = {
    id: `career_${Date.now()}`,
    personal: params.personal,
    appearance: normalizedAppearance,
    gear: normalizedGear,
    position: params.position,
    secondaryPositions: params.secondaryPositions ?? [],
    playstyle: params.playstyle,
    creationMode: params.creationMode ?? 'automatico',
    attributes: safeAttrs,
    ovr,
    potential,
    marketValue,
    traits,
    xp: 0,
    fatigue: 10,
    clubId: params.club.id,
    division,
    serieAClubIds,
    serieBClubIds,
    contract: {
      clubId: params.club.id,
      clubName: params.club.name,
      weeklySalary: baseSalary,
      yearsRemaining: 2,
      role,
      signedSeason: season,
    },
    season,
    round: 1,
    currentDayIndex: 0,
    calendar,
    trainingLog: [],
    trainingPoints: 2,
    morale: 78,
    coachTrust: role === 'Titular' ? 72 : 58,
    popularity: 22,
    pressRelation: 65,
    teamChemistry: 70,
    fanSupport: 65,
    nationalTeamCalled: false,
    injuryMatchesRemaining: 0,
    injuryType: null,
    seasonStats: emptyStats(),
    careerStats: emptyStats(),
    competitionStats: {},
    startsCount: 0,
    recentMatches: [],
    awards: [],
    history: [],
    evolutionHistory: [makeEvolutionSnapshot(season, 1, ovr, safeAttrs)],
    offers: [],
    standings,
    serieBStandings,
    leagueLeaders: generateInitialLeaders(
      params.club.id,
      params.personal.nickname || params.personal.firstName,
      activeClubs
    ),
    copaStage: 'Oitavas',
    estadualStage: 'Fase de Grupos',
    schedule,
    serieBSchedule,
    copaBracket,
    supercopa,
    championsHistory: [],
    roundResults: [],
    news: [],
    objectives: [],
    playedMatchIds: [],
    narrativeHistory: [],
    lastSimReport: null,
  };

  career.objectives = createSeasonObjectives(career);
  career.news = buildInitialNews(career);
  return career;
}

function processNonMatchSpecialDay(next: PlayerCareer, day: CalendarDay) {
  // Handle Supercopa AI resolution when user isn't playing it
  if (day.isSupercopa && next.supercopa && !next.supercopa.played) {
    const lc = getClubById(next.supercopa.leagueChampId);
    const cc = getClubById(next.supercopa.copaChampId);
    const sim = simulateAiMatch(lc, cc, { knockout: true, neutralVenue: true });
    next.supercopa = {
      ...next.supercopa,
      homeScore: sim.homeScore,
      awayScore: sim.awayScore,
      penHome: sim.penHome,
      penAway: sim.penAway,
      winnerClubId: sim.winnerId,
      played: true,
    };
    const champ = getClubById(sim.winnerId);
    const runner = getClubById(sim.winnerId === lc.id ? cc.id : lc.id);
    const scoreStr =
      sim.penHome !== undefined
        ? `${lc.shortName} ${sim.homeScore}x${sim.awayScore} ${cc.shortName} (${sim.penHome}-${sim.penAway} pên.)`
        : `${lc.shortName} ${sim.homeScore}x${sim.awayScore} ${cc.shortName}`;

    day.resultText = scoreStr;
    next.championsHistory = [
      {
        season: next.season,
        competition: 'Supercopa do Brasil',
        championClubId: champ.id,
        runnerUpClubId: runner.id,
        scoreSummary: scoreStr,
      },
      ...(next.championsHistory || []),
    ];
    next.roundResults = [
      {
        id: `res_sup_${next.season}`,
        season: next.season,
        round: 0,
        competition: 'Supercopa do Brasil',
        homeClubId: lc.id,
        awayClubId: cc.id,
        homeScore: sim.homeScore,
        awayScore: sim.awayScore,
        penHome: sim.penHome,
        penAway: sim.penAway,
        dateLabel: day.dateLabel,
      },
      ...(next.roundResults || []),
    ].slice(0, 80);

    next.news = [
      {
        id: `news_sup_${next.season}`,
        season: next.season,
        round: 0,
        dateLabel: day.dateLabel,
        category: 'SUPERCOPA' as const,
        headline: `${champ.name} conquista a Supercopa do Brasil ${next.season}!`,
        summary: `Vitória sobre o ${runner.name} (${scoreStr}) abre oficialmente a temporada nacional.`,
        clubId: champ.id,
        opponentClubId: runner.id,
        artKind: 'trophy' as const,
      },
      ...(next.news || []),
    ].slice(0, 40);
  }

  // Handle Copa do Brasil AI stages after user was eliminated
  if (day.copaStage && next.copaBracket) {
    const stageRes = simulateCopaStageLeg(
      next.copaBracket,
      day.copaStage,
      day.copaLeg || 1,
      next.clubId,
      day.dateLabel,
      day.roundRef || next.round,
      next.standings,
      false
    );
    next.copaBracket = stageRes.bracket;
    if (stageRes.results.length > 0) {
      next.roundResults = [...stageRes.results, ...(next.roundResults || [])].slice(0, 80);
    }
    if (stageRes.championId) {
      const champ = getClubById(stageRes.championId);
      const runner = getClubById(stageRes.runnerUpId || champ.id);
      next.championsHistory = [
        {
          season: next.season,
          competition: 'Copa do Brasil',
          championClubId: champ.id,
          runnerUpClubId: runner.id,
        },
        ...(next.championsHistory || []),
      ];
      next.news = [
        {
          id: `news_copa_champ_${next.season}`,
          season: next.season,
          round: next.round,
          dateLabel: day.dateLabel,
          category: 'COPA' as const,
          headline: `${champ.name} é campeão da Copa do Brasil ${next.season}!`,
          summary: `Campanha sólida garante o troféu nacional diante do ${runner.name} e vaga na próxima Supercopa.`,
          clubId: champ.id,
          opponentClubId: runner.id,
          artKind: 'trophy' as const,
        },
        ...(next.news || []),
      ].slice(0, 40);
    }
    next.calendar = syncCalendarCopaFixtures(next.calendar, next.copaBracket, next.clubId);
  }
}

export function advanceCalendarDay(career: PlayerCareer): PlayerCareer {
  const next = structuredClone(career) as PlayerCareer;
  const day = next.calendar[next.currentDayIndex];
  if (!day) return next;
  if (day.activity === 'PARTIDA' && !day.completed) return next; // Never skip mandatory player match

  day.completed = true;
  if (day.activity === 'DESCANSO' || day.activity === 'RECUPERACAO') {
    next.fatigue = Math.max(0, next.fatigue - (day.activity === 'RECUPERACAO' ? 28 : 22));
    next.morale = Math.min(100, next.morale + 3);
    next.trainingPoints = Math.min(4, next.trainingPoints + 1);
  } else if (day.activity === 'COMPROMISSO' || day.activity === 'ESPECIAL') {
    next.popularity = Math.min(100, next.popularity + 2);
    next.morale = Math.min(100, next.morale + 2);
  } else if (day.activity === 'VIAGEM') {
    next.fatigue = Math.min(100, next.fatigue + 4);
  } else if (day.activity === 'TREINO') {
    next.trainingPoints = Math.min(4, next.trainingPoints + 1);
  }

  processNonMatchSpecialDay(next, day);

  if (next.currentDayIndex < next.calendar.length - 1) {
    next.currentDayIndex += 1;
  }
  return next;
}

export function advanceUntilNextMatch(career: PlayerCareer): PlayerCareer {
  let curr = career;
  for (let guard = 0; guard < 14; guard++) {
    const day = curr.calendar[curr.currentDayIndex];
    if (!day || (day.activity === 'PARTIDA' && !day.completed)) break;
    if (curr.currentDayIndex >= curr.calendar.length - 1) break;
    curr = advanceCalendarDay(curr);
  }
  return curr;
}

export function applyNarrativeChoice(
  career: PlayerCareer,
  dayIndex: number,
  event: NarrativeEvent,
  choice: NarrativeChoice
): PlayerCareer {
  const next = structuredClone(career) as PlayerCareer;
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

  next.morale = clamp(next.morale + (choice.effects.morale ?? 0), 15, 100);
  next.coachTrust = clamp(next.coachTrust + (choice.effects.coachTrust ?? 0), 10, 100);
  next.popularity = clamp(next.popularity + (choice.effects.popularity ?? 0), 0, 100);
  next.pressRelation = clamp((next.pressRelation ?? 65) + (choice.effects.pressRelation ?? 0), 0, 100);
  next.teamChemistry = clamp((next.teamChemistry ?? 70) + (choice.effects.teamChemistry ?? 0), 0, 100);
  next.fanSupport = clamp((next.fanSupport ?? 65) + (choice.effects.fanSupport ?? 0), 0, 100);
  next.fatigue = clamp(next.fatigue + (choice.effects.fatigue ?? 0), 0, 100);
  next.xp += Math.max(0, choice.effects.xp ?? 0);

  const day = next.calendar[dayIndex];
  if (day) {
    day.completed = true;
    day.narrativeEventId = event.id;
    day.resultText = choice.label;
    processNonMatchSpecialDay(next, day);
    if (dayIndex === next.currentDayIndex && next.currentDayIndex < next.calendar.length - 1) {
      next.currentDayIndex += 1;
    }
  }

  const playerName = next.personal.nickname || next.personal.firstName;
  next.narrativeHistory = [
    {
      eventId: event.id,
      dayIndex,
      dateLabel: day?.dateLabel || `R${next.round}`,
      category: event.category,
      title: event.title,
      choiceLabel: choice.label,
      summary: choice.responseText,
    },
    ...(next.narrativeHistory || []),
  ].slice(0, 30);

  if (event.category === 'COLETIVA' || event.category === 'ZONA_MISTA' || event.category === 'CONTRATO') {
    next.news = [
      {
        id: `news_nar_${next.season}_${dayIndex}_${Date.now()}`,
        season: next.season,
        round: next.round,
        dateLabel: day?.dateLabel || `R${next.round}`,
        category: (event.category === 'CONTRATO' ? 'MERCADO' : 'DESTAQUE') as 'MERCADO' | 'DESTAQUE',
        headline: `${playerName}: ${choice.label}`,
        summary: choice.responseText,
        clubId: next.clubId,
        artKind: 'player' as const,
      },
      ...(next.news || []),
    ].slice(0, 40);
  }

  return next;
}

export function completeTrainingDrill(
  career: PlayerCareer,
  drill: TrainingDrill,
  medal: 'Ouro' | 'Prata' | 'Bronze'
): PlayerCareer {
  if (career.trainingPoints <= 0) return career;
  const next = structuredClone(career) as PlayerCareer;

  next.trainingPoints -= 1;
  next.fatigue = Math.min(100, next.fatigue + drill.fatigueCost);

  const mult = medal === 'Ouro' ? 1.4 : medal === 'Prata' ? 1.0 : 0.65;
  const gainedXp = Math.round(drill.xpReward * mult);
  next.xp += gainedXp;

  const attrUpdates: string[] = [];
  const threshold = 90;
  const levels = Math.floor(next.xp / threshold);
  if (levels > 0) {
    next.xp = next.xp % threshold;
    const pool = drill.attributesWorked;
    for (let i = 0; i < Math.min(2, levels); i++) {
      const k = pool[Math.floor(Math.random() * pool.length)];
      if (next.attributes[k] < 99) {
        next.attributes[k] += 1;
        attrUpdates.push(`+1 ${k}`);
      }
    }
  } else if (medal === 'Ouro' && Math.random() < 0.65) {
    const k = drill.attributesWorked[0];
    if (next.attributes[k] < 99) {
      next.attributes[k] += 1;
      attrUpdates.push(`+1 ${k}`);
    }
  }

  next.ovr = calculateOverall(next.attributes, next.position);
  const age = calculateAge(next.personal.birthDate);
  next.potential = Math.max(next.ovr, next.potential ?? estimatePotential(next.ovr, age));
  next.marketValue = calculateMarketValue(next.ovr, next.potential, age, next.position);
  next.traits = derivePlayerTraits(next.attributes, next.position, next.playstyle);
  next.coachTrust = Math.min(100, next.coachTrust + (medal === 'Ouro' ? 2 : 1));

  const curDay = next.calendar[next.currentDayIndex];
  const dayLabel = curDay ? `${curDay.dateLabel} (${curDay.weekday})` : `Rod. ${next.round}`;
  next.trainingLog.unshift({
    dayLabel,
    drillName: drill.name,
    medal,
    gainText: attrUpdates.length > 0 ? `${attrUpdates.join(', ')} · +${gainedXp} XP` : `+${gainedXp} XP`,
  });
  next.trainingLog = next.trainingLog.slice(0, 15);

  if (curDay && curDay.activity === 'TREINO') {
    curDay.completed = true;
    processNonMatchSpecialDay(next, curDay);
    if (next.currentDayIndex < next.calendar.length - 1) {
      next.currentDayIndex += 1;
    }
  }
  next.objectives = evaluateObjectives(next);
  next.evolutionHistory = pushEvolutionSnapshot(next);

  return next;
}

export function applyMatchOutcomeToCareer(
  career: PlayerCareer,
  result: {
    homeClubId: string;
    awayClubId: string;
    homeScore: number;
    awayScore: number;
    penHomeScore?: number;
    penAwayScore?: number;
    fixtureId?: string;
    playerStats: MatchStatLine;
    rating: number;
    motm: boolean;
    competition?: string;
    stadiumName?: string;
    weather?: WeatherCondition;
    simReport?: MatchSimReport;
  }
): PlayerCareer {
  const next = structuredClone(career) as PlayerCareer;
  const activeDay = next.calendar[next.currentDayIndex];
  const matchId = result.fixtureId || activeDay?.matchId || `m_${next.season}_${next.round}_${result.homeClubId}_${result.awayClubId}`;

  // Guard against duplicate result registration
  next.playedMatchIds = next.playedMatchIds || [];
  if (next.playedMatchIds.includes(matchId)) {
    return next;
  }
  next.playedMatchIds.push(matchId);

  const homeClub = getClubById(result.homeClubId);
  const awayClub = getClubById(result.awayClubId);
  const compName = result.competition || activeDay?.competition || 'Brasileirão Série A';
  const dateLabel = activeDay?.dateLabel || `R${next.round}`;

  const record: MatchRecord = {
    id: matchId,
    season: next.season,
    round: next.round,
    competition: compName,
    homeClubId: result.homeClubId,
    awayClubId: result.awayClubId,
    homeName: homeClub.shortName,
    awayName: awayClub.shortName,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    penHomeScore: result.penHomeScore,
    penAwayScore: result.penAwayScore,
    fixtureId: matchId,
    startedMatch: true,
    playerClubId: next.clubId,
    playerStats: result.playerStats,
    rating: result.rating,
    motm: result.motm,
    stadiumName: result.stadiumName || homeClub.stadiumName,
    weather: result.weather || 'Ensolarado',
  };

  next.recentMatches = [record, ...next.recentMatches].slice(0, 30);
  next.seasonStats = mergeStats(next.seasonStats, result.playerStats);
  next.careerStats = mergeStats(next.careerStats, result.playerStats);
  next.startsCount = (next.startsCount ?? 0) + 1;

  // Track stats per competition
  const compBucket =
    compName.includes('Copa do Brasil')
      ? 'Copa do Brasil'
      : compName.includes('Supercopa')
      ? 'Supercopa do Brasil'
      : compName.includes('Série B') || next.division === 'Série B'
      ? 'Brasileirão Série B'
      : 'Brasileirão Série A';
  next.competitionStats = next.competitionStats || {};
  next.competitionStats[compBucket] = mergeStats(
    next.competitionStats[compBucket] || emptyStats(),
    result.playerStats
  );
  next.lastSimReport = result.simReport ?? null;

  next.fatigue = Math.min(100, next.fatigue + (result.simReport && result.simReport.userMinutes === 0 ? 4 : 18));

  const userLeader = next.leagueLeaders.find((l) => l.playerId === 'user_player');
  if (userLeader) {
    userLeader.goals = next.seasonStats.goals;
    userLeader.assists = next.seasonStats.assists;
  }

  const isUserHome = result.homeClubId === next.clubId;
  const userScore = isUserHome ? result.homeScore : result.awayScore;
  const oppScore = isUserHome ? result.awayScore : result.homeScore;
  const userPen = isUserHome ? result.penHomeScore : result.penAwayScore;
  const oppPen = isUserHome ? result.penAwayScore : result.penHomeScore;
  const wonOnPitch = userScore > oppScore;
  const wonOnPenalties =
    userScore === oppScore &&
    userPen !== undefined &&
    oppPen !== undefined &&
    userPen > oppPen;
  const won = wonOnPitch || wonOnPenalties;
  const drew = result.homeScore === result.awayScore && !wonOnPenalties;

  const newRoundResults: RoundMatchResult[] = [
    {
      id: `res_${matchId}`,
      season: next.season,
      round: next.round,
      competition: compName,
      homeClubId: result.homeClubId,
      awayClubId: result.awayClubId,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      penHome: result.penHomeScore,
      penAway: result.penAwayScore,
      dateLabel,
    },
  ];

  // Competition-specific resolution
  if (compBucket === 'Supercopa do Brasil' && next.supercopa) {
    const winnerId =
      result.homeScore > result.awayScore
        ? result.homeClubId
        : result.awayScore > result.homeScore
        ? result.awayClubId
        : (result.penHomeScore ?? 0) >= (result.penAwayScore ?? 0)
        ? result.homeClubId
        : result.awayClubId;

    const champ = getClubById(winnerId);
    const runner = getClubById(winnerId === result.homeClubId ? result.awayClubId : result.homeClubId);
    const scoreStr =
      result.penHomeScore !== undefined && result.penAwayScore !== undefined && result.homeScore === result.awayScore
        ? `${homeClub.shortName} ${result.homeScore}x${result.awayScore} ${awayClub.shortName} (${result.penHomeScore}-${result.penAwayScore} pên.)`
        : `${homeClub.shortName} ${result.homeScore}x${result.awayScore} ${awayClub.shortName}`;

    next.supercopa = {
      ...next.supercopa,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      penHome: result.penHomeScore,
      penAway: result.penAwayScore,
      winnerClubId: winnerId,
      played: true,
    };

    next.championsHistory = [
      {
        season: next.season,
        competition: 'Supercopa do Brasil',
        championClubId: champ.id,
        runnerUpClubId: runner.id,
        scoreSummary: scoreStr,
      },
      ...(next.championsHistory || []),
    ];

    if (winnerId === next.clubId) {
      next.awards.push({
        id: `aw_sup_${next.season}`,
        season: next.season,
        title: `Campeão da Supercopa do Brasil (${next.season})`,
        clubName: champ.name,
      });
    }

    next.news = [
      {
        id: `news_sup_user_${next.season}`,
        season: next.season,
        round: 0,
        dateLabel,
        category: 'SUPERCOPA' as const,
        headline: `${champ.name} levanta a Supercopa do Brasil ${next.season}!`,
        summary: `Decisão emocionante (${scoreStr}) garante a primeira taça do ano no ${record.stadiumName}.`,
        clubId: champ.id,
        opponentClubId: runner.id,
        artKind: 'trophy' as const,
      },
      ...(next.news || []),
    ].slice(0, 40);
  } else if (compBucket === 'Copa do Brasil' && next.copaBracket) {
    const copaStage: CopaStageId = activeDay?.copaStage || (next.copaBracket.currentStage === 'Concluída' ? 'Final' : next.copaBracket.currentStage);
    const copaLeg: 1 | 2 = activeDay?.copaLeg || 1;
    const bracket: CopaBracketState = structuredClone(next.copaBracket);
    const userTie = bracket.ties.find(
      (t) => t.stage === copaStage && (t.homeClubId === next.clubId || t.awayClubId === next.clubId)
    );

    if (userTie) {
      if (copaLeg === 1) {
        userTie.homeScoreLeg1 = result.homeScore;
        userTie.awayScoreLeg1 = result.awayScore;
        userTie.playedLeg1 = true;
        if (!userTie.twoLegged) {
          userTie.playedLeg2 = true;
          userTie.penHome = result.penHomeScore;
          userTie.penAway = result.penAwayScore;
          userTie.winnerClubId = won ? next.clubId : (next.clubId === userTie.homeClubId ? userTie.awayClubId : userTie.homeClubId);
        }
      } else {
        userTie.homeScoreLeg2 = result.homeScore;
        userTie.awayScoreLeg2 = result.awayScore;
        userTie.playedLeg2 = true;
        const aggA = (userTie.homeScoreLeg1 ?? 0) + (userTie.awayScoreLeg2 ?? 0);
        const aggB = (userTie.awayScoreLeg1 ?? 0) + (userTie.homeScoreLeg2 ?? 0);
        if (aggA > aggB) userTie.winnerClubId = userTie.homeClubId;
        else if (aggB > aggA) userTie.winnerClubId = userTie.awayClubId;
        else if (wonOnPenalties) {
          userTie.winnerClubId = next.clubId;
          userTie.penHome = result.penHomeScore;
          userTie.penAway = result.penAwayScore;
        } else {
          userTie.winnerClubId = won ? next.clubId : (next.clubId === userTie.homeClubId ? userTie.awayClubId : userTie.homeClubId);
        }
      }
    }

    const simRes = simulateCopaStageLeg(
      bracket,
      copaStage,
      copaLeg,
      next.clubId,
      dateLabel,
      next.round,
      next.standings,
      true
    );
    next.copaBracket = simRes.bracket;
    newRoundResults.push(...simRes.results);

    if (simRes.stageCompleted && userTie) {
      const winnerId = resolveTieWinner(userTie);
      if (copaStage === 'Final') {
        const champ = getClubById(winnerId);
        const runner = getClubById(winnerId === userTie.homeClubId ? userTie.awayClubId : userTie.homeClubId);
        next.championsHistory = [
          {
            season: next.season,
            competition: 'Copa do Brasil',
            championClubId: champ.id,
            runnerUpClubId: runner.id,
            scoreSummary: `${homeClub.shortName} ${result.homeScore}x${result.awayScore} ${awayClub.shortName}`,
          },
          ...(next.championsHistory || []),
        ];
        if (winnerId === next.clubId) {
          next.copaStage = 'Campeão';
          next.awards.push({
            id: `aw_copa_${next.season}`,
            season: next.season,
            title: `Campeão da Copa do Brasil (${next.season})`,
            clubName: champ.name,
          });
        } else {
          next.copaStage = 'Eliminado';
        }
      } else if (winnerId === next.clubId) {
        next.copaStage = simRes.bracket.currentStage === 'Concluída' ? 'Final' : simRes.bracket.currentStage;
      } else {
        next.copaStage = 'Eliminado';
      }
    }

    next.calendar = syncCalendarCopaFixtures(next.calendar, next.copaBracket, next.clubId);
  } else {
    // Brasileirão Série A or Série B (User Round) + Full AI Simulation of Both Divisions
    const serieAClubs = getDivisionClubsFromIds(next.serieAClubIds, CLUBS);
    const serieBClubs = getDivisionClubsFromIds(next.serieBClubIds, SERIE_B_CLUBS);
    next.serieBStandings = next.serieBStandings || buildEmptyStandings(serieBClubs);
    next.serieBSchedule = next.serieBSchedule || generateSchedule(serieBClubs, 'Brasileirão Série B');

    if (compBucket === 'Brasileirão Série B') {
      applyMatchToStandings(next.serieBStandings, result.homeClubId, result.awayClubId, result.homeScore, result.awayScore);

      // Other 9 Série B matches
      const otherB = next.serieBSchedule.filter(
        (f) => f.round === next.round && f.homeClubId !== next.clubId && f.awayClubId !== next.clubId
      );
      for (const fx of otherB) {
        const hc = getClubById(fx.homeClubId);
        const ac = getClubById(fx.awayClubId);
        const sim = simulateAiMatch(hc, ac, { standings: next.serieBStandings });
        applyMatchToStandings(next.serieBStandings, fx.homeClubId, fx.awayClubId, sim.homeScore, sim.awayScore);
        newRoundResults.push({
          id: `res_b_${next.season}_r${next.round}_${fx.homeClubId}`,
          season: next.season,
          round: next.round,
          competition: 'Brasileirão Série B',
          homeClubId: fx.homeClubId,
          awayClubId: fx.awayClubId,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          dateLabel,
        });
        if (sim.homeScore > 0) {
          const l = next.leagueLeaders.find((x) => x.clubId === fx.homeClubId && x.playerId.endsWith('_9'));
          if (l) l.goals += Math.min(2, sim.homeScore);
        }
        if (sim.awayScore > 0) {
          const l = next.leagueLeaders.find((x) => x.clubId === fx.awayClubId && x.playerId.endsWith('_9'));
          if (l) l.goals += Math.min(2, sim.awayScore);
        }
        const astH = next.leagueLeaders.find((x) => x.clubId === fx.homeClubId && x.playerId.endsWith('_7'));
        if (astH && sim.homeScore > 0) astH.assists += 1;
        const astA = next.leagueLeaders.find((x) => x.clubId === fx.awayClubId && x.playerId.endsWith('_7'));
        if (astA && sim.awayScore > 0) astA.assists += 1;
      }

      // All 10 Série A matches
      const roundA = next.schedule.filter((f) => f.round === next.round);
      for (const fx of roundA) {
        const hc = getClubById(fx.homeClubId);
        const ac = getClubById(fx.awayClubId);
        const sim = simulateAiMatch(hc, ac, { standings: next.standings });
        applyMatchToStandings(next.standings, fx.homeClubId, fx.awayClubId, sim.homeScore, sim.awayScore);
        newRoundResults.push({
          id: `res_a_${next.season}_r${next.round}_${fx.homeClubId}`,
          season: next.season,
          round: next.round,
          competition: 'Brasileirão Série A',
          homeClubId: fx.homeClubId,
          awayClubId: fx.awayClubId,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          dateLabel,
        });
      }
    } else {
      // User is in Série A
      applyMatchToStandings(next.standings, result.homeClubId, result.awayClubId, result.homeScore, result.awayScore);

      const otherA = next.schedule.filter(
        (f) => f.round === next.round && f.homeClubId !== next.clubId && f.awayClubId !== next.clubId
      );
      for (const fx of otherA) {
        const hc = getClubById(fx.homeClubId);
        const ac = getClubById(fx.awayClubId);
        const sim = simulateAiMatch(hc, ac, { standings: next.standings });
        applyMatchToStandings(next.standings, fx.homeClubId, fx.awayClubId, sim.homeScore, sim.awayScore);
        newRoundResults.push({
          id: `res_a_${next.season}_r${next.round}_${fx.homeClubId}`,
          season: next.season,
          round: next.round,
          competition: 'Brasileirão Série A',
          homeClubId: fx.homeClubId,
          awayClubId: fx.awayClubId,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          dateLabel,
        });

        if (sim.homeScore > 0) {
          const l = next.leagueLeaders.find((x) => x.clubId === fx.homeClubId && x.playerId.endsWith('_9'));
          if (l) l.goals += Math.min(2, sim.homeScore);
        }
        if (sim.awayScore > 0) {
          const l = next.leagueLeaders.find((x) => x.clubId === fx.awayClubId && x.playerId.endsWith('_9'));
          if (l) l.goals += Math.min(2, sim.awayScore);
        }
        const astH = next.leagueLeaders.find((x) => x.clubId === fx.homeClubId && x.playerId.endsWith('_7'));
        if (astH && sim.homeScore > 0) astH.assists += 1;
        const astA = next.leagueLeaders.find((x) => x.clubId === fx.awayClubId && x.playerId.endsWith('_7'));
        if (astA && sim.awayScore > 0) astA.assists += 1;
      }

      // All 10 Série B matches
      const roundB = next.serieBSchedule.filter((f) => f.round === next.round);
      for (const fx of roundB) {
        const hc = getClubById(fx.homeClubId);
        const ac = getClubById(fx.awayClubId);
        const sim = simulateAiMatch(hc, ac, { standings: next.serieBStandings });
        applyMatchToStandings(next.serieBStandings, fx.homeClubId, fx.awayClubId, sim.homeScore, sim.awayScore);
        newRoundResults.push({
          id: `res_b_${next.season}_r${next.round}_${fx.homeClubId}`,
          season: next.season,
          round: next.round,
          competition: 'Brasileirão Série B',
          homeClubId: fx.homeClubId,
          awayClubId: fx.awayClubId,
          homeScore: sim.homeScore,
          awayScore: sim.awayScore,
          dateLabel,
        });
      }
    }

    next.standings = sortStandings(next.standings);
    next.serieBStandings = sortStandings(next.serieBStandings);
  }

  next.roundResults = [...newRoundResults, ...(next.roundResults || [])].slice(0, 100);

  // News generation for match & round
  const generatedNews = createMatchNewsItem({
    season: next.season,
    round: next.round,
    dateLabel,
    competition: compName,
    homeClub,
    awayClub,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    userClubId: next.clubId,
    userGoals: result.playerStats.goals,
    playerName: next.personal.nickname || next.personal.firstName,
    leagueLeaders: next.leagueLeaders,
  });
  next.news = [...generatedNews, ...(next.news || [])].slice(0, 40);

  // Match-driven attribute growth
  const posMeta = getPositionMeta(next.position);
  next.xp += Math.round(result.rating * 5);
  if (result.rating >= 7.2) {
    const keys = Object.keys(posMeta.weights) as (keyof PlayerAttributes)[];
    const picked = keys[Math.floor(Math.random() * keys.length)];
    if (picked) next.attributes[picked] = Math.min(99, next.attributes[picked] + 1);
  }
  if (result.playerStats.goals > 0 && Math.random() < 0.55) {
    next.attributes.finalizacao = Math.min(99, next.attributes.finalizacao + 1);
  }
  if (result.playerStats.assists > 0 && Math.random() < 0.55) {
    next.attributes.visaoJogo = Math.min(99, next.attributes.visaoJogo + 1);
  }
  next.ovr = calculateOverall(next.attributes, next.position);
  const age = calculateAge(next.personal.birthDate);
  next.potential = Math.max(next.ovr, next.potential ?? estimatePotential(next.ovr, age));
  next.marketValue = calculateMarketValue(next.ovr, next.potential, age, next.position);
  next.traits = derivePlayerTraits(next.attributes, next.position, next.playstyle);

  next.morale = Math.max(20, Math.min(100, next.morale + (won ? 5 : drew ? 1 : -4) + (result.rating >= 7.5 ? 4 : 0)));
  next.coachTrust = Math.max(15, Math.min(100, next.coachTrust + (result.rating >= 7.0 ? 4 : result.rating < 6.0 ? -3 : 1)));
  next.popularity = Math.min(100, next.popularity + (result.playerStats.goals * 3 + result.playerStats.assists * 2 + (result.motm ? 4 : 1)));
  next.fanSupport = Math.max(20, Math.min(100, (next.fanSupport ?? 65) + (won ? 3 : drew ? 0 : -2) + (result.playerStats.goals > 0 ? 2 : 0)));

  if (next.ovr >= 76 && next.popularity >= 55 && !next.nationalTeamCalled) {
    next.nationalTeamCalled = true;
    next.awards.push({
      id: `aw_sel_${next.season}`,
      season: next.season,
      title: 'Convocação para a Seleção Brasileira',
      clubName: getClubById(next.clubId).name,
    });
  }

  if (next.injuryMatchesRemaining > 0) {
    next.injuryMatchesRemaining = Math.max(0, next.injuryMatchesRemaining - 1);
    if (next.injuryMatchesRemaining === 0) next.injuryType = null;
  } else if (next.fatigue > 82 && Math.random() < 0.14) {
    next.injuryMatchesRemaining = 1;
    next.injuryType = 'Fadiga muscular por sobrecarga';
  }

  // Mark calendar day completed & store result summary
  const matchDayIdx = next.calendar.findIndex((d) => d.matchId === matchId) >= 0
    ? next.calendar.findIndex((d) => d.matchId === matchId)
    : next.calendar.findIndex((d) => d.dayIndex === next.currentDayIndex);

  if (matchDayIdx >= 0) {
    next.calendar[matchDayIdx].resultText = `${homeClub.shortName} ${result.homeScore}x${result.awayScore} ${awayClub.shortName}`;
    for (let i = 0; i <= matchDayIdx; i++) {
      next.calendar[i].completed = true;
    }
    next.currentDayIndex = Math.min(next.calendar.length - 1, matchDayIdx + 1);
  }

  next.trainingPoints = Math.min(4, next.trainingPoints + 2);
  next.evolutionHistory = pushEvolutionSnapshot(next);

  // Update objectives & grant small bonus when newly completed
  const prevCompleted = new Set((career.objectives || []).filter((o) => o.completed).map((o) => o.id));
  next.objectives = evaluateObjectives(next);
  for (const obj of next.objectives) {
    if (obj.completed && !prevCompleted.has(obj.id)) {
      next.xp += 45;
      next.morale = Math.min(100, next.morale + 4);
      next.coachTrust = Math.min(100, next.coachTrust + 3);
    }
  }

  // Advance Brasileirão round (Série A or Série B) & process Promotion/Relegation at Round 38
  const activeSchedule = compBucket === 'Brasileirão Série B' ? next.serieBSchedule || next.schedule : next.schedule;
  const maxRound = activeSchedule.reduce((m, f) => Math.max(m, f.round), 38);
  if (compBucket === 'Brasileirão Série A' || compBucket === 'Brasileirão Série B') {
    if (next.round >= maxRound) {
      const currentClub = getClubById(next.clubId);
      const userDivision = next.division || (compBucket === 'Brasileirão Série B' ? 'Série B' : 'Série A');
      const avg = next.seasonStats.matches > 0 ? +(next.seasonStats.ratingSum / next.seasonStats.matches).toFixed(2) : 6.5;
      next.history.unshift({
        season: next.season,
        clubId: next.clubId,
        clubName: currentClub.name,
        division: userDivision,
        matches: next.seasonStats.matches,
        goals: next.seasonStats.goals,
        assists: next.seasonStats.assists,
        avgRating: avg,
      });

      const sortedA = sortStandings(next.standings);
      const sortedB = sortStandings(next.serieBStandings || buildEmptyStandings(SERIE_B_CLUBS));

      const leagueChampId = sortedA[0]?.clubId || next.clubId;
      const leagueRunnerId = sortedA[1]?.clubId;
      const serieBChampId = sortedB[0]?.clubId || SERIE_B_CLUBS[0].id;
      const serieBRunnerId = sortedB[1]?.clubId;

      next.championsHistory = [
        {
          season: next.season,
          competition: 'Brasileirão Série A',
          championClubId: leagueChampId,
          runnerUpClubId: leagueRunnerId,
          scoreSummary: `${sortedA[0]?.points ?? 0} pts`,
        },
        {
          season: next.season,
          competition: 'Brasileirão Série B',
          championClubId: serieBChampId,
          runnerUpClubId: serieBRunnerId,
          scoreSummary: `${sortedB[0]?.points ?? 0} pts`,
        },
        ...(next.championsHistory || []),
      ];

      if (userDivision === 'Série A' && leagueChampId === next.clubId) {
        next.awards.push({
          id: `aw_title_${next.season}`,
          season: next.season,
          title: `Campeão do Brasileirão Série A (${next.season})`,
          clubName: currentClub.name,
        });
      } else if (userDivision === 'Série B' && serieBChampId === next.clubId) {
        next.awards.push({
          id: `aw_title_b_${next.season}`,
          season: next.season,
          title: `Campeão do Brasileirão Série B (${next.season})`,
          clubName: currentClub.name,
        });
      }

      if (avg >= 7.4) {
        next.awards.push({
          id: `aw_mvp_${next.season}`,
          season: next.season,
          title: `Craque do Campeonato (${next.season})`,
          clubName: currentClub.name,
        });
      }

      // Real Promotion & Relegation (Top 4 Série B up <-> Bottom 4 Série A down)
      const promotedIds = sortedB.slice(0, 4).map((s) => s.clubId);
      const relegatedIds = sortedA.slice(-4).map((s) => s.clubId);
      const promotedSet = new Set(promotedIds);
      const relegatedSet = new Set(relegatedIds);

      const nextSerieAIds = [
        ...sortedA.filter((s) => !relegatedSet.has(s.clubId)).map((s) => s.clubId),
        ...promotedIds,
      ];
      const nextSerieBIds = [
        ...relegatedIds,
        ...sortedB.filter((s) => !promotedSet.has(s.clubId)).map((s) => s.clubId),
      ];

      const userPromoted = userDivision === 'Série B' && promotedSet.has(next.clubId);
      const userRelegated = userDivision === 'Série A' && relegatedSet.has(next.clubId);
      if (userPromoted) {
        next.awards.push({
          id: `aw_acesso_${next.season}`,
          season: next.season,
          title: `Acesso para a Série A (${next.season})`,
          clubName: currentClub.name,
        });
      }

      const nextDivision: 'Série A' | 'Série B' = nextSerieBIds.includes(next.clubId) ? 'Série B' : 'Série A';
      const nextSerieAClubs = getDivisionClubsFromIds(nextSerieAIds, CLUBS);
      const nextSerieBClubs = getDivisionClubsFromIds(nextSerieBIds, SERIE_B_CLUBS);

      const copaChampId = next.copaBracket?.championClubId || leagueRunnerId || 'flamengo';

      // Advance to next season
      next.season += 1;
      next.round = 1;
      next.division = nextDivision;
      next.serieAClubIds = nextSerieAIds;
      next.serieBClubIds = nextSerieBIds;
      next.contract.yearsRemaining = Math.max(0, next.contract.yearsRemaining - 1);
      next.seasonStats = emptyStats();
      next.competitionStats = {};
      next.playedMatchIds = [];
      next.copaStage = 'Oitavas';
      next.estadualStage = 'Fase de Grupos';
      next.standings = buildEmptyStandings(nextSerieAClubs);
      next.serieBStandings = buildEmptyStandings(nextSerieBClubs);
      next.schedule = generateSchedule(nextSerieAClubs, 'Brasileirão Série A');
      next.serieBSchedule = generateSchedule(nextSerieBClubs, 'Brasileirão Série B');
      const nextUserSchedule = nextDivision === 'Série B' ? next.serieBSchedule : next.schedule;
      const nextUserClubs = nextDivision === 'Série B' ? nextSerieBClubs : nextSerieAClubs;

      next.copaBracket = createCopaBracket(next.season, next.clubId);
      next.supercopa = createInitialSupercopa(next.season, leagueChampId, copaChampId);
      next.calendar = generateSeasonCalendar(
        nextUserSchedule,
        next.clubId,
        next.season,
        next.copaBracket,
        next.supercopa
      );
      next.currentDayIndex = 0;
      next.leagueLeaders = generateInitialLeaders(
        next.clubId,
        next.personal.nickname || next.personal.firstName,
        nextUserClubs
      );
      next.objectives = createSeasonObjectives(next);

      const promoNames = promotedIds.map((id) => getClubById(id).shortName).join(', ');
      const relNames = relegatedIds.map((id) => getClubById(id).shortName).join(', ');
      next.news = [
        {
          id: `news_promo_${next.season}`,
          season: next.season,
          round: 1,
          dateLabel: '10/01',
          category: 'DESTAQUE' as const,
          headline: userPromoted
            ? `${currentClub.name} garante acesso histórico para a Série A ${next.season}!`
            : userRelegated
            ? `${currentClub.name} disputará a Série B na temporada ${next.season}`
            : `Definidos acessos e rebaixamentos para a temporada ${next.season}`,
          summary: `Subiram para a Série A: ${promoNames}. Rebaixados para a Série B: ${relNames}.`,
          clubId: next.clubId,
          artKind: 'trophy' as const,
        },
        ...buildInitialNews(next),
      ].slice(0, 40);
    } else {
      next.round += 1;
    }
  }

  next.offers = generateOffers(next);
  return next;
}

function generateOffers(career: PlayerCareer): TransferOffer[] {
  const serieBSet = new Set(career.serieBClubIds || SERIE_B_CLUBS.map((c) => c.id));
  const candidates = getAllClubs().filter(
    (c) =>
      c.id !== career.clubId &&
      Math.abs(c.squadQuality - career.ovr) <= 13
  );
  const offers: TransferOffer[] = [];
  if (career.round % 3 === 0 || career.contract.yearsRemaining === 0) {
    const sorted = [...candidates].sort(
      (a, b) => Math.abs(a.squadQuality - career.ovr) - Math.abs(b.squadQuality - career.ovr)
    );
    const picks = sorted.slice(0, 3);
    picks.forEach((c, idx) => {
      const div = serieBSet.has(c.id) ? 'Série B' : 'Série A';
      offers.push({
        id: `off_${career.season}_${career.round}_${c.id}`,
        clubId: c.id,
        clubName: c.name,
        division: div,
        type: idx === 1 && career.ovr < 73 ? 'Empréstimo' : 'Transferência',
        weeklySalary: Math.max(3500, Math.round((career.contract.weeklySalary * (1.1 + idx * 0.08)) / 100) * 100),
        years: idx === 1 ? 1 : 3,
        role: career.ovr >= c.squadQuality ? 'Estrela' : 'Titular',
      });
    });

    const cur = getClubById(career.clubId);
    const curDiv = serieBSet.has(cur.id) ? 'Série B' : 'Série A';
    offers.push({
      id: `ren_${career.season}_${career.round}`,
      clubId: cur.id,
      clubName: cur.name,
      division: curDiv,
      type: 'Renovação',
      weeklySalary: Math.max(3500, Math.round((career.contract.weeklySalary * 1.15) / 100) * 100),
      years: 2,
      role: career.ovr >= cur.squadQuality ? 'Estrela' : 'Titular',
    });
  }
  return offers;
}

export function applyTrainingFocus(
  career: PlayerCareer,
  focus: 'FISICO' | 'ATAQUE' | 'PASSE' | 'DRIBLE' | 'DEFESA' | 'GOLEIRO'
): PlayerCareer {
  if (career.trainingPoints <= 0) return career;
  const next = structuredClone(career) as PlayerCareer;
  next.trainingPoints -= 1;

  const map: Record<typeof focus, (keyof PlayerAttributes)[]> = {
    FISICO: ['velocidade', 'aceleracao', 'resistencia', 'forcaFisica', 'agilidade', 'equilibrio', 'impulsao'],
    ATAQUE: ['finalizacao', 'potenciaChute', 'precisaoChute', 'cabeceio', 'voleio'],
    PASSE: ['passeCurto', 'passeLongo', 'cruzamento', 'visaoJogo', 'decisoes'],
    DRIBLE: ['drible', 'controleBola', 'dominio', 'compostura'],
    DEFESA: ['marcacao', 'desarme', 'posicionamentoDefensivo', 'interceptacao', 'lideranca'],
    GOLEIRO: ['reflexos', 'elasticidade', 'posicionamentoGk', 'saidasGol', 'defesaPenaltis', 'reposicao'],
  };

  const pool = map[focus];
  const a = pool[Math.floor(Math.random() * pool.length)];
  next.attributes[a] = Math.min(99, next.attributes[a] + 1);
  next.ovr = calculateOverall(next.attributes, next.position);
  const age = calculateAge(next.personal.birthDate);
  next.potential = Math.max(next.ovr, next.potential ?? estimatePotential(next.ovr, age));
  next.marketValue = calculateMarketValue(next.ovr, next.potential, age, next.position);
  next.traits = derivePlayerTraits(next.attributes, next.position, next.playstyle);
  next.coachTrust = Math.min(100, next.coachTrust + 1);
  return next;
}

export function acceptOffer(career: PlayerCareer, offer: TransferOffer): PlayerCareer {
  const next = structuredClone(career) as PlayerCareer;
  const serieBSet = new Set(next.serieBClubIds || SERIE_B_CLUBS.map((c) => c.id));
  const targetDivision: 'Série A' | 'Série B' =
    offer.division === 'Série B' || serieBSet.has(offer.clubId) ? 'Série B' : 'Série A';

  next.clubId = offer.clubId;
  next.division = targetDivision;
  next.contract = {
    clubId: offer.clubId,
    clubName: offer.clubName,
    weeklySalary: offer.weeklySalary,
    yearsRemaining: offer.years,
    role: offer.role,
    signedSeason: next.season,
  };
  next.offers = [];
  next.morale = Math.min(100, next.morale + 10);
  next.teamChemistry = 62;
  next.fanSupport = 60;

  const targetSchedule =
    targetDivision === 'Série B'
      ? next.serieBSchedule || generateSchedule(SERIE_B_CLUBS, 'Brasileirão Série B')
      : next.schedule;

  next.calendar = generateSeasonCalendar(
    targetSchedule,
    next.clubId,
    next.season,
    next.copaBracket,
    next.supercopa
  );
  const targetDayIdx = next.calendar.findIndex(
    (d) => d.activity === 'PARTIDA' && (d.roundRef ?? 0) >= next.round
  );
  next.currentDayIndex = targetDayIdx >= 0 ? targetDayIdx : Math.min(next.calendar.length - 1, (next.round - 1) * 4);
  for (let i = 0; i < next.currentDayIndex; i++) {
    next.calendar[i].completed = true;
  }
  next.news = [
    {
      id: `news_transf_${next.season}_${next.round}_${Date.now()}`,
      season: next.season,
      round: next.round,
      dateLabel: next.calendar[next.currentDayIndex]?.dateLabel || `R${next.round}`,
      category: 'MERCADO' as const,
      headline: `${next.personal.nickname || next.personal.firstName} assina com o ${offer.clubName}`,
      summary: `Acordo de ${offer.type.toLowerCase()} por ${offer.years} ano(s) fortalece o elenco na ${targetDivision}.`,
      clubId: offer.clubId,
      artKind: 'transfer' as const,
    },
    ...(next.news || []),
  ].slice(0, 40);
  return next;
}

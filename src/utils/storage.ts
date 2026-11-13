import { CLUBS, getClubById, resolveClubId } from '../data/clubs';
import { calculateOverall, getPositionMeta } from '../data/positions';
import {
  CalendarActivityType,
  CalendarDay,
  Club,
  EvolutionPoint,
  GameSettings,
  LeagueLeader,
  LeagueStanding,
  MatchRecord,
  MatchStatLine,
  PlayerAppearance,
  PlayerAttributes,
  PlayerCareer,
  PlayerPersonalInfo,
  PlaystyleId,
  PositionId,
  SportGear,
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

export function loadCareer(): PlayerCareer | null {
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerCareer>;
    if (!parsed.clubId || !parsed.schedule) return null;

    const resolvedClubId = resolveClubId(parsed.clubId);
    const resolvedClub = getClubById(resolvedClubId);

    // Migrate schedule club IDs
    const migratedSchedule = (parsed.schedule || []).map((f) => ({
      ...f,
      homeClubId: resolveClubId(f.homeClubId),
      awayClubId: resolveClubId(f.awayClubId),
    }));

    // Migrate standings and ensure all 20 Série A clubs are represented
    const standingMap = new Map<string, LeagueStanding>();
    for (const s of parsed.standings || []) {
      const rId = resolveClubId(s.clubId);
      if (!standingMap.has(rId)) {
        standingMap.set(rId, { ...s, clubId: rId });
      }
    }
    for (const c of CLUBS) {
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
    const migratedStandings = Array.from(standingMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return b.gf - b.ga - (a.gf - a.ga);
    });

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

    const season = parsed.season ?? 2026;
    const round = parsed.round ?? 1;
    const ovr = parsed.ovr ?? 68;
    const attrs = parsed.attributes as PlayerAttributes;

    const migrated: PlayerCareer = {
      ...(parsed as PlayerCareer),
      clubId: resolvedClubId,
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
      copaStage: parsed.copaStage ?? 'Oitavas',
      estadualStage: parsed.estadualStage ?? 'Fase de Grupos',
      standings: migratedStandings,
      schedule: migratedSchedule,
      recentMatches: (parsed.recentMatches || []).map((m) => ({
        ...m,
        homeClubId: resolveClubId(m.homeClubId),
        awayClubId: resolveClubId(m.awayClubId),
        playerClubId: resolveClubId(m.playerClubId),
      })),
      leagueLeaders: (
        parsed.leagueLeaders ??
        generateInitialLeaders(resolvedClubId, parsed.personal?.nickname || 'Você')
      ).map((l) => ({ ...l, clubId: resolveClubId(l.clubId) })),
      calendar:
        parsed.calendar && parsed.calendar.length > 0
          ? parsed.calendar.map((d) => ({
              ...d,
              opponentClubId: d.opponentClubId ? resolveClubId(d.opponentClubId) : undefined,
            }))
          : generateSeasonCalendar(migratedSchedule, resolvedClubId, season),
      currentDayIndex: parsed.currentDayIndex ?? 0,
      evolutionHistory:
        parsed.evolutionHistory && parsed.evolutionHistory.length > 0
          ? parsed.evolutionHistory
          : attrs
          ? [makeEvolutionSnapshot(season, round, ovr, attrs)]
          : [],
    };
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

export function generateSchedule(clubs: Club[]): { round: number; homeClubId: string; awayClubId: string; competition: string }[] {
  const ids = clubs.map((c) => c.id);
  const n = ids.length;
  const half = Math.floor(n / 2);
  const rotating = ids.slice(1);
  const fixtures: { round: number; homeClubId: string; awayClubId: string; competition: string }[] = [];

  for (let r = 0; r < n - 1; r++) {
    const order = [ids[0], ...rotating];
    for (let i = 0; i < half; i++) {
      const c1 = order[i];
      const c2 = order[n - 1 - i];
      const flip = (r + i) % 2 === 1;
      const roundNum = r + 1;
      const comp = roundNum === 9 || roundNum === 17 ? 'Copa Nacional' : 'Brasileirão Série A';
      fixtures.push({
        round: roundNum,
        homeClubId: flip ? c2 : c1,
        awayClubId: flip ? c1 : c2,
        competition: comp,
      });
    }
    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  const firstLeg = [...fixtures];
  for (const f of firstLeg) {
    const rNum = f.round + (n - 1);
    const comp = rNum === 26 || rNum === 34 ? 'Copa Nacional' : 'Brasileirão Série A';
    fixtures.push({
      round: rNum,
      homeClubId: f.awayClubId,
      awayClubId: f.homeClubId,
      competition: comp,
    });
  }
  return fixtures;
}

export function generateSeasonCalendar(
  schedule: { round: number; homeClubId: string; awayClubId: string; competition?: string }[],
  clubId: string,
  season: number
): CalendarDay[] {
  const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const clubFixtures = schedule.filter((f) => f.homeClubId === clubId || f.awayClubId === clubId);
  const days: CalendarDay[] = [];
  const startDate = new Date(season, 1, 2); // Feb 2

  // 4 days per round cycle: Training -> Travel/Prep -> Match -> Recovery/Rest
  let dayIdx = 0;
  for (let r = 0; r < clubFixtures.length; r++) {
    const fx = clubFixtures[r];
    const isHome = fx.homeClubId === clubId;
    const oppId = isHome ? fx.awayClubId : fx.homeClubId;
    const opp = getClubById(oppId);
    const comp = fx.competition || 'Liga Nacional';

    const cycle: { act: CalendarActivityType; title: string; note: string; isMatch?: boolean }[] = [
      {
        act: 'TREINO',
        title: 'Treino no CT',
        note: 'Sessão técnica e tática com o elenco.',
      },
      {
        act: isHome ? 'COMPROMISSO' : 'VIAGEM',
        title: isHome ? 'Coletiva & Concentração' : `Viagem para ${opp.city}`,
        note: isHome ? 'Preparação tática pré-jogo e atendimento à imprensa.' : `Deslocamento com a delegação para enfrentar ${opp.shortName}.`,
      },
      {
        act: 'PARTIDA',
        title: `${comp}: vs ${opp.shortName}`,
        note: isHome ? `Jogo em casa · ${getClubById(clubId).stadiumName}` : `Jogo fora · ${opp.stadiumName}`,
        isMatch: true,
      },
      {
        act: r % 3 === 2 ? 'ESPECIAL' : r % 2 === 0 ? 'RECUPERACAO' : 'DESCANSO',
        title:
          r % 3 === 2
            ? 'Evento com Torcedores'
            : r % 2 === 0
            ? 'Recuperação Física'
            : 'Dia de Descanso',
        note:
          r % 3 === 2
            ? 'Sessão de autógrafos que eleva sua popularidade.'
            : 'Fisioterapia, crioterapia e regeneração muscular.',
      },
    ];

    for (const item of cycle) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + dayIdx * 2);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      days.push({
        dayIndex: dayIdx,
        dateLabel: `${dd}/${mm}`,
        weekday: weekdays[dayIdx % 7],
        activity: item.act,
        title: item.title,
        completed: false,
        roundRef: item.isMatch ? fx.round : undefined,
        competition: item.isMatch ? comp : undefined,
        opponentClubId: item.isMatch ? oppId : undefined,
        isHome: item.isMatch ? isHome : undefined,
        kickoffTime: item.isMatch ? ['16:00', '18:30', '21:00', '10:30'][fx.round % 4] : undefined,
        note: item.note,
      });
      dayIdx++;
    }
  }
  return days;
}

function generateInitialLeaders(userClubId: string, userName: string): LeagueLeader[] {
  const leaders: LeagueLeader[] = [
    { playerId: 'user_player', name: userName, clubId: userClubId, goals: 0, assists: 0 },
  ];
  CLUBS.forEach((c) => {
    const striker = c.squad[9];
    const playmaker = c.squad[7];
    if (striker && c.id !== userClubId) {
      leaders.push({ playerId: striker.id, name: striker.name, clubId: c.id, goals: 0, assists: 0 });
    }
    if (playmaker && c.id !== userClubId) {
      leaders.push({ playerId: playmaker.id, name: playmaker.name, clubId: c.id, goals: 0, assists: 0 });
    }
  });
  return leaders;
}

export function createInitialCareer(params: {
  personal: PlayerPersonalInfo;
  appearance: PlayerAppearance;
  gear: SportGear;
  position: PositionId;
  playstyle: PlaystyleId;
  attributes: PlayerAttributes;
  club: Club;
}): PlayerCareer {
  const ovr = calculateOverall(params.attributes, params.position);
  const baseSalary = Math.round((params.club.squadQuality * 140 + ovr * 95) / 100) * 100;
  const role =
    ovr >= params.club.squadQuality - 3
      ? 'Titular'
      : ovr >= params.club.squadQuality - 10
      ? 'Rotação'
      : 'Reserva';

  const standings: LeagueStanding[] = CLUBS.map((c) => ({
    clubId: c.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
  }));

  const schedule = generateSchedule(CLUBS);
  const season = 2026;
  const calendar = generateSeasonCalendar(schedule, params.club.id, season);
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

  return {
    id: `career_${Date.now()}`,
    personal: params.personal,
    appearance: normalizedAppearance,
    gear: normalizedGear,
    position: params.position,
    playstyle: params.playstyle,
    attributes: params.attributes,
    ovr,
    xp: 0,
    fatigue: 10,
    clubId: params.club.id,
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
    nationalTeamCalled: false,
    injuryMatchesRemaining: 0,
    injuryType: null,
    seasonStats: emptyStats(),
    careerStats: emptyStats(),
    recentMatches: [],
    awards: [],
    history: [],
    evolutionHistory: [makeEvolutionSnapshot(season, 1, ovr, params.attributes)],
    offers: [],
    standings,
    leagueLeaders: generateInitialLeaders(
      params.club.id,
      params.personal.nickname || params.personal.firstName
    ),
    copaStage: 'Oitavas',
    estadualStage: 'Fase de Grupos',
    schedule,
  };
}

export function advanceCalendarDay(career: PlayerCareer): PlayerCareer {
  const next = structuredClone(career) as PlayerCareer;
  const day = next.calendar[next.currentDayIndex];
  if (!day) return next;
  if (day.activity === 'PARTIDA') return next; // Match days must be played/resolved

  day.completed = true;
  if (day.activity === 'DESCANSO' || day.activity === 'RECUPERACAO') {
    next.fatigue = Math.max(0, next.fatigue - (day.activity === 'RECUPERACAO' ? 28 : 22));
    next.morale = Math.min(100, next.morale + 3);
    next.trainingPoints = Math.min(4, next.trainingPoints + 1);
  } else if (day.activity === 'COMPROMISSO' || day.activity === 'ESPECIAL') {
    next.popularity = Math.min(100, next.popularity + 3);
    next.morale = Math.min(100, next.morale + 2);
  } else if (day.activity === 'VIAGEM') {
    next.fatigue = Math.min(100, next.fatigue + 4);
  } else if (day.activity === 'TREINO') {
    next.trainingPoints = Math.min(4, next.trainingPoints + 1);
  }

  if (next.currentDayIndex < next.calendar.length - 1) {
    next.currentDayIndex += 1;
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

  // Gradual evolution: every 100 XP grants +1 in drill's primary attributes (Ouro also gives immediate +1 if xp crosses 60)
  const attrUpdates: string[] = [];
  const threshold = 90;
  let levels = Math.floor(next.xp / threshold);
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
    if (next.currentDayIndex < next.calendar.length - 1) {
      next.currentDayIndex += 1;
    }
  }
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
    playerStats: MatchStatLine;
    rating: number;
    motm: boolean;
    competition?: string;
    stadiumName?: string;
    weather?: WeatherCondition;
  }
): PlayerCareer {
  const next = structuredClone(career) as PlayerCareer;
  const homeClub = getClubById(result.homeClubId);
  const awayClub = getClubById(result.awayClubId);

  const record: MatchRecord = {
    id: `m_${next.season}_${next.round}_${Date.now()}`,
    season: next.season,
    round: next.round,
    competition: result.competition || 'Liga Nacional',
    homeClubId: result.homeClubId,
    awayClubId: result.awayClubId,
    homeName: homeClub.shortName,
    awayName: awayClub.shortName,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    playerClubId: next.clubId,
    playerStats: result.playerStats,
    rating: result.rating,
    motm: result.motm,
    stadiumName: result.stadiumName || homeClub.stadiumName,
    weather: result.weather || 'Ensolarado',
  };

  next.recentMatches = [record, ...next.recentMatches].slice(0, 20);
  next.seasonStats = mergeStats(next.seasonStats, result.playerStats);
  next.careerStats = mergeStats(next.careerStats, result.playerStats);
  next.fatigue = Math.min(100, next.fatigue + 18);

  // Update user in League Leaders
  const userLeader = next.leagueLeaders.find((l) => l.playerId === 'user_player');
  if (userLeader) {
    userLeader.goals = next.seasonStats.goals;
    userLeader.assists = next.seasonStats.assists;
  }

  // Update standings
  const updateStanding = (hId: string, aId: string, hs: number, as: number) => {
    const h = next.standings.find((s) => s.clubId === hId);
    const a = next.standings.find((s) => s.clubId === aId);
    if (!h || !a) return;
    h.played += 1;
    a.played += 1;
    h.gf += hs;
    h.ga += as;
    a.gf += as;
    a.ga += hs;
    if (hs > as) {
      h.won += 1;
      h.points += 3;
      a.lost += 1;
    } else if (as > hs) {
      a.won += 1;
      a.points += 3;
      h.lost += 1;
    } else {
      h.drawn += 1;
      a.drawn += 1;
      h.points += 1;
      a.points += 1;
    }
  };

  updateStanding(result.homeClubId, result.awayClubId, result.homeScore, result.awayScore);

  const otherFixtures = next.schedule.filter(
    (f) =>
      f.round === next.round &&
      f.homeClubId !== next.clubId &&
      f.awayClubId !== next.clubId
  );

  for (const fx of otherFixtures) {
    const hc = getClubById(fx.homeClubId);
    const ac = getClubById(fx.awayClubId);
    const diff = (hc.squadQuality + 3 - ac.squadQuality) / 14;
    const hs = Math.max(0, Math.round(1.15 + diff * 0.65 + (Math.random() - 0.38) * 1.8));
    const as = Math.max(0, Math.round(1.05 - diff * 0.55 + (Math.random() - 0.4) * 1.7));
    updateStanding(fx.homeClubId, fx.awayClubId, hs, as);

    // Attribute simulated goals/assists to AI league leaders
    if (hs > 0) {
      const l = next.leagueLeaders.find((x) => x.clubId === fx.homeClubId && x.playerId.endsWith('_9'));
      if (l) l.goals += Math.min(2, hs);
    }
    if (as > 0) {
      const l = next.leagueLeaders.find((x) => x.clubId === fx.awayClubId && x.playerId.endsWith('_9'));
      if (l) l.goals += Math.min(2, as);
    }
    const astH = next.leagueLeaders.find((x) => x.clubId === fx.homeClubId && x.playerId.endsWith('_7'));
    if (astH && hs > 0) astH.assists += 1;
    const astA = next.leagueLeaders.find((x) => x.clubId === fx.awayClubId && x.playerId.endsWith('_7'));
    if (astA && as > 0) astA.assists += 1;
  }

  next.standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    return b.gf - b.ga - (a.gf - a.ga);
  });

  // Update Copa & Estadual progression milestones
  const isHome = result.homeClubId === next.clubId;
  const won = isHome ? result.homeScore > result.awayScore : result.awayScore > result.homeScore;
  if (result.competition === 'Copa Nacional' && won) {
    if (next.copaStage === 'Oitavas') next.copaStage = 'Quartas';
    else if (next.copaStage === 'Quartas') next.copaStage = 'Semifinal';
    else if (next.copaStage === 'Semifinal') next.copaStage = 'Final';
    else if (next.copaStage === 'Final') {
      next.copaStage = 'Campeão';
      next.awards.push({
        id: `aw_copa_${next.season}`,
        season: next.season,
        title: `Campeão da Copa Nacional (${next.season})`,
        clubName: getClubById(next.clubId).name,
      });
    }
  }
  if (result.competition === 'Campeonato Estadual' && next.round === 4) {
    next.estadualStage = won ? 'Campeão' : 'Semifinal';
    if (won) {
      next.awards.push({
        id: `aw_est_${next.season}`,
        season: next.season,
        title: `Campeão Estadual (${next.season})`,
        clubName: getClubById(next.clubId).name,
      });
    }
  }

  // Match-driven organic attribute growth based on performance
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

  const drew = result.homeScore === result.awayScore;
  next.morale = Math.max(20, Math.min(100, next.morale + (won ? 5 : drew ? 1 : -4) + (result.rating >= 7.5 ? 4 : 0)));
  next.coachTrust = Math.max(15, Math.min(100, next.coachTrust + (result.rating >= 7.0 ? 4 : result.rating < 6.0 ? -3 : 1)));
  next.popularity = Math.min(100, next.popularity + (result.playerStats.goals * 3 + result.playerStats.assists * 2 + (result.motm ? 4 : 1)));

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

  // Mark calendar match day completed & advance pointer to next day
  const matchDayIdx = next.calendar.findIndex((d) => d.roundRef === next.round);
  if (matchDayIdx >= 0) {
    for (let i = 0; i <= matchDayIdx; i++) {
      next.calendar[i].completed = true;
    }
    next.currentDayIndex = Math.min(next.calendar.length - 1, matchDayIdx + 1);
  }

  next.trainingPoints = Math.min(4, next.trainingPoints + 2);
  next.evolutionHistory = pushEvolutionSnapshot(next);

  const maxRound = next.schedule.reduce((m, f) => Math.max(m, f.round), 38);
  if (next.round >= maxRound) {
    const currentClub = getClubById(next.clubId);
    const avg = next.seasonStats.matches > 0 ? +(next.seasonStats.ratingSum / next.seasonStats.matches).toFixed(2) : 6.5;
    next.history.unshift({
      season: next.season,
      clubId: next.clubId,
      clubName: currentClub.name,
      division: currentClub.division,
      matches: next.seasonStats.matches,
      goals: next.seasonStats.goals,
      assists: next.seasonStats.assists,
      avgRating: avg,
    });

    if (next.standings[0]?.clubId === next.clubId) {
      next.awards.push({
        id: `aw_title_${next.season}`,
        season: next.season,
        title: `Campeão do Brasileirão Série A (${next.season})`,
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

    next.season += 1;
    next.round = 1;
    next.contract.yearsRemaining = Math.max(0, next.contract.yearsRemaining - 1);
    next.seasonStats = emptyStats();
    next.copaStage = 'Oitavas';
    next.estadualStage = 'Fase de Grupos';
    next.standings = CLUBS.map((c) => ({
      clubId: c.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    }));
    next.schedule = generateSchedule(CLUBS);
    next.calendar = generateSeasonCalendar(next.schedule, next.clubId, next.season);
    next.currentDayIndex = 0;
    next.leagueLeaders = generateInitialLeaders(
      next.clubId,
      next.personal.nickname || next.personal.firstName
    );
  } else {
    next.round += 1;
  }

  next.offers = generateOffers(next);
  return next;
}

function generateOffers(career: PlayerCareer): TransferOffer[] {
  const candidates = CLUBS.filter(
    (c) =>
      c.id !== career.clubId &&
      Math.abs(c.squadQuality - career.ovr) <= 12
  );
  const offers: TransferOffer[] = [];
  if (career.round % 3 === 0 || career.contract.yearsRemaining === 0) {
    const picks = candidates.slice(0, 2);
    picks.forEach((c, idx) => {
      offers.push({
        id: `off_${career.season}_${career.round}_${c.id}`,
        clubId: c.id,
        clubName: c.name,
        division: c.division,
        type: idx === 1 && career.ovr < 73 ? 'Empréstimo' : 'Transferência',
        weeklySalary: Math.round((career.contract.weeklySalary * (1.12 + idx * 0.08)) / 100) * 100,
        years: idx === 1 ? 1 : 3,
        role: career.ovr >= c.squadQuality ? 'Estrela' : 'Titular',
      });
    });

    const cur = getClubById(career.clubId);
    offers.push({
      id: `ren_${career.season}_${career.round}`,
      clubId: cur.id,
      clubName: cur.name,
      division: cur.division,
      type: 'Renovação',
      weeklySalary: Math.round((career.contract.weeklySalary * 1.15) / 100) * 100,
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
    FISICO: ['velocidade', 'aceleracao', 'resistencia', 'forcaFisica', 'agilidade', 'equilibrio'],
    ATAQUE: ['finalizacao', 'potenciaChute', 'precisaoChute', 'cabeceio'],
    PASSE: ['passeCurto', 'passeLongo', 'cruzamento', 'visaoJogo'],
    DRIBLE: ['drible', 'controleBola', 'dominio'],
    DEFESA: ['marcacao', 'desarme', 'posicionamento', 'interceptacao'],
    GOLEIRO: ['reflexos', 'posicionamentoGk', 'saidasGol', 'defesaPenaltis', 'reposicao'],
  };

  const pool = map[focus];
  const a = pool[Math.floor(Math.random() * pool.length)];
  next.attributes[a] = Math.min(99, next.attributes[a] + 1);
  next.ovr = calculateOverall(next.attributes, next.position);
  next.coachTrust = Math.min(100, next.coachTrust + 1);
  return next;
}

export function acceptOffer(career: PlayerCareer, offer: TransferOffer): PlayerCareer {
  const next = structuredClone(career) as PlayerCareer;
  next.clubId = offer.clubId;
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
  next.calendar = generateSeasonCalendar(next.schedule, next.clubId, next.season);
  next.currentDayIndex = Math.min(next.calendar.length - 1, (next.round - 1) * 4);
  return next;
}

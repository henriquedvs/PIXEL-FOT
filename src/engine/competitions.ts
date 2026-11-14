import { CLUBS, SERIE_B_CLUBS, getClubById } from '../data/clubs';
import { getPositionMeta } from '../data/positions';
import {
  Club,
  CopaBracketState,
  CopaMatchTie,
  CopaStageId,
  LeagueLeader,
  LeagueStanding,
  NewsItem,
  PlayerCareer,
  RoundMatchResult,
  SeasonObjective,
  SupercopaState,
} from '../types/game';

export function sortStandings(rows: LeagueStanding[]): LeagueStanding[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    const sgDiff = b.gf - b.ga - (a.gf - a.ga);
    if (sgDiff !== 0) return sgDiff;
    return b.gf - a.gf;
  });
}

export function buildEmptyStandings(clubs: Club[]): LeagueStanding[] {
  return clubs.map((c) => ({
    clubId: c.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
  }));
}

export function applyMatchToStandings(
  standings: LeagueStanding[],
  homeId: string,
  awayId: string,
  homeScore: number,
  awayScore: number
) {
  const h = standings.find((s) => s.clubId === homeId);
  const a = standings.find((s) => s.clubId === awayId);
  if (!h || !a) return;
  h.played += 1;
  a.played += 1;
  h.gf += homeScore;
  h.ga += awayScore;
  a.gf += awayScore;
  a.ga += homeScore;
  if (homeScore > awayScore) {
    h.won += 1;
    h.points += 3;
    a.lost += 1;
  } else if (awayScore > homeScore) {
    a.won += 1;
    a.points += 3;
    h.lost += 1;
  } else {
    h.drawn += 1;
    a.drawn += 1;
    h.points += 1;
    a.points += 1;
  }
}

export function buildRoundRobinSchedule(
  clubs: Club[]
): { round: number; homeClubId: string; awayClubId: string }[] {
  const ids = clubs.map((c) => c.id);
  const n = ids.length;
  const half = Math.floor(n / 2);
  const rotating = ids.slice(1);
  const firstHalf: { round: number; homeClubId: string; awayClubId: string }[] = [];

  for (let r = 0; r < n - 1; r++) {
    const order = [ids[0], ...rotating];
    for (let i = 0; i < half; i++) {
      const c1 = order[i];
      const c2 = order[n - 1 - i];
      const flip = (r + i) % 2 === 1;
      firstHalf.push({
        round: r + 1,
        homeClubId: flip ? c2 : c1,
        awayClubId: flip ? c1 : c2,
      });
    }
    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  const secondHalf = firstHalf.map((f) => ({
    round: f.round + (n - 1),
    homeClubId: f.awayClubId,
    awayClubId: f.homeClubId,
  }));

  return [...firstHalf, ...secondHalf];
}

function getStarterStrength(club: Club, standings?: LeagueStanding[]): number {
  const starters = club.squad.slice(0, 11);
  const squadAvg =
    starters.length > 0
      ? starters.reduce((acc, m) => acc + m.ovr, 0) / starters.length
      : club.squadQuality;
  const row = standings?.find((s) => s.clubId === club.id);
  const formDelta =
    row && row.played > 0
      ? ((row.won - row.lost) / Math.max(1, row.played)) * 3.2
      : 0;
  return club.squadQuality * 0.55 + squadAvg * 0.45 + formDelta;
}

export function simulateAiMatch(
  homeClub: Club,
  awayClub: Club,
  options?: {
    knockout?: boolean;
    standings?: LeagueStanding[];
    neutralVenue?: boolean;
  }
): {
  homeScore: number;
  awayScore: number;
  penHome?: number;
  penAway?: number;
  winnerId: string;
} {
  const homeStr =
    getStarterStrength(homeClub, options?.standings) + (options?.neutralVenue ? 0 : 2.8);
  const awayStr = getStarterStrength(awayClub, options?.standings);
  const edge = (homeStr - awayStr) / 10;

  // Poisson-like organic scoring with upset possibility
  const sampleGoals = (lambda: number) => {
    const clamped = Math.max(0.32, Math.min(3.1, lambda));
    let g = 0;
    const roll = Math.random();
    if (roll < Math.exp(-clamped)) g = 0;
    else if (roll < Math.exp(-clamped) * (1 + clamped)) g = 1;
    else if (roll < Math.exp(-clamped) * (1 + clamped + (clamped * clamped) / 2)) g = 2;
    else if (Math.random() < 0.72) g = 3;
    else g = 4;
    return g;
  };

  const homeLambda = 1.32 + edge * 0.55 + (Math.random() - 0.5) * 0.45;
  const awayLambda = 1.08 - edge * 0.48 + (Math.random() - 0.5) * 0.45;

  const homeScore = sampleGoals(homeLambda);
  const awayScore = sampleGoals(awayLambda);

  if (options?.knockout && homeScore === awayScore) {
    let pH = 3 + Math.floor(Math.random() * 3);
    let pA = 3 + Math.floor(Math.random() * 3);
    if (pH === pA) {
      if (Math.random() + edge * 0.08 >= 0.5) pH += 1;
      else pA += 1;
    }
    return {
      homeScore,
      awayScore,
      penHome: pH,
      penAway: pA,
      winnerId: pH > pA ? homeClub.id : awayClub.id,
    };
  }

  const winnerId =
    homeScore > awayScore
      ? homeClub.id
      : awayScore > homeScore
      ? awayClub.id
      : Math.random() >= 0.5
      ? homeClub.id
      : awayClub.id;

  return { homeScore, awayScore, winnerId };
}

export function createCopaBracket(
  season: number,
  userClubId: string
): CopaBracketState {
  // 16 participants: user's club + top 15 Série A / Série B ranked contenders seeded deterministically by season
  const pool = [...CLUBS, ...SERIE_B_CLUBS.slice(0, 6)];
  const filtered = pool.filter((c) => c.id !== userClubId);

  // Seeded deterministic shuffle using season
  let seed = season * 997 + 131;
  const nextRand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const shuffled = [...filtered].sort((a, b) => {
    const scoreA = a.reputation * 0.6 + nextRand() * 35;
    const scoreB = b.reputation * 0.6 + nextRand() * 35;
    return scoreB - scoreA;
  });

  const entrants = [getClubById(userClubId), ...shuffled.slice(0, 15)];
  // Mix positions so user isn't always slot 0
  const mixed = entrants.map((c, i) => ({ c, k: i === 0 ? 0.31 : nextRand() })).sort((a, b) => a.k - b.k);

  const ties: CopaMatchTie[] = [];
  for (let i = 0; i < 8; i++) {
    const c1 = mixed[i * 2].c;
    const c2 = mixed[i * 2 + 1].c;
    ties.push({
      id: `copa_${season}_oitavas_${i}`,
      stage: 'Oitavas',
      slotIndex: i,
      homeClubId: c1.id,
      awayClubId: c2.id,
      twoLegged: true,
      playedLeg1: false,
      playedLeg2: false,
    });
  }

  return {
    season,
    currentStage: 'Oitavas',
    ties,
  };
}

export function createInitialSupercopa(
  season: number,
  leagueChampId?: string,
  copaChampId?: string
): SupercopaState {
  // For season 2026, reigning 2025 champions default to Flamengo x Palmeiras (if same, Atlético-MG takes runner-up slot)
  const lc = leagueChampId || 'palmeiras';
  let cc = copaChampId || 'flamengo';
  if (cc === lc) {
    cc = lc === 'flamengo' ? 'atletico-mineiro' : 'flamengo';
  }
  return {
    season,
    leagueChampId: lc,
    copaChampId: cc,
    played: false,
  };
}

export function getNextCopaStage(stage: CopaStageId): CopaStageId | 'Concluída' {
  if (stage === 'Oitavas') return 'Quartas';
  if (stage === 'Quartas') return 'Semifinal';
  if (stage === 'Semifinal') return 'Final';
  return 'Concluída';
}

export function resolveTieWinner(tie: CopaMatchTie): string {
  if (tie.winnerClubId) return tie.winnerClubId;
  if (!tie.twoLegged) {
    const hs = tie.homeScoreLeg1 ?? 0;
    const as = tie.awayScoreLeg1 ?? 0;
    if (hs > as) return tie.homeClubId;
    if (as > hs) return tie.awayClubId;
    if ((tie.penHome ?? 0) >= (tie.penAway ?? 0)) return tie.homeClubId;
    return tie.awayClubId;
  }
  // Two-legged: Leg 1 (homeClubId at home) + Leg 2 (awayClubId at home, so awayClubId scores homeScoreLeg2!)
  const teamATotal = (tie.homeScoreLeg1 ?? 0) + (tie.awayScoreLeg2 ?? 0);
  const teamBTotal = (tie.awayScoreLeg1 ?? 0) + (tie.homeScoreLeg2 ?? 0);
  if (teamATotal > teamBTotal) return tie.homeClubId;
  if (teamBTotal > teamATotal) return tie.awayClubId;
  if ((tie.penHome ?? 0) >= (tie.penAway ?? 0)) return tie.homeClubId;
  return tie.awayClubId;
}

export function buildNextCopaStageTies(
  season: number,
  prevStage: CopaStageId,
  prevTies: CopaMatchTie[]
): CopaMatchTie[] {
  const nextStage = getNextCopaStage(prevStage);
  if (nextStage === 'Concluída') return [];
  const stageTies = prevTies
    .filter((t) => t.stage === prevStage)
    .sort((a, b) => a.slotIndex - b.slotIndex);
  const nextTies: CopaMatchTie[] = [];
  for (let i = 0; i < stageTies.length; i += 2) {
    const t1 = stageTies[i];
    const t2 = stageTies[i + 1];
    if (!t1 || !t2) break;
    const w1 = resolveTieWinner(t1);
    const w2 = resolveTieWinner(t2);
    nextTies.push({
      id: `copa_${season}_${nextStage.toLowerCase()}_${i / 2}`,
      stage: nextStage,
      slotIndex: i / 2,
      homeClubId: w1,
      awayClubId: w2,
      twoLegged: nextStage !== 'Final',
      playedLeg1: false,
      playedLeg2: false,
    });
  }
  return nextTies;
}

export function simulateCopaStageLeg(
  bracket: CopaBracketState,
  stage: CopaStageId,
  leg: 1 | 2,
  userClubId: string,
  dateLabel: string,
  roundRef: number,
  standings?: LeagueStanding[],
  skipUserTie = false
): {
  bracket: CopaBracketState;
  results: RoundMatchResult[];
  stageCompleted: boolean;
  championId?: string;
  runnerUpId?: string;
} {
  const nextBracket: CopaBracketState = structuredClone(bracket);
  const results: RoundMatchResult[] = [];
  const stageTies = nextBracket.ties.filter((t) => t.stage === stage);

  for (const tie of stageTies) {
    const involvesUser = tie.homeClubId === userClubId || tie.awayClubId === userClubId;
    if (skipUserTie && involvesUser) continue;

    if (leg === 1 && !tie.playedLeg1) {
      const hc = getClubById(tie.homeClubId);
      const ac = getClubById(tie.awayClubId);
      const sim = simulateAiMatch(hc, ac, {
        knockout: !tie.twoLegged,
        standings,
        neutralVenue: !tie.twoLegged,
      });
      tie.homeScoreLeg1 = sim.homeScore;
      tie.awayScoreLeg1 = sim.awayScore;
      tie.playedLeg1 = true;

      if (!tie.twoLegged) {
        tie.playedLeg2 = true;
        tie.penHome = sim.penHome;
        tie.penAway = sim.penAway;
        tie.winnerClubId = sim.winnerId;
      }

      results.push({
        id: `res_${tie.id}_l1`,
        season: nextBracket.season,
        round: roundRef,
        competition: `Copa do Brasil · ${stage}${tie.twoLegged ? ' (Ida)' : ''}`,
        homeClubId: tie.homeClubId,
        awayClubId: tie.awayClubId,
        homeScore: sim.homeScore,
        awayScore: sim.awayScore,
        penHome: sim.penHome,
        penAway: sim.penAway,
        dateLabel,
      });
    } else if (leg === 2 && tie.twoLegged && !tie.playedLeg2) {
      // Leg 2 reverses home/away
      const hc = getClubById(tie.awayClubId);
      const ac = getClubById(tie.homeClubId);
      const aggBeforeA = tie.homeScoreLeg1 ?? 0;
      const aggBeforeB = tie.awayScoreLeg1 ?? 0;
      const sim = simulateAiMatch(hc, ac, { knockout: false, standings });
      tie.homeScoreLeg2 = sim.homeScore; // awayClubId score at home
      tie.awayScoreLeg2 = sim.awayScore; // homeClubId score away
      tie.playedLeg2 = true;

      const totalA = aggBeforeA + sim.awayScore;
      const totalB = aggBeforeB + sim.homeScore;
      if (totalA > totalB) {
        tie.winnerClubId = tie.homeClubId;
      } else if (totalB > totalA) {
        tie.winnerClubId = tie.awayClubId;
      } else {
        // Resolve on penalties
        let pA = 4;
        let pB = 4;
        if (Math.random() >= 0.5) pA = 5;
        else pB = 5;
        tie.penHome = pA;
        tie.penAway = pB;
        tie.winnerClubId = pA > pB ? tie.homeClubId : tie.awayClubId;
      }

      results.push({
        id: `res_${tie.id}_l2`,
        season: nextBracket.season,
        round: roundRef,
        competition: `Copa do Brasil · ${stage} (Volta)`,
        homeClubId: tie.awayClubId,
        awayClubId: tie.homeClubId,
        homeScore: sim.homeScore,
        awayScore: sim.awayScore,
        penHome: tie.penAway,
        penAway: tie.penHome,
        dateLabel,
      });
    }
  }

  const allStageDone = stageTies.every((t) => (t.twoLegged ? t.playedLeg1 && t.playedLeg2 : t.playedLeg1));
  let championId: string | undefined;
  let runnerUpId: string | undefined;

  if (allStageDone) {
    if (stage === 'Final') {
      const finalTie = stageTies[0];
      if (finalTie) {
        championId = resolveTieWinner(finalTie);
        runnerUpId =
          championId === finalTie.homeClubId ? finalTie.awayClubId : finalTie.homeClubId;
        nextBracket.championClubId = championId;
        nextBracket.runnerUpClubId = runnerUpId;
        nextBracket.currentStage = 'Concluída';
      }
    } else {
      const nextStage = getNextCopaStage(stage);
      const alreadyBuilt = nextBracket.ties.some((t) => t.stage === nextStage);
      if (!alreadyBuilt && nextStage !== 'Concluída') {
        const created = buildNextCopaStageTies(nextBracket.season, stage, nextBracket.ties);
        nextBracket.ties.push(...created);
        nextBracket.currentStage = nextStage;
      }
    }
  }

  return {
    bracket: nextBracket,
    results,
    stageCompleted: allStageDone,
    championId,
    runnerUpId,
  };
}

export function createSeasonObjectives(career: PlayerCareer): SeasonObjective[] {
  const posGroup = getPositionMeta(career.position).group;
  const club = getClubById(career.clubId);
  const clubQuality = club.squadQuality;

  const posTarget = clubQuality >= 79 ? 4 : clubQuality >= 74 ? 8 : 12;
  const goalsTarget =
    posGroup === 'ATAQUE' ? 12 : posGroup === 'MEIO_CAMPO' ? 7 : posGroup === 'DEFESA' ? 2 : 0;
  const assistsTarget =
    posGroup === 'MEIO_CAMPO' ? 8 : posGroup === 'ATAQUE' ? 5 : posGroup === 'DEFESA' ? 3 : 1;

  const objs: SeasonObjective[] = [];

  if (posGroup === 'GOLEIRO') {
    objs.push({
      id: `obj_${career.season}_saves`,
      title: 'Muralha em Campo',
      description: 'Realize 20 jogos mantendo nota média acima de 6.8',
      kind: 'MATCHES',
      target: 20,
      current: career.seasonStats.matches,
      completed: career.seasonStats.matches >= 20,
      rewardText: '+40 XP · +6 Confiança',
    });
  } else {
    objs.push({
      id: `obj_${career.season}_goals`,
      title: `Artilharia (${goalsTarget} Gols)`,
      description: `Marque ${goalsTarget} gols na temporada pelo ${club.shortName}`,
      kind: 'GOALS',
      target: goalsTarget,
      current: career.seasonStats.goals,
      completed: career.seasonStats.goals >= goalsTarget,
      rewardText: '+55 XP · +6 Popularidade',
    });
  }

  objs.push(
    {
      id: `obj_${career.season}_assists`,
      title: `Garçom do Elenco (${assistsTarget} Assist.)`,
      description: `Distribua ${assistsTarget} assistências em competições oficiais`,
      kind: 'ASSISTS',
      target: assistsTarget,
      current: career.seasonStats.assists,
      completed: career.seasonStats.assists >= assistsTarget,
      rewardText: '+45 XP · +5 Moral',
    },
    {
      id: `obj_${career.season}_ovr`,
      title: `Evolução Técnica (OVR ${Math.min(95, career.ovr + 3)})`,
      description: `Eleve seu Overall até ${Math.min(95, career.ovr + 3)} com treinos e jogos`,
      kind: 'OVR',
      target: Math.min(95, career.ovr + 3),
      current: career.ovr,
      completed: career.ovr >= Math.min(95, career.ovr + 3),
      rewardText: '+60 XP · +5 Confiança',
    },
    {
      id: `obj_${career.season}_table`,
      title: `Meta do Clube: Top ${posTarget}`,
      description: `Ajude o ${club.shortName} a ficar entre os ${posTarget} melhores da Série A`,
      kind: 'LEAGUE_POS',
      target: posTarget,
      current: Math.max(
        1,
        career.standings.findIndex((s) => s.clubId === career.clubId) + 1
      ),
      completed: false,
      rewardText: '+8 Moral · +5 Confiança',
    },
    {
      id: `obj_${career.season}_copa`,
      title: 'Campanha na Copa do Brasil',
      description: 'Alcance pelo menos as Semifinais da Copa do Brasil',
      kind: 'COPA_STAGE',
      target: 3, // 1=Oitavas, 2=Quartas, 3=Semifinal, 4=Final, 5=Campeão
      current: 1,
      completed: false,
      rewardText: '+70 XP · +10 Popularidade',
    }
  );

  return objs;
}

export function evaluateObjectives(career: PlayerCareer): SeasonObjective[] {
  const base =
    career.objectives && career.objectives.length > 0
      ? career.objectives
      : createSeasonObjectives(career);

  const activeTable =
    career.division === 'Série B' && career.serieBStandings?.length
      ? career.serieBStandings
      : career.standings;
  const leaguePos = Math.max(
    1,
    activeTable.findIndex((s) => s.clubId === career.clubId) + 1
  );
  const copaRankMap: Record<string, number> = {
    Eliminado: 0,
    Oitavas: 1,
    Quartas: 2,
    Semifinal: 3,
    Final: 4,
    Campeão: 5,
  };
  const copaRank = copaRankMap[career.copaStage] ?? 1;

  return base.map((obj) => {
    let current = obj.current;
    let completed = obj.completed;

    switch (obj.kind) {
      case 'GOALS':
        current = career.seasonStats.goals;
        completed = current >= obj.target;
        break;
      case 'ASSISTS':
        current = career.seasonStats.assists;
        completed = current >= obj.target;
        break;
      case 'MATCHES':
        current = career.seasonStats.matches;
        completed = current >= obj.target;
        break;
      case 'OVR':
        current = career.ovr;
        completed = current >= obj.target;
        break;
      case 'LEAGUE_POS':
        current = leaguePos;
        completed = career.round >= 4 && leaguePos <= obj.target;
        break;
      case 'COPA_STAGE':
        current = copaRank;
        completed = copaRank >= obj.target;
        break;
      case 'AVG_RATING':
        current =
          career.seasonStats.matches > 0
            ? Number((career.seasonStats.ratingSum / career.seasonStats.matches).toFixed(1))
            : 0;
        completed = career.seasonStats.matches >= 5 && current >= obj.target;
        break;
    }

    return { ...obj, current, completed };
  });
}

export function buildAutoHighlights(career: PlayerCareer): string[] {
  const club = getClubById(career.clubId);
  const highlights: string[] = [];

  const nextMatchDay = career.calendar.find(
    (d, idx) => idx >= career.currentDayIndex && !d.completed && d.activity === 'PARTIDA'
  );
  if (nextMatchDay && nextMatchDay.opponentClubId) {
    const opp = getClubById(nextMatchDay.opponentClubId);
    const homeName = nextMatchDay.isHome ? club.name : opp.name;
    const awayName = nextMatchDay.isHome ? opp.name : club.name;
    highlights.push(`Próxima partida: ${homeName} x ${awayName} (${nextMatchDay.competition || 'Brasileirão'})`);

    const daysAway = nextMatchDay.dayIndex - career.currentDayIndex;
    if (daysAway <= 0) {
      highlights.push('Hoje é dia de jogo oficial! Vá ao estádio quando estiver pronto.');
    } else if (daysAway === 1) {
      highlights.push('Falta 1 dia para a próxima partida.');
    } else {
      highlights.push(`Faltam ${daysAway} dias no calendário para a próxima partida.`);
    }
  }

  const activeTable =
    career.division === 'Série B' && career.serieBStandings?.length
      ? career.serieBStandings
      : career.standings;
  const divisionLabel = career.division === 'Série B' ? 'Brasileirão Série B' : 'Brasileirão Série A';
  const posIdx = activeTable.findIndex((s) => s.clubId === career.clubId);
  if (posIdx >= 0) {
    highlights.push(
      `Seu clube está na ${posIdx + 1}ª posição do ${divisionLabel} (${activeTable[posIdx].points} pts)`
    );
  }

  highlights.push(
    `Você soma ${career.seasonStats.goals} gol(s) e ${career.seasonStats.assists} assistência(s) na temporada ${career.season}`
  );

  if (career.copaStage === 'Semifinal' || career.copaStage === 'Final' || career.copaStage === 'Campeão') {
    highlights.push(
      career.copaStage === 'Campeão'
        ? `Título histórico! ${club.shortName} é Campeão da Copa do Brasil ${career.season}`
        : `Seu clube avançou para a ${career.copaStage} da Copa do Brasil`
    );
  }

  return highlights;
}

export function buildInitialNews(career: PlayerCareer): NewsItem[] {
  const club = getClubById(career.clubId);
  const sup = career.supercopa;
  const lc = sup ? getClubById(sup.leagueChampId) : CLUBS[8];
  const cc = sup ? getClubById(sup.copaChampId) : CLUBS[13];
  const playerName = career.personal.nickname || career.personal.firstName;

  return [
    {
      id: `news_init_${career.season}_1`,
      season: career.season,
      round: 1,
      dateLabel: '12/01',
      category: 'MERCADO',
      headline: `${club.name} apresenta ${playerName} (#${career.gear.jerseyNumber}) para a temporada`,
      summary: `Novo reforço chega sob comando do técnico ${club.coachName} com contrato de ${career.contract.yearsRemaining} ano(s) e status de ${career.contract.role}.`,
      clubId: club.id,
      artKind: 'transfer',
    },
    {
      id: `news_init_${career.season}_2`,
      season: career.season,
      round: 1,
      dateLabel: '14/01',
      category: 'SUPERCOPA',
      headline: `Supercopa do Brasil: ${lc.shortName} e ${cc.shortName} abrem a temporada`,
      summary: `Confronto único em campo neutro reúne os campeões da liga e da copa abrindo o calendário nacional.`,
      clubId: lc.id,
      opponentClubId: cc.id,
      artKind: 'trophy',
    },
    {
      id: `news_init_${career.season}_3`,
      season: career.season,
      round: 1,
      dateLabel: '15/01',
      category: 'COPA',
      headline: `Chaveamento das Oitavas da Copa do Brasil ${career.season} está definido`,
      summary: `Dezesseis clubes disputam o mata-mata nacional com jogos de ida e volta até as semifinais e final única.`,
      clubId: club.id,
      artKind: 'stadium',
    },
  ];
}

export function createMatchNewsItem(params: {
  season: number;
  round: number;
  dateLabel: string;
  competition: string;
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  userClubId: string;
  userGoals: number;
  playerName: string;
  leagueLeaders: LeagueLeader[];
}): NewsItem[] {
  const items: NewsItem[] = [];
  const { homeClub, awayClub, homeScore, awayScore, competition } = params;
  const winner =
    homeScore > awayScore ? homeClub : awayScore > homeScore ? awayClub : null;
  const loser =
    homeScore > awayScore ? awayClub : awayScore > homeScore ? homeClub : null;

  if (competition.includes('Copa do Brasil')) {
    items.push({
      id: `news_copa_${params.season}_${params.round}_${Date.now()}`,
      season: params.season,
      round: params.round,
      dateLabel: params.dateLabel,
      category: 'COPA',
      headline: winner
        ? `${winner.name} vence ${loser?.shortName} por ${Math.max(homeScore, awayScore)}x${Math.min(homeScore, awayScore)} na Copa do Brasil`
        : `Tudo igual: ${homeClub.shortName} ${homeScore}x${awayScore} ${awayClub.shortName} pela Copa do Brasil`,
      summary: `Duelo movimentado em ${homeClub.stadiumName} agita a disputa eliminatória da Copa do Brasil.`,
      clubId: winner?.id || homeClub.id,
      opponentClubId: loser?.id || awayClub.id,
      artKind: 'trophy',
    });
  } else if (params.userGoals >= 2) {
    items.push({
      id: `news_brilho_${params.season}_${params.round}_${Date.now()}`,
      season: params.season,
      round: params.round,
      dateLabel: params.dateLabel,
      category: 'DESTAQUE',
      headline: `Show de ${params.playerName}: ${params.userGoals} gols no duelo ${homeClub.shortName} ${homeScore}x${awayScore} ${awayClub.shortName}`,
      summary: `Atuação decisiva em ${homeClub.stadiumName} coloca ${params.playerName} nos holofotes da imprensa esportiva.`,
      clubId: params.userClubId,
      artKind: 'player',
    });
  } else {
    items.push({
      id: `news_rod_${params.season}_${params.round}_${Date.now()}`,
      season: params.season,
      round: params.round,
      dateLabel: params.dateLabel,
      category: 'RODADA',
      headline: winner
        ? `${winner.name} supera ${loser?.name} (${homeClub.shortName} ${homeScore}x${awayScore} ${awayClub.shortName})`
        : `${homeClub.name} e ${awayClub.name} empatam por ${homeScore}x${awayScore} na Rodada ${params.round}`,
      summary: `Partida válida pelo ${competition} movimenta a tabela de classificação.`,
      clubId: homeClub.id,
      opponentClubId: awayClub.id,
      artKind: 'match',
    });
  }

  // Top scorer milestone check
  const topScorer = [...params.leagueLeaders].sort((a, b) => b.goals - a.goals)[0];
  if (topScorer && topScorer.goals >= 4 && params.round % 4 === 0) {
    const sc = getClubById(topScorer.clubId);
    items.push({
      id: `news_art_${params.season}_${params.round}`,
      season: params.season,
      round: params.round,
      dateLabel: params.dateLabel,
      category: 'ARTILHARIA',
      headline: `${topScorer.name} (${sc.shortName}) lidera a artilharia com ${topScorer.goals} gols`,
      summary: `Disputa pela chuteira de ouro segue acirrada após ${params.round} rodadas do campeonato.`,
      clubId: sc.id,
      artKind: 'player',
    });
  }

  return items;
}

export function getDivisionClubsFromIds(ids: string[] | undefined, fallback: Club[]): Club[] {
  if (!ids || ids.length === 0) return fallback;
  const resolved = ids.map((id) => getClubById(id));
  return resolved.length >= 2 ? resolved : fallback;
}

export function buildTopScorersForDivision(
  divisionClubs: Club[],
  userClubId: string,
  userName: string
): LeagueLeader[] {
  const leaders: LeagueLeader[] = [
    { playerId: 'user_player', name: userName, clubId: userClubId, goals: 0, assists: 0 },
  ];
  for (const c of divisionClubs) {
    const striker = c.squad[9] || c.squad.find((m) => m.position === 'ST' || m.position === 'FALSE_9');
    const playmaker = c.squad[7] || c.squad.find((m) => m.position === 'CAM' || m.position === 'PLAYMAKER');
    if (striker && c.id !== userClubId) {
      leaders.push({ playerId: striker.id, name: striker.name, clubId: c.id, goals: 0, assists: 0 });
    }
    if (playmaker && c.id !== userClubId && playmaker.id !== striker?.id) {
      leaders.push({ playerId: playmaker.id, name: playmaker.name, clubId: c.id, goals: 0, assists: 0 });
    }
  }
  return leaders;
}


import { getPositionMeta } from '../data/positions';
import {
  Club,
  ClubSquadMember,
  MatchSimReport,
  MatchStatLine,
  PlayerCareer,
  SimMatchEvent,
  SimPlayerRating,
  WeatherCondition,
} from '../types/game';

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getTeamFormStrength(career: PlayerCareer, club: Club): number {
  const table =
    career.division === 'Série B' && club.division === 'Série B'
      ? career.serieBStandings
      : career.standings;
  const row = table?.find((s) => s.clubId === club.id);
  const starters = club.squad.slice(0, 11);
  const starterAvg =
    starters.length > 0
      ? starters.reduce((acc, m) => acc + m.ovr, 0) / starters.length
      : club.squadQuality;
  const formBonus =
    row && row.played > 0 ? ((row.won - row.lost) / Math.max(1, row.played)) * 3.5 : 0;

  let strength = club.squadQuality * 0.52 + starterAvg * 0.48 + formBonus;
  if (club.id === career.clubId) {
    const chemistryBoost = ((career.teamChemistry ?? 70) - 65) * 0.08;
    const moraleBoost = (career.morale - 70) * 0.06;
    const userImpact = career.injuryMatchesRemaining > 0 ? -1.5 : (career.ovr - club.squadQuality) * 0.16;
    strength += chemistryBoost + moraleBoost + userImpact;
  }
  return strength;
}

function sampleGoals(lambda: number): number {
  const c = clamp(lambda, 0.25, 3.3);
  const r = Math.random();
  const e = Math.exp(-c);
  if (r < e) return 0;
  if (r < e * (1 + c)) return 1;
  if (r < e * (1 + c + (c * c) / 2)) return 2;
  if (r < e * (1 + c + (c * c) / 2 + (c * c * c) / 6)) return 3;
  return Math.random() < 0.7 ? 4 : 5;
}

function pickWeightedScorer(
  lineup: SimPlayerRating[],
  squad: ClubSquadMember[],
  userBoost: number
): SimPlayerRating {
  const weights = lineup.map((p) => {
    const group = getPositionMeta(p.position).group;
    let w = group === 'ATAQUE' ? 5.2 : group === 'MEIO_CAMPO' ? 2.4 : group === 'DEFESA' ? 0.55 : 0.02;
    const member = squad.find((m) => m.id === p.playerId);
    if (member) {
      w *= 0.8 + member.shooting / 160;
    }
    if (p.isUser) {
      w *= userBoost;
    }
    if (p.redCard) w *= 0.05;
    return Math.max(0.01, w);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < lineup.length; i++) {
    r -= weights[i];
    if (r <= 0) return lineup[i];
  }
  return lineup[lineup.length - 1];
}

function pickWeightedAssister(
  lineup: SimPlayerRating[],
  scorerId: string,
  userAssistBoost: number
): SimPlayerRating | undefined {
  const candidates = lineup.filter((p) => p.playerId !== scorerId && !p.redCard);
  if (candidates.length === 0) return undefined;
  const weights = candidates.map((p) => {
    const group = getPositionMeta(p.position).group;
    let w = group === 'MEIO_CAMPO' ? 4.4 : group === 'ATAQUE' ? 3.2 : group === 'DEFESA' ? 1.1 : 0.08;
    if (p.isUser) w *= userAssistBoost;
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[0];
}

function buildTeamRatings(
  club: Club,
  career: PlayerCareer,
  userRole: MatchSimReport['userRole']
): { starters: SimPlayerRating[]; subs: ClubSquadMember[] } {
  const baseStarters = club.squad.slice(0, 11);
  const subs = club.squad.slice(11, 16);
  const isUserClub = club.id === career.clubId;
  const userName = career.personal.nickname || `${career.personal.firstName} ${career.personal.lastName}`;
  const userGroup = getPositionMeta(career.position).group;

  let replacedIdx = -1;
  if (isUserClub && userRole === 'Titular') {
    replacedIdx = baseStarters.findIndex((m) => m.position === career.position);
    if (replacedIdx < 0) {
      replacedIdx = baseStarters.findIndex((m) => getPositionMeta(m.position).group === userGroup);
    }
    if (replacedIdx < 0) replacedIdx = 10;
  }

  const starters: SimPlayerRating[] = baseStarters.map((m, idx) => {
    if (isUserClub && userRole === 'Titular' && idx === replacedIdx) {
      return {
        playerId: 'user_player',
        name: userName,
        number: career.gear.jerseyNumber,
        position: career.position,
        rating: 6.5,
        goals: 0,
        assists: 0,
        isUser: true,
      };
    }
    return {
      playerId: m.id,
      name: m.name,
      number: m.number,
      position: m.position,
      rating: 6.4,
      goals: 0,
      assists: 0,
    };
  });

  if (isUserClub && userRole === 'Reserva') {
    const subEntry: SimPlayerRating = {
      playerId: 'user_player',
      name: userName,
      number: career.gear.jerseyNumber,
      position: career.position,
      rating: 6.3,
      goals: 0,
      assists: 0,
      subbedIn: true,
      isUser: true,
    };
    starters.push(subEntry);
  }

  return { starters, subs };
}

export function simulateDetailedMatch(
  career: PlayerCareer,
  homeClub: Club,
  awayClub: Club,
  opts: {
    competition: string;
    roundLabel?: string;
    fixtureId?: string;
    isKnockout?: boolean;
    weather?: WeatherCondition;
    stadiumName?: string;
  }
): {
  report: MatchSimReport;
  outcomePayload: {
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
    simReport: MatchSimReport;
  };
} {
  const userClub = homeClub.id === career.clubId ? homeClub : awayClub;
  const userRole: MatchSimReport['userRole'] =
    career.injuryMatchesRemaining > 0
      ? 'Lesionado'
      : career.contract.role === 'Estrela' ||
        career.contract.role === 'Titular' ||
        career.coachTrust >= 56 ||
        career.ovr >= userClub.squadQuality - 3
      ? 'Titular'
      : career.coachTrust >= 40 || career.ovr >= userClub.squadQuality - 8
      ? 'Reserva'
      : 'Banco';

  const userMinutes =
    userRole === 'Lesionado'
      ? 0
      : userRole === 'Titular'
      ? career.fatigue > 78
        ? 68 + Math.floor(Math.random() * 14)
        : 82 + Math.floor(Math.random() * 9)
      : userRole === 'Reserva'
      ? 20 + Math.floor(Math.random() * 20)
      : 0;

  const homeStr = getTeamFormStrength(career, homeClub) + 2.9;
  const awayStr = getTeamFormStrength(career, awayClub);
  const diff = (homeStr - awayStr) / 10;

  const homeScore = sampleGoals(1.34 + diff * 0.56 + (Math.random() - 0.5) * 0.42);
  const awayScore = sampleGoals(1.06 - diff * 0.48 + (Math.random() - 0.5) * 0.42);

  let penHomeScore: number | undefined;
  let penAwayScore: number | undefined;
  if (opts.isKnockout && homeScore === awayScore) {
    penHomeScore = 3 + Math.floor(Math.random() * 3);
    penAwayScore = 3 + Math.floor(Math.random() * 3);
    if (penHomeScore === penAwayScore) {
      if (Math.random() + diff * 0.08 >= 0.5) penHomeScore += 1;
      else penAwayScore += 1;
    }
  }

  const homeLineup = buildTeamRatings(homeClub, career, userRole);
  const awayLineup = buildTeamRatings(awayClub, career, userRole);
  const events: SimMatchEvent[] = [];

  const userGoalBoost =
    userMinutes <= 0
      ? 0.01
      : (userMinutes / 90) *
        (0.75 + career.attributes.finalizacao / 120 + (career.morale - 65) / 160);
  const userAssistBoost =
    userMinutes <= 0
      ? 0.01
      : (userMinutes / 90) *
        (0.75 + career.attributes.visaoJogo / 120 + career.attributes.passeCurto / 180);

  const usedMinutes = new Set<number>();
  const allocMinute = (min: number, max: number) => {
    for (let t = 0; t < 15; t++) {
      const m = min + Math.floor(Math.random() * Math.max(1, max - min + 1));
      if (!usedMinutes.has(m)) {
        usedMinutes.add(m);
        return m;
      }
    }
    return min + Math.floor(Math.random() * Math.max(1, max - min + 1));
  };

  for (let g = 0; g < homeScore; g++) {
    const scorer = pickWeightedScorer(homeLineup.starters, homeClub.squad, userGoalBoost);
    const min = scorer.subbedIn ? allocMinute(64, 90) : allocMinute(4, 90);
    scorer.goals += 1;
    const assister = Math.random() < 0.72 ? pickWeightedAssister(homeLineup.starters, scorer.playerId, userAssistBoost) : undefined;
    if (assister) assister.assists += 1;
    events.push({
      minute: min,
      type: 'GOL',
      clubId: homeClub.id,
      playerName: scorer.name,
      assistName: assister?.name,
      detail: assister ? `Gol de ${scorer.name} (assistência de ${assister.name})` : `Gol de ${scorer.name}`,
      isUserPlayer: scorer.isUser || assister?.isUser,
    });
  }

  for (let g = 0; g < awayScore; g++) {
    const scorer = pickWeightedScorer(awayLineup.starters, awayClub.squad, userGoalBoost);
    const min = scorer.subbedIn ? allocMinute(64, 90) : allocMinute(4, 90);
    scorer.goals += 1;
    const assister = Math.random() < 0.72 ? pickWeightedAssister(awayLineup.starters, scorer.playerId, userAssistBoost) : undefined;
    if (assister) assister.assists += 1;
    events.push({
      minute: min,
      type: 'GOL',
      clubId: awayClub.id,
      playerName: scorer.name,
      assistName: assister?.name,
      detail: assister ? `Gol de ${scorer.name} (assistência de ${assister.name})` : `Gol de ${scorer.name}`,
      isUserPlayer: scorer.isUser || assister?.isUser,
    });
  }

  // Yellow cards (1-4 across match)
  const yellowCount = 1 + Math.floor(Math.random() * 4);
  for (let y = 0; y < yellowCount; y++) {
    const isHomeCard = Math.random() < 0.48;
    const side = isHomeCard ? homeLineup.starters : awayLineup.starters;
    const club = isHomeCard ? homeClub : awayClub;
    const pool = side.filter((p) => !p.yellowCard && p.position !== 'GK_TRAD' && p.position !== 'GK_SWEEPER');
    if (pool.length === 0) continue;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    picked.yellowCard = true;
    events.push({
      minute: allocMinute(14, 88),
      type: 'AMARELO',
      clubId: club.id,
      playerName: picked.name,
      detail: `Cartão amarelo para ${picked.name}`,
      isUserPlayer: picked.isUser,
    });
  }

  // Key GK saves
  const savesHome = Math.max(1, 2 + Math.floor(Math.random() * 5) - (awayScore > 2 ? 1 : 0));
  const savesAway = Math.max(1, 2 + Math.floor(Math.random() * 5) - (homeScore > 2 ? 1 : 0));
  if (savesHome >= 4 && homeLineup.starters[0]) {
    events.push({
      minute: allocMinute(25, 84),
      type: 'DEFESA',
      clubId: homeClub.id,
      playerName: homeLineup.starters[0].name,
      detail: `Grande defesa de ${homeLineup.starters[0].name} salvando o ${homeClub.shortName}!`,
      isUserPlayer: homeLineup.starters[0].isUser,
    });
  }
  if (savesAway >= 4 && awayLineup.starters[0]) {
    events.push({
      minute: allocMinute(25, 84),
      type: 'DEFESA',
      clubId: awayClub.id,
      playerName: awayLineup.starters[0].name,
      detail: `Defesa espetacular de ${awayLineup.starters[0].name} mantendo o ${awayClub.shortName} no jogo!`,
      isUserPlayer: awayLineup.starters[0].isUser,
    });
  }

  // Substitutions
  if (userRole === 'Reserva') {
    const subTarget = (homeClub.id === career.clubId ? homeLineup.starters : awayLineup.starters).find(
      (p) => !p.isUser && p.position !== 'GK_TRAD' && p.position !== 'GK_SWEEPER'
    );
    if (subTarget) subTarget.subbedOut = true;
    const subMin = Math.max(52, 90 - userMinutes);
    events.push({
      minute: subMin,
      type: 'SUBSTITUICAO',
      clubId: userClub.id,
      playerName: career.personal.nickname || career.personal.firstName,
      detail: `Entra ${career.personal.nickname || career.personal.firstName} no lugar de ${subTarget?.name || 'companheiro'}`,
      isUserPlayer: true,
    });
  } else {
    const homeSub = homeLineup.subs[0];
    if (homeSub && homeLineup.starters[6]) {
      homeLineup.starters[6].subbedOut = true;
      events.push({
        minute: allocMinute(62, 81),
        type: 'SUBSTITUICAO',
        clubId: homeClub.id,
        playerName: homeSub.name,
        detail: `${homeSub.name} entra na vaga de ${homeLineup.starters[6].name}`,
      });
    }
    const awaySub = awayLineup.subs[0];
    if (awaySub && awayLineup.starters[7]) {
      awayLineup.starters[7].subbedOut = true;
      events.push({
        minute: allocMinute(64, 83),
        type: 'SUBSTITUICAO',
        clubId: awayClub.id,
        playerName: awaySub.name,
        detail: `${awaySub.name} entra na vaga de ${awayLineup.starters[7].name}`,
      });
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  // Compute match stats
  const possessionHome = clamp(Math.round(50 + diff * 11 + (Math.random() - 0.5) * 8), 35, 65);
  const shotsOnTargetHome = Math.max(homeScore, homeScore + savesAway);
  const shotsOnTargetAway = Math.max(awayScore, awayScore + savesHome);
  const shotsHome = shotsOnTargetHome + 3 + Math.floor(Math.random() * 6);
  const shotsAway = shotsOnTargetAway + 3 + Math.floor(Math.random() * 6);
  const cornersHome = Math.max(2, Math.round(shotsHome * 0.42));
  const cornersAway = Math.max(2, Math.round(shotsAway * 0.42));
  const foulsHome = 8 + Math.floor(Math.random() * 7);
  const foulsAway = 8 + Math.floor(Math.random() * 7);

  // Score player ratings
  const scoreSide = (list: SimPlayerRating[], gf: number, ga: number) => {
    list.forEach((p, idx) => {
      let r = 6.2 + (gf > ga ? 0.45 : gf === ga ? 0.1 : -0.25) + (Math.random() - 0.4) * 0.7;
      r += p.goals * 1.15 + p.assists * 0.65;
      if (idx === 0) {
        r += ga === 0 ? 0.75 : ga >= 3 ? -0.45 : 0.1;
      }
      if (p.yellowCard) r -= 0.25;
      if (p.isUser) {
        r += (career.ovr - 68) * 0.025 + (career.attributes.decisoes - 60) * 0.012;
        if (userMinutes === 0) r = 6.0;
      }
      p.rating = Number(clamp(r, 5.2, 9.8).toFixed(1));
    });
  };

  scoreSide(homeLineup.starters, homeScore, awayScore);
  scoreSide(awayLineup.starters, awayScore, homeScore);

  const allRated = [
    ...homeLineup.starters.map((p) => ({ ...p, cId: homeClub.id })),
    ...awayLineup.starters.map((p) => ({ ...p, cId: awayClub.id })),
  ].sort((a, b) => b.rating - a.rating);
  const motm = allRated[0];

  const userRatingObj = allRated.find((p) => p.isUser);
  const userRating = userMinutes > 0 && userRatingObj ? userRatingObj.rating : 6.0;
  const userGoals = userRatingObj?.goals ?? 0;
  const userAssists = userRatingObj?.assists ?? 0;
  const userYellow = userRatingObj?.yellowCard ? 1 : 0;

  const isGK = career.position === 'GK_TRAD' || career.position === 'GK_SWEEPER';
  const userGroup = getPositionMeta(career.position).group;
  const minRatio = userMinutes / 90;

  const passesCompleted =
    userMinutes === 0
      ? 0
      : Math.round((14 + (career.attributes.passeCurto / 100) * 32) * minRatio);
  const passesMissed =
    userMinutes === 0
      ? 0
      : Math.max(1, Math.round((7 - career.attributes.passeCurto / 25) * minRatio));
  const shots =
    userMinutes === 0
      ? 0
      : Math.max(
          userGoals,
          Math.round(((userGroup === 'ATAQUE' ? 3.5 : userGroup === 'MEIO_CAMPO' ? 2 : 0.6) + Math.random() * 1.5) * minRatio)
        );
  const shotsOnTarget = Math.max(userGoals, Math.min(shots, Math.round(shots * 0.58)));
  const dribblesCompleted =
    userMinutes === 0
      ? 0
      : Math.round((1 + (career.attributes.drible / 30)) * minRatio);
  const tackles =
    userMinutes === 0
      ? 0
      : Math.round(((userGroup === 'DEFESA' ? 4.2 : userGroup === 'MEIO_CAMPO' ? 2.4 : 0.8) + Math.random()) * minRatio);
  const interceptions =
    userMinutes === 0
      ? 0
      : Math.round(((userGroup === 'DEFESA' ? 3.5 : 1.5) + Math.random()) * minRatio);
  const saves =
    isGK && userMinutes > 0 ? (homeClub.id === career.clubId ? savesHome : savesAway) : 0;

  const playerStats: MatchStatLine = {
    matches: userMinutes > 0 ? 1 : 0,
    goals: userGoals,
    assists: userAssists,
    passesCompleted,
    passesMissed,
    shots,
    shotsOnTarget,
    dribblesCompleted,
    tackles,
    interceptions,
    yellowCards: userYellow,
    redCards: 0,
    minutesPlayed: userMinutes,
    ratingSum: userMinutes > 0 ? userRating : 0,
    saves,
  };

  const stadiumCapacity = homeClub.stadiumCapacity || 30000;
  const importance = opts.competition.includes('Copa') || opts.competition.includes('Supercopa') ? 0.92 : 0.78;
  const attendance = Math.round(stadiumCapacity * clamp(importance + (Math.random() - 0.5) * 0.18, 0.45, 0.99));

  const report: MatchSimReport = {
    id: opts.fixtureId || `sim_${career.season}_${career.round}_${homeClub.id}_${awayClub.id}`,
    season: career.season,
    round: career.round,
    competition: opts.competition,
    homeClubId: homeClub.id,
    awayClubId: awayClub.id,
    homeScore,
    awayScore,
    penHomeScore,
    penAwayScore,
    stadiumName: opts.stadiumName || homeClub.stadiumName,
    weather: opts.weather || 'Ensolarado',
    attendance,
    userRole,
    userMinutes,
    userRating,
    motmName: motm?.name || homeClub.squad[9]?.name || 'Destaque',
    motmClubId: motm?.cId || homeClub.id,
    events,
    stats: {
      possessionHome,
      shotsHome,
      shotsAway,
      shotsOnTargetHome,
      shotsOnTargetAway,
      cornersHome,
      cornersAway,
      foulsHome,
      foulsAway,
      savesHome,
      savesAway,
    },
    homeRatings: homeLineup.starters,
    awayRatings: awayLineup.starters,
  };

  return {
    report,
    outcomePayload: {
      homeClubId: homeClub.id,
      awayClubId: awayClub.id,
      homeScore,
      awayScore,
      penHomeScore,
      penAwayScore,
      fixtureId: opts.fixtureId,
      playerStats,
      rating: userRating,
      motm: Boolean(motm?.isUser),
      competition: opts.competition,
      stadiumName: report.stadiumName,
      weather: report.weather,
      simReport: report,
    },
  };
}

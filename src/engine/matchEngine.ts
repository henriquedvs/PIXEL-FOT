import { soundEngine } from '../audio/soundEngine';
import { getPositionMeta } from '../data/positions';
import {
  Club,
  ClubKit,
  ClubSquadMember,
  CrowdMood,
  FormationId,
  GameSettings,
  MatchEnvironment,
  MatchStatLine,
  PlayerAnimAction,
  PlayerAppearance,
  PlayerCareer,
  PositionId,
  SportGear,
} from '../types/game';
import { emptyStats } from '../utils/storage';
import {
  BallTrailPoint,
  CrowdSpectator,
  PITCH_GEO,
  TurfScuffMark,
  drawPixelBall,
  drawPixelBallTrail,
  drawPixelLinesman,
  drawPixelPlayerSprite,
  drawPixelReferee,
  drawPixelStadium,
  drawReplayOverlay,
  drawWeatherAndLightingOverlay,
  generateCrowd,
} from './pixelRenderer';

export type MatchPhase =
  | 'KICKOFF'
  | 'PLAYING'
  | 'GOAL_CELEBRATION'
  | 'GOAL_REPLAY'
  | 'SET_PIECE'
  | 'HALFTIME'
  | 'PENALTY_SHOOTOUT'
  | 'FULLTIME';

export type TeamTacticId = 'DEFENSIVO' | 'EQUILIBRADO' | 'OFENSIVO' | 'PRESSAO_ALTA';
export type CameraZoomPreset = 'close' | 'normal' | 'wide';
export type KitSlotChoice = 'home' | 'away' | 'third';

export interface SimPlayer {
  id: string;
  name: string;
  number: number;
  team: 'home' | 'away';
  isUser: boolean;
  isGoalkeeper: boolean;
  isCaptain: boolean;
  position: PositionId;
  homeSlotX: number;
  homeSlotY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingAngle: number;
  animPhase: number;
  action: PlayerAnimAction;
  actionTimer: number;
  stamina: number;
  speedStat: number;
  accelStat: number;
  shootStat: number;
  passStat: number;
  dribbleStat: number;
  defendStat: number;
  gkStat: number;
  jumpStat: number;
  volleyStat: number;
  composureStat: number;
  decisionStat: number;
  leadershipStat: number;
  elasticityStat: number;
  defPosStat: number;
  traits: string[];
  appearance: PlayerAppearance;
  gear: SportGear;
  dribbleTimer: number;
  tackleCooldown: number;
  tackleLungeTimer: number;
  diveTimer: number;
  diveVy: number;
  yellowCards: number;
  redCard: boolean;
  aiDecisionTimer: number;
  matchRating: number;
}

export interface SimBall {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  ownerId: string | null;
  lastTouchTeam: 'home' | 'away' | null;
  lastTouchPlayerId: string | null;
  lastPasserId: string | null;
  pickupLockTimer: number;
  wasShot: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
  gravity?: number;
}

export interface RadarDot {
  nx: number;
  ny: number;
  team: 'home' | 'away';
  isGk: boolean;
  isUser: boolean;
}

export interface LineupRatingItem {
  id: string;
  name: string;
  number: number;
  position: PositionId;
  stamina: number;
  rating: number;
  isUser: boolean;
  redCard: boolean;
}

export interface PenaltyShootoutSnapshot {
  active: boolean;
  turn: 'home' | 'away';
  step: 'WAIT_USER' | 'BALL_FLIGHT' | 'RESULT_PAUSE';
  round: number;
  homeKicks: ('G' | 'M')[];
  awayKicks: ('G' | 'M')[];
  homeScore: number;
  awayScore: number;
  userRole: 'KICKER' | 'KEEPER';
  kickerName: string;
  aimDir: 'left' | 'center' | 'right';
}

interface ReplayFrame {
  ballX: number;
  ballY: number;
  ballZ: number;
  ballSpin: number;
  camX: number;
  camY: number;
  players: {
    id: string;
    x: number;
    y: number;
    facingAngle: number;
    animPhase: number;
    action: PlayerAnimAction;
    dribbleTimer: number;
  }[];
  refX: number;
  refY: number;
  refPhase: number;
}

export interface MatchHudSnapshot {
  homeScore: number;
  awayScore: number;
  penHomeScore: number;
  penAwayScore: number;
  matchMinute: number;
  addedTime: number;
  half: 1 | 2;
  phase: MatchPhase;
  eventBanner: string | null;
  eventTone: 'goal' | 'card' | 'sub' | 'save' | 'info';
  possessionHomePct: number;
  teamShotsHome: number;
  teamShotsAway: number;
  teamPassesHome: number;
  teamPassesAway: number;
  teamCornersHome: number;
  teamCornersAway: number;
  teamOffsidesHome: number;
  teamOffsidesAway: number;
  teamFoulsHome: number;
  teamFoulsAway: number;
  userHasBall: boolean;
  userTeamHasBall: boolean;
  userTeamHasSetPiece: boolean;
  advantageActive: boolean;
  momentum: number; // -100 (away) to +100 (home)
  userStamina: number;
  userIsGk: boolean;
  isAimingShot: boolean;
  shotPower: number;
  stats: MatchStatLine;
  rating: number;
  tactic: TeamTacticId;
  zoomPreset: CameraZoomPreset;
  subsUsedUser: number;
  benchCountUser: number;
  hasReplayAvailable: boolean;
  radar: {
    players: RadarDot[];
    ballX: number;
    ballY: number;
  };
  userLineupRatings: LineupRatingItem[];
  penaltyShootout: PenaltyShootoutSnapshot | null;
}

const FORMATION_COORDS: Record<FormationId, { x: number; y: number }[]> = {
  '4-3-3': [
    { x: 0.04, y: 0.5 },
    { x: 0.22, y: 0.84 },
    { x: 0.19, y: 0.62 },
    { x: 0.19, y: 0.38 },
    { x: 0.22, y: 0.16 },
    { x: 0.40, y: 0.50 },
    { x: 0.50, y: 0.32 },
    { x: 0.54, y: 0.68 },
    { x: 0.78, y: 0.82 },
    { x: 0.83, y: 0.50 },
    { x: 0.78, y: 0.18 },
  ],
  '4-4-2': [
    { x: 0.04, y: 0.5 },
    { x: 0.22, y: 0.84 },
    { x: 0.19, y: 0.62 },
    { x: 0.19, y: 0.38 },
    { x: 0.22, y: 0.16 },
    { x: 0.45, y: 0.80 },
    { x: 0.45, y: 0.58 },
    { x: 0.45, y: 0.42 },
    { x: 0.45, y: 0.20 },
    { x: 0.80, y: 0.38 },
    { x: 0.80, y: 0.62 },
  ],
  '3-5-2': [
    { x: 0.04, y: 0.5 },
    { x: 0.20, y: 0.74 },
    { x: 0.18, y: 0.50 },
    { x: 0.20, y: 0.26 },
    { x: 0.46, y: 0.86 },
    { x: 0.42, y: 0.60 },
    { x: 0.50, y: 0.40 },
    { x: 0.46, y: 0.14 },
    { x: 0.60, y: 0.50 },
    { x: 0.81, y: 0.38 },
    { x: 0.81, y: 0.62 },
  ],
  '4-2-3-1': [
    { x: 0.04, y: 0.5 },
    { x: 0.22, y: 0.84 },
    { x: 0.19, y: 0.62 },
    { x: 0.19, y: 0.38 },
    { x: 0.22, y: 0.16 },
    { x: 0.38, y: 0.62 },
    { x: 0.38, y: 0.38 },
    { x: 0.58, y: 0.50 },
    { x: 0.72, y: 0.82 },
    { x: 0.84, y: 0.50 },
    { x: 0.72, y: 0.18 },
  ],
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [128, 128, 128];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function colorDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

export function getClubKitByChoice(club: Club, choice: KitSlotChoice): ClubKit {
  if (choice === 'away' && club.awayKit) return club.awayKit;
  if (choice === 'third' && club.thirdKit) return club.thirdKit;
  return club.kit;
}

export function resolveKitSelection(
  homeClub: Club,
  awayClub: Club,
  userTeam: 'home' | 'away',
  userKitChoice: KitSlotChoice = 'home'
): { homeKit: ClubKit; awayKit: ClubKit; clashResolved: boolean } {
  const userClub = userTeam === 'home' ? homeClub : awayClub;
  const oppClub = userTeam === 'home' ? awayClub : homeClub;

  const userKit = getClubKitByChoice(userClub, userKitChoice);
  const oppCandidates: ClubKit[] = [oppClub.kit];
  if (oppClub.awayKit) oppCandidates.push(oppClub.awayKit);
  if (oppClub.thirdKit) oppCandidates.push(oppClub.thirdKit);

  let chosenOpp = oppCandidates[0];
  let clashResolved = false;

  if (colorDistance(userKit.primary, chosenOpp.primary) < 115) {
    let bestDist = colorDistance(userKit.primary, chosenOpp.primary);
    for (const cand of oppCandidates) {
      const d = colorDistance(userKit.primary, cand.primary);
      if (d > bestDist) {
        bestDist = d;
        chosenOpp = cand;
      }
    }
    clashResolved = chosenOpp !== oppClub.kit;
  }

  return userTeam === 'home'
    ? { homeKit: userKit, awayKit: chosenOpp, clashResolved }
    : { homeKit: chosenOpp, awayKit: userKit, clashResolved };
}

export class MatchEngine {
  public homeClub: Club;
  public awayClub: Club;
  public activeHomeKit: ClubKit;
  public activeAwayKit: ClubKit;
  public userTeam: 'home' | 'away';
  public career: PlayerCareer;
  public settings: GameSettings;
  public env: MatchEnvironment;

  public players: SimPlayer[] = [];
  public homeBench: ClubSquadMember[] = [];
  public awayBench: ClubSquadMember[] = [];
  public homeSubsUsed = 0;
  public awaySubsUsed = 0;

  public ball: SimBall;
  public ref = { x: 680, y: 380, phase: 0, cardTimer: 0, cardColor: null as 'yellow' | 'red' | null };
  public linesmen = [
    { x: 680, y: PITCH_GEO.pitchY - 8, phase: 0, flagTimer: 0 },
    { x: 920, y: PITCH_GEO.pitchY + PITCH_GEO.pitchH + 8, phase: 0, flagTimer: 0 },
  ];
  public crowd: CrowdSpectator[];
  public particles: Particle[] = [];
  public scuffMarks: TurfScuffMark[] = [];
  public ballTrail: BallTrailPoint[] = [];

  public homeScore = 0;
  public awayScore = 0;
  public penHomeScore = 0;
  public penAwayScore = 0;
  public half: 1 | 2 = 1;
  public matchSeconds = 0;
  public addedTime = 1;
  public phase: MatchPhase = 'KICKOFF';
  public phaseTimer = 1.2;
  public eventBanner: string | null = 'INÍCIO DE PARTIDA';
  public eventTone: 'goal' | 'card' | 'sub' | 'save' | 'info' = 'info';
  public bannerTimer = 1.8;

  public netRippleLeft = 0;
  public netRippleRight = 0;
  public goalExcitement = 0;
  public crowdMood: CrowdMood = 'calm';
  public moodTimer = 0;
  public shakeTimer = 0;
  public cameraFlashTimer = 0;
  public fourthOfficialText = '';
  public fourthOfficialTimer = 0;
  public totalTime = 0;
  public paused = false;

  public possessionTicksHome = 1;
  public possessionTicksAway = 1;
  public teamShotsHome = 0;
  public teamShotsAway = 0;
  public teamPassesHome = 0;
  public teamPassesAway = 0;
  public teamCornersHome = 0;
  public teamCornersAway = 0;
  public teamOffsidesHome = 0;
  public teamOffsidesAway = 0;
  public teamFoulsHome = 0;
  public teamFoulsAway = 0;

  private aiHomeSubDone = false;
  private aiAwaySubDone = false;
  private footstepCooldown = 0;
  private chantCooldown = 6;
  private celebrationScorerId: string | null = null;
  private celebrationScorerName = '';
  private celebrationTeam: 'home' | 'away' = 'home';
  private celebrationTarget = { x: 800, y: 210 };
  private activeCelebrationAction: PlayerAnimAction = 'celebrate_arms';
  private celebrationRunElapsed = 0;

  // Functional features state
  public userTactic: TeamTacticId = 'EQUILIBRADO';
  public zoomPreset: CameraZoomPreset = 'normal';
  private pendingOffsideIds = new Set<string>();
  private giveAndGoMateId: string | null = null;
  private giveAndGoTimer = 0;
  private momentum = 0;
  private powerShotTimer = 0;
  private advantageTimer = 0;
  private offsideLineX: number | null = null;
  private offsideLineTimer = 0;
  private netImpactLeftY = PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2;
  private netImpactRightY = PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2;
  private dynamicCamZoomBoost = 0;
  private setPieceTeam: 'home' | 'away' | null = null;
  private shotShockwave = { x: 0, y: 0, timer: 0 };

  // Replay buffer
  private replayBuffer: ReplayFrame[] = [];
  private replayCaptureAccum = 0;
  private replayPlaybackFrames: ReplayFrame[] = [];
  private replayCursor = 0;
  private replayPendingKickoffSide: 'home' | 'away' = 'home';
  private hasGoalReplayReady = false;

  // Penalty Shootout state (Knockout matches tied at 90')
  private penKicksHome: ('G' | 'M')[] = [];
  private penKicksAway: ('G' | 'M')[] = [];
  private penTurn: 'home' | 'away' = 'home';
  private penStep: 'WAIT_USER' | 'BALL_FLIGHT' | 'RESULT_PAUSE' = 'WAIT_USER';
  private penAimDir: 'left' | 'center' | 'right' = 'center';
  private penTimer = 0;
  private penRound = 1;
  private penGkTargetY = PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2;
  private penLastWasGoal = false;

  public stats: MatchStatLine = emptyStats();
  public rating = 6.5;

  public camX = PITCH_GEO.worldW / 2;
  public camY = PITCH_GEO.worldH / 2;

  public moveInput = { x: 0, y: 0 };
  public sprintHeld = false;
  public markHeld = false;
  public isAimingShot = false;
  public aimWorldX = 0;
  public aimWorldY = 0;
  public shotCharge = 0.25;
  public shootQueueTimer = 0;
  private queuedShotPower = 0.65;
  private queuedShotAimY: number | null = null;
  public passQueueTimer = 0;
  public callForPassPulseTimer = 0;
  public userRequestedPassTimer = 0;
  public highlightedTeammateId: string | null = null;
  public highlightTimer = 0;

  constructor(
    career: PlayerCareer,
    homeClub: Club,
    awayClub: Club,
    settings: GameSettings,
    env: MatchEnvironment,
    kitOverrides?: { homeKitOverride?: ClubKit; awayKitOverride?: ClubKit }
  ) {
    this.career = career;
    this.homeClub = homeClub;
    this.awayClub = awayClub;
    this.userTeam = career.clubId === homeClub.id ? 'home' : 'away';
    this.settings = settings;
    this.env = env;

    const autoResolved = resolveKitSelection(homeClub, awayClub, this.userTeam, 'home');
    this.activeHomeKit = kitOverrides?.homeKitOverride || autoResolved.homeKit;
    this.activeAwayKit = kitOverrides?.awayKitOverride || autoResolved.awayKit;

    const isImportant =
      env.competitionName.includes('Final') ||
      env.competitionName.includes('Copa') ||
      env.competitionName.includes('Supercopa') ||
      career.round >= 20;

    this.crowd = generateCrowd(
      this.activeHomeKit.primary,
      this.activeHomeKit.secondary,
      this.activeAwayKit.primary,
      settings.crowdDetail || settings.graphicsQuality,
      {
        awaySecondary: this.activeAwayKit.secondary,
        capacity: env.stadium.capacity,
        importance: isImportant ? 0.96 : 0.72,
      }
    );

    this.ball = {
      x: PITCH_GEO.pitchX + PITCH_GEO.pitchW / 2,
      y: PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      spin: 0,
      ownerId: null,
      lastTouchTeam: null,
      lastTouchPlayerId: null,
      lastPasserId: null,
      pickupLockTimer: 0,
      wasShot: false,
    };

    this.spawnTeams();
    this.resetKickoff(this.userTeam);
    soundEngine.play('whistle');
  }

  private createNpcAppearance(member: ClubSquadMember): { appearance: PlayerAppearance; gear: SportGear } {
    return {
      appearance: {
        skinColor: member.skinColor,
        hairStyle: member.hairStyle,
        hairColor: member.hairColor,
        faceStyle: 'Determinado',
        eyeStyle: 'Padrão',
        eyebrowStyle: 'Grossa',
        beardStyle: member.beard || 'Nenhuma',
        mustacheStyle: 'Nenhum',
        bodyType: 'Atlético',
        visualHeightScale: 1.0,
      },
      gear: {
        jerseyNumber: member.number,
        dominantFoot: 'Direito',
        bootModel: 'Clássica',
        bootColor: '#1E293B',
        sleeveLength: 'Curta',
        sockType: 'Alta',
        accessory: member.position === 'GK_TRAD' || member.position === 'GK_SWEEPER' ? 'Luvas' : 'Nenhum',
      },
    };
  }

  private spawnTeams() {
    this.players = [];
    this.homeBench = this.homeClub.squad.slice(11);
    this.awayBench = this.awayClub.squad.slice(11);
    this.spawnSide(this.homeClub, 'home');
    this.spawnSide(this.awayClub, 'away');
  }

  private spawnSide(club: Club, side: 'home' | 'away') {
    const coords = FORMATION_COORDS[club.formation] || FORMATION_COORDS['4-3-3'];
    const userIsThisSide = this.userTeam === side;
    const userGroup = getPositionMeta(this.career.position).group;

    let userSlotIdx = 9;
    if (userIsThisSide) {
      if (userGroup === 'GOLEIRO') userSlotIdx = 0;
      else if (userGroup === 'DEFESA') userSlotIdx = 2;
      else if (userGroup === 'MEIO_CAMPO') userSlotIdx = 6;
      else userSlotIdx = 9;
    }

    const fatiguePenalty = Math.max(0, (this.career.fatigue - 55) * 0.15);

    // Strictly 11 starting players per team (1 GK + 10 outfield = 22 total on pitch)
    const starters = club.squad.slice(0, 11);

    starters.forEach((m, idx) => {
      const slot = coords[idx] || { x: 0.5, y: 0.5 };
      const isUser = userIsThisSide && idx === userSlotIdx;
      const isGk = idx === 0;
      const isCaptain = idx === 1;

      if (isUser) {
        const a = this.career.attributes;
        this.players.push({
          id: 'user_player',
          name: this.career.personal.nickname || this.career.personal.firstName,
          number: this.career.gear.jerseyNumber,
          team: side,
          isUser: true,
          isGoalkeeper: isGk,
          isCaptain,
          position: this.career.position,
          homeSlotX: slot.x,
          homeSlotY: slot.y,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          facingAngle: side === 'home' ? 0 : Math.PI,
          animPhase: 0,
          action: 'idle',
          actionTimer: 0,
          stamina: Math.max(60, 100 - fatiguePenalty),
          speedStat: a.velocidade,
          accelStat: a.aceleracao,
          shootStat: Math.round((a.finalizacao + a.precisaoChute + a.potenciaChute) / 3),
          passStat: Math.round((a.passeCurto + a.passeLongo + a.visaoJogo) / 3),
          dribbleStat: Math.round((a.drible + a.controleBola + a.agilidade) / 3),
          defendStat: Math.round((a.desarme + a.marcacao + a.interceptacao) / 3),
          gkStat: Math.round((a.reflexos + a.posicionamentoGk) / 2),
          jumpStat: a.impulsao ?? a.forcaFisica,
          volleyStat: a.voleio ?? a.finalizacao,
          composureStat: a.compostura ?? a.decisoes,
          decisionStat: a.decisoes ?? a.visaoJogo,
          leadershipStat: a.lideranca ?? 65,
          elasticityStat: a.elasticidade ?? a.reflexos,
          defPosStat: a.posicionamentoDefensivo ?? a.marcacao,
          traits: this.career.traits || [],
          appearance: this.career.appearance,
          gear: this.career.gear,
          dribbleTimer: 0,
          tackleCooldown: 0,
          tackleLungeTimer: 0,
          diveTimer: 0,
          diveVy: 0,
          yellowCards: 0,
          redCard: false,
          aiDecisionTimer: 0,
          matchRating: 6.5,
        });
      } else {
        const visuals = this.createNpcAppearance(m);
        this.players.push({
          id: `${side}_${idx}`,
          name: m.name,
          number: m.number,
          team: side,
          isUser: false,
          isGoalkeeper: isGk,
          isCaptain,
          position: m.position,
          homeSlotX: slot.x,
          homeSlotY: slot.y,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          facingAngle: side === 'home' ? 0 : Math.PI,
          animPhase: idx * 0.7,
          action: 'idle',
          actionTimer: 0,
          stamina: 100,
          speedStat: m.speed,
          accelStat: m.speed,
          shootStat: m.shooting,
          passStat: m.passing,
          dribbleStat: m.dribbling,
          defendStat: m.defending,
          gkStat: m.gkSkill,
          jumpStat: Math.round((m.ovr + m.speed) / 2),
          volleyStat: Math.round((m.shooting + m.dribbling) / 2),
          composureStat: m.ovr,
          decisionStat: Math.round((m.passing + m.ovr) / 2),
          leadershipStat: isCaptain ? Math.min(95, m.ovr + 10) : m.ovr,
          elasticityStat: m.gkSkill,
          defPosStat: m.defending,
          traits: m.traits || [],
          appearance: visuals.appearance,
          gear: visuals.gear,
          dribbleTimer: 0,
          tackleCooldown: 0,
          tackleLungeTimer: 0,
          diveTimer: 0,
          diveVy: 0,
          yellowCards: 0,
          redCard: false,
          aiDecisionTimer: Math.random() * 0.35,
          matchRating: 6.4,
        });
      }
    });
  }

  public getAttackDir(team: 'home' | 'away'): 1 | -1 {
    if (this.half === 1) return team === 'home' ? 1 : -1;
    return team === 'home' ? -1 : 1;
  }

  public setTeamTactic(tactic: TeamTacticId) {
    this.userTactic = tactic;
    soundEngine.play('menu');
    const labels: Record<TeamTacticId, string> = {
      DEFENSIVO: 'TÁTICA: DEFENSIVO',
      EQUILIBRADO: 'TÁTICA: EQUILIBRADO',
      OFENSIVO: 'TÁTICA: OFENSIVO',
      PRESSAO_ALTA: 'TÁTICA: PRESSÃO ALTA',
    };
    this.eventBanner = labels[tactic];
    this.eventTone = 'info';
    this.bannerTimer = 1.4;
  }

  public cycleZoomPreset() {
    const order: CameraZoomPreset[] = ['normal', 'wide', 'close'];
    const next = order[(order.indexOf(this.zoomPreset) + 1) % order.length];
    this.zoomPreset = next;
    soundEngine.play('menu');
  }

  public setZoomPreset(preset: CameraZoomPreset) {
    this.zoomPreset = preset;
  }

  public performSubstitution(team: 'home' | 'away', targetPlayerId?: string): boolean {
    const bench = team === 'home' ? this.homeBench : this.awayBench;
    const subsUsed = team === 'home' ? this.homeSubsUsed : this.awaySubsUsed;
    if (bench.length === 0 || subsUsed >= 5) return false;

    const candidates = this.players.filter(
      (p) => p.team === team && !p.isUser && !p.isGoalkeeper && !p.redCard
    );
    if (candidates.length === 0) return false;

    const outgoing =
      (targetPlayerId && candidates.find((c) => c.id === targetPlayerId)) ||
      candidates.sort((a, b) => a.stamina - b.stamina)[0];

    // Pick best matching outfield bench player (or first non-GK on bench)
    const benchOutIdx = bench.findIndex(
      (b) => b.position !== 'GK_TRAD' && b.position !== 'GK_SWEEPER'
    );
    const incomingIdx = benchOutIdx >= 0 ? benchOutIdx : 0;
    const incoming = bench.splice(incomingIdx, 1)[0];
    if (!incoming) return false;

    const prevNum = outgoing.number;
    const prevName = outgoing.name;
    const visuals = this.createNpcAppearance(incoming);
    outgoing.name = incoming.name;
    outgoing.number = incoming.number;
    outgoing.position = incoming.position;
    outgoing.stamina = 100;
    outgoing.speedStat = incoming.speed;
    outgoing.accelStat = incoming.speed;
    outgoing.shootStat = incoming.shooting;
    outgoing.passStat = incoming.passing;
    outgoing.dribbleStat = incoming.dribbling;
    outgoing.defendStat = incoming.defending;
    outgoing.gkStat = incoming.gkSkill;
    outgoing.jumpStat = Math.round((incoming.ovr + incoming.speed) / 2);
    outgoing.volleyStat = Math.round((incoming.shooting + incoming.dribbling) / 2);
    outgoing.composureStat = incoming.ovr;
    outgoing.decisionStat = Math.round((incoming.passing + incoming.ovr) / 2);
    outgoing.elasticityStat = incoming.gkSkill;
    outgoing.defPosStat = incoming.defending;
    outgoing.traits = incoming.traits || [];
    outgoing.appearance = visuals.appearance;
    outgoing.gear = visuals.gear;
    outgoing.matchRating = 6.5;
    outgoing.yellowCards = 0;

    if (team === 'home') this.homeSubsUsed += 1;
    else this.awaySubsUsed += 1;

    this.fourthOfficialText = `${prevNum}/${incoming.number}`;
    this.fourthOfficialTimer = 3.8;
    const touchX = PITCH_GEO.pitchX + PITCH_GEO.pitchW * 0.5;
    const touchY = PITCH_GEO.pitchY - 12;
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: touchX + (Math.random() - 0.5) * 16,
        y: touchY,
        vx: (Math.random() - 0.5) * 55,
        vy: -25 - Math.random() * 45,
        color: i % 2 === 0 ? '#34D399' : '#FACC15',
        life: 0.75,
        size: 3,
      });
    }
    this.shiftMomentum(team, 6);
    this.eventBanner = `SUBSTITUIÇÃO · Sai #${prevNum} ${prevName} · Entra #${incoming.number} ${incoming.name}`;
    this.eventTone = 'sub';
    this.bannerTimer = 2.6;
    soundEngine.play('applause');
    return true;
  }

  private shiftMomentum(team: 'home' | 'away', delta: number) {
    this.momentum = clamp(this.momentum + (team === 'home' ? delta : -delta), -100, 100);
  }

  private slotToWorld(team: 'home' | 'away', slotX: number, slotY: number) {
    const g = PITCH_GEO;
    const dir = this.getAttackDir(team);
    const nx = dir === 1 ? slotX : 1 - slotX;
    const ny = dir === 1 ? slotY : 1 - slotY;
    return {
      x: g.pitchX + nx * g.pitchW,
      y: g.pitchY + ny * g.pitchH,
    };
  }

  private resetKickoff(kickoffTeam: 'home' | 'away') {
    const g = PITCH_GEO;
    const midX = g.pitchX + g.pitchW / 2;
    const midY = g.pitchY + g.pitchH / 2;

    this.ball.x = midX;
    this.ball.y = midY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.ownerId = null;
    this.ball.wasShot = false;
    this.ball.pickupLockTimer = 0.2;
    this.pendingOffsideIds.clear();
    this.ballTrail = [];

    this.players.forEach((p) => {
      if (p.redCard) return;
      const clampedX = Math.min(0.46, p.homeSlotX);
      const pos = this.slotToWorld(p.team, clampedX, p.homeSlotY);
      p.x = pos.x;
      p.y = pos.y;
      p.vx = 0;
      p.vy = 0;
      p.facingAngle = this.getAttackDir(p.team) === 1 ? 0 : Math.PI;
    });

    const taker = this.players.find((p) => p.team === kickoffTeam && !p.redCard && !p.isGoalkeeper);
    if (taker) {
      taker.x = midX - this.getAttackDir(kickoffTeam) * 14;
      taker.y = midY;
    }

    this.ref.x = midX;
    this.ref.y = midY - 70;
    this.phase = 'KICKOFF';
    this.phaseTimer = 1.0;
  }

  public getUserPlayer(): SimPlayer {
    return this.players.find((p) => p.isUser) || this.players[0];
  }

  public triggerDribbleOrTackle() {
    if (this.phase !== 'PLAYING') return;
    const user = this.getUserPlayer();
    if (user.redCard) return;

    if (this.ball.ownerId === user.id) {
      if (user.dribbleTimer <= 0 && user.stamina >= 10) {
        user.dribbleTimer = 0.62;
        user.action = 'dribble';
        user.actionTimer = 0.45;
        user.stamina = Math.max(0, user.stamina - 8);
        const cutAngle = user.facingAngle + (Math.random() > 0.5 ? 0.35 : -0.35);
        user.vx = Math.cos(cutAngle) * 235;
        user.vy = Math.sin(cutAngle) * 235;
        soundEngine.play('ball');

        const nearestOpp = this.players.find(
          (o) => o.team !== user.team && !o.redCard && dist(o.x, o.y, user.x, user.y) < 62
        );
        if (nearestOpp) {
          const successChance = 0.58 + (user.dribbleStat - nearestOpp.defendStat) * 0.008;
          if (Math.random() < successChance) {
            this.stats.dribblesCompleted += 1;
            this.rating = Math.min(10, this.rating + 0.12);
            user.matchRating = Math.min(10, user.matchRating + 0.12);
            this.setCrowdMood('excited', 1.4);
          }
        }
      }
    } else if (user.isGoalkeeper && this.ball.ownerId === null) {
      if (user.diveTimer <= 0) {
        user.diveTimer = 0.5;
        user.action = 'dive';
        user.actionTimer = 0.5;
        user.diveVy = this.ball.y > user.y ? 265 : -265;
        this.addScuffMark(user.x, user.y + 6, Math.PI / 2, 16, 'scuff');
        soundEngine.play('ball');
      }
    } else {
      if (user.tackleCooldown <= 0) {
        user.tackleLungeTimer = 0.3;
        user.tackleCooldown = 0.85;
        user.action = 'tackle';
        user.actionTimer = 0.32;
        const speed = 295;
        user.vx = Math.cos(user.facingAngle) * speed;
        user.vy = Math.sin(user.facingAngle) * speed;
        this.addScuffMark(user.x, user.y + 6, user.facingAngle, 20, 'slide');
        this.spawnTurfParticles(user.x, user.y + 6, 5);
        soundEngine.play('ball');
      }
    }
  }

  public findBestUserPassTarget(user: SimPlayer): SimPlayer | null {
    const mates = this.players.filter(
      (p) => p.team === user.team && p.id !== user.id && !p.redCard
    );
    if (mates.length === 0) return null;

    const aimAng =
      Math.hypot(this.moveInput.x, this.moveInput.y) > 0.2
        ? Math.atan2(this.moveInput.y, this.moveInput.x)
        : user.facingAngle;
    const aimX = Math.cos(aimAng);
    const aimY = Math.sin(aimAng);

    let bestMate = mates[0];
    let bestScore = -9999;
    for (const m of mates) {
      const dx = m.x - user.x;
      const dy = m.y - user.y;
      const d = Math.hypot(dx, dy);
      if (d < 16 || d > 560) continue;
      const dot = (dx / d) * aimX + (dy / d) * aimY;
      const score = dot * 230 - d * 0.2 + (m.isGoalkeeper ? -95 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestMate = m;
      }
    }
    return bestMate;
  }

  public triggerQuickPass() {
    const user = this.getUserPlayer();
    if (user.redCard) return;

    // Allow user to execute a live Set-Piece immediately using analog direction!
    if (this.phase === 'SET_PIECE' && this.setPieceTeam === this.userTeam) {
      const owner = this.players.find((p) => p.id === this.ball.ownerId) || user;
      const bestMate = this.findBestUserPassTarget(owner) || this.findBestPassTarget(owner);
      if (bestMate) {
        this.phase = 'PLAYING';
        this.phaseTimer = 0;
        this.setPieceTeam = null;
        this.executePass(owner, bestMate, this.sprintHeld);
      }
      return;
    }

    if (this.phase !== 'PLAYING') return;

    if (
      this.ball.ownerId === user.id ||
      (!this.ball.ownerId && dist(user.x, user.y, this.ball.x, this.ball.y) < 38 && this.ball.z < 28)
    ) {
      const bestMate = this.findBestUserPassTarget(user);
      if (!bestMate) return;
      this.highlightedTeammateId = bestMate.id;
      this.highlightTimer = 0.45;
      this.passQueueTimer = 0;
      const isThrough = this.sprintHeld;
      this.executePass(user, bestMate, isThrough);
    } else {
      // Queue one-touch pass if ball is arriving soon
      this.passQueueTimer = 0.36;
    }
  }

  public triggerCallForPass() {
    if (this.phase === 'PENALTY_SHOOTOUT') {
      this.submitPenaltyChoice('center');
      return;
    }
    if (this.phase !== 'PLAYING') return;
    const user = this.getUserPlayer();
    if (user.redCard) return;
    if (this.ball.ownerId === user.id) return;

    this.callForPassPulseTimer = 0.75;
    this.userRequestedPassTimer = 1.6;
    soundEngine.play('menu');

    // 1-2 Give-and-Go support: if user passed recently, mark receiver for priority instant return!
    if (this.ball.lastPasserId === user.id && this.ball.ownerId) {
      this.giveAndGoMateId = this.ball.ownerId;
      this.giveAndGoTimer = 1.3;
    }

    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    if (owner && owner.team === user.team && owner.id !== user.id) {
      this.userRequestedPassTimer = 0;
      owner.aiDecisionTimer = 0.35;
      this.executePass(owner, user, this.sprintHeld || this.giveAndGoTimer > 0);
    }
  }

  public handleCanvasTap(worldX: number, worldY: number) {
    if (this.phase !== 'PLAYING') return;
    const user = this.getUserPlayer();
    if (user.redCard) return;

    if (this.ball.ownerId === user.id) {
      const teammates = this.players.filter(
        (p) => p.team === user.team && p.id !== user.id && !p.redCard
      );
      let tappedMate: SimPlayer | null = null;
      let bestD = 62;
      for (const m of teammates) {
        const d = dist(worldX, worldY, m.x, m.y);
        if (d < bestD) {
          bestD = d;
          tappedMate = m;
        }
      }
      if (tappedMate) {
        this.highlightedTeammateId = tappedMate.id;
        this.highlightTimer = 0.45;
        const dir = this.getAttackDir(user.team);
        const isThrough = this.sprintHeld || (worldX - tappedMate.x) * dir > 18;
        this.executePass(user, tappedMate, isThrough);
        return;
      }

      const dir = this.getAttackDir(user.team);
      const g = PITCH_GEO;
      const inFinishingZone =
        dir === 1
          ? worldX > g.pitchX + g.pitchW * 0.56
          : worldX < g.pitchX + g.pitchW * 0.44;
      if (inFinishingZone) {
        this.executeShot(user, worldX, worldY, 0.7);
      }
    }
  }

  public startShotAim(worldX: number, worldY: number) {
    if (this.phase === 'PENALTY_SHOOTOUT') {
      const midY = PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2;
      const dir: 'left' | 'center' | 'right' =
        worldY < midY - 22 ? 'left' : worldY > midY + 22 ? 'right' : 'center';
      this.submitPenaltyChoice(dir);
      return;
    }
    if (this.phase !== 'PLAYING' && !(this.phase === 'SET_PIECE' && this.setPieceTeam === this.userTeam)) return;
    const user = this.getUserPlayer();
    if (user.redCard) return;
    this.isAimingShot = true;
    this.aimWorldX = worldX;
    this.aimWorldY = worldY;
    this.shotCharge = 0.35;
    if (this.ball.ownerId !== user.id) {
      this.shootQueueTimer = 0.45;
      this.queuedShotPower = 0.65;
      this.queuedShotAimY = worldY;
    }
  }

  public updateShotAim(worldX: number, worldY: number) {
    if (!this.isAimingShot) return;
    this.aimWorldX = worldX;
    this.aimWorldY = worldY;
    this.queuedShotAimY = worldY;
  }

  public releaseShotAim() {
    if (!this.isAimingShot) return;
    const user = this.getUserPlayer();
    this.isAimingShot = false;
    if (user.redCard) return;

    if (this.phase === 'SET_PIECE' && this.setPieceTeam === this.userTeam) {
      const owner = this.players.find((p) => p.id === this.ball.ownerId) || user;
      const dir = this.getAttackDir(owner.team);
      const goalX = dir === 1 ? PITCH_GEO.pitchX + PITCH_GEO.pitchW : PITCH_GEO.pitchX;
      const aimOffsetY = Math.hypot(this.moveInput.x, this.moveInput.y) > 0.2
        ? PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2 + this.moveInput.y * (PITCH_GEO.goalH * 0.45)
        : this.aimWorldY;
      this.phase = 'PLAYING';
      this.phaseTimer = 0;
      this.setPieceTeam = null;
      this.executeShot(owner, goalX, aimOffsetY, Math.max(0.55, this.shotCharge));
      return;
    }

    if (this.phase !== 'PLAYING') return;

    const power = Math.max(0.4, this.shotCharge);
    const canFirstTimeStrike =
      !this.ball.ownerId &&
      dist(user.x, user.y, this.ball.x, this.ball.y) < 42 &&
      this.ball.z < 30;

    if (this.ball.ownerId === user.id || canFirstTimeStrike) {
      this.shootQueueTimer = 0;
      this.executeShot(user, this.aimWorldX, this.aimWorldY, power);
    } else {
      this.shootQueueTimer = 0.38;
      this.queuedShotPower = power;
      this.queuedShotAimY = this.aimWorldY;
    }
  }

  public skipCelebration() {
    if (this.phase === 'GOAL_REPLAY') {
      this.finishReplayToKickoff();
      return;
    }
    if (this.phase !== 'GOAL_CELEBRATION') return;
    if (this.hasGoalReplayReady && this.replayBuffer.length > 24) {
      this.startGoalReplay();
    } else {
      this.finishReplayToKickoff();
    }
  }

  public startGoalReplayNow() {
    if (this.replayBuffer.length > 18) {
      this.startGoalReplay();
    }
  }

  private startGoalReplay() {
    this.replayPlaybackFrames = this.replayBuffer.slice(-90);
    this.replayCursor = 0;
    this.phase = 'GOAL_REPLAY';
    this.phaseTimer = 2.6;
    this.eventBanner = 'REPLAY DO GOL';
    this.eventTone = 'info';
    this.bannerTimer = 2.5;
  }

  private finishReplayToKickoff() {
    this.phaseTimer = 0;
    this.hasGoalReplayReady = false;
    this.resetKickoff(this.replayPendingKickoffSide);
    soundEngine.play('whistle');
  }

  private evaluateOffsidePass(passer: SimPlayer, target: SimPlayer) {
    this.pendingOffsideIds.clear();
    const g = PITCH_GEO;
    const midX = g.pitchX + g.pitchW / 2;
    const dir = this.getAttackDir(passer.team);

    // Must be in opponent half & forward pass
    const inOppHalf = dir === 1 ? target.x > midX + 6 : target.x < midX - 6;
    const isForward = (target.x - passer.x) * dir > 18;
    if (!inOppHalf || !isForward) return;

    const opps = this.players
      .filter((o) => o.team !== passer.team && !o.redCard)
      .map((o) => o.x * dir)
      .sort((a, b) => b - a);
    const secondLastOppDirX = opps.length >= 2 ? opps[1] : opps[0] ?? g.pitchX * dir;

    const targetDirX = target.x * dir;
    const ballDirX = this.ball.x * dir;
    if (targetDirX > ballDirX + 10 && targetDirX > secondLastOppDirX + 12) {
      this.pendingOffsideIds.add(target.id);
    }
  }

  public executePass(passer: SimPlayer, target: SimPlayer, throughBall = false) {
    this.evaluateOffsidePass(passer, target);

    const d = dist(passer.x, passer.y, target.x, target.y);
    const dir = this.getAttackDir(passer.team);
    const leadTime = Math.min(0.58, d / 520);
    const throughLead = throughBall ? dir * 64 : 0;
    const tx = target.x + target.vx * leadTime + throughLead;
    const ty = target.y + target.vy * leadTime;

    const baseAngle = Math.atan2(ty - passer.y, tx - passer.x);
    const hasMaestro = passer.traits.includes('Maestro de Passes');
    const decisionFactor = (passer.passStat * 0.7 + passer.decisionStat * 0.3 + (hasMaestro ? 6 : 0));
    const maxSpread = clamp((100 - decisionFactor) / 100, 0.03, 0.45) * 0.14;
    const angle = baseAngle + (Math.random() - 0.5) * maxSpread;
    const isLong = d > 270;
    const speed = clamp(
      295 + d * 0.95 + (passer.passStat - 60) * 1.6 + (hasMaestro ? 22 : 0) + (throughBall ? 65 : 0),
      285,
      695
    );

    this.ball.ownerId = null;
    this.ball.pickupLockTimer = 0.14;
    this.ball.lastTouchTeam = passer.team;
    this.ball.lastTouchPlayerId = passer.id;
    this.ball.lastPasserId = passer.id;
    this.ball.wasShot = false;
    this.ball.vx = Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    this.ball.vz = isLong ? 120 : 16;
    passer.facingAngle = angle;
    passer.action = 'pass';
    passer.actionTimer = 0.25;

    if (passer.isUser) {
      this.giveAndGoMateId = target.id;
      this.giveAndGoTimer = 1.4;
    }

    if (passer.team === 'home') this.teamPassesHome += 1;
    else this.teamPassesAway += 1;
    this.shiftMomentum(passer.team, 2.5);

    soundEngine.play('pass');
  }

  public executeShot(shooter: SimPlayer, targetX: number, targetY: number, power01: number) {
    const g = PITCH_GEO;
    const dir = this.getAttackDir(shooter.team);
    const goalX = dir === 1 ? g.pitchX + g.pitchW : g.pitchX;
    const midY = g.pitchY + g.pitchH / 2;

    let aimY = clamp(targetY, midY - g.goalH * 0.62, midY + g.goalH * 0.62);
    if (shooter.isUser && this.settings.aimAssist) {
      const oppGk = this.players.find((p) => p.team !== shooter.team && p.isGoalkeeper);
      if (oppGk) {
        const cornerBias = oppGk.y >= midY ? midY - g.goalH * 0.36 : midY + g.goalH * 0.36;
        aimY = aimY * 0.65 + cornerBias * 0.35;
      }
    }

    const baseAngle = Math.atan2(aimY - shooter.y, goalX - shooter.x);
    const isAerialStrike = this.ball.z > 10;
    const nearestDefDist = this.players
      .filter((o) => o.team !== shooter.team && !o.redCard && !o.isGoalkeeper)
      .reduce((minD, o) => Math.min(minD, dist(o.x, o.y, shooter.x, shooter.y)), 999);
    const underPressure = nearestDefDist < 48;
    const hasColdTrait = shooter.traits.includes('Artilheiro Frio');

    // Dominant foot alignment bonus when shooting across body vs natural side
    const dyGoal = aimY - shooter.y;
    const footAligned =
      shooter.gear.dominantFoot === 'Ambidestro' ||
      (shooter.gear.dominantFoot === 'Direito' && ((dir === 1 && dyGoal <= 16) || (dir === -1 && dyGoal >= -16))) ||
      (shooter.gear.dominantFoot === 'Esquerdo' && ((dir === 1 && dyGoal >= -16) || (dir === -1 && dyGoal <= 16)));

    const effectiveAccuracy =
      shooter.shootStat * 0.72 +
      (isAerialStrike ? shooter.volleyStat * 0.28 : shooter.composureStat * 0.28) +
      (hasColdTrait ? 6 : 0) +
      (footAligned ? 4 : -2) -
      (underPressure ? Math.max(0, (75 - shooter.composureStat) * 0.25) : 0);

    const spread = clamp((100 - effectiveAccuracy) / 100, 0.04, 0.55) * 0.2;
    const angle = baseAngle + (Math.random() - 0.5) * spread;
    const pwr = clamp(power01, 0.35, 1.0);
    const isPowerShot = pwr >= 0.78;
    const aerialBoost = isAerialStrike ? 1 + Math.max(0, (shooter.volleyStat + shooter.jumpStat - 120) * 0.0014) : 1;
    const speed =
      (475 + pwr * 295 + (shooter.shootStat - 60) * 2.2) *
      (isPowerShot ? 1.08 : 1.0) *
      aerialBoost;

    this.pendingOffsideIds.clear();
    this.ball.ownerId = null;
    this.ball.pickupLockTimer = 0.18;
    this.ball.lastTouchTeam = shooter.team;
    this.ball.lastTouchPlayerId = shooter.id;
    this.ball.wasShot = true;
    this.ball.vx = Math.cos(angle) * speed;
    this.ball.vy = Math.sin(angle) * speed;
    this.ball.vz = pwr < 0.55 ? 24 : 42 + pwr * 82;
    shooter.facingAngle = angle;
    shooter.action = this.ball.z > 14 ? 'header' : 'kick';
    shooter.actionTimer = 0.35;
    this.cameraFlashTimer = Math.max(this.cameraFlashTimer, 0.55);

    if (isPowerShot) {
      this.powerShotTimer = 0.85;
      this.shotShockwave = { x: shooter.x, y: shooter.y, timer: 0.35 };
      this.shakeTimer = Math.max(this.shakeTimer, 0.12);
      for (let i = 0; i < 8; i++) {
        const sa = angle + Math.PI + (Math.random() - 0.5) * 1.1;
        this.particles.push({
          x: this.ball.x,
          y: this.ball.y,
          vx: Math.cos(sa) * (80 + Math.random() * 80),
          vy: Math.sin(sa) * (80 + Math.random() * 80),
          color: i % 2 === 0 ? '#FACC15' : '#FB923C',
          life: 0.35,
          size: 3,
        });
      }
    }

    if (shooter.team === 'home') this.teamShotsHome += 1;
    else this.teamShotsAway += 1;
    this.shiftMomentum(shooter.team, isPowerShot ? 12 : 8);

    if (shooter.isUser) {
      this.stats.shots += 1;
      if (Math.abs(aimY - midY) <= g.goalH / 2 + 12) {
        this.stats.shotsOnTarget += 1;
      }
    }

    this.setCrowdMood('excited', 2.0);
    soundEngine.play('kick');
    soundEngine.play('crowdOoh');
  }

  private setCrowdMood(mood: CrowdMood, duration: number) {
    this.crowdMood = mood;
    this.moodTimer = duration;
  }

  private addScuffMark(x: number, y: number, angle: number, length: number, kind: 'slide' | 'scuff') {
    this.scuffMarks.push({ x, y, angle, length, alpha: 1, kind });
    if (this.scuffMarks.length > 42) this.scuffMarks.shift();
  }

  private spawnTurfParticles(x: number, y: number, count: number) {
    const isRain = this.env.weather === 'Chuva fraca' || this.env.weather === 'Chuva forte';
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 65,
        vy: -15 - Math.random() * 45,
        color: isRain ? '#BAE6FD' : i % 2 === 0 ? '#22C55E' : '#78350F',
        life: 0.35 + Math.random() * 0.25,
        size: 3,
      });
    }
  }

  public isKnockoutCompetition(): boolean {
    const c = this.env.competitionName;
    return (
      c.includes('Copa') ||
      c.includes('Supercopa') ||
      c.includes('Final') ||
      c.includes('Semifinal') ||
      c.includes('Quartas') ||
      c.includes('Oitavas')
    );
  }

  public submitPenaltyChoice(dir: 'left' | 'center' | 'right') {
    if (this.phase !== 'PENALTY_SHOOTOUT' || this.penStep !== 'WAIT_USER') return;
    this.penAimDir = dir;
    this.launchPenaltyKick();
  }

  private setupNextPenaltyKick() {
    const g = PITCH_GEO;
    const goalX = g.pitchX + g.pitchW;
    const midY = g.pitchY + g.pitchH / 2;

    this.ball.x = goalX - 112;
    this.ball.y = midY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.ball.ownerId = null;

    const shooterTeam = this.penTurn;
    const gkTeam = shooterTeam === 'home' ? 'away' : 'home';

    this.players.forEach((p) => {
      if (p.isGoalkeeper && p.team === gkTeam) {
        p.x = goalX - 8;
        p.y = midY;
        p.facingAngle = Math.PI;
        p.action = 'idle';
      } else if (p.isUser && p.team === shooterTeam && this.penKicksHome.length === 0 && shooterTeam === this.userTeam) {
        p.x = goalX - 134;
        p.y = midY;
        p.facingAngle = 0;
        p.action = 'idle';
      } else {
        p.x = g.pitchX + g.pitchW * 0.5 + (Math.random() - 0.5) * 60;
        p.y = midY + (Math.random() - 0.5) * 140;
        p.facingAngle = 0;
        p.action = 'idle';
      }
    });

    const isUserTurn =
      (this.penTurn === this.userTeam) ||
      (this.userTeam !== this.penTurn); // User directs kicker OR directs their GK!
    this.penStep = isUserTurn ? 'WAIT_USER' : 'BALL_FLIGHT';
    this.penTimer = 2.5;
    this.camX = goalX - 140;
    this.camY = midY;
  }

  private launchPenaltyKick() {
    const g = PITCH_GEO;
    const goalX = g.pitchX + g.pitchW;
    const midY = g.pitchY + g.pitchH / 2;

    const userIsKicking = this.penTurn === this.userTeam;
    const dirs: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const kickChoice = userIsKicking
      ? this.penAimDir
      : dirs[Math.floor(Math.random() * 3)];
    const gkChoice = !userIsKicking
      ? this.penAimDir
      : dirs[Math.floor(Math.random() * 3)];

    const offsetMap = { left: -g.goalH * 0.36, center: 0, right: g.goalH * 0.36 };
    const targetY = midY + offsetMap[kickChoice] + (Math.random() - 0.5) * 12;
    this.penGkTargetY = midY + offsetMap[gkChoice];

    const ang = Math.atan2(targetY - this.ball.y, goalX - this.ball.x);
    this.ball.vx = Math.cos(ang) * 560;
    this.ball.vy = Math.sin(ang) * 560;
    this.ball.vz = 32;
    this.penStep = 'BALL_FLIGHT';
    this.penTimer = 0.72;
    soundEngine.play('kick');
  }

  private stepPenaltyShootout(dt: number) {
    const g = PITCH_GEO;
    const goalX = g.pitchX + g.pitchW;
    const midY = g.pitchY + g.pitchH / 2;
    const gkTeam = this.penTurn === 'home' ? 'away' : 'home';
    const gk = this.players.find((p) => p.team === gkTeam && p.isGoalkeeper);

    if (this.penStep === 'WAIT_USER') {
      this.penTimer -= dt;
      if (this.penTimer <= 0) {
        this.launchPenaltyKick();
      }
      return;
    }

    if (this.penStep === 'BALL_FLIGHT') {
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;
      this.ball.spin += 12 * dt;
      if (gk) {
        gk.y += (this.penGkTargetY - gk.y) * Math.min(1, dt * 8);
        gk.action = Math.abs(this.penGkTargetY - midY) > 12 ? 'dive' : 'idle';
      }
      this.penTimer -= dt;

      const gkCaught = gk && dist(gk.x, gk.y, this.ball.x, this.ball.y) < 22;
      const crossedLine = this.ball.x >= goalX;

      if (gkCaught || crossedLine || this.penTimer <= 0) {
        const saved = gkCaught || (gk && Math.abs(gk.y - this.ball.y) < 19);
        const onFrame = Math.abs(this.ball.y - midY) < g.goalH / 2 - 4;
        const isGoal = !saved && onFrame;
        this.penLastWasGoal = isGoal;

        if (this.penTurn === 'home') {
          this.penKicksHome.push(isGoal ? 'G' : 'M');
          if (isGoal) this.penHomeScore += 1;
        } else {
          this.penKicksAway.push(isGoal ? 'G' : 'M');
          if (isGoal) this.penAwayScore += 1;
        }

        if (isGoal) {
          this.netRippleRight = 1.2;
          this.cameraFlashTimer = 0.8;
          this.eventBanner = 'GOL DE PÊNALTI!';
          this.eventTone = 'goal';
          soundEngine.play('net');
          soundEngine.play('goalRoar');
        } else {
          this.eventBanner = 'DEFENDEU O GOLEIRO!';
          this.eventTone = 'save';
          soundEngine.play('applause');
        }
        this.bannerTimer = 1.6;
        this.penStep = 'RESULT_PAUSE';
        this.penTimer = 1.25;
      }
      return;
    }

    if (this.penStep === 'RESULT_PAUSE') {
      this.penTimer -= dt;
      if (this.penTimer <= 0) {
        // Check if shootout is mathematically decided
        const hCount = this.penKicksHome.length;
        const aCount = this.penKicksAway.length;
        let winnerDecided = false;

        if (hCount <= 5 && aCount <= 5) {
          const hRem = 5 - hCount;
          const aRem = 5 - aCount;
          if (this.penHomeScore > this.penAwayScore + aRem) winnerDecided = true;
          if (this.penAwayScore > this.penHomeScore + hRem) winnerDecided = true;
        }
        if (hCount >= 5 && hCount === aCount && this.penHomeScore !== this.penAwayScore) {
          winnerDecided = true;
        }

        if (winnerDecided) {
          const penWinner: 'home' | 'away' =
            this.penHomeScore > this.penAwayScore ? 'home' : 'away';
          // Add tiebreaker reflection to final score banner while preserving regulation score + pen score
          this.phase = 'FULLTIME';
          const userWon = penWinner === this.userTeam;
          this.eventBanner = userWon
            ? `CAMPEÃO NOS PÊNALTIS (${this.penHomeScore}x${this.penAwayScore})!`
            : `FIM NOS PÊNALTIS (${this.penHomeScore}x${this.penAwayScore})`;
          this.eventTone = userWon ? 'goal' : 'info';
          this.bannerTimer = 5;
          this.stats.minutesPlayed = 90;
          if (penWinner === 'home') this.setCrowdMood('celebrating_victory', 6.0);
          soundEngine.play('whistleLong');
          return;
        }

        this.penTurn = this.penTurn === 'home' ? 'away' : 'home';
        if (this.penTurn === 'home') this.penRound += 1;
        this.setupNextPenaltyKick();
      }
    }
  }

  public step(rawDt: number) {
    if (this.paused || this.phase === 'HALFTIME' || this.phase === 'FULLTIME') return;
    const dt = Math.min(rawDt, 0.05);
    this.totalTime += dt;

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.eventBanner = null;
    }
    if (this.moodTimer > 0) {
      this.moodTimer -= dt;
      if (this.moodTimer <= 0) this.crowdMood = 'calm';
    }
    if (this.highlightTimer > 0) this.highlightTimer -= dt;
    if (this.giveAndGoTimer > 0) {
      this.giveAndGoTimer -= dt;
      if (this.giveAndGoTimer <= 0) this.giveAndGoMateId = null;
    }
    if (this.powerShotTimer > 0) this.powerShotTimer = Math.max(0, this.powerShotTimer - dt);
    if (this.advantageTimer > 0) this.advantageTimer = Math.max(0, this.advantageTimer - dt);
    if (this.offsideLineTimer > 0) {
      this.offsideLineTimer = Math.max(0, this.offsideLineTimer - dt);
      if (this.offsideLineTimer <= 0) this.offsideLineX = null;
    }
    if (this.shotShockwave.timer > 0) this.shotShockwave.timer = Math.max(0, this.shotShockwave.timer - dt);
    this.momentum *= Math.pow(0.96, dt * 60 * 0.08);
    if (this.shootQueueTimer > 0) this.shootQueueTimer = Math.max(0, this.shootQueueTimer - dt);
    if (this.passQueueTimer > 0) this.passQueueTimer = Math.max(0, this.passQueueTimer - dt);
    if (this.callForPassPulseTimer > 0) this.callForPassPulseTimer = Math.max(0, this.callForPassPulseTimer - dt);
    if (this.userRequestedPassTimer > 0) this.userRequestedPassTimer = Math.max(0, this.userRequestedPassTimer - dt);
    if (this.netRippleLeft > 0) this.netRippleLeft = Math.max(0, this.netRippleLeft - dt * 1.4);
    if (this.netRippleRight > 0) this.netRippleRight = Math.max(0, this.netRippleRight - dt * 1.4);
    if (this.goalExcitement > 0) this.goalExcitement = Math.max(0, this.goalExcitement - dt * 0.85);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    if (this.cameraFlashTimer > 0) this.cameraFlashTimer = Math.max(0, this.cameraFlashTimer - dt);
    if (this.fourthOfficialTimer > 0) {
      this.fourthOfficialTimer -= dt;
      if (this.fourthOfficialTimer <= 0) this.fourthOfficialText = '';
    }
    if (this.ref.cardTimer > 0) {
      this.ref.cardTimer -= dt;
      if (this.ref.cardTimer <= 0) this.ref.cardColor = null;
    }
    for (const lm of this.linesmen) {
      if (lm.flagTimer > 0) lm.flagTimer = Math.max(0, lm.flagTimer - dt);
    }
    if (this.footstepCooldown > 0) this.footstepCooldown -= dt;
    if (this.chantCooldown > 0) {
      this.chantCooldown -= dt;
    } else if (this.phase === 'PLAYING') {
      this.chantCooldown = 10 + Math.random() * 6;
      soundEngine.play(Math.random() > 0.35 ? 'crowdChant' : 'flagWave');
    }

    // Fade turf scuff marks gently
    for (let i = this.scuffMarks.length - 1; i >= 0; i--) {
      this.scuffMarks[i].alpha -= dt * 0.03;
      if (this.scuffMarks[i].alpha <= 0) this.scuffMarks.splice(i, 1);
    }

    // Fade ball speed trail
    for (let i = this.ballTrail.length - 1; i >= 0; i--) {
      this.ballTrail[i].alpha -= dt * 3.8;
      if (this.ballTrail[i].alpha <= 0) this.ballTrail.splice(i, 1);
    }

    this.particles = this.particles.filter((pt) => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.gravity) pt.vy += pt.gravity * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life -= dt;
      return pt.life > 0;
    });

    if (this.isAimingShot) {
      this.shotCharge = Math.min(1, this.shotCharge + dt * 1.15);
    }

    if (this.phase === 'PENALTY_SHOOTOUT') {
      this.stepPenaltyShootout(dt);
      return;
    }

    if (this.phase === 'GOAL_REPLAY') {
      this.phaseTimer -= dt;
      this.replayCursor += dt * 18; // ~0.55x slow motion replay
      const frameIdx = Math.min(
        this.replayPlaybackFrames.length - 1,
        Math.floor(this.replayCursor)
      );
      const rf = this.replayPlaybackFrames[frameIdx];
      if (rf) {
        this.ball.x = rf.ballX;
        this.ball.y = rf.ballY;
        this.ball.z = rf.ballZ;
        this.ball.spin = rf.ballSpin;
        this.camX = rf.camX;
        this.camY = rf.camY;
        this.ref.x = rf.refX;
        this.ref.y = rf.refY;
        this.ref.phase = rf.refPhase;
        for (const pf of rf.players) {
          const sp = this.players.find((pl) => pl.id === pf.id);
          if (sp) {
            sp.x = pf.x;
            sp.y = pf.y;
            sp.facingAngle = pf.facingAngle;
            sp.animPhase = pf.animPhase;
            sp.action = pf.action;
            sp.dribbleTimer = pf.dribbleTimer;
          }
        }
      }
      if (this.phaseTimer <= 0 || frameIdx >= this.replayPlaybackFrames.length - 1) {
        this.finishReplayToKickoff();
      }
      return;
    }

    if (this.phase === 'KICKOFF' || this.phase === 'SET_PIECE' || this.phase === 'GOAL_CELEBRATION') {
      this.phaseTimer -= dt;
      if (this.phase === 'GOAL_CELEBRATION') {
        this.celebrationRunElapsed += dt;
        const scorer = this.players.find((p) => p.id === this.celebrationScorerId);
        this.players.forEach((p) => {
          if (p.redCard) return;
          if (p.id === this.celebrationScorerId) {
            const dx = this.celebrationTarget.x - p.x;
            const dy = this.celebrationTarget.y - p.y;
            const d = Math.hypot(dx, dy);
            if (this.activeCelebrationAction === 'celebrate_slide') {
              if (this.celebrationRunElapsed < 1.05 && d > 28) {
                p.x += (dx / d) * 185 * dt;
                p.y += (dy / d) * 185 * dt;
                p.facingAngle = Math.atan2(dy, dx);
                p.action = 'celebrate_arms';
              } else if (this.celebrationRunElapsed < 2.15 && d > 10) {
                const slideSpd = Math.max(25, 130 * (1 - (this.celebrationRunElapsed - 1.05) / 1.1));
                p.x += (dx / d) * slideSpd * dt;
                p.y += (dy / d) * slideSpd * dt;
                p.facingAngle = Math.atan2(dy, dx);
                p.action = 'celebrate_slide';
                if (Math.random() < 0.35) this.addScuffMark(p.x, p.y + 6, p.facingAngle, 12, 'slide');
              } else {
                p.action = 'celebrate_slide';
              }
            } else if (d > 16 && this.celebrationRunElapsed < 1.25) {
              p.x += (dx / d) * 170 * dt;
              p.y += (dy / d) * 170 * dt;
              p.facingAngle = Math.atan2(dy, dx);
              p.action = 'celebrate_arms';
            } else {
              p.action = this.activeCelebrationAction;
            }
            p.animPhase += dt * 13;
          } else if (p.team === this.celebrationTeam && !p.isGoalkeeper && scorer) {
            const d = dist(p.x, p.y, scorer.x, scorer.y);
            if (d < 360 && d > 24) {
              const ang = Math.atan2(scorer.y - p.y, scorer.x - p.x);
              p.x += Math.cos(ang) * 145 * dt;
              p.y += Math.sin(ang) * 145 * dt;
              p.facingAngle = ang;
              p.action = 'celebrate_arms';
            } else if (d <= 24) {
              p.action =
                this.activeCelebrationAction === 'celebrate_hug' || Math.abs(p.number) % 2 === 0
                  ? 'celebrate_hug'
                  : 'celebrate_jump';
            }
            p.animPhase += dt * 11;
          } else {
            p.action = 'idle';
            p.animPhase += dt * 2;
          }
        });

        if (this.phaseTimer <= 0) {
          if (this.hasGoalReplayReady && this.replayBuffer.length > 24) {
            this.startGoalReplay();
          } else {
            this.finishReplayToKickoff();
          }
        }
      } else if (this.phaseTimer <= 0) {
        this.phase = 'PLAYING';
        this.setPieceTeam = null;
        this.ball.pickupLockTimer = 0;
      }
      this.updateCamera(dt);
      return;
    }

    this.matchSeconds += dt * 36;
    const halfLimit = 2700 + this.addedTime * 60;

    if (this.matchSeconds >= 2620 && !this.fourthOfficialText) {
      this.fourthOfficialText = `+${this.addedTime}`;
      this.fourthOfficialTimer = 4.5;
    }

    // Real 2nd-half bench substitutions for both clubs
    if (this.half === 2 && !this.aiHomeSubDone && this.matchSeconds >= 1020) {
      this.aiHomeSubDone = true;
      this.performSubstitution('home');
    }
    if (this.half === 2 && !this.aiAwaySubDone && this.matchSeconds >= 1450) {
      this.aiAwaySubDone = true;
      this.performSubstitution('away');
    }

    if (this.matchSeconds >= halfLimit) {
      if (this.half === 1) {
        this.phase = 'HALFTIME';
        this.eventBanner = 'INTERVALO';
        this.eventTone = 'info';
        this.bannerTimer = 3;
        soundEngine.play('whistleLong');
      } else {
        // Check knockout tiebreaker -> interactive Penalty Shootout!
        if (this.homeScore === this.awayScore && this.isKnockoutCompetition()) {
          this.phase = 'PENALTY_SHOOTOUT';
          this.penKicksHome = [];
          this.penKicksAway = [];
          this.penHomeScore = 0;
          this.penAwayScore = 0;
          this.penTurn = this.userTeam;
          this.penRound = 1;
          this.eventBanner = 'DISPUTA DE PÊNALTIS!';
          this.eventTone = 'card';
          this.bannerTimer = 3;
          soundEngine.play('whistleLong');
          this.setupNextPenaltyKick();
          return;
        }

        this.phase = 'FULLTIME';
        const userWon =
          (this.userTeam === 'home' && this.homeScore > this.awayScore) ||
          (this.userTeam === 'away' && this.awayScore > this.homeScore);
        this.eventBanner = userWon ? 'VITÓRIA! FIM DE JOGO' : 'FIM DE JOGO';
        this.eventTone = userWon ? 'goal' : 'info';
        this.bannerTimer = 5;
        this.stats.minutesPlayed = 90;
        if (this.homeScore > this.awayScore) {
          this.setCrowdMood('celebrating_victory', 6.0);
          soundEngine.play('goalRoar');
          soundEngine.play('applause');
        }
        soundEngine.play('whistleLong');
      }
      return;
    }

    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    if (owner) {
      if (owner.team === 'home') this.possessionTicksHome += 1;
      else this.possessionTicksAway += 1;
    }

    for (const p of this.players) {
      if (p.redCard) continue;
      if (p.dribbleTimer > 0) p.dribbleTimer -= dt;
      if (p.tackleCooldown > 0) p.tackleCooldown -= dt;
      if (p.tackleLungeTimer > 0) p.tackleLungeTimer -= dt;
      if (p.diveTimer > 0) p.diveTimer -= dt;
      if (p.actionTimer > 0) p.actionTimer -= dt;

      if (p.isUser) {
        this.updateUserPlayer(p, dt);
      } else {
        this.updateAiPlayer(p, dt);
      }
    }

    this.resolvePlayerCollisions();
    this.updateBall(dt);

    // Track linesmen along top & bottom touchlines
    const g = PITCH_GEO;
    const targetLineX = clamp(this.ball.x, g.pitchX + 120, g.pitchX + g.pitchW - 120);
    this.linesmen.forEach((lm, idx) => {
      const dx = targetLineX - lm.x;
      if (Math.abs(dx) > 4) {
        lm.x += Math.sign(dx) * Math.min(Math.abs(dx), 145 * dt);
        lm.phase += dt * 7;
      }
      lm.y = idx === 0 ? g.pitchY - 8 : g.pitchY + g.pitchH + 8;
    });

    const refTargetX = clamp(this.ball.x - 45, g.pitchX + 80, g.pitchX + g.pitchW - 80);
    const refTargetY = clamp(this.ball.y - 65, g.pitchY + 60, g.pitchY + g.pitchH - 60);
    const rdx = refTargetX - this.ref.x;
    const rdy = refTargetY - this.ref.y;
    const rdist = Math.hypot(rdx, rdy);
    if (rdist > 8) {
      this.ref.x += (rdx / rdist) * Math.min(135 * dt, rdist);
      this.ref.y += (rdy / rdist) * Math.min(135 * dt, rdist);
      this.ref.phase += dt * 8;
    }

    this.updateCamera(dt);

    // Capture replay ring buffer (~30fps)
    this.replayCaptureAccum += dt;
    if (this.replayCaptureAccum >= 0.033) {
      this.replayCaptureAccum = 0;
      this.replayBuffer.push({
        ballX: this.ball.x,
        ballY: this.ball.y,
        ballZ: this.ball.z,
        ballSpin: this.ball.spin,
        camX: this.camX,
        camY: this.camY,
        refX: this.ref.x,
        refY: this.ref.y,
        refPhase: this.ref.phase,
        players: this.players.map((pl) => ({
          id: pl.id,
          x: pl.x,
          y: pl.y,
          facingAngle: pl.facingAngle,
          animPhase: pl.animPhase,
          action: pl.action,
          dribbleTimer: pl.dribbleTimer,
        })),
      });
      if (this.replayBuffer.length > 110) this.replayBuffer.shift();
    }
  }

  public resumeSecondHalf() {
    if (this.phase !== 'HALFTIME') return;
    this.half = 2;
    this.matchSeconds = 0;
    this.addedTime = 1 + Math.floor(Math.random() * 3);
    this.resetKickoff(this.userTeam === 'home' ? 'away' : 'home');
    this.eventBanner = '2º TEMPO';
    this.bannerTimer = 1.6;
    soundEngine.play('whistle');
  }

  private updateUserPlayer(p: SimPlayer, dt: number) {
    if (p.tackleLungeTimer > 0) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.animPhase += dt * 14;
      this.clampToArena(p);
      return;
    }
    if (p.diveTimer > 0) {
      p.y += p.diveVy * dt;
      this.clampToArena(p);
      return;
    }

    let ix = this.moveInput.x * this.settings.controlSensitivity;
    let iy = this.moveInput.y * this.settings.controlSensitivity;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    if (this.markHeld && mag < 0.15 && this.ball.ownerId !== p.id) {
      const ang = Math.atan2(this.ball.y - p.y, this.ball.x - p.x);
      ix = Math.cos(ang) * 0.85;
      iy = Math.sin(ang) * 0.85;
    }

    const sprinting = this.sprintHeld && p.stamina > 5 && Math.hypot(ix, iy) > 0.1;
    const dribbleBoost = p.dribbleTimer > 0 ? 1.28 : 1.0;
    const baseSpeed = 148 + (p.speedStat - 50) * 1.45;
    const maxSpeed = baseSpeed * (sprinting ? 1.36 : 1.0) * dribbleBoost * (this.ball.ownerId === p.id ? 0.94 : 1.0);

    if (sprinting) {
      p.stamina = Math.max(0, p.stamina - dt * 19);
      if (Math.random() < 0.25) this.spawnTurfParticles(p.x, p.y + 7, 1);
    } else {
      p.stamina = Math.min(100, p.stamina + dt * 13);
    }

    const accel = 580 + (p.accelStat - 50) * 6;
    const targetVx = ix * maxSpeed;
    const targetVy = iy * maxSpeed;
    p.vx += clamp(targetVx - p.vx, -accel * dt, accel * dt);
    p.vy += clamp(targetVy - p.vy, -accel * dt, accel * dt);

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    this.clampToArena(p);

    const curSpeed = Math.hypot(p.vx, p.vy);
    if (curSpeed > 15) {
      p.facingAngle = Math.atan2(p.vy, p.vx);
      p.animPhase += dt * (curSpeed * 0.065);
      if (p.actionTimer <= 0) {
        p.action = p.dribbleTimer > 0 ? 'dribble' : sprinting ? 'sprint' : curSpeed > 80 ? 'run' : 'walk';
      }
      if (this.footstepCooldown <= 0 && curSpeed > 120) {
        this.footstepCooldown = sprinting ? 0.24 : 0.34;
        soundEngine.play('footstep');
      }
    } else if (p.actionTimer <= 0) {
      p.action = 'idle';
    }
  }

  private updateAiPlayer(p: SimPlayer, dt: number) {
    const g = PITCH_GEO;
    const dir = this.getAttackDir(p.team);
    const hasBall = this.ball.ownerId === p.id;
    const owner = this.players.find((o) => o.id === this.ball.ownerId);
    const teamHasBall = owner?.team === p.team;

    // Gradual realistic AI stamina wear
    p.stamina = Math.max(18, p.stamina - dt * (hasBall ? 1.1 : 0.55));

    if (p.isGoalkeeper) {
      const goalLineX = dir === 1 ? g.pitchX + 26 : g.pitchX + g.pitchW - 26;
      const midY = g.pitchY + g.pitchH / 2;
      const targetY = clamp(
        midY + (this.ball.y - midY) * 0.44,
        midY - g.goalH * 0.46,
        midY + g.goalH * 0.46
      );

      if (hasBall) {
        p.aiDecisionTimer -= dt;
        if (p.aiDecisionTimer <= 0) {
          p.aiDecisionTimer = 0.5;
          const openMate = this.findBestPassTarget(p);
          if (openMate) this.executePass(p, openMate);
        }
        return;
      }

      const inOwnBox =
        dir === 1
          ? this.ball.x < g.pitchX + 150 && Math.abs(this.ball.y - midY) < 155
          : this.ball.x > g.pitchX + g.pitchW - 150 && Math.abs(this.ball.y - midY) < 155;

      const tx = inOwnBox && !this.ball.ownerId ? this.ball.x : goalLineX;
      const ty = inOwnBox && !this.ball.ownerId ? this.ball.y : targetY;
      const gkMoveSpeed = 132 + (p.gkStat * 0.6 + p.elasticityStat * 0.22);
      this.steerAiToward(p, tx, ty, gkMoveSpeed, dt);
      p.facingAngle = dir === 1 ? 0 : Math.PI;
      return;
    }

    if (hasBall) {
      // Priority 1-2 give-and-go return pass
      if (p.team === this.userTeam && this.giveAndGoMateId === p.id && this.giveAndGoTimer > 0) {
        this.giveAndGoMateId = null;
        this.giveAndGoTimer = 0;
        const user = this.getUserPlayer();
        if (!user.redCard) {
          this.executePass(p, user, true);
          return;
        }
      }

      if (p.team === this.userTeam && this.userRequestedPassTimer > 0) {
        this.userRequestedPassTimer = 0;
        const user = this.getUserPlayer();
        if (!user.redCard) {
          this.executePass(p, user, this.sprintHeld);
          return;
        }
      }
      p.aiDecisionTimer -= dt;
      const oppGoalX = dir === 1 ? g.pitchX + g.pitchW : g.pitchX;
      const oppGoalY = g.pitchY + g.pitchH / 2;
      const distToGoal = dist(p.x, p.y, oppGoalX, oppGoalY);
      const isWide = Math.abs(p.y - oppGoalY) > 190 && (p.x - oppGoalX) * dir > -240;

      if (p.aiDecisionTimer <= 0) {
        p.aiDecisionTimer = 0.24 + Math.random() * 0.24;

        if (distToGoal < 265 && Math.random() < 0.65) {
          const cornerY = oppGoalY + (Math.random() - 0.5) * (g.goalH * 0.76);
          this.executeShot(p, oppGoalX, cornerY, 0.72 + Math.random() * 0.22);
          return;
        }

        if (isWide && Math.random() < 0.55) {
          const striker = this.players.find(
            (m) => m.team === p.team && m.id !== p.id && !m.isGoalkeeper && Math.abs(m.y - oppGoalY) < 150
          );
          if (striker) {
            this.executePass(p, striker, true);
            return;
          }
        }

        const nearestOpp = this.players
          .filter((o) => o.team !== p.team && !o.redCard)
          .sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y))[0];

        const underPressure = nearestOpp && dist(nearestOpp.x, nearestOpp.y, p.x, p.y) < 78;
        if (underPressure || Math.random() < 0.36) {
          const mate = this.findBestPassTarget(p);
          if (mate) {
            this.executePass(p, mate, Math.random() < 0.3);
            return;
          }
        }
      }

      const tx = oppGoalX - dir * 115;
      const ty = clamp(
        p.y + Math.sin(this.totalTime * 2 + p.number) * 35,
        g.pitchY + 55,
        g.pitchY + g.pitchH - 55
      );
      this.steerAiToward(p, tx, ty, 138 + (p.speedStat - 50) * 1.15, dt);
      return;
    }

    // Apply live team tactic shift for user's team
    let tacticSlotShift = 0;
    let pressSlots = 1;
    if (p.team === this.userTeam) {
      if (this.userTactic === 'DEFENSIVO') tacticSlotShift = -0.11;
      else if (this.userTactic === 'OFENSIVO') tacticSlotShift = 0.11;
      else if (this.userTactic === 'PRESSAO_ALTA') {
        tacticSlotShift = 0.08;
        pressSlots = 2;
      }
    }

    const adjSlotX = clamp(p.homeSlotX + tacticSlotShift, 0.14, 0.88);
    const basePos = this.slotToWorld(p.team, adjSlotX, p.homeSlotY);
    const ballShiftX = (this.ball.x - (g.pitchX + g.pitchW / 2)) * (teamHasBall ? 0.38 : 0.28);
    const ballShiftY = (this.ball.y - (g.pitchY + g.pitchH / 2)) * 0.24;

    let tx = clamp(basePos.x + ballShiftX, g.pitchX + 35, g.pitchX + g.pitchW - 35);
    let ty = clamp(basePos.y + ballShiftY, g.pitchY + 35, g.pitchY + g.pitchH - 35);

    const pressCandidates = this.players
      .filter((m) => m.team === p.team && !m.isUser && !m.isGoalkeeper && !m.redCard)
      .sort((a, b) => dist(a.x, a.y, this.ball.x, this.ball.y) - dist(b.x, b.y, this.ball.x, this.ball.y));

    const isPresser = pressCandidates.slice(0, pressSlots).some((c) => c.id === p.id);

    if (!teamHasBall && isPresser) {
      tx = this.ball.x;
      ty = this.ball.y;
    } else if (teamHasBall && p.homeSlotX > 0.52) {
      tx = clamp(tx + dir * 60, g.pitchX + 40, g.pitchX + g.pitchW - 40);
    }

    // Anti-clumping teammate repulsion: keeps field spacing realistic & prevents midfield bunching
    for (const mate of this.players) {
      if (mate.team !== p.team || mate.id === p.id || mate.redCard || mate.isGoalkeeper) continue;
      const md = dist(p.x, p.y, mate.x, mate.y);
      if (md > 0 && md < 48) {
        const push = ((48 - md) / 48) * 38;
        tx += ((p.x - mate.x) / md) * push;
        ty += ((p.y - mate.y) / md) * push;
      }
    }
    tx = clamp(tx, g.pitchX + 30, g.pitchX + g.pitchW - 30);
    ty = clamp(ty, g.pitchY + 30, g.pitchY + g.pitchH - 30);

    const staminaMod = p.stamina < 30 ? 0.88 : 1.0;
    const posDiscipline = !teamHasBall ? 1 + (p.defPosStat - 60) * 0.0025 : 1 + (p.decisionStat - 60) * 0.002;
    const aiSpeed = (135 + (p.speedStat - 50) * 1.2) * (isPresser ? 1.1 : 0.96) * staminaMod * clamp(posDiscipline, 0.92, 1.12);
    this.steerAiToward(p, tx, ty, aiSpeed, dt);
  }

  private steerAiToward(p: SimPlayer, tx: number, ty: number, speed: number, dt: number) {
    const dx = tx - p.x;
    const dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 8) {
      const vx = (dx / d) * speed;
      const vy = (dy / d) * speed;
      p.vx += (vx - p.vx) * Math.min(1, dt * 8);
      p.vy += (vy - p.vy) * Math.min(1, dt * 8);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      this.clampToArena(p);
      p.facingAngle = Math.atan2(p.vy, p.vx);
      const spd = Math.hypot(p.vx, p.vy);
      p.animPhase += dt * (spd * 0.06);
      if (p.actionTimer <= 0) {
        p.action = spd > 165 ? 'sprint' : spd > 70 ? 'run' : 'walk';
      }
    } else {
      p.vx *= 0.85;
      p.vy *= 0.85;
      if (p.actionTimer <= 0) p.action = 'idle';
    }
  }

  private findBestPassTarget(passer: SimPlayer): SimPlayer | null {
    const dir = this.getAttackDir(passer.team);
    const mates = this.players.filter(
      (m) => m.team === passer.team && m.id !== passer.id && !m.isGoalkeeper && !m.redCard
    );
    let best: SimPlayer | null = null;
    let bestScore = -9999;

    for (const m of mates) {
      const d = dist(passer.x, passer.y, m.x, m.y);
      if (d < 45 || d > 480) continue;
      const forwardGain = (m.x - passer.x) * dir;
      const nearestEnemy = this.players
        .filter((o) => o.team !== passer.team && !o.redCard)
        .reduce((minD, o) => Math.min(minD, dist(o.x, o.y, m.x, m.y)), 999);

      const userBonus = m.isUser ? 60 : 0;
      const score = forwardGain * 0.65 + nearestEnemy * 1.1 - d * 0.24 + userBonus;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }
    return best;
  }

  private resolvePlayerCollisions() {
    const minSep = 20;
    for (let i = 0; i < this.players.length; i++) {
      const a = this.players[i];
      if (a.redCard) continue;
      for (let j = i + 1; j < this.players.length; j++) {
        const b = this.players[j];
        if (b.redCard) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < minSep) {
          const push = (minSep - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;

          if (a.team !== b.team) {
            this.checkTackleContest(a, b);
            this.checkTackleContest(b, a);
          }
        }
      }
    }
  }

  private checkTackleContest(tackler: SimPlayer, carrier: SimPlayer) {
    if (this.ball.ownerId !== carrier.id) return;
    if (carrier.dribbleTimer > 0.15) return;

    const activeLunge = tackler.tackleLungeTimer > 0;
    const stealChance = activeLunge ? 0.6 : 0.08;
    if (Math.random() > stealChance) return;

    if (activeLunge && Math.random() < 0.14) {
      // Referee Advantage Rule: if carrier keeps forward momentum in open play, wave advantage!
      const g = PITCH_GEO;
      const midY = g.pitchY + g.pitchH / 2;
      const dirCarrier = this.getAttackDir(carrier.team);
      const inBox =
        dirCarrier === 1
          ? carrier.x > g.pitchX + g.pitchW - 162 && Math.abs(carrier.y - midY) < 170
          : carrier.x < g.pitchX + 162 && Math.abs(carrier.y - midY) < 170;
      if (!inBox && Math.hypot(carrier.vx, carrier.vy) > 60 && Math.random() < 0.45) {
        this.advantageTimer = 1.6;
        this.eventBanner = 'SEGUE O JOGO · VANTAGEM!';
        this.eventTone = 'info';
        this.bannerTimer = 1.6;
        tackler.tackleCooldown = 1.0;
        return;
      }
      this.triggerFoul(tackler, carrier);
      return;
    }

    this.ball.ownerId = tackler.id;
    this.ball.pickupLockTimer = 0.25;
    this.ball.lastTouchTeam = tackler.team;
    this.ball.lastTouchPlayerId = tackler.id;
    this.shiftMomentum(tackler.team, 4);

    if (tackler.isUser) {
      this.stats.tackles += 1;
      this.rating = Math.min(10, this.rating + 0.18);
      tackler.matchRating = Math.min(10, tackler.matchRating + 0.18);
    }
    soundEngine.play('ball');
  }

  private formDefensiveWall(spotX: number, spotY: number, attackingTeam: 'home' | 'away') {
    const g = PITCH_GEO;
    const dir = this.getAttackDir(attackingTeam);
    const goalX = dir === 1 ? g.pitchX + g.pitchW : g.pitchX;
    const goalY = g.pitchY + g.pitchH / 2;
    const distToGoal = dist(spotX, spotY, goalX, goalY);
    if (distToGoal > 340) return;

    const ang = Math.atan2(goalY - spotY, goalX - spotX);
    const wallCenterX = clamp(spotX + Math.cos(ang) * 92, g.pitchX + 35, g.pitchX + g.pitchW - 35);
    const wallCenterY = clamp(spotY + Math.sin(ang) * 92, g.pitchY + 35, g.pitchY + g.pitchH - 35);
    const perpX = -Math.sin(ang);
    const perpY = Math.cos(ang);

    const defenders = this.players
      .filter((p) => p.team !== attackingTeam && !p.isGoalkeeper && !p.redCard && !p.isUser)
      .slice(0, 3);
    defenders.forEach((def, idx) => {
      const offset = (idx - 1) * 18;
      def.x = clamp(wallCenterX + perpX * offset, g.pitchX + 20, g.pitchX + g.pitchW - 20);
      def.y = clamp(wallCenterY + perpY * offset, g.pitchY + 20, g.pitchY + g.pitchH - 20);
      def.vx = 0;
      def.vy = 0;
      def.facingAngle = ang + Math.PI;
    });
  }

  private triggerFoul(offender: SimPlayer, victim: SimPlayer) {
    const g = PITCH_GEO;
    const midY = g.pitchY + g.pitchH / 2;
    const dirVictim = this.getAttackDir(victim.team);
    const inOppBox =
      dirVictim === 1
        ? victim.x > g.pitchX + g.pitchW - 162 && Math.abs(victim.y - midY) < 170
        : victim.x < g.pitchX + 162 && Math.abs(victim.y - midY) < 170;

    if (offender.team === 'home') this.teamFoulsHome += 1;
    else this.teamFoulsAway += 1;

    soundEngine.play('whistle');
    soundEngine.play('crowdBoo');
    this.setCrowdMood('tense', 2.4);
    victim.action = 'fall';
    victim.actionTimer = 0.7;
    this.linesmen[0].flagTimer = 1.4;

    if (Math.random() < 0.35) {
      offender.yellowCards += 1;
      if (offender.isUser) this.stats.yellowCards += 1;
      if (offender.yellowCards >= 2) {
        offender.redCard = true;
        if (offender.isUser) this.stats.redCards += 1;
        this.ref.cardColor = 'red';
        this.ref.cardTimer = 1.7;
        this.eventBanner = `CARTÃO VERMELHO (${offender.name})`;
        this.eventTone = 'card';
        soundEngine.play('crowdBoo');
      } else {
        this.ref.cardColor = 'yellow';
        this.ref.cardTimer = 1.5;
        this.eventBanner = `CARTÃO AMARELO (${offender.name})`;
        this.eventTone = 'card';
      }
    } else {
      this.eventBanner = inOppBox ? 'PÊNALTI!' : 'FALTA PERIGOSA!';
      this.eventTone = inOppBox ? 'card' : 'info';
    }
    this.bannerTimer = 2.2;

    const spotX = inOppBox
      ? dirVictim === 1
        ? g.pitchX + g.pitchW - 112
        : g.pitchX + 112
      : victim.x;
    const spotY = inOppBox ? midY : victim.y;

    this.ball.ownerId = null;
    this.ball.x = spotX;
    this.ball.y = spotY;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;

    if (!inOppBox) {
      this.formDefensiveWall(spotX, spotY, victim.team);
    }

    this.phase = 'SET_PIECE';
    this.phaseTimer = 1.1;

    const kicker = victim.isUser
      ? victim
      : this.players.find((p) => p.team === victim.team && !p.redCard && !p.isGoalkeeper) || victim;
    kicker.x = spotX - dirVictim * 14;
    kicker.y = spotY;
    this.ball.ownerId = kicker.id;
  }

  private updateBall(dt: number) {
    const g = PITCH_GEO;
    if (this.ball.pickupLockTimer > 0) this.ball.pickupLockTimer -= dt;

    const isRain = this.env.weather === 'Chuva fraca' || this.env.weather === 'Chuva forte';

    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    if (owner) {
      const carryDist = 13;
      this.ball.x = owner.x + Math.cos(owner.facingAngle) * carryDist;
      this.ball.y = owner.y + Math.sin(owner.facingAngle) * carryDist;
      this.ball.z = 0;
      this.ball.vx = owner.vx;
      this.ball.vy = owner.vy;
      this.ball.spin += Math.hypot(owner.vx, owner.vy) * dt * 0.08;
      return;
    }

    // Record fast ball trail (golden for Power Shots!)
    const ballSpd = Math.hypot(this.ball.vx, this.ball.vy);
    if (ballSpd > 380) {
      this.ballTrail.push({
        x: this.ball.x,
        y: this.ball.y,
        z: this.ball.z,
        alpha: 0.92,
        isPower: this.powerShotTimer > 0,
      });
      if (this.ballTrail.length > 10) this.ballTrail.shift();
    }

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    this.ball.z = Math.max(0, this.ball.z + this.ball.vz * dt);
    if (this.ball.z > 0) {
      this.ball.vz -= 380 * dt;
      if (this.ball.z <= 0) {
        this.ball.z = 0;
        if (Math.abs(this.ball.vz) > 45) {
          this.ball.vz = -this.ball.vz * 0.42;
          soundEngine.play('ball');
          if (isRain && this.settings.environmentalEffects) {
            for (let i = 0; i < 6; i++) {
              this.particles.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: (Math.random() - 0.5) * 90,
                vy: (Math.random() - 0.5) * 90,
                color: '#BAE6FD',
                life: 0.35,
                size: 3,
              });
            }
          }
        } else {
          this.ball.vz = 0;
        }
      }
    }

    const groundDrag = isRain ? 0.976 : 0.968;
    const drag = this.ball.z > 2 ? 0.992 : groundDrag;
    const factor = Math.pow(drag, dt * 60);
    this.ball.vx *= factor;
    this.ball.vy *= factor;
    this.ball.spin += Math.hypot(this.ball.vx, this.ball.vy) * dt * 0.06;

    const midY = g.pitchY + g.pitchH / 2;
    const goalTop = midY - g.goalH / 2;
    const goalBot = midY + g.goalH / 2;

    if (
      Math.abs(this.ball.x - g.pitchX) < 10 &&
      (Math.abs(this.ball.y - goalTop) < 8 || Math.abs(this.ball.y - goalBot) < 8)
    ) {
      this.ball.vx = Math.abs(this.ball.vx) * 0.7;
      this.ball.vy *= -0.7;
      this.spawnPostSparks(g.pitchX, this.ball.y);
      soundEngine.play('post');
      soundEngine.play('crowdOoh');
      this.setCrowdMood('tense', 2.0);
      this.eventBanner = 'NA TRAVE!';
      this.eventTone = 'save';
      this.bannerTimer = 1.6;
      this.shakeTimer = 0.28;
    }
    if (
      Math.abs(this.ball.x - (g.pitchX + g.pitchW)) < 10 &&
      (Math.abs(this.ball.y - goalTop) < 8 || Math.abs(this.ball.y - goalBot) < 8)
    ) {
      this.ball.vx = -Math.abs(this.ball.vx) * 0.7;
      this.ball.vy *= -0.7;
      this.spawnPostSparks(g.pitchX + g.pitchW, this.ball.y);
      soundEngine.play('post');
      soundEngine.play('crowdOoh');
      this.setCrowdMood('tense', 2.0);
      this.eventBanner = 'NA TRAVE!';
      this.eventTone = 'save';
      this.bannerTimer = 1.6;
      this.shakeTimer = 0.28;
    }

    if (this.ball.x < g.pitchX && this.ball.y > goalTop + 4 && this.ball.y < goalBot - 4) {
      const attackingTeam = this.getAttackDir('home') === -1 ? 'home' : 'away';
      this.scoreGoal(attackingTeam, 'left');
      return;
    }
    if (this.ball.x > g.pitchX + g.pitchW && this.ball.y > goalTop + 4 && this.ball.y < goalBot - 4) {
      const attackingTeam = this.getAttackDir('home') === 1 ? 'home' : 'away';
      this.scoreGoal(attackingTeam, 'right');
      return;
    }

    if (this.ball.y < g.pitchY || this.ball.y > g.pitchY + g.pitchH) {
      const restartTeam = this.ball.lastTouchTeam === 'home' ? 'away' : 'home';
      const clampedY = this.ball.y < g.pitchY ? g.pitchY + 6 : g.pitchY + g.pitchH - 6;
      this.linesmen[this.ball.y < g.pitchY ? 0 : 1].flagTimer = 1.1;
      this.triggerRestart(
        'LATERAL',
        restartTeam,
        clamp(this.ball.x, g.pitchX + 20, g.pitchX + g.pitchW - 20),
        clampedY
      );
      return;
    }
    if (this.ball.x < g.pitchX || this.ball.x > g.pitchX + g.pitchW) {
      const leftSideDefendingTeam = this.getAttackDir('home') === 1 ? 'home' : 'away';
      const defendingTeam =
        this.ball.x < g.pitchX
          ? leftSideDefendingTeam
          : leftSideDefendingTeam === 'home'
          ? 'away'
          : 'home';
      const attackingTeam = defendingTeam === 'home' ? 'away' : 'home';

      if (this.ball.lastTouchTeam === defendingTeam) {
        if (attackingTeam === 'home') this.teamCornersHome += 1;
        else this.teamCornersAway += 1;
        const cx = this.ball.x < g.pitchX ? g.pitchX + 10 : g.pitchX + g.pitchW - 10;
        const cy = this.ball.y < midY ? g.pitchY + 10 : g.pitchY + g.pitchH - 10;
        this.linesmen[this.ball.y < midY ? 0 : 1].flagTimer = 1.2;
        this.triggerRestart('ESCANTEIO', attackingTeam, cx, cy);
      } else {
        const gx = this.ball.x < g.pitchX ? g.pitchX + 52 : g.pitchX + g.pitchW - 52;
        this.triggerRestart('TIRO DE META', defendingTeam, gx, midY);
      }
      return;
    }

    if (this.ball.pickupLockTimer <= 0 && this.ball.z < 28) {
      for (const p of this.players) {
        if (p.redCard) continue;
        const gkReachBonus = (p.elasticityStat - 60) * 0.12 + (p.traits.includes('Gato Sob as Traves') ? 2.5 : 0);
        const reach = p.isGoalkeeper
          ? clamp(23 + gkReachBonus, 21, 30)
          : 17 + (this.ball.z > 12 ? clamp((p.jumpStat - 60) * 0.08, 0, 3.5) : 0);
        if (dist(p.x, p.y, this.ball.x, this.ball.y) < reach) {
          // Real Offside check + Crisp Offside Line Flash
          if (this.pendingOffsideIds.has(p.id)) {
            this.pendingOffsideIds.clear();
            this.offsideLineX = p.x;
            this.offsideLineTimer = 1.6;
            const defendingTeam: 'home' | 'away' = p.team === 'home' ? 'away' : 'home';
            if (p.team === 'home') this.teamOffsidesHome += 1;
            else this.teamOffsidesAway += 1;
            this.linesmen[p.y < midY ? 0 : 1].flagTimer = 1.9;
            this.triggerRestart('IMPEDIMENTO!', defendingTeam, p.x, p.y);
            return;
          }
          this.pendingOffsideIds.clear();

          if (this.ball.lastPasserId === 'user_player') {
            if (p.team === this.userTeam && p.id !== 'user_player') {
              this.stats.passesCompleted += 1;
              this.rating = Math.min(10, this.rating + 0.05);
            } else if (p.team !== this.userTeam) {
              this.stats.passesMissed += 1;
            }
            this.ball.lastPasserId = null;
          }
          if (p.isUser && this.ball.lastTouchTeam && this.ball.lastTouchTeam !== p.team) {
            this.stats.interceptions += 1;
            this.rating = Math.min(10, this.rating + 0.14);
          }
          if (p.isGoalkeeper && this.ball.wasShot) {
            if (p.isUser) {
              this.stats.saves += 1;
              this.rating = Math.min(10, this.rating + 0.35);
            }
            p.matchRating = Math.min(10, p.matchRating + 0.25);
            p.action = 'dive';
            p.actionTimer = 0.42;
            this.cameraFlashTimer = Math.max(this.cameraFlashTimer, 0.5);
            this.eventBanner = `DEFESAÇA! ${p.name}`;
            this.eventTone = 'save';
            this.bannerTimer = 1.5;
            this.setCrowdMood('excited', 1.8);
            soundEngine.play('applause');
            soundEngine.play('crowd');
          } else if (this.ball.z > 14 && !p.isGoalkeeper) {
            p.action = 'header';
            p.actionTimer = 0.32;
            this.spawnTurfParticles(p.x, p.y - 14, 4);
          }

          this.ball.ownerId = p.id;
          this.ball.wasShot = false;
          this.ball.lastTouchTeam = p.team;
          this.ball.lastTouchPlayerId = p.id;
          soundEngine.play('ball');

          if (p.isUser) {
            if (this.shootQueueTimer > 0) {
              this.shootQueueTimer = 0;
              const dir = this.getAttackDir(p.team);
              const goalX = dir === 1 ? g.pitchX + g.pitchW : g.pitchX;
              const aimY = this.queuedShotAimY ?? g.pitchY + g.pitchH / 2;
              this.executeShot(p, goalX, aimY, this.queuedShotPower);
            } else if (this.passQueueTimer > 0) {
              this.passQueueTimer = 0;
              const mate = this.findBestUserPassTarget(p);
              if (mate) this.executePass(p, mate, this.sprintHeld);
            }
          }
          break;
        }
      }
    }
  }

  private spawnPostSparks(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: i % 2 === 0 ? '#FEF08A' : '#FFFFFF',
        life: 0.45,
        size: 3,
      });
    }
  }

  private triggerRestart(label: string, team: 'home' | 'away', x: number, y: number) {
    soundEngine.play('whistle');
    this.eventBanner = label;
    this.eventTone = label === 'IMPEDIMENTO!' ? 'card' : 'info';
    this.bannerTimer = 1.4;
    this.ball.x = x;
    this.ball.y = y;
    this.ball.z = 0;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;

    const taker =
      label === 'TIRO DE META'
        ? this.players.find((p) => p.team === team && p.isGoalkeeper)
        : this.players.find((p) => p.team === team && !p.redCard && !p.isGoalkeeper);
    if (taker) {
      taker.x = x;
      taker.y = y;
      this.ball.ownerId = taker.id;
    }

    this.phase = 'SET_PIECE';
    this.setPieceTeam = team;
    this.phaseTimer = team === this.userTeam ? 1.55 : 0.75;
  }

  private scoreGoal(scoringTeam: 'home' | 'away', netSide: 'left' | 'right') {
    const prevHome = this.homeScore;
    const prevAway = this.awayScore;
    if (scoringTeam === 'home') this.homeScore += 1;
    else this.awayScore += 1;

    if (netSide === 'left') {
      this.netRippleLeft = 1.35;
      this.netImpactLeftY = this.ball.y;
    } else {
      this.netRippleRight = 1.35;
      this.netImpactRightY = this.ball.y;
    }
    this.shiftMomentum(scoringTeam, 35);

    const rawMinute = Math.floor(this.matchSeconds / 60) + (this.half === 2 ? 45 : 0);
    const isLate = rawMinute >= 80;
    const isFinal =
      this.env.competitionName.includes('Final') || this.env.competitionName.includes('Supercopa');
    const isEqualizer = this.homeScore === this.awayScore;
    const isComeback =
      (scoringTeam === 'home' && prevHome <= prevAway && this.homeScore > this.awayScore && prevAway > 0) ||
      (scoringTeam === 'away' && prevAway <= prevHome && this.awayScore > this.homeScore && prevHome > 0);

    this.goalExcitement = isFinal || isLate ? 4.2 : 3.4;
    this.setCrowdMood(scoringTeam === 'home' ? 'goal_home' : 'goal_away', 3.8);
    this.shakeTimer = 0.4;
    this.cameraFlashTimer = 1.4;
    this.ball.vx *= 0.15;
    this.ball.vy *= 0.15;
    this.ball.ownerId = null;

    if (this.ball.lastTouchPlayerId === 'user_player') {
      this.stats.goals += 1;
      this.rating = Math.min(10, this.rating + 1.1);
    } else if (this.ball.lastPasserId === 'user_player' && scoringTeam === this.userTeam) {
      this.stats.assists += 1;
      this.rating = Math.min(10, this.rating + 0.65);
    }

    const scorer =
      this.players.find((p) => p.id === this.ball.lastTouchPlayerId) ||
      this.players.find((p) => p.team === scoringTeam && !p.isGoalkeeper && !p.redCard) ||
      this.players[0];
    scorer.matchRating = Math.min(10, scorer.matchRating + 1.1);

    this.celebrationScorerId = scorer.id;
    this.celebrationScorerName = scorer.name;
    this.celebrationTeam = scoringTeam;
    this.celebrationRunElapsed = 0;

    const CELEBRATION_ACTION_MAP: Record<string, PlayerAnimAction> = {
      arms_open: 'celebrate_arms',
      run_crowd: 'celebrate_crowd',
      point_sky: 'celebrate_sky',
      jump_fist: 'celebrate_jump',
      knee_slide: 'celebrate_slide',
      dance: 'celebrate_dance',
      jersey_show: 'celebrate_shirt',
      group_hug: 'celebrate_hug',
    };
    const allCelebs = Object.keys(CELEBRATION_ACTION_MAP);
    const chosenId = scorer.isUser
      ? this.career.gear.celebrationId || 'knee_slide'
      : allCelebs[(scorer.number + Math.floor(this.matchSeconds)) % allCelebs.length];
    this.activeCelebrationAction = CELEBRATION_ACTION_MAP[chosenId] || 'celebrate_arms';

    const cornerX =
      netSide === 'right'
        ? PITCH_GEO.pitchX + PITCH_GEO.pitchW - 28
        : PITCH_GEO.pitchX + 28;
    const cornerY =
      scorer.y < PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2
        ? PITCH_GEO.pitchY + 24
        : PITCH_GEO.pitchY + PITCH_GEO.pitchH - 24;

    if (this.activeCelebrationAction === 'celebrate_slide') {
      this.celebrationTarget = { x: cornerX, y: cornerY };
    } else if (this.activeCelebrationAction === 'celebrate_crowd') {
      this.celebrationTarget = {
        x: clamp(
          scorer.x + (netSide === 'right' ? 60 : -60),
          PITCH_GEO.pitchX + 90,
          PITCH_GEO.pitchX + PITCH_GEO.pitchW - 90
        ),
        y:
          scorer.y < PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2
            ? PITCH_GEO.pitchY + 12
            : PITCH_GEO.pitchY + PITCH_GEO.pitchH - 12,
      };
    } else if (this.activeCelebrationAction === 'celebrate_hug') {
      this.celebrationTarget = {
        x: clamp(
          scorer.x + (netSide === 'right' ? -70 : 70),
          PITCH_GEO.pitchX + 120,
          PITCH_GEO.pitchX + PITCH_GEO.pitchW - 120
        ),
        y: PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2,
      };
    } else {
      this.celebrationTarget = {
        x: netSide === 'right' ? PITCH_GEO.pitchX + PITCH_GEO.pitchW - 58 : PITCH_GEO.pitchX + 58,
        y: cornerY,
      };
    }

    const activeKit = scoringTeam === 'home' ? this.activeHomeKit : this.activeAwayKit;
    const clubName = scoringTeam === 'home' ? this.homeClub.shortName : this.awayClub.shortName;
    const isClassico = this.homeClub.state === this.awayClub.state;
    const tag = isFinal
      ? 'GOL NA FINAL!'
      : isLate
      ? 'GOL NOS MINUTOS FINAIS!'
      : isComeback
      ? 'GOL DA VIRADA!'
      : isEqualizer
      ? 'GOL DE EMPATE!'
      : isClassico
      ? 'GOL NO CLÁSSICO!'
      : 'GOOOOL!';
    this.eventBanner = `${tag} ${clubName} · ${scorer.name}`;
    this.eventTone = 'goal';
    this.bannerTimer = 3.8;

    const colors = [activeKit.primary, '#FACC15', '#10B981', '#FFFFFF'];
    for (let i = 0; i < 65; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 75 + Math.random() * 230;
      this.particles.push({
        x: this.ball.x,
        y: this.ball.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: colors[i % colors.length],
        life: 1.9 + Math.random() * 1.1,
        size: 5 + Math.floor(Math.random() * 4),
      });
    }

    // #15 appearance: falling stadium confetti across the penalty area on big goals
    if (isFinal || isLate || this.env.competitionName.includes('Copa')) {
      for (let c = 0; c < 50; c++) {
        this.particles.push({
          x: this.ball.x + (Math.random() - 0.5) * 420,
          y: this.ball.y - 160 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 40,
          vy: 45 + Math.random() * 65,
          color: colors[c % colors.length],
          life: 3.5,
          size: 4,
          gravity: 18,
        });
      }
    }

    const concededTeam: 'home' | 'away' = scoringTeam === 'home' ? 'away' : 'home';
    this.replayPendingKickoffSide = concededTeam;
    this.hasGoalReplayReady = true;

    soundEngine.play('net');
    soundEngine.play('goalRoar');
    soundEngine.play('flagWave');
    soundEngine.play('celebration');

    this.phase = 'GOAL_CELEBRATION';
    this.phaseTimer = 4.0;
  }

  private clampToArena(p: SimPlayer) {
    const g = PITCH_GEO;
    p.x = clamp(p.x, g.pitchX - 10, g.pitchX + g.pitchW + 10);
    p.y = clamp(p.y, g.pitchY - 10, g.pitchY + g.pitchH + 10);
  }

  private updateCamera(dt: number) {
    const user = this.getUserPlayer();
    const targetX = this.ball.x * 0.62 + user.x * 0.38;
    const targetY = this.ball.y * 0.62 + user.y * 0.38;
    this.camX += (targetX - this.camX) * Math.min(1, dt * 6.5);
    this.camY += (targetY - this.camY) * Math.min(1, dt * 6.5);

    const g = PITCH_GEO;
    const inPenaltyBox =
      this.ball.wasShot &&
      (this.ball.x < g.pitchX + 175 || this.ball.x > g.pitchX + g.pitchW - 175);
    const targetBoost =
      this.phase === 'GOAL_CELEBRATION' ? 0.13 : inPenaltyBox ? 0.07 : 0;
    this.dynamicCamZoomBoost += (targetBoost - this.dynamicCamZoomBoost) * Math.min(1, dt * 4.5);
  }

  public screenToWorld(sx: number, sy: number, canvasW: number, canvasH: number) {
    const zoom = this.getZoom(canvasW, canvasH);
    const wx = (sx - canvasW / 2) / zoom + this.camX;
    const wy = (sy - canvasH / 2) / zoom + this.camY;
    return { x: wx, y: wy };
  }

  private getZoom(canvasW: number, canvasH: number): number {
    const base = Math.max(canvasW / 980, canvasH / 600);
    const mult =
      this.zoomPreset === 'close' ? 1.18 : this.zoomPreset === 'wide' ? 0.82 : 1.0;
    return clamp(base * (mult + this.dynamicCamZoomBoost), 0.66, 1.85);
  }

  public render(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number) {
    ctx.imageSmoothingEnabled = false;
    const zoom = this.getZoom(canvasW, canvasH);

    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 9 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * 9 : 0;

    ctx.fillStyle = '#081018';
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(
      Math.round(canvasW / 2 + shakeX),
      Math.round(canvasH / 2 + shakeY)
    );
    ctx.scale(zoom, zoom);
    ctx.translate(Math.round(-this.camX), Math.round(-this.camY));

    const rawMin = Math.floor(this.matchSeconds / 60) + (this.half === 2 ? 45 : 0);
    const minuteStr = `${Math.min(this.half === 1 ? 45 : 90, rawMin)}'`;

    drawPixelStadium(
      ctx,
      this.crowd,
      this.totalTime,
      this.goalExcitement,
      this.netRippleLeft,
      this.netRippleRight,
      this.settings.crowdDetail || this.settings.graphicsQuality,
      {
        stadium: this.env.stadium,
        homeKit: this.activeHomeKit,
        awayKit: this.activeAwayKit,
        homeShort: this.homeClub.shortName,
        awayShort: this.awayClub.shortName,
        homeScore: this.homeScore,
        awayScore: this.awayScore,
        matchMinuteStr: minuteStr,
        mascot: this.homeClub.mascot,
        crowdMood: this.crowdMood,
        showMosaic: this.matchSeconds < 120 && this.half === 1,
        env: this.env,
        environmentalEffects: this.settings.environmentalEffects,
        effectsIntensity: this.settings.effectsIntensity,
        cameraFlash: this.cameraFlashTimer,
        fourthOfficialText: this.fourthOfficialText,
        scuffMarks: this.scuffMarks,
        ballX: this.ball.x,
        ballY: this.ball.y,
        netImpactLeftY: this.netImpactLeftY,
        netImpactRightY: this.netImpactRightY,
      }
    );

    // Offside line flash across pitch
    if (this.offsideLineX !== null && this.offsideLineTimer > 0) {
      const a = Math.min(0.85, this.offsideLineTimer);
      ctx.strokeStyle = `rgba(239, 68, 68, ${a})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.offsideLineX, PITCH_GEO.pitchY);
      ctx.lineTo(this.offsideLineX, PITCH_GEO.pitchY + PITCH_GEO.pitchH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Power-shot expanding pixel ground shockwave ring
    if (this.shotShockwave.timer > 0) {
      const p = 1 - this.shotShockwave.timer / 0.35;
      ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - p) * 0.85})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.shotShockwave.x, this.shotShockwave.y, 10 + p * 34, 0, Math.PI * 2);
      ctx.stroke();
    }

    const user = this.getUserPlayer();
    // Interactive Set-Piece Aim Guide when user's team has a restart
    if (this.phase === 'SET_PIECE' && this.setPieceTeam === this.userTeam) {
      const owner = this.players.find((p) => p.id === this.ball.ownerId) || user;
      const aimAng =
        Math.hypot(this.moveInput.x, this.moveInput.y) > 0.2
          ? Math.atan2(this.moveInput.y, this.moveInput.x)
          : this.getAttackDir(this.userTeam) === 1
          ? 0
          : Math.PI;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(owner.x, owner.y);
      ctx.lineTo(owner.x + Math.cos(aimAng) * 140, owner.y + Math.sin(aimAng) * 140);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.ball.ownerId === user.id && this.phase === 'PLAYING') {
      const defaultTarget = this.findBestUserPassTarget(user);
      if (defaultTarget) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(user.x, user.y + 6);
        ctx.lineTo(defaultTarget.x, defaultTarget.y + 6);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (const m of this.players) {
        if (m.team === user.team && m.id !== user.id && !m.redCard) {
          const isHl =
            (this.highlightedTeammateId === m.id && this.highlightTimer > 0) ||
            defaultTarget?.id === m.id;
          ctx.strokeStyle = isHl ? '#FACC15' : 'rgba(248, 250, 252, 0.22)';
          ctx.lineWidth = isHl ? 2.4 : 1.1;
          ctx.beginPath();
          ctx.arc(m.x, m.y + 8, isHl ? 19 : 14, 0, Math.PI * 2);
          ctx.stroke();

          // Tactical '!' icon over open forward runners
          if (m.homeSlotX > 0.65 && Math.hypot(m.vx, m.vy) > 95) {
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(Math.round(m.x - 5), Math.round(m.y - 34), 10, 10);
            ctx.fillStyle = '#FACC15';
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', Math.round(m.x), Math.round(m.y - 26));
          }
        }
      }
    }

    if (this.callForPassPulseTimer > 0 && !user.redCard) {
      const progress = 1 - this.callForPassPulseTimer / 0.75;
      const r = 14 + progress * 24;
      ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - progress) * 0.95})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(user.x, user.y + 6, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.isAimingShot && this.ball.ownerId === user.id) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.ball.x, this.ball.y);
      ctx.lineTo(this.aimWorldX, this.aimWorldY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.aimWorldX, this.aimWorldY, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Floating pixel power bar right above user's feet
      const bx = Math.round(user.x - 16);
      const by = Math.round(user.y - 38);
      ctx.fillStyle = '#020617';
      ctx.fillRect(bx, by, 32, 6);
      ctx.fillStyle =
        this.shotCharge > 0.8 ? '#EF4444' : this.shotCharge > 0.55 ? '#FACC15' : '#34D399';
      ctx.fillRect(bx + 1, by + 1, Math.round(30 * this.shotCharge), 4);
    }

    // Ball speed trail
    if (this.ballTrail.length > 0) {
      drawPixelBallTrail(ctx, this.ballTrail);
    }

    const sunShadow =
      this.env.timeOfDay === 'Fim de tarde'
        ? { x: 6, y: 2 }
        : this.env.timeOfDay === 'Manhã'
        ? { x: -3, y: 2 }
        : { x: 0, y: 0 };

    type DrawItem = { y: number; draw: () => void };
    const drawList: DrawItem[] = [];

    // 2 Linesmen patrolling touchlines
    this.linesmen.forEach((lm, idx) => {
      drawList.push({
        y: lm.y,
        draw: () =>
          drawPixelLinesman(ctx, lm.x, lm.y, lm.phase, lm.flagTimer > 0, idx === 0),
      });
    });

    drawList.push({
      y: this.ref.y,
      draw: () =>
        drawPixelReferee(
          ctx,
          this.ref.x,
          this.ref.y,
          this.ref.phase,
          this.ref.cardTimer > 0 ? this.ref.cardColor : null,
          this.advantageTimer > 0
        ),
    });

    let topPerformerId = 'user_player';
    let topRating = -1;
    for (const pl of this.players) {
      if (pl.redCard) continue;
      const r = pl.isUser ? this.rating : pl.matchRating;
      if (r > topRating) {
        topRating = r;
        topPerformerId = pl.id;
      }
    }

    for (const p of this.players) {
      if (p.redCard) continue;
      const kit = p.team === 'home' ? this.activeHomeKit : this.activeAwayKit;
      drawList.push({
        y: p.y,
        draw: () => {
          drawPixelPlayerSprite(
            ctx,
            p.x,
            p.y,
            2.1,
            {
              appearance: p.appearance,
              gear: p.gear,
              kit,
              isGoalkeeper: p.isGoalkeeper,
              isUserControlled: p.isUser,
              isCaptain: p.isCaptain,
              isMotmLeader: p.id === topPerformerId,
              facingAngle: p.facingAngle,
              animPhase: p.animPhase,
              isSprinting: p.isUser && this.sprintHeld,
              isDribbling: p.dribbleTimer > 0,
              hasBall: this.ball.ownerId === p.id,
              action: p.action,
            },
            'match',
            sunShadow
          );

          // Tired player sweat drop pixels (< 25% stamina)
          if (p.stamina < 25) {
            ctx.fillStyle = '#38BDF8';
            ctx.fillRect(Math.round(p.x + 8), Math.round(p.y - 20), 2, 3);
          }

          if (p.isUser) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(Math.round(p.x - 18), Math.round(p.y - 31), 36, 11);
            ctx.fillStyle = '#34D399';
            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`#${p.number}`, Math.round(p.x), Math.round(p.y - 23));
          }
        },
      });
    }

    drawList.push({
      y: this.ball.y + 1,
      draw: () => drawPixelBall(ctx, this.ball.x, this.ball.y, this.ball.z, this.ball.spin),
    });

    drawList.sort((a, b) => a.y - b.y);
    drawList.forEach((d) => d.draw());

    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
    }

    ctx.restore();

    drawWeatherAndLightingOverlay(
      ctx,
      canvasW,
      canvasH,
      this.totalTime,
      this.env,
      this.settings.environmentalEffects,
      this.settings.effectsIntensity,
      this.goalExcitement
    );

    if (this.phase === 'GOAL_REPLAY') {
      drawReplayOverlay(ctx, canvasW, canvasH, this.totalTime, this.celebrationScorerName);
    }
  }

  public getHudSnapshot(): MatchHudSnapshot {
    const user = this.getUserPlayer();
    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    const totalPoss = this.possessionTicksHome + this.possessionTicksAway;
    const rawMinute = Math.floor(this.matchSeconds / 60) + (this.half === 2 ? 45 : 0);
    const g = PITCH_GEO;

    const radarPlayers: RadarDot[] = this.players
      .filter((p) => !p.redCard)
      .map((p) => ({
        nx: clamp((p.x - g.pitchX) / g.pitchW, 0, 1),
        ny: clamp((p.y - g.pitchY) / g.pitchH, 0, 1),
        team: p.team,
        isGk: p.isGoalkeeper,
        isUser: p.isUser,
      }));

    const userLineupRatings: LineupRatingItem[] = this.players
      .filter((p) => p.team === this.userTeam)
      .map((p) => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        stamina: Math.round(p.stamina),
        rating: p.isUser ? +this.rating.toFixed(1) : +p.matchRating.toFixed(1),
        isUser: p.isUser,
        redCard: p.redCard,
      }));

    const userSubsUsed = this.userTeam === 'home' ? this.homeSubsUsed : this.awaySubsUsed;
    const userBenchCount = this.userTeam === 'home' ? this.homeBench.length : this.awayBench.length;

    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      penHomeScore: this.penHomeScore,
      penAwayScore: this.penAwayScore,
      matchMinute: Math.min(this.half === 1 ? 45 : 90, rawMinute),
      addedTime: rawMinute >= (this.half === 1 ? 45 : 90) ? this.addedTime : 0,
      half: this.half,
      phase: this.phase,
      eventBanner: this.eventBanner,
      eventTone: this.eventTone,
      possessionHomePct: Math.round((this.possessionTicksHome / totalPoss) * 100),
      teamShotsHome: this.teamShotsHome,
      teamShotsAway: this.teamShotsAway,
      teamPassesHome: this.teamPassesHome,
      teamPassesAway: this.teamPassesAway,
      teamCornersHome: this.teamCornersHome,
      teamCornersAway: this.teamCornersAway,
      teamOffsidesHome: this.teamOffsidesHome,
      teamOffsidesAway: this.teamOffsidesAway,
      teamFoulsHome: this.teamFoulsHome,
      teamFoulsAway: this.teamFoulsAway,
      userHasBall: this.ball.ownerId === user.id,
      userTeamHasBall: owner?.team === this.userTeam,
      userTeamHasSetPiece: this.phase === 'SET_PIECE' && this.setPieceTeam === this.userTeam,
      advantageActive: this.advantageTimer > 0,
      momentum: Math.round(this.momentum),
      userStamina: Math.round(user.stamina),
      userIsGk: user.isGoalkeeper,
      isAimingShot: this.isAimingShot,
      shotPower: Math.round(this.shotCharge * 100),
      stats: { ...this.stats },
      rating: +this.rating.toFixed(1),
      tactic: this.userTactic,
      zoomPreset: this.zoomPreset,
      subsUsedUser: userSubsUsed,
      benchCountUser: userBenchCount,
      hasReplayAvailable: this.replayBuffer.length > 20,
      radar: {
        players: radarPlayers,
        ballX: clamp((this.ball.x - g.pitchX) / g.pitchW, 0, 1),
        ballY: clamp((this.ball.y - g.pitchY) / g.pitchH, 0, 1),
      },
      userLineupRatings,
      penaltyShootout:
        this.phase === 'PENALTY_SHOOTOUT'
          ? {
              active: true,
              turn: this.penTurn,
              step: this.penStep,
              round: this.penRound,
              homeKicks: [...this.penKicksHome],
              awayKicks: [...this.penKicksAway],
              homeScore: this.penHomeScore,
              awayScore: this.penAwayScore,
              userRole: this.penTurn === this.userTeam ? 'KICKER' : 'KEEPER',
              kickerName:
                this.penTurn === this.userTeam && this.penKicksHome.length === 0
                  ? user.name
                  : (this.penTurn === 'home' ? this.homeClub : this.awayClub).squad[
                      (this.penRound + 8) % 11
                    ]?.name || 'Cobrador',
              aimDir: this.penAimDir,
            }
          : null,
    };
  }
}

import { soundEngine } from '../audio/soundEngine';
import { getPositionMeta } from '../data/positions';
import {
  CrowdMood,
  PlayerAnimAction,
  Club,
  ClubSquadMember,
  FormationId,
  GameSettings,
  MatchEnvironment,
  MatchStatLine,
  PlayerAppearance,
  PlayerCareer,
  PositionId,
  SportGear,
} from '../types/game';
import { emptyStats } from '../utils/storage';
import {
  CrowdSpectator,
  PITCH_GEO,
  drawPixelBall,
  drawPixelPlayerSprite,
  drawPixelReferee,
  drawPixelStadium,
  drawWeatherAndLightingOverlay,
  generateCrowd,
} from './pixelRenderer';

export type MatchPhase =
  | 'KICKOFF'
  | 'PLAYING'
  | 'GOAL_CELEBRATION'
  | 'SET_PIECE'
  | 'HALFTIME'
  | 'FULLTIME';

export interface SimPlayer {
  id: string;
  name: string;
  number: number;
  team: 'home' | 'away';
  isUser: boolean;
  isGoalkeeper: boolean;
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
}

export interface MatchHudSnapshot {
  homeScore: number;
  awayScore: number;
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
  userHasBall: boolean;
  userTeamHasBall: boolean;
  userStamina: number;
  userIsGk: boolean;
  isAimingShot: boolean;
  shotPower: number;
  stats: MatchStatLine;
  rating: number;
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

export class MatchEngine {
  public homeClub: Club;
  public awayClub: Club;
  public userTeam: 'home' | 'away';
  public career: PlayerCareer;
  public settings: GameSettings;
  public env: MatchEnvironment;

  public players: SimPlayer[] = [];
  public ball: SimBall;
  public ref = { x: 680, y: 380, phase: 0 };
  public crowd: CrowdSpectator[];
  public particles: Particle[] = [];

  public homeScore = 0;
  public awayScore = 0;
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
  public totalTime = 0;
  public paused = false;

  public possessionTicksHome = 1;
  public possessionTicksAway = 1;
  public teamShotsHome = 0;
  public teamShotsAway = 0;
  public teamPassesHome = 0;
  public teamPassesAway = 0;
  private subDone = false;
  private footstepCooldown = 0;
  private chantCooldown = 6;
  private celebrationScorerId: string | null = null;
  private celebrationTeam: 'home' | 'away' = 'home';
  private celebrationTarget = { x: 800, y: 210 };
  private activeCelebrationAction: PlayerAnimAction = 'celebrate_arms';
  private celebrationRunElapsed = 0;

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
    env: MatchEnvironment
  ) {
    this.career = career;
    this.homeClub = homeClub;
    this.awayClub = awayClub;
    this.userTeam = career.clubId === homeClub.id ? 'home' : 'away';
    this.settings = settings;
    this.env = env;

    const isImportant =
      env.competitionName.includes('Final') ||
      env.competitionName.includes('Copa') ||
      env.competitionName.includes('Supercopa') ||
      career.round >= 20;

    this.crowd = generateCrowd(
      homeClub.kit.primary,
      homeClub.kit.secondary,
      awayClub.kit.primary,
      settings.crowdDetail || settings.graphicsQuality,
      {
        awaySecondary: awayClub.kit.secondary,
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
        beardStyle: 'Nenhuma',
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
        accessory: member.position === 'GK_TRAD' ? 'Luvas' : 'Nenhum',
      },
    };
  }

  private spawnTeams() {
    this.players = [];
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

    club.squad.forEach((m, idx) => {
      const slot = coords[idx] || { x: 0.5, y: 0.5 };
      const isUser = userIsThisSide && idx === userSlotIdx;
      const isGk = idx === 0;

      if (isUser) {
        const a = this.career.attributes;
        this.players.push({
          id: 'user_player',
          name: this.career.personal.nickname || this.career.personal.firstName,
          number: this.career.gear.jerseyNumber,
          team: side,
          isUser: true,
          isGoalkeeper: isGk,
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
        });
      }
    });
  }

  public getAttackDir(team: 'home' | 'away'): 1 | -1 {
    if (this.half === 1) return team === 'home' ? 1 : -1;
    return team === 'home' ? -1 : 1;
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
        // Quick lateral step / direction burst
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
    if (this.phase !== 'PLAYING') return;
    const user = this.getUserPlayer();
    if (user.redCard) return;

    if (this.ball.ownerId === user.id || (!this.ball.ownerId && dist(user.x, user.y, this.ball.x, this.ball.y) < 38 && this.ball.z < 28)) {
      const bestMate = this.findBestUserPassTarget(user);
      if (!bestMate) return;
      this.highlightedTeammateId = bestMate.id;
      this.highlightTimer = 0.45;
      this.passQueueTimer = 0;
      this.executePass(user, bestMate, this.sprintHeld);
    } else {
      // Queue one-touch pass if ball is arriving soon (never triggers call-for-pass)
      this.passQueueTimer = 0.36;
    }
  }

  public triggerCallForPass() {
    if (this.phase !== 'PLAYING') return;
    const user = this.getUserPlayer();
    if (user.redCard) return;
    if (this.ball.ownerId === user.id) return;

    this.callForPassPulseTimer = 0.75;
    this.userRequestedPassTimer = 1.6;
    soundEngine.play('menu');

    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    if (owner && owner.team === user.team && owner.id !== user.id) {
      this.userRequestedPassTimer = 0;
      owner.aiDecisionTimer = 0.35;
      this.executePass(owner, user, this.sprintHeld);
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
    if (this.phase !== 'PLAYING') return;
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
    if (this.phase !== 'PLAYING' || user.redCard) return;

    const power = Math.max(0.4, this.shotCharge);
    const canFirstTimeStrike =
      !this.ball.ownerId &&
      dist(user.x, user.y, this.ball.x, this.ball.y) < 42 &&
      this.ball.z < 30;

    if (this.ball.ownerId === user.id || canFirstTimeStrike) {
      this.shootQueueTimer = 0;
      this.executeShot(user, this.aimWorldX, this.aimWorldY, power);
    } else {
      // Queue shot briefly if user pressed Shoot right before receiving the ball
      this.shootQueueTimer = 0.38;
      this.queuedShotPower = power;
      this.queuedShotAimY = this.aimWorldY;
    }
  }

  public skipCelebration() {
    if (this.phase !== 'GOAL_CELEBRATION') return;
    this.phaseTimer = 0;
    const concededTeam = this.ball.x > PITCH_GEO.pitchX + PITCH_GEO.pitchW / 2 ? 'away' : 'home';
    const kickoffSide = this.half === 1 ? concededTeam : concededTeam === 'home' ? 'away' : 'home';
    this.resetKickoff(kickoffSide);
    soundEngine.play('whistle');
  }

  public executePass(passer: SimPlayer, target: SimPlayer, throughBall = false) {
    const d = dist(passer.x, passer.y, target.x, target.y);
    const dir = this.getAttackDir(passer.team);
    const leadTime = Math.min(0.55, d / 540);
    const tx = target.x + target.vx * leadTime + (throughBall ? dir * 48 : 0);
    const ty = target.y + target.vy * leadTime;

    const baseAngle = Math.atan2(ty - passer.y, tx - passer.x);
    const maxSpread = ((100 - passer.passStat) / 100) * 0.15;
    const angle = baseAngle + (Math.random() - 0.5) * maxSpread;
    const isLong = d > 270;
    const speed = clamp(295 + d * 0.95 + (passer.passStat - 60) * 1.6 + (throughBall ? 55 : 0), 285, 660);

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

    if (passer.team === 'home') this.teamPassesHome += 1;
    else this.teamPassesAway += 1;

    soundEngine.play('pass');
  }

  public executeShot(shooter: SimPlayer, targetX: number, targetY: number, power01: number) {
    const g = PITCH_GEO;
    const dir = this.getAttackDir(shooter.team);
    const goalX = dir === 1 ? g.pitchX + g.pitchW : g.pitchX;
    const midY = g.pitchY + g.pitchH / 2;

    let aimY = clamp(targetY, midY - g.goalH * 0.62, midY + g.goalH * 0.62);
    // Optional Aim Assist gently biases toward open corner away from GK
    if (shooter.isUser && this.settings.aimAssist) {
      const oppGk = this.players.find((p) => p.team !== shooter.team && p.isGoalkeeper);
      if (oppGk) {
        const cornerBias = oppGk.y >= midY ? midY - g.goalH * 0.36 : midY + g.goalH * 0.36;
        aimY = aimY * 0.65 + cornerBias * 0.35;
      }
    }

    const baseAngle = Math.atan2(aimY - shooter.y, goalX - shooter.x);
    const spread = ((100 - shooter.shootStat) / 100) * 0.2;
    const angle = baseAngle + (Math.random() - 0.5) * spread;
    const pwr = clamp(power01, 0.35, 1.0);
    // Placed low shot vs power shot
    const speed = 475 + pwr * 295 + (shooter.shootStat - 60) * 2.2;

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

    if (shooter.team === 'home') this.teamShotsHome += 1;
    else this.teamShotsAway += 1;

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
    if (this.shootQueueTimer > 0) this.shootQueueTimer = Math.max(0, this.shootQueueTimer - dt);
    if (this.passQueueTimer > 0) this.passQueueTimer = Math.max(0, this.passQueueTimer - dt);
    if (this.callForPassPulseTimer > 0) this.callForPassPulseTimer = Math.max(0, this.callForPassPulseTimer - dt);
    if (this.userRequestedPassTimer > 0) this.userRequestedPassTimer = Math.max(0, this.userRequestedPassTimer - dt);
    if (this.netRippleLeft > 0) this.netRippleLeft = Math.max(0, this.netRippleLeft - dt * 1.4);
    if (this.netRippleRight > 0) this.netRippleRight = Math.max(0, this.netRippleRight - dt * 1.4);
    if (this.goalExcitement > 0) this.goalExcitement = Math.max(0, this.goalExcitement - dt * 0.85);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    if (this.footstepCooldown > 0) this.footstepCooldown -= dt;
    if (this.chantCooldown > 0) {
      this.chantCooldown -= dt;
    } else if (this.phase === 'PLAYING') {
      this.chantCooldown = 10 + Math.random() * 6;
      soundEngine.play(Math.random() > 0.35 ? 'crowdChant' : 'flagWave');
    }

    this.particles = this.particles.filter((pt) => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life -= dt;
      return pt.life > 0;
    });

    if (this.isAimingShot) {
      this.shotCharge = Math.min(1, this.shotCharge + dt * 1.15);
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
              } else {
                p.action = 'celebrate_slide';
              }
            } else if (d > 16 && this.celebrationRunElapsed < 1.25) {
              p.x += (dx / d) * 170 * dt;
              p.y += (dy / d) * 170 * dt;
              p.facingAngle = Math.atan2(dy, dx);
              p.action =
                this.activeCelebrationAction === 'celebrate_crowd'
                  ? 'celebrate_arms'
                  : 'celebrate_arms';
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
          const concededTeam = this.ball.x > PITCH_GEO.pitchX + PITCH_GEO.pitchW / 2 ? 'away' : 'home';
          const kickoffSide = this.half === 1 ? concededTeam : concededTeam === 'home' ? 'away' : 'home';
          this.resetKickoff(kickoffSide);
          soundEngine.play('whistle');
        }
      } else if (this.phaseTimer <= 0) {
        this.phase = 'PLAYING';
        this.ball.pickupLockTimer = 0;
      }
      this.updateCamera(dt);
      return;
    }

    this.matchSeconds += dt * 36;
    const halfLimit = 2700 + this.addedTime * 60;

    // Late 2nd half AI substitution event for atmosphere
    if (this.half === 2 && !this.subDone && this.matchSeconds >= 1320) {
      this.subDone = true;
      const subTarget = this.players.find((p) => !p.isUser && !p.isGoalkeeper && !p.redCard);
      if (subTarget) {
        subTarget.stamina = 100;
        this.eventBanner = `SUBSTITUIÇÃO · #${subTarget.number} entra descansado`;
        this.eventTone = 'sub';
        this.bannerTimer = 2.4;
        soundEngine.play('applause');
      }
    }

    if (this.matchSeconds >= halfLimit) {
      if (this.half === 1) {
        this.phase = 'HALFTIME';
        this.eventBanner = 'INTERVALO';
        this.eventTone = 'info';
        this.bannerTimer = 3;
        soundEngine.play('whistleLong');
      } else {
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
      if (p.actionTimer > 0) {
        p.actionTimer -= dt;
      }

      if (p.isUser) {
        this.updateUserPlayer(p, dt);
      } else {
        this.updateAiPlayer(p, dt);
      }
    }

    this.resolvePlayerCollisions();
    this.updateBall(dt);

    const refTargetX = clamp(this.ball.x - 45, PITCH_GEO.pitchX + 80, PITCH_GEO.pitchX + PITCH_GEO.pitchW - 80);
    const refTargetY = clamp(this.ball.y - 65, PITCH_GEO.pitchY + 60, PITCH_GEO.pitchY + PITCH_GEO.pitchH - 60);
    const rdx = refTargetX - this.ref.x;
    const rdy = refTargetY - this.ref.y;
    const rdist = Math.hypot(rdx, rdy);
    if (rdist > 8) {
      this.ref.x += (rdx / rdist) * Math.min(135 * dt, rdist);
      this.ref.y += (rdy / rdist) * Math.min(135 * dt, rdist);
      this.ref.phase += dt * 8;
    }

    this.updateCamera(dt);
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
      this.steerAiToward(p, tx, ty, 132 + p.gkStat * 0.78, dt);
      p.facingAngle = dir === 1 ? 0 : Math.PI;
      return;
    }

    if (hasBall) {
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

        // Shoot if in range
        if (distToGoal < 265 && Math.random() < 0.65) {
          const cornerY = oppGoalY + (Math.random() - 0.5) * (g.goalH * 0.76);
          this.executeShot(p, oppGoalX, cornerY, 0.72 + Math.random() * 0.22);
          return;
        }

        // Cross into the box from wings!
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

    const basePos = this.slotToWorld(p.team, p.homeSlotX, p.homeSlotY);
    const ballShiftX = (this.ball.x - (g.pitchX + g.pitchW / 2)) * (teamHasBall ? 0.38 : 0.28);
    const ballShiftY = (this.ball.y - (g.pitchY + g.pitchH / 2)) * 0.24;

    let tx = clamp(basePos.x + ballShiftX, g.pitchX + 35, g.pitchX + g.pitchW - 35);
    let ty = clamp(basePos.y + ballShiftY, g.pitchY + 35, g.pitchY + g.pitchH - 35);

    const closestPresser = this.players
      .filter((m) => m.team === p.team && !m.isUser && !m.isGoalkeeper && !m.redCard)
      .sort((a, b) => dist(a.x, a.y, this.ball.x, this.ball.y) - dist(b.x, b.y, this.ball.x, this.ball.y))[0];

    if (!teamHasBall && closestPresser?.id === p.id) {
      tx = this.ball.x;
      ty = this.ball.y;
    } else if (teamHasBall && p.homeSlotX > 0.52) {
      // Offensive support & onside awareness
      tx = clamp(tx + dir * 60, g.pitchX + 40, g.pitchX + g.pitchW - 40);
    }

    const aiSpeed = (135 + (p.speedStat - 50) * 1.2) * (closestPresser?.id === p.id ? 1.1 : 0.96);
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
      this.triggerFoul(tackler, carrier);
      return;
    }

    this.ball.ownerId = tackler.id;
    this.ball.pickupLockTimer = 0.25;
    this.ball.lastTouchTeam = tackler.team;
    this.ball.lastTouchPlayerId = tackler.id;

    if (tackler.isUser) {
      this.stats.tackles += 1;
      this.rating = Math.min(10, this.rating + 0.18);
    }
    soundEngine.play('ball');
  }

  private triggerFoul(offender: SimPlayer, victim: SimPlayer) {
    const g = PITCH_GEO;
    const midY = g.pitchY + g.pitchH / 2;
    const dirVictim = this.getAttackDir(victim.team);
    const inOppBox =
      dirVictim === 1
        ? victim.x > g.pitchX + g.pitchW - 162 && Math.abs(victim.y - midY) < 170
        : victim.x < g.pitchX + 162 && Math.abs(victim.y - midY) < 170;

    soundEngine.play('whistle');
    soundEngine.play('crowdBoo');
    this.setCrowdMood('tense', 2.4);
    victim.action = 'fall';
    victim.actionTimer = 0.7;

    if (Math.random() < 0.35) {
      offender.yellowCards += 1;
      if (offender.isUser) this.stats.yellowCards += 1;
      if (offender.yellowCards >= 2) {
        offender.redCard = true;
        if (offender.isUser) this.stats.redCards += 1;
        this.eventBanner = `CARTÃO VERMELHO (${offender.name})`;
        this.eventTone = 'card';
        soundEngine.play('crowdBoo');
      } else {
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

    // Wet grass makes rolling ball glide slightly faster
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
        const cx = this.ball.x < g.pitchX ? g.pitchX + 10 : g.pitchX + g.pitchW - 10;
        const cy = this.ball.y < midY ? g.pitchY + 10 : g.pitchY + g.pitchH - 10;
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
        const reach = p.isGoalkeeper ? 24 : 17;
        if (dist(p.x, p.y, this.ball.x, this.ball.y) < reach) {
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
            p.action = 'dive';
            p.actionTimer = 0.42;
            this.eventBanner = `DEFESAÇA! ${p.name}`;
            this.eventTone = 'save';
            this.bannerTimer = 1.5;
            this.setCrowdMood('excited', 1.8);
            soundEngine.play('applause');
            soundEngine.play('crowd');
          } else if (this.ball.z > 14 && !p.isGoalkeeper) {
            p.action = 'header';
            p.actionTimer = 0.3;
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

  private triggerRestart(label: string, team: 'home' | 'away', x: number, y: number) {
    soundEngine.play('whistle');
    this.eventBanner = label;
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
    this.phaseTimer = 0.7;
  }

  private scoreGoal(scoringTeam: 'home' | 'away', netSide: 'left' | 'right') {
    const prevHome = this.homeScore;
    const prevAway = this.awayScore;
    if (scoringTeam === 'home') this.homeScore += 1;
    else this.awayScore += 1;

    if (netSide === 'left') this.netRippleLeft = 1.25;
    else this.netRippleRight = 1.25;

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

    this.celebrationScorerId = scorer.id;
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
        x: clamp(scorer.x + (netSide === 'right' ? 60 : -60), PITCH_GEO.pitchX + 90, PITCH_GEO.pitchX + PITCH_GEO.pitchW - 90),
        y: scorer.y < PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2 ? PITCH_GEO.pitchY + 12 : PITCH_GEO.pitchY + PITCH_GEO.pitchH - 12,
      };
    } else if (this.activeCelebrationAction === 'celebrate_hug') {
      this.celebrationTarget = {
        x: clamp(scorer.x + (netSide === 'right' ? -70 : 70), PITCH_GEO.pitchX + 120, PITCH_GEO.pitchX + PITCH_GEO.pitchW - 120),
        y: PITCH_GEO.pitchY + PITCH_GEO.pitchH / 2,
      };
    } else {
      this.celebrationTarget = {
        x: netSide === 'right' ? PITCH_GEO.pitchX + PITCH_GEO.pitchW - 58 : PITCH_GEO.pitchX + 58,
        y: cornerY,
      };
    }

    const clubName = scoringTeam === 'home' ? this.homeClub.shortName : this.awayClub.shortName;
    const tag = isFinal
      ? 'GOL NA FINAL!'
      : isLate
      ? 'GOL NOS MINUTOS FINAIS!'
      : isComeback
      ? 'GOL DA VIRADA!'
      : isEqualizer
      ? 'GOL DE EMPATE!'
      : 'GOOOOL!';
    this.eventBanner = `${tag} ${clubName} · ${scorer.name}`;
    this.eventTone = 'goal';
    this.bannerTimer = 3.8;

    const colors = [
      scoringTeam === 'home' ? this.homeClub.kit.primary : this.awayClub.kit.primary,
      '#FACC15',
      '#10B981',
      '#FFFFFF',
    ];
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
  }

  public screenToWorld(sx: number, sy: number, canvasW: number, canvasH: number) {
    const zoom = this.getZoom(canvasW, canvasH);
    const wx = (sx - canvasW / 2) / zoom + this.camX;
    const wy = (sy - canvasH / 2) / zoom + this.camY;
    return { x: wx, y: wy };
  }

  private getZoom(canvasW: number, canvasH: number): number {
    const base = Math.max(canvasW / 980, canvasH / 600);
    return clamp(base, 0.72, 1.55);
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
        homeKit: this.homeClub.kit,
        awayKit: this.awayClub.kit,
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
      }
    );

    const user = this.getUserPlayer();
    if (this.ball.ownerId === user.id && this.phase === 'PLAYING') {
      const defaultTarget = this.findBestUserPassTarget(user);
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
    }

    const sunShadow =
      this.env.timeOfDay === 'Fim de tarde'
        ? { x: 6, y: 2 }
        : this.env.timeOfDay === 'Manhã'
        ? { x: -3, y: 2 }
        : { x: 0, y: 0 };

    type DrawItem = { y: number; draw: () => void };
    const drawList: DrawItem[] = [];

    drawList.push({
      y: this.ref.y,
      draw: () => drawPixelReferee(ctx, this.ref.x, this.ref.y, this.ref.phase),
    });

    for (const p of this.players) {
      if (p.redCard) continue;
      const kit = p.team === 'home' ? this.homeClub.kit : this.awayClub.kit;
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

    // Screen-space weather & time-of-day overlay
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
  }

  public getHudSnapshot(): MatchHudSnapshot {
    const user = this.getUserPlayer();
    const owner = this.players.find((p) => p.id === this.ball.ownerId);
    const totalPoss = this.possessionTicksHome + this.possessionTicksAway;
    const rawMinute = Math.floor(this.matchSeconds / 60) + (this.half === 2 ? 45 : 0);

    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
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
      userHasBall: this.ball.ownerId === user.id,
      userTeamHasBall: owner?.team === this.userTeam,
      userStamina: Math.round(user.stamina),
      userIsGk: user.isGoalkeeper,
      isAimingShot: this.isAimingShot,
      shotPower: Math.round(this.shotCharge * 100),
      stats: { ...this.stats },
      rating: +this.rating.toFixed(1),
    };
  }
}

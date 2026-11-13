export type ScreenId =
  | 'TITLE'
  | 'MAIN_MENU'
  | 'SETTINGS'
  | 'CREDITS'
  | 'CHAR_CREATOR'
  | 'CLUB_SELECT'
  | 'CAREER_HUB'
  | 'MATCH'
  | 'PLAYER_PROFILE'
  | 'CLUBS_BROWSER'
  | 'STADIUMS_BROWSER'
  | 'COMPETITIONS_BROWSER'
  | 'CUSTOMIZATION';

export type LanguageCode = 'pt-BR' | 'en-US' | 'es-ES';
export type GraphicsQuality = 'high' | 'medium' | 'low';
export type OrientationPref = 'landscape-auto' | 'landscape-locked';
export type ButtonSizePref = 'normal' | 'large';
export type ControlPositionPref = 'standard' | 'compact';

export interface AudioSettings {
  musicEnabled: boolean;
  musicVolume: number; // 0..1
  sfxEnabled: boolean;
  sfxVolume: number; // 0..1
  ballVolume: number; // 0..1
  kickVolume: number; // 0..1
  passVolume: number; // 0..1
  netVolume: number; // 0..1
  crowdVolume: number; // 0..1
  whistleVolume: number; // 0..1
  celebrationVolume: number; // 0..1
  menuVolume: number; // 0..1
  footstepVolume: number; // 0..1
}

export interface GameSettings {
  audio: AudioSettings;
  controlSensitivity: number; // 0.5..1.5
  graphicsQuality: GraphicsQuality;
  effectsIntensity: number; // 0.5..1.0
  crowdDetail: GraphicsQuality;
  environmentalEffects: boolean;
  buttonSize: ButtonSizePref;
  controlPosition: ControlPositionPref;
  aimAssist: boolean;
  highContrastHud: boolean;
  showMatchHints: boolean;
  vibration: boolean;
  language: LanguageCode;
  orientation: OrientationPref;
}

export type PositionGroup = 'GOLEIRO' | 'DEFESA' | 'MEIO_CAMPO' | 'ATAQUE';

export type PositionId =
  | 'GK_TRAD'
  | 'GK_SWEEPER'
  | 'CB_STOPPER'
  | 'CB_BALL'
  | 'RB'
  | 'LB'
  | 'WB'
  | 'CDM_ANCHOR'
  | 'CDM_BOX'
  | 'CM'
  | 'CAM'
  | 'PLAYMAKER'
  | 'RW'
  | 'LW'
  | 'SS'
  | 'ST'
  | 'FALSE_9';

export type PlaystyleId =
  | 'ARMADOR'
  | 'FINALIZADOR'
  | 'VELOCISTA'
  | 'DRIBLADOR'
  | 'VOLANTE_MARCADOR'
  | 'PONTA_OFENSIVO'
  | 'DEFENSOR'
  | 'GOLEIRO'
  // Legacy compatibility ids
  | 'MARCADOR'
  | 'CONSTRUTOR'
  | 'COMPLETO';

export type DominantFoot = 'Direito' | 'Esquerdo' | 'Ambidestro';
export type SleeveLength = 'Curta' | 'Longa';
export type SockType = 'Curta' | 'Média' | 'Alta';
export type CollarStyle = 'Redonda' | 'Gola V' | 'Polo';
export type AccessoryType =
  | 'Nenhum'
  | 'Munhequeira'
  | 'Faixa'
  | 'FaixaCabelo'
  | 'Bracadeira'
  | 'Joelho'
  | 'Luvas';
export type BodyType = 'Magro' | 'Atlético' | 'Forte';
export type HairStyle =
  | 'Curto'
  | 'Moicano'
  | 'BlackPower'
  | 'Longo'
  | 'Raspado'
  | 'Topete'
  | 'Tranças'
  | 'Cacheado'
  | 'Franja';
export type FaceStyle = 'Sério' | 'Confiante' | 'Determinado' | 'Sorriso';
export type FaceShape = 'Oval' | 'Quadrado' | 'Redondo' | 'Fino';
export type FacialDetail = 'Nenhuma' | 'Sardas' | 'Cicatriz' | 'Pintura';
export type EyeStyle = 'Padrão' | 'Focado' | 'Expressivo';
export type EyebrowStyle = 'Fina' | 'Grossa' | 'Arqueada';
export type BeardStyle = 'Nenhuma' | 'Rala' | 'Cheia' | 'Cavanhaque';
export type MustacheStyle = 'Nenhum' | 'Fino' | 'Clássico';
export type BootModel = 'Clássica' | 'Velocidade' | 'Controle' | 'TravaAlta';

export type CelebrationId =
  | 'arms_open'
  | 'run_crowd'
  | 'point_sky'
  | 'jump_fist'
  | 'knee_slide'
  | 'dance'
  | 'jersey_show'
  | 'group_hug';

export interface PlayerPersonalInfo {
  firstName: string;
  lastName: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD
  nationality: string;
  hometown: string;
  heightCm: number;
  weightKg: number;
}

export interface PlayerAppearance {
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  faceStyle: FaceStyle;
  faceShape?: FaceShape;
  facialDetail?: FacialDetail;
  eyeStyle: EyeStyle;
  eyebrowStyle: EyebrowStyle;
  beardStyle: BeardStyle;
  mustacheStyle: MustacheStyle;
  bodyType: BodyType;
  visualHeightScale: number;
}

export interface SportGear {
  jerseyNumber: number;
  shirtName?: string;
  collarStyle?: CollarStyle;
  dominantFoot: DominantFoot;
  bootModel: BootModel;
  bootColor: string;
  sleeveLength: SleeveLength;
  sockType: SockType;
  accessory: AccessoryType;
  celebrationId?: CelebrationId;
}

export interface PlayerAttributes {
  velocidade: number;
  aceleracao: number;
  resistencia: number;
  forcaFisica: number;
  agilidade: number;
  equilibrio: number;
  finalizacao: number;
  potenciaChute: number;
  precisaoChute: number;
  passeCurto: number;
  passeLongo: number;
  cruzamento: number;
  visaoJogo: number;
  drible: number;
  controleBola: number;
  dominio: number;
  cabeceio: number;
  marcacao: number;
  desarme: number;
  posicionamento: number;
  interceptacao: number;
  reflexos: number;
  posicionamentoGk: number;
  saidasGol: number;
  defesaPenaltis: number;
  reposicao: number;
}

export type FormationId = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
export type CrestPattern =
  | 'stripes'
  | 'halves'
  | 'sash'
  | 'hoops'
  | 'cross'
  | 'diamond'
  | 'quartered'
  | 'star';

export type StadiumArchitecture =
  | 'modern'
  | 'traditional'
  | 'compact'
  | 'grand'
  | 'municipal'
  | 'cauldron';

export type MascotId =
  | 'aguia'
  | 'leao'
  | 'lobo'
  | 'tigre'
  | 'dragao'
  | 'estrela'
  | 'touro'
  | 'coroa'
  | 'ancora'
  | 'pinheiro'
  | 'falcao'
  | 'raio';

export interface StadiumSpec {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  architecture: StadiumArchitecture;
  turfToneA: string;
  turfToneB: string;
  standColor: string;
  trackBorder: boolean;
  roofCover: boolean;
  floodlightStyle: 'towers' | 'ring' | 'poles';
  description: string;
}

export type TimeOfDay = 'Manhã' | 'Tarde' | 'Fim de tarde' | 'Noite';
export type WeatherCondition = 'Ensolarado' | 'Nublado' | 'Chuva fraca' | 'Chuva forte';

export type CrowdMood =
  | 'calm'
  | 'excited'
  | 'tense'
  | 'disappointed'
  | 'goal_home'
  | 'goal_away'
  | 'celebrating_victory';

export type PlayerAnimAction =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'dribble'
  | 'pass'
  | 'kick'
  | 'header'
  | 'tackle'
  | 'fall'
  | 'dive'
  | 'celebrate_arms'
  | 'celebrate_crowd'
  | 'celebrate_sky'
  | 'celebrate_jump'
  | 'celebrate_slide'
  | 'celebrate_dance'
  | 'celebrate_shirt'
  | 'celebrate_hug';

export interface MatchEnvironment {
  competitionName: string;
  roundLabel: string;
  dateStr: string;
  kickoffTime: string;
  timeOfDay: TimeOfDay;
  weather: WeatherCondition;
  temperatureC: number;
  stadium: StadiumSpec;
}

export interface ClubKit {
  primary: string;
  secondary: string;
  shorts: string;
  socks: string;
  pattern: 'solid' | 'stripes' | 'hoops' | 'sash' | 'halves';
  gkPrimary: string;
}

export interface ClubSquadMember {
  id: string;
  name: string;
  age?: number;
  number: number;
  position: PositionId;
  ovr: number;
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyle;
  beard?: BeardStyle;
  speed: number;
  passing: number;
  shooting: number;
  defending: number;
  dribbling: number;
  gkSkill: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  foundedYear: number;
  stadiumName: string;
  stadiumCapacity: number;
  stadiumId: string;
  mascot: MascotId;
  mascotName: string;
  reputation: number;
  squadQuality: number;
  finances: 'Modesta' | 'Estável' | 'Sólida' | 'Potência';
  coachName: string;
  formation: FormationId;
  division: 'Série A' | 'Série B' | 'Série C';
  history: string;
  chantTheme?: string;
  crestPattern: CrestPattern;
  kit: ClubKit;
  awayKit?: ClubKit;
  thirdKit?: ClubKit;
  squad: ClubSquadMember[];
}

export interface Contract {
  clubId: string;
  clubName: string;
  weeklySalary: number;
  yearsRemaining: number;
  role: 'Reserva' | 'Rotação' | 'Titular' | 'Estrela';
  signedSeason: number;
}

export interface MatchStatLine {
  matches: number;
  goals: number;
  assists: number;
  passesCompleted: number;
  passesMissed: number;
  shots: number;
  shotsOnTarget: number;
  dribblesCompleted: number;
  tackles: number;
  interceptions: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  ratingSum: number;
  saves: number;
}

export interface MatchRecord {
  id: string;
  season: number;
  round: number;
  competition: string;
  homeClubId: string;
  awayClubId: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  playerClubId: string;
  playerStats: MatchStatLine;
  rating: number;
  motm: boolean;
  stadiumName: string;
  weather: WeatherCondition;
}

export interface CareerAward {
  id: string;
  season: number;
  title: string;
  clubName: string;
}

export interface TransferOffer {
  id: string;
  clubId: string;
  clubName: string;
  division: string;
  type: 'Transferência' | 'Empréstimo' | 'Renovação';
  weeklySalary: number;
  years: number;
  role: 'Rotação' | 'Titular' | 'Estrela';
}

export interface LeagueStanding {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

export interface LeagueLeader {
  playerId: string;
  name: string;
  clubId: string;
  goals: number;
  assists: number;
}

export type TrainingCategory = 'FISICO' | 'TECNICO' | 'TATICO' | 'GOLEIRO';
export type MinigameType = 'DRIBBLE_SPEED' | 'SHOOTING' | 'PASSING' | 'DEFENSE_GK';

export interface TrainingDrill {
  id: string;
  name: string;
  category: TrainingCategory;
  durationMin: number;
  difficulty: 'Fácil' | 'Média' | 'Alta';
  attributesWorked: (keyof PlayerAttributes)[];
  xpReward: number;
  fatigueCost: number;
  estimatedGain: string;
  minigame: MinigameType;
  description: string;
}

export type CalendarActivityType =
  | 'TREINO'
  | 'DESCANSO'
  | 'RECUPERACAO'
  | 'PARTIDA'
  | 'VIAGEM'
  | 'COMPROMISSO'
  | 'ESPECIAL';

export interface CalendarDay {
  dayIndex: number; // 0..N
  dateLabel: string; // e.g. 14/02
  weekday: string; // Seg, Ter...
  activity: CalendarActivityType;
  title: string;
  completed: boolean;
  roundRef?: number;
  competition?: string;
  opponentClubId?: string;
  isHome?: boolean;
  kickoffTime?: string;
  note?: string;
}

export interface CareerHistoryEntry {
  season: number;
  clubId: string;
  clubName: string;
  division: string;
  matches: number;
  goals: number;
  assists: number;
  avgRating: number;
}

export interface EvolutionPoint {
  round: number;
  season: number;
  ovr: number;
  velocidade: number;
  finalizacao: number;
  passeCurto: number;
  drible: number;
  marcacao: number;
  reflexos: number;
}

export interface PlayerCareer {
  id: string;
  personal: PlayerPersonalInfo;
  appearance: PlayerAppearance;
  gear: SportGear;
  position: PositionId;
  playstyle: PlaystyleId;
  attributes: PlayerAttributes;
  ovr: number;
  xp: number;
  fatigue: number; // 0..100 (100 = exhausted)
  clubId: string;
  contract: Contract;
  season: number;
  round: number; // 1..38
  currentDayIndex: number;
  calendar: CalendarDay[];
  trainingLog: { dayLabel: string; drillName: string; medal: 'Ouro' | 'Prata' | 'Bronze'; gainText: string }[];
  trainingPoints: number;
  morale: number;
  coachTrust: number;
  popularity: number;
  nationalTeamCalled: boolean;
  injuryMatchesRemaining: number;
  injuryType: string | null;
  seasonStats: MatchStatLine;
  careerStats: MatchStatLine;
  recentMatches: MatchRecord[];
  awards: CareerAward[];
  history: CareerHistoryEntry[];
  evolutionHistory?: EvolutionPoint[];
  offers: TransferOffer[];
  standings: LeagueStanding[];
  leagueLeaders: LeagueLeader[];
  copaStage: 'Oitavas' | 'Quartas' | 'Semifinal' | 'Final' | 'Eliminado' | 'Campeão';
  estadualStage: 'Fase de Grupos' | 'Semifinal' | 'Final' | 'Campeão';
  schedule: { round: number; homeClubId: string; awayClubId: string; competition?: string }[];
}

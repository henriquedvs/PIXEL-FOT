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
  | 'CALENDAR_BROWSER'
  | 'SQUAD_BROWSER'
  | 'CUSTOMIZATION';

export type LanguageCode = 'pt-BR' | 'en-US' | 'es-ES';
export type GraphicsQuality = 'high' | 'medium' | 'low';
export type OrientationPref = 'landscape-auto' | 'landscape-locked';
export type ButtonSizePref = 'normal' | 'large';
export type ControlPositionPref = 'standard' | 'compact';
export type CameraAngleId = 'cima' | 'lado' | 'tv' | 'dinamica' | 'tatica' | 'jogador';
export type CameraZoomPreset = 'close' | 'normal' | 'wide';

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
  cameraAngle: CameraAngleId;
  cameraZoom: CameraZoomPreset;
  cameraCustomScale: number; // 0.75..1.35
  showMatchCommentary: boolean;
  showMatchRadar: boolean;
  showMatchPlayerBar: boolean;
  showMatchHints: boolean;
  hudCleanV2?: boolean;
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
  secondaryNationality?: string;
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

export type AttributeCreationMode = 'livre' | 'balanceado' | 'automatico';

export interface PlayerAttributes {
  velocidade: number;
  aceleracao: number;
  resistencia: number;
  forcaFisica: number;
  agilidade: number;
  equilibrio: number;
  impulsao: number;
  finalizacao: number;
  potenciaChute: number;
  precisaoChute: number;
  voleio: number;
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
  posicionamentoDefensivo: number;
  interceptacao: number;
  decisoes: number;
  compostura: number;
  lideranca: number;
  reflexos: number;
  elasticidade: number;
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
  nationality?: string;
  preferredFoot?: DominantFoot;
  number: number;
  position: PositionId;
  ovr: number;
  potential?: number;
  traits?: string[];
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
  penHomeScore?: number;
  penAwayScore?: number;
  fixtureId?: string;
  startedMatch?: boolean;
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

export type CopaStageId = 'Oitavas' | 'Quartas' | 'Semifinal' | 'Final';

export interface CopaMatchTie {
  id: string;
  stage: CopaStageId;
  slotIndex: number;
  homeClubId: string;
  awayClubId: string;
  twoLegged: boolean;
  homeScoreLeg1?: number;
  awayScoreLeg1?: number;
  homeScoreLeg2?: number;
  awayScoreLeg2?: number;
  penHome?: number;
  penAway?: number;
  playedLeg1: boolean;
  playedLeg2: boolean;
  winnerClubId?: string;
}

export interface CopaBracketState {
  season: number;
  currentStage: CopaStageId | 'Concluída';
  ties: CopaMatchTie[];
  championClubId?: string;
  runnerUpClubId?: string;
}

export interface SupercopaState {
  season: number;
  leagueChampId: string;
  copaChampId: string;
  homeScore?: number;
  awayScore?: number;
  penHome?: number;
  penAway?: number;
  winnerClubId?: string;
  played: boolean;
}

export interface RoundMatchResult {
  id: string;
  season: number;
  round: number;
  competition: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  penHome?: number;
  penAway?: number;
  dateLabel: string;
}

export type NewsCategory =
  | 'RODADA'
  | 'COPA'
  | 'SUPERCOPA'
  | 'ARTILHARIA'
  | 'MERCADO'
  | 'DESTAQUE';

export interface NewsItem {
  id: string;
  season: number;
  round: number;
  dateLabel: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  clubId?: string;
  opponentClubId?: string;
  artKind: 'match' | 'trophy' | 'player' | 'stadium' | 'transfer';
}

export type ObjectiveKind =
  | 'GOALS'
  | 'ASSISTS'
  | 'MATCHES'
  | 'OVR'
  | 'LEAGUE_POS'
  | 'COPA_STAGE'
  | 'AVG_RATING';

export interface SeasonObjective {
  id: string;
  title: string;
  description: string;
  kind: ObjectiveKind;
  target: number;
  current: number;
  completed: boolean;
  rewardText: string;
}

export interface CompetitionChampionRecord {
  season: number;
  competition: string;
  championClubId: string;
  runnerUpClubId?: string;
  scoreSummary?: string;
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
  monthIndex?: number; // 0..11
  weekday: string; // Seg, Ter...
  activity: CalendarActivityType;
  title: string;
  completed: boolean;
  matchId?: string;
  roundRef?: number;
  competition?: string;
  copaStage?: CopaStageId;
  copaLeg?: 1 | 2;
  isSupercopa?: boolean;
  opponentClubId?: string;
  isHome?: boolean;
  kickoffTime?: string;
  resultText?: string;
  note?: string;
  narrativeEventId?: string;
}

export interface SimMatchEvent {
  minute: number;
  type: 'GOL' | 'AMARELO' | 'VERMELHO' | 'SUBSTITUICAO' | 'DEFESA' | 'LESAO';
  clubId: string;
  playerName: string;
  assistName?: string;
  detail: string;
  isUserPlayer?: boolean;
}

export interface SimPlayerRating {
  playerId: string;
  name: string;
  number: number;
  position: PositionId;
  rating: number;
  goals: number;
  assists: number;
  yellowCard?: boolean;
  redCard?: boolean;
  subbedOut?: boolean;
  subbedIn?: boolean;
  isUser?: boolean;
}

export interface MatchSimReport {
  id: string;
  season: number;
  round: number;
  competition: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  penHomeScore?: number;
  penAwayScore?: number;
  stadiumName: string;
  weather: WeatherCondition;
  attendance: number;
  userRole: 'Titular' | 'Reserva' | 'Banco' | 'Lesionado' | 'Suspenso';
  userMinutes: number;
  userRating: number;
  motmName: string;
  motmClubId: string;
  events: SimMatchEvent[];
  stats: {
    possessionHome: number;
    shotsHome: number;
    shotsAway: number;
    shotsOnTargetHome: number;
    shotsOnTargetAway: number;
    cornersHome: number;
    cornersAway: number;
    foulsHome: number;
    foulsAway: number;
    savesHome: number;
    savesAway: number;
  };
  homeRatings: SimPlayerRating[];
  awayRatings: SimPlayerRating[];
}

export type NarrativeEventCategory =
  | 'COLETIVA'
  | 'VESTIARIO'
  | 'TREINADOR'
  | 'ZONA_MISTA'
  | 'CONTRATO'
  | 'ESPECIAL';

export interface NarrativeChoice {
  id: string;
  label: string;
  tone: 'Confiante' | 'Diplomático' | 'Autocrítico' | 'Focado';
  responseText: string;
  effects: {
    morale?: number;
    coachTrust?: number;
    popularity?: number;
    pressRelation?: number;
    teamChemistry?: number;
    fanSupport?: number;
    xp?: number;
    fatigue?: number;
  };
}

export interface NarrativeEvent {
  id: string;
  category: NarrativeEventCategory;
  title: string;
  speakerName: string;
  speakerRole: string;
  contextTag: string;
  prompt: string;
  choices: NarrativeChoice[];
}

export interface NarrativeDecisionRecord {
  eventId: string;
  dayIndex: number;
  dateLabel: string;
  category: NarrativeEventCategory;
  title: string;
  choiceLabel: string;
  summary: string;
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
  secondaryPositions?: PositionId[];
  playstyle: PlaystyleId;
  creationMode?: AttributeCreationMode;
  attributes: PlayerAttributes;
  ovr: number;
  potential?: number;
  marketValue?: number;
  traits?: string[];
  xp: number;
  fatigue: number; // 0..100 (100 = exhausted)
  clubId: string;
  division?: 'Série A' | 'Série B';
  serieAClubIds?: string[];
  serieBClubIds?: string[];
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
  pressRelation?: number;
  teamChemistry?: number;
  fanSupport?: number;
  nationalTeamCalled: boolean;
  injuryMatchesRemaining: number;
  injuryType: string | null;
  seasonStats: MatchStatLine;
  careerStats: MatchStatLine;
  competitionStats?: Record<string, MatchStatLine>;
  startsCount?: number;
  recentMatches: MatchRecord[];
  awards: CareerAward[];
  history: CareerHistoryEntry[];
  evolutionHistory?: EvolutionPoint[];
  offers: TransferOffer[];
  standings: LeagueStanding[];
  serieBStandings?: LeagueStanding[];
  leagueLeaders: LeagueLeader[];
  copaStage: 'Oitavas' | 'Quartas' | 'Semifinal' | 'Final' | 'Eliminado' | 'Campeão';
  estadualStage: 'Fase de Grupos' | 'Semifinal' | 'Final' | 'Campeão';
  schedule: { round: number; homeClubId: string; awayClubId: string; competition?: string }[];
  serieBSchedule?: { round: number; homeClubId: string; awayClubId: string; competition?: string }[];
  copaBracket?: CopaBracketState;
  supercopa?: SupercopaState;
  championsHistory?: CompetitionChampionRecord[];
  roundResults?: RoundMatchResult[];
  news?: NewsItem[];
  objectives?: SeasonObjective[];
  playedMatchIds?: string[];
  narrativeHistory?: NarrativeDecisionRecord[];
  lastSimReport?: MatchSimReport | null;
}

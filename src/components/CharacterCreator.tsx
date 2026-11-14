import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Shuffle, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getClubById } from '../data/clubs';
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_LABELS,
  PLAYSTYLES,
  POSITIONS,
  calculateMarketValue,
  calculateOverall,
  derivePlayerTraits,
  estimatePotential,
  generateBalancedPoolAttributes,
  generateInitialAttributes,
  getPositionMeta,
  suggestWeeklySalary,
} from '../data/positions';
import { drawPixelPlayerSprite } from '../engine/pixelRenderer';
import {
  AccessoryType,
  AttributeCreationMode,
  BeardStyle,
  BodyType,
  BootModel,
  CelebrationId,
  CollarStyle,
  DominantFoot,
  EyeStyle,
  EyebrowStyle,
  FaceShape,
  FaceStyle,
  FacialDetail,
  HairStyle,
  MustacheStyle,
  PlayerAnimAction,
  PlayerAppearance,
  PlayerAttributes,
  PlayerCareer,
  PlayerPersonalInfo,
  PlaystyleId,
  PositionGroup,
  PositionId,
  SleeveLength,
  SockType,
  SportGear,
} from '../types/game';
import { calculateAge } from '../utils/storage';
import { PixelBackdrop } from './PixelBackdrop';
import { PixelFlag } from './PixelIcons';

export interface CreatedCharacterDraft {
  personal: PlayerPersonalInfo;
  appearance: PlayerAppearance;
  gear: SportGear;
  position: PositionId;
  secondaryPositions: PositionId[];
  playstyle: PlaystyleId;
  creationMode: AttributeCreationMode;
  attributes: PlayerAttributes;
}

interface CharacterCreatorProps {
  initialCareer?: PlayerCareer | null;
  editMode?: boolean;
  onBack: () => void;
  onComplete: (draft: CreatedCharacterDraft) => void;
}

type CreatorTab = 'PESSOAL' | 'APARENCIA' | 'ESPORTIVO' | 'COMEMORACAO' | 'POSICAO' | 'ATRIBUTOS';
type ViewAngle = 'front' | 'back' | 'side';

const SKIN_TONES = ['#F6D2B8', '#E8B896', '#D19A6E', '#A8704A', '#73452A', '#4D2D1B'];
const HAIR_COLORS = ['#18181B', '#3F2718', '#6F4724', '#C49A45', '#991B1B', '#CBD5E1', '#10B981', '#38BDF8'];
const BOOT_COLORS = ['#10B981', '#FACC15', '#EF4444', '#3B82F6', '#F8FAFC', '#111827', '#EC4899'];
const HAIR_STYLES: HairStyle[] = [
  'Curto',
  'Moicano',
  'BlackPower',
  'Longo',
  'Raspado',
  'Topete',
  'Tranças',
  'Cacheado',
  'Franja',
];
const FACE_STYLES: FaceStyle[] = ['Sério', 'Confiante', 'Determinado', 'Sorriso'];
const FACE_SHAPES: FaceShape[] = ['Oval', 'Quadrado', 'Redondo', 'Fino'];
const FACIAL_DETAILS: FacialDetail[] = ['Nenhuma', 'Sardas', 'Cicatriz', 'Pintura'];
const EYE_STYLES: EyeStyle[] = ['Padrão', 'Focado', 'Expressivo'];
const BROW_STYLES: EyebrowStyle[] = ['Fina', 'Grossa', 'Arqueada'];
const BEARD_STYLES: BeardStyle[] = ['Nenhuma', 'Rala', 'Cheia', 'Cavanhaque'];
const MUSTACHE_STYLES: MustacheStyle[] = ['Nenhum', 'Fino', 'Clássico'];
const BODY_TYPES: BodyType[] = ['Magro', 'Atlético', 'Forte'];
const BOOT_MODELS: BootModel[] = ['Clássica', 'Velocidade', 'Controle', 'TravaAlta'];
const COLLAR_STYLES: CollarStyle[] = ['Redonda', 'Gola V', 'Polo'];
const ACCESSORIES: AccessoryType[] = [
  'Nenhum',
  'Munhequeira',
  'Faixa',
  'FaixaCabelo',
  'Bracadeira',
  'Joelho',
  'Luvas',
];

export const CELEBRATION_OPTIONS: {
  id: CelebrationId;
  label: string;
  action: PlayerAnimAction;
  desc: string;
}[] = [
  { id: 'knee_slide', label: 'Deslizar de Joelhos', action: 'celebrate_slide', desc: 'Corrida até a bandeirinha e deslize clássico no gramado.' },
  { id: 'arms_open', label: 'Braços Abertos', action: 'celebrate_arms', desc: 'Abre os braços vibrando diante da arquibancada.' },
  { id: 'point_sky', label: 'Apontar para o Céu', action: 'celebrate_sky', desc: 'Dedicação emocionante erguendo o braço ao alto.' },
  { id: 'jersey_show', label: 'Mostrar a Camisa', action: 'celebrate_shirt', desc: 'Exibe o manto e o número com orgulho para o estádio.' },
  { id: 'run_crowd', label: 'Correr até a Torcida', action: 'celebrate_crowd', desc: 'Dispara até a linha lateral para vibrar com a massa.' },
  { id: 'jump_fist', label: 'Salto com Soco no Ar', action: 'celebrate_jump', desc: 'Salto explosivo com punho cerrado após o gol.' },
  { id: 'dance', label: 'Dança Comemorativa', action: 'celebrate_dance', desc: 'Passos rítmicos estilosos celebrando com o time.' },
  { id: 'group_hug', label: 'Abraço Coletivo', action: 'celebrate_hug', desc: 'Reúne os companheiros em volta para comemorar juntos.' },
];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  initialCareer,
  editMode = false,
  onBack,
  onComplete,
}) => {
  const [tab, setTab] = useState<CreatorTab>(editMode ? 'APARENCIA' : 'PESSOAL');
  const [previewKitIdx, setPreviewKitIdx] = useState(0);
  const [viewAngle, setViewAngle] = useState<ViewAngle>('front');
  const [testCelebration, setTestCelebration] = useState(false);

  const [personal, setPersonal] = useState<PlayerPersonalInfo>(() =>
    initialCareer?.personal
      ? { ...initialCareer.personal }
      : {
          firstName: 'Gabriel',
          lastName: 'Mendes',
          nickname: 'Gabi',
          birthDate: '2007-05-14',
          nationality: 'Brasil',
          hometown: 'São Paulo',
          heightCm: 177,
          weightKg: 72,
        }
  );

  const [appearance, setAppearance] = useState<PlayerAppearance>(() =>
    initialCareer?.appearance
      ? {
          ...initialCareer.appearance,
          faceShape: initialCareer.appearance.faceShape ?? 'Oval',
          facialDetail: initialCareer.appearance.facialDetail ?? 'Nenhuma',
        }
      : {
          skinColor: SKIN_TONES[2],
          hairStyle: 'Topete',
          hairColor: HAIR_COLORS[0],
          faceStyle: 'Confiante',
          faceShape: 'Oval',
          facialDetail: 'Nenhuma',
          eyeStyle: 'Focado',
          eyebrowStyle: 'Grossa',
          beardStyle: 'Nenhuma',
          mustacheStyle: 'Nenhum',
          bodyType: 'Atlético',
          visualHeightScale: 1.0,
        }
  );

  const [gear, setGear] = useState<SportGear>(() =>
    initialCareer?.gear
      ? {
          ...initialCareer.gear,
          shirtName:
            initialCareer.gear.shirtName ??
            (initialCareer.personal.nickname || initialCareer.personal.lastName || 'GABI').toUpperCase(),
          collarStyle: initialCareer.gear.collarStyle ?? 'Redonda',
          celebrationId: initialCareer.gear.celebrationId ?? 'knee_slide',
        }
      : {
          jerseyNumber: 10,
          shirtName: 'GABI',
          collarStyle: 'Redonda',
          dominantFoot: 'Direito',
          bootModel: 'Velocidade',
          bootColor: BOOT_COLORS[0],
          sleeveLength: 'Curta',
          sockType: 'Alta',
          accessory: 'Munhequeira',
          celebrationId: 'knee_slide',
        }
  );

  const [position, setPosition] = useState<PositionId>(initialCareer?.position ?? 'CAM');
  const [secondaryPositions, setSecondaryPositions] = useState<PositionId[]>(
    initialCareer?.secondaryPositions ?? []
  );
  const [playstyle, setPlaystyle] = useState<PlaystyleId>(initialCareer?.playstyle ?? 'ARMADOR');
  const [creationMode, setCreationMode] = useState<AttributeCreationMode>(
    initialCareer?.creationMode ?? 'automatico'
  );
  const [bonusPoints, setBonusPoints] = useState(editMode ? 0 : 6);
  const [balancedBase, setBalancedBase] = useState<PlayerAttributes>(() =>
    generateBalancedPoolAttributes(initialCareer?.position ?? 'CAM', initialCareer?.playstyle ?? 'ARMADOR').baseAttributes
  );
  const [attributes, setAttributes] = useState<PlayerAttributes>(() =>
    initialCareer?.attributes
      ? { ...initialCareer.attributes }
      : generateInitialAttributes('CAM', 'ARMADOR')
  );

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const age = useMemo(() => calculateAge(personal.birthDate), [personal.birthDate]);
  const ovr = useMemo(() => calculateOverall(attributes, position), [attributes, position]);
  const potential = useMemo(() => estimatePotential(ovr, age), [ovr, age]);
  const marketValue = useMemo(
    () => calculateMarketValue(ovr, potential, age, position),
    [ovr, potential, age, position]
  );
  const suggestedSalary = useMemo(
    () => suggestWeeklySalary(ovr, 72, marketValue),
    [ovr, marketValue]
  );
  const derivedTraits = useMemo(
    () => derivePlayerTraits(attributes, position, playstyle),
    [attributes, position, playstyle]
  );
  const posMeta = useMemo(() => getPositionMeta(position), [position]);

  const applyCreationMode = (
    mode: AttributeCreationMode,
    targetPos: PositionId = position,
    targetStyle: PlaystyleId = playstyle
  ) => {
    setCreationMode(mode);
    if (editMode) return;
    if (mode === 'automatico') {
      setAttributes(generateInitialAttributes(targetPos, targetStyle, age));
      setBonusPoints(6);
    } else if (mode === 'balanceado') {
      const pool = generateBalancedPoolAttributes(targetPos, targetStyle, age);
      setBalancedBase(pool.baseAttributes);
      setAttributes({ ...pool.baseAttributes });
      setBonusPoints(pool.bonusPoints);
    } else {
      // 'livre' starts from current or initial attributes and unlocks full slider adjustment
      setAttributes(generateInitialAttributes(targetPos, targetStyle, age));
      setBonusPoints(0);
    }
  };

  const handlePositionOrStyleChange = (nextPos: PositionId, nextStyle: PlaystyleId) => {
    setPosition(nextPos);
    setPlaystyle(nextStyle);
    setSecondaryPositions((prev) => prev.filter((p) => p !== nextPos).slice(0, 2));
    if (!editMode) {
      applyCreationMode(creationMode, nextPos, nextStyle);
    }
    if (nextPos === 'GK_TRAD' || nextPos === 'GK_SWEEPER') {
      setGear((g) => ({ ...g, accessory: 'Luvas', jerseyNumber: editMode ? g.jerseyNumber : 1 }));
    }
  };

  const toggleSecondaryPosition = (posId: PositionId) => {
    if (posId === position) return;
    soundEngine.play('menu');
    setSecondaryPositions((prev) => {
      if (prev.includes(posId)) return prev.filter((p) => p !== posId);
      if (prev.length >= 2) return [prev[1], posId];
      return [...prev, posId];
    });
  };

  const adjustAttr = (key: keyof PlayerAttributes, delta: 1 | -1) => {
    if (editMode) return;
    const current = attributes[key];
    if (creationMode === 'livre') {
      const nextVal = Math.max(30, Math.min(88, current + delta));
      if (nextVal === current) return;
      soundEngine.play('menu');
      setAttributes((prev) => ({ ...prev, [key]: nextVal }));
      return;
    }

    if (delta === 1 && bonusPoints <= 0) return;
    const base =
      creationMode === 'balanceado'
        ? balancedBase[key]
        : generateInitialAttributes(position, playstyle, age)[key];
    if (delta === -1 && current <= base) return;
    if (delta === 1 && current >= 88) return;

    soundEngine.play('menu');
    setAttributes((prev) => ({ ...prev, [key]: prev[key] + delta }));
    setBonusPoints((p) => p - delta);
  };

  const setLivreAttr = (key: keyof PlayerAttributes, value: number) => {
    if (editMode || creationMode !== 'livre') return;
    const clamped = Math.max(30, Math.min(88, Math.round(value)));
    setAttributes((prev) => ({ ...prev, [key]: clamped }));
  };

  const randomizeCharacter = () => {
    soundEngine.play('menu');
    const names = ['Lucas', 'Kauã', 'Mateus', 'Rafael', 'Thiago', 'Bruno', 'Vitor', 'Igor'];
    const lasts = ['Silva', 'Oliveira', 'Costa', 'Pereira', 'Rocha', 'Almeida', 'Santos'];
    const cities = ['Rio de Janeiro', 'Belo Horizonte', 'Recife', 'Porto Alegre', 'Salvador', 'Curitiba'];
    const fn = names[Math.floor(Math.random() * names.length)];
    const ln = lasts[Math.floor(Math.random() * lasts.length)];
    if (!editMode) {
      setPersonal((p) => ({
        ...p,
        firstName: fn,
        lastName: ln,
        nickname: fn,
        hometown: cities[Math.floor(Math.random() * cities.length)],
        heightCm: 168 + Math.floor(Math.random() * 24),
        weightKg: 64 + Math.floor(Math.random() * 22),
      }));
    }
    setAppearance({
      skinColor: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      faceStyle: FACE_STYLES[Math.floor(Math.random() * FACE_STYLES.length)],
      faceShape: FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)],
      facialDetail: FACIAL_DETAILS[Math.floor(Math.random() * FACIAL_DETAILS.length)],
      eyeStyle: EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)],
      eyebrowStyle: BROW_STYLES[Math.floor(Math.random() * BROW_STYLES.length)],
      beardStyle: BEARD_STYLES[Math.floor(Math.random() * BEARD_STYLES.length)],
      mustacheStyle: MUSTACHE_STYLES[Math.floor(Math.random() * MUSTACHE_STYLES.length)],
      bodyType: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)],
      visualHeightScale: 0.94 + Math.random() * 0.14,
    });
    const randomCeleb = CELEBRATION_OPTIONS[Math.floor(Math.random() * CELEBRATION_OPTIONS.length)];
    setGear((g) => ({
      ...g,
      shirtName: editMode ? g.shirtName : fn.toUpperCase(),
      collarStyle: COLLAR_STYLES[Math.floor(Math.random() * COLLAR_STYLES.length)],
      jerseyNumber: 2 + Math.floor(Math.random() * 30),
      bootColor: BOOT_COLORS[Math.floor(Math.random() * BOOT_COLORS.length)],
      bootModel: BOOT_MODELS[Math.floor(Math.random() * BOOT_MODELS.length)],
      celebrationId: randomCeleb.id,
    }));
  };

  const previewKits = useMemo(() => {
    if (initialCareer) {
      const club = getClubById(initialCareer.clubId);
      return [
        club.kit,
        club.awayKit || club.kit,
        club.thirdKit || club.kit,
      ];
    }
    return [
      { primary: '#10B981', secondary: '#0F172A', shorts: '#0F172A', socks: '#10B981', pattern: 'stripes' as const, gkPrimary: '#FACC15' },
      { primary: '#DC2626', secondary: '#FFFFFF', shorts: '#111827', socks: '#DC2626', pattern: 'sash' as const, gkPrimary: '#38BDF8' },
      { primary: '#1D4ED8', secondary: '#F8FAFC', shorts: '#1E3A8A', socks: '#F8FAFC', pattern: 'halves' as const, gkPrimary: '#FB923C' },
    ];
  }, [initialCareer]);

  // Live Pixel Art preview loop
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    const draw = () => {
      phase += testCelebration ? 0.11 : 0.055;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F1A2A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle stadium spotlight backdrop
      ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.fillRect(40, 14, canvas.width - 80, canvas.height - 68);

      // Pixel pitch pedestal
      ctx.fillStyle = '#14532D';
      ctx.fillRect(18, canvas.height - 54, canvas.width - 36, 36);
      ctx.fillStyle = '#1B6E3A';
      ctx.fillRect(24, canvas.height - 50, canvas.width - 48, 28);
      ctx.fillStyle = '#228748';
      ctx.fillRect(38, canvas.height - 44, canvas.width - 76, 16);

      const isGk = position === 'GK_TRAD' || position === 'GK_SWEEPER';
      const celebOpt = CELEBRATION_OPTIONS.find((c) => c.id === gear.celebrationId);
      const activeAction: PlayerAnimAction = testCelebration
        ? celebOpt?.action || 'celebrate_arms'
        : 'idle';

      drawPixelPlayerSprite(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + 24 + (testCelebration ? 0 : Math.sin(phase) * 1.1),
        8.4,
        {
          appearance,
          gear,
          kit: previewKits[previewKitIdx % previewKits.length],
          isGoalkeeper: isGk,
          isUserControlled: false,
          facingAngle: 0,
          animPhase: phase,
          isSprinting: false,
          isDribbling: false,
          hasBall: false,
          action: activeAction,
          viewAngle: testCelebration ? 'front' : viewAngle,
        },
        'preview'
      );

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [appearance, gear, position, previewKitIdx, previewKits, viewAngle, testCelebration]);

  const handleSubmit = () => {
    soundEngine.play('menu');
    const cleanNick = personal.nickname.trim() || personal.firstName.trim() || 'Craque';
    onComplete({
      personal: {
        ...personal,
        firstName: personal.firstName.trim() || 'Jogador',
        lastName: personal.lastName.trim() || 'Silva',
        nickname: cleanNick,
      },
      appearance,
      gear: {
        ...gear,
        shirtName: (gear.shirtName || cleanNick).trim().toUpperCase().slice(0, 11),
      },
      position,
      secondaryPositions,
      playstyle,
      creationMode,
      attributes,
    });
  };

  const posGroups: { id: PositionGroup; label: string }[] = [
    { id: 'GOLEIRO', label: 'Goleiro' },
    { id: 'DEFESA', label: 'Defesa' },
    { id: 'MEIO_CAMPO', label: 'Meio-Campo' },
    { id: 'ATAQUE', label: 'Ataque' },
  ];

  const tabs: { id: CreatorTab; label: string }[] = editMode
    ? [
        { id: 'APARENCIA', label: 'Aparência & Rosto' },
        { id: 'ESPORTIVO', label: 'Uniforme & Chuteira' },
        { id: 'COMEMORACAO', label: 'Comemoração' },
        { id: 'PESSOAL', label: 'Dados Pessoais' },
      ]
    : [
        { id: 'PESSOAL', label: 'Dados Pessoais' },
        { id: 'APARENCIA', label: 'Aparência & Rosto' },
        { id: 'ESPORTIVO', label: 'Uniforme & Chuteira' },
        { id: 'COMEMORACAO', label: 'Comemoração' },
        { id: 'POSICAO', label: 'Posição & Estilo' },
        { id: 'ATRIBUTOS', label: 'Atributos' },
      ];

  return (
    <div className="px-shell animate-fadeIn">
      <PixelBackdrop
        homeKit={previewKits[previewKitIdx % previewKits.length]}
        awayKit={previewKits[(previewKitIdx + 1) % previewKits.length]}
        dimOpacity={0.86}
      />

      {/* Header */}
      <header className="relative z-10 px-header px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
          <div className="px-flag-stripe-br shrink-0" />
          <h1 className="font-display font-bold text-base sm:text-lg text-white uppercase whitespace-nowrap truncate">
            {editMode ? 'Personalização do Atleta' : 'Criação de Personagem'}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={randomizeCharacter}
            className="px-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase cursor-pointer whitespace-nowrap"
          >
            <Shuffle size={14} />
            Aleatório
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm uppercase cursor-pointer whitespace-nowrap"
          >
            {editMode ? (
              <>
                <Check size={16} />
                Salvar Personalização
              </>
            ) : (
              <>
                Escolher Clube
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Horizontal Split */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Left Live Pixel Art Preview */}
        <aside className="md:col-span-4 bg-[#071019]/82 border-b md:border-b-0 md:border-r border-[#1E3346] p-3 sm:p-4 flex flex-row md:flex-col items-center justify-between gap-3 shrink-0 overflow-y-auto custom-scroll">
          <div className="relative flex flex-col items-center w-auto md:w-full">
            <canvas
              ref={previewCanvasRef}
              width={220}
              height={220}
              className="w-[126px] h-[126px] sm:w-[196px] sm:h-[196px] rounded-[2px] border border-[#2C465E] pixelated bg-[#0B1522] shadow-[0_8px_22px_rgba(0,0,0,0.6)]"
            />

            {/* View Angle & Kit Selector */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
              {(
                [
                  { id: 'front', label: 'Frente' },
                  { id: 'back', label: 'Costas' },
                  { id: 'side', label: 'Lateral' },
                ] as { id: ViewAngle; label: string }[]
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    soundEngine.play('menu');
                    setTestCelebration(false);
                    setViewAngle(v.id);
                  }}
                  className={`px-2.5 py-1 rounded-[2px] border text-[11px] font-display font-bold uppercase cursor-pointer ${
                    !testCelebration && viewAngle === v.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-[#0C1724] border-[#22384C] text-slate-300 hover:border-[#4b7496]'
                  }`}
                >
                  {v.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setPreviewKitIdx((i) => i + 1);
                }}
                className="px-2.5 py-1 rounded-[2px] border border-[#22384C] bg-[#0C1724] hover:border-sky-400 text-[11px] font-display font-bold uppercase text-sky-300 cursor-pointer"
              >
                Kit {(previewKitIdx % 3) + 1}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.play(testCelebration ? 'menu' : 'celebration');
                setTestCelebration((v) => !v);
              }}
              className={`mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-[2px] border text-[11px] font-display font-bold uppercase cursor-pointer ${
                testCelebration
                  ? 'bg-[#E6B84C] text-slate-950 border-amber-300'
                  : 'bg-[#0C1724] border-[#22384C] hover:border-[#E6B84C] text-[#E6B84C]'
              }`}
            >
              <Sparkles size={12} />
              {testCelebration ? 'Parar Comemoração' : 'Testar Comemoração'}
            </button>
          </div>

          <div className="flex-1 md:w-full px-panel p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <PixelFlag nationality={personal.nationality} width={18} />
                  <div className="font-display font-bold text-base text-white uppercase truncate">
                    {personal.nickname || `${personal.firstName} ${personal.lastName}`}
                  </div>
                </div>
                <div className="text-xs font-mono-num text-slate-400 truncate mt-0.5">
                  {posMeta.name}
                  {secondaryPositions.length > 0
                    ? ` (${secondaryPositions.map((p) => getPositionMeta(p).code).join('/')})`
                    : ''}{' '}
                  · {age}a · #{gear.jerseyNumber}
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <div className="text-[10px] font-mono-num uppercase text-slate-400 font-semibold">OVR</div>
                <div className="font-mono-num text-2xl font-extrabold text-emerald-400 leading-none">
                  {ovr}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 border-t border-[#1E3346] pt-2 text-[10px] font-mono-num">
              <div className="px-panel-soft px-2 py-1">
                <div className="text-slate-500">POTENCIAL</div>
                <div className="font-bold text-sky-400">{potential}</div>
              </div>
              <div className="px-panel-soft px-2 py-1">
                <div className="text-slate-500">VALOR</div>
                <div className="font-bold text-emerald-400">
                  R$ {(marketValue / 1000000).toFixed(1)}M
                </div>
              </div>
              <div className="px-panel-soft px-2 py-1">
                <div className="text-slate-500">SALÁRIO</div>
                <div className="font-bold text-[#E6B84C]">
                  R$ {(suggestedSalary / 1000).toFixed(1)}k
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono-num text-slate-400 border-t border-[#1E3346] pt-1.5 flex justify-between">
              <span>{personal.heightCm} cm · {personal.weightKg} kg</span>
              <span>Pé: {gear.dominantFoot}</span>
            </div>
            {derivedTraits.length > 0 && (
              <div className="text-[10px] text-[#E6B84C] border-t border-[#1E3346] pt-1.5 truncate">
                Especialidades: {derivedTraits.slice(0, 3).join(' · ')}
              </div>
            )}
          </div>
        </aside>

        {/* Right Tabbed Editor */}
        <section className="md:col-span-8 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1E3346] bg-[#081018]/95 overflow-x-auto shrink-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setTab(t.id);
                }}
                className={`px-3.5 py-2 rounded-[2px] border text-xs font-display font-bold uppercase transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  tab === t.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-[#0C1724] text-slate-300 border-[#22384C] hover:border-[#4b7496]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Panel Body */}
          <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
            {tab === 'PESSOAL' && (
              <div className="px-panel p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Nome">
                  <input
                    type="text"
                    maxLength={18}
                    value={personal.firstName}
                    onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label="Sobrenome">
                  <input
                    type="text"
                    maxLength={20}
                    value={personal.lastName}
                    onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label="Apelido em campo">
                  <input
                    type="text"
                    maxLength={14}
                    value={personal.nickname}
                    onChange={(e) => setPersonal({ ...personal, nickname: e.target.value })}
                    className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label={`Data de nascimento (${age} anos)`}>
                  <input
                    type="date"
                    min="1985-01-01"
                    max="2010-12-31"
                    value={personal.birthDate}
                    onChange={(e) => setPersonal({ ...personal, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white focus:border-emerald-500 outline-none font-mono-num"
                  />
                </Field>
                <Field label="Nacionalidade Principal">
                  <input
                    type="text"
                    maxLength={22}
                    value={personal.nationality}
                    onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}
                    className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label="Segunda Nacionalidade (Opcional)">
                  <select
                    value={personal.secondaryNationality || ''}
                    onChange={(e) =>
                      setPersonal({
                        ...personal,
                        secondaryNationality: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="">Nenhuma</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Itália">Itália</option>
                    <option value="Espanha">Espanha</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Uruguai">Uruguai</option>
                    <option value="Japão">Japão</option>
                    <option value="Alemanha">Alemanha</option>
                    <option value="França">França</option>
                  </select>
                </Field>
                <Field label="Cidade natal">
                  <input
                    type="text"
                    maxLength={24}
                    value={personal.hometown}
                    onChange={(e) => setPersonal({ ...personal, hometown: e.target.value })}
                    className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label={`Altura: ${personal.heightCm} cm`}>
                  <input
                    type="range"
                    min={160}
                    max={202}
                    value={personal.heightCm}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setPersonal({ ...personal, heightCm: h });
                      setAppearance((a) => ({
                        ...a,
                        visualHeightScale: +(0.9 + ((h - 160) / 42) * 0.2).toFixed(2),
                      }));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </Field>
                <Field label={`Peso: ${personal.weightKg} kg`}>
                  <input
                    type="range"
                    min={56}
                    max={102}
                    value={personal.weightKg}
                    onChange={(e) => setPersonal({ ...personal, weightKg: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </Field>
              </div>
            )}

            {tab === 'APARENCIA' && (
              <div className="px-panel p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] font-mono-num uppercase text-slate-300 mb-1.5">Cor da pele</div>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TONES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAppearance({ ...appearance, skinColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-[2px] border-2 cursor-pointer ${
                            appearance.skinColor === c ? 'border-emerald-400 scale-110' : 'border-[#22384C]'
                          }`}
                          aria-label={`Tom de pele ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono-num uppercase text-slate-300 mb-1.5">Cor do cabelo</div>
                    <div className="flex flex-wrap gap-2">
                      {HAIR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAppearance({ ...appearance, hairColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-[2px] border-2 cursor-pointer ${
                            appearance.hairColor === c ? 'border-emerald-400 scale-110' : 'border-[#22384C]'
                          }`}
                          aria-label={`Cor de cabelo ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <OptionChips
                  label="Estilo de cabelo"
                  options={HAIR_STYLES}
                  value={appearance.hairStyle}
                  onChange={(v) => setAppearance({ ...appearance, hairStyle: v })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <OptionChips
                    label="Formato do rosto"
                    options={FACE_SHAPES}
                    value={appearance.faceShape || 'Oval'}
                    onChange={(v) => setAppearance({ ...appearance, faceShape: v })}
                  />
                  <OptionChips
                    label="Detalhes faciais"
                    options={FACIAL_DETAILS}
                    value={appearance.facialDetail || 'Nenhuma'}
                    onChange={(v) => setAppearance({ ...appearance, facialDetail: v })}
                  />
                  <OptionChips
                    label="Expressão do rosto"
                    options={FACE_STYLES}
                    value={appearance.faceStyle}
                    onChange={(v) => setAppearance({ ...appearance, faceStyle: v })}
                  />
                  <OptionChips
                    label="Olhos"
                    options={EYE_STYLES}
                    value={appearance.eyeStyle}
                    onChange={(v) => setAppearance({ ...appearance, eyeStyle: v })}
                  />
                  <OptionChips
                    label="Sobrancelhas"
                    options={BROW_STYLES}
                    value={appearance.eyebrowStyle}
                    onChange={(v) => setAppearance({ ...appearance, eyebrowStyle: v })}
                  />
                  <OptionChips
                    label="Barba"
                    options={BEARD_STYLES}
                    value={appearance.beardStyle}
                    onChange={(v) => setAppearance({ ...appearance, beardStyle: v })}
                  />
                  <OptionChips
                    label="Bigode"
                    options={MUSTACHE_STYLES}
                    value={appearance.mustacheStyle}
                    onChange={(v) => setAppearance({ ...appearance, mustacheStyle: v })}
                  />
                  <OptionChips
                    label="Porte físico"
                    options={BODY_TYPES}
                    value={appearance.bodyType}
                    onChange={(v) => setAppearance({ ...appearance, bodyType: v })}
                  />
                </div>

                <Field label={`Altura visual do sprite: ${Math.round(appearance.visualHeightScale * 100)}%`}>
                  <input
                    type="range"
                    min={90}
                    max={112}
                    value={Math.round(appearance.visualHeightScale * 100)}
                    onChange={(e) =>
                      setAppearance({
                        ...appearance,
                        visualHeightScale: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </Field>
              </div>
            )}

            {tab === 'ESPORTIVO' && (
              <div className="px-panel p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nome na camisa (visão Costas)">
                    <input
                      type="text"
                      maxLength={11}
                      value={gear.shirtName ?? personal.nickname}
                      onChange={(e) =>
                        setGear({ ...gear, shirtName: e.target.value.toUpperCase() })
                      }
                      onFocus={() => setViewAngle('back')}
                      className="w-full px-3 py-2 rounded-[2px] bg-[#071019] border border-[#22384C] text-sm text-white font-mono-num uppercase focus:border-emerald-500 outline-none"
                    />
                  </Field>
                  <Field label={`Número da camisa: #${gear.jerseyNumber}`}>
                    <input
                      type="range"
                      min={1}
                      max={99}
                      value={gear.jerseyNumber}
                      onChange={(e) =>
                        setGear({ ...gear, jerseyNumber: Number(e.target.value) })
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OptionChips
                    label="Estilo da gola"
                    options={COLLAR_STYLES}
                    value={gear.collarStyle || 'Redonda'}
                    onChange={(v) => setGear({ ...gear, collarStyle: v })}
                  />
                  <OptionChips
                    label="Pé dominante"
                    options={['Direito', 'Esquerdo', 'Ambidestro'] as DominantFoot[]}
                    value={gear.dominantFoot}
                    onChange={(v) => setGear({ ...gear, dominantFoot: v })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OptionChips
                    label="Modelo de chuteira"
                    options={BOOT_MODELS}
                    value={gear.bootModel}
                    onChange={(v) => setGear({ ...gear, bootModel: v })}
                  />
                  <div>
                    <div className="text-[11px] font-mono-num uppercase text-slate-300 mb-1.5">Cor da chuteira</div>
                    <div className="flex flex-wrap gap-2">
                      {BOOT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setGear({ ...gear, bootColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-[2px] border-2 cursor-pointer ${
                            gear.bootColor === c ? 'border-emerald-400 scale-110' : 'border-[#22384C]'
                          }`}
                          aria-label={`Cor de chuteira ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OptionChips
                    label="Comprimento das mangas"
                    options={['Curta', 'Longa'] as SleeveLength[]}
                    value={gear.sleeveLength}
                    onChange={(v) => setGear({ ...gear, sleeveLength: v })}
                  />
                  <OptionChips
                    label="Tipo de meião"
                    options={['Curta', 'Média', 'Alta'] as SockType[]}
                    value={gear.sockType}
                    onChange={(v) => setGear({ ...gear, sockType: v })}
                  />
                </div>

                <OptionChips
                  label="Acessórios esportivos"
                  options={ACCESSORIES}
                  value={gear.accessory}
                  onChange={(v) => setGear({ ...gear, accessory: v })}
                />
              </div>
            )}

            {tab === 'COMEMORACAO' && (
              <div className="space-y-3">
                <div className="px-panel p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-display font-bold text-white uppercase">
                      Escolha sua Comemoração de Gol
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Clique em uma opção para visualizar a animação em Pixel Art no painel à esquerda.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CELEBRATION_OPTIONS.map((opt) => {
                    const active = (gear.celebrationId || 'knee_slide') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          soundEngine.play('celebration');
                          setGear({ ...gear, celebrationId: opt.id });
                          setViewAngle('front');
                          setTestCelebration(true);
                        }}
                        className={`p-3 text-left transition-colors cursor-pointer ${
                          active ? 'px-panel-active text-white' : 'px-panel-soft text-slate-300 hover:border-[#4b7496]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-xs text-white uppercase">
                            {opt.label}
                          </span>
                          {active && (
                            <span className="text-[10px] font-mono-num font-bold text-emerald-400">
                              SELECIONADA
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'POSICAO' && !editMode && (
              <div className="px-panel p-4 space-y-4">
                <div>
                  <div className="text-xs font-display font-bold uppercase text-slate-300 mb-2">
                    Escolha sua Posição Principal
                  </div>
                  <div className="space-y-3">
                    {posGroups.map((grp) => (
                      <div key={grp.id}>
                        <div className="text-[11px] font-mono-num font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                          {grp.label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {POSITIONS.filter((p) => p.group === grp.id).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                soundEngine.play('menu');
                                handlePositionOrStyleChange(p.id, playstyle);
                              }}
                              className={`px-3 py-1.5 rounded-[2px] border text-xs font-display font-bold uppercase cursor-pointer transition-colors ${
                                position === p.id
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : 'bg-[#081018] border-[#22384C] text-slate-300 hover:border-[#4b7496]'
                              }`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{posMeta.description}</p>
                </div>

                <div className="border-t border-[#1E3346] pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-display font-bold uppercase text-slate-300">
                      Posições Secundárias (até 2)
                    </span>
                    <span className="text-[11px] font-mono-num text-emerald-400">
                      {secondaryPositions.length}/2 selecionadas
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POSITIONS.filter((p) => p.id !== position).map((p) => {
                      const active = secondaryPositions.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleSecondaryPosition(p.id)}
                          className={`px-2.5 py-1.5 rounded-[2px] border text-[11px] font-mono-num cursor-pointer transition-colors ${
                            active
                              ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                              : 'bg-[#081018] border-[#22384C] text-slate-300 hover:border-[#4b7496]'
                          }`}
                        >
                          {p.code} · {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#1E3346] pt-3">
                  <div className="text-xs font-display font-bold uppercase text-slate-300 mb-2">
                    Estilo de Jogo (8 Perfis Táticos)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PLAYSTYLES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          soundEngine.play('menu');
                          handlePositionOrStyleChange(position, st.id);
                        }}
                        className={`p-2.5 text-left transition-colors cursor-pointer ${
                          playstyle === st.id
                            ? 'px-panel-active text-white'
                            : 'px-panel-soft text-slate-300 hover:border-[#4b7496]'
                        }`}
                      >
                        <div className="text-xs font-display font-bold uppercase text-white">{st.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{st.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ATRIBUTOS' && !editMode && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: 'automatico',
                        title: 'Automático',
                        desc: 'Base fiel à posição e estilo + 6 pontos extras.',
                      },
                      {
                        id: 'balanceado',
                        title: 'Balanceado (Pontos)',
                        desc: 'Receba 36 pontos livres para moldar seu craque.',
                      },
                      {
                        id: 'livre',
                        title: 'Livre (Sliders)',
                        desc: 'Ajuste qualquer atributo diretamente entre 30 e 88.',
                      },
                    ] as { id: AttributeCreationMode; title: string; desc: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        soundEngine.play('menu');
                        applyCreationMode(m.id);
                      }}
                      className={`p-3 text-left cursor-pointer transition-colors ${
                        creationMode === m.id
                          ? 'px-panel-active text-white'
                          : 'px-panel-soft text-slate-300 hover:border-[#4b7496]'
                      }`}
                    >
                      <div className="text-xs font-display font-bold uppercase text-white">{m.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="px-panel px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-display font-bold uppercase text-white">
                      Modo {creationMode === 'livre' ? 'Livre' : creationMode === 'balanceado' ? 'Balanceado' : 'Automático'} · OVR {ovr} · Potencial {potential}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {posMeta.name} ({playstyle}) · Especialidades: {derivedTraits.slice(0, 2).join(', ')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-400 font-mono-num">
                      {creationMode === 'livre'
                        ? 'Edição livre (30–88)'
                        : `${bonusPoints} pontos disponíveis`}
                    </span>
                  </div>
                </div>

                <div className="px-panel p-4 space-y-4">
                  {ATTRIBUTE_CATEGORIES.map((category) => {
                    const playerIsGk = position === 'GK_TRAD' || position === 'GK_SWEEPER';
                    if (category === 'Goleiro' && !playerIsGk && creationMode !== 'livre') return null;
                    const items = ATTRIBUTE_LABELS.filter((a) => a.category === category);
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="text-[11px] font-mono-num font-bold uppercase tracking-wider text-emerald-400 border-b border-[#1E3346] pb-1">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map((item) => {
                            const val = attributes[item.key];
                            return (
                              <div
                                key={item.key}
                                className="px-panel-soft px-3 py-2 space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-slate-200 truncate">{item.label}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => adjustAttr(item.key, -1)}
                                      className="px-btn-secondary w-7 h-7 text-xs font-bold cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="w-7 text-center font-mono-num text-xs font-bold text-emerald-400">
                                      {val}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => adjustAttr(item.key, 1)}
                                      className="px-btn-secondary w-7 h-7 text-xs font-bold cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                {creationMode === 'livre' && (
                                  <input
                                    type="range"
                                    min={30}
                                    max={88}
                                    value={val}
                                    onChange={(e) => setLivreAttr(item.key, Number(e.target.value))}
                                    aria-label={item.label}
                                    className="w-full accent-emerald-500 cursor-pointer h-1.5"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-mono-num uppercase text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function OptionChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-mono-num uppercase text-slate-300">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onChange(opt);
            }}
            className={`px-2.5 py-1.5 rounded-[2px] border text-xs font-display font-bold uppercase transition-colors cursor-pointer ${
              value === opt
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-[#081018] border-[#22384C] text-slate-300 hover:border-[#4b7496]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

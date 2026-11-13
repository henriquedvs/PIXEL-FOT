import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  ATTRIBUTE_LABELS,
  PLAYSTYLES,
  POSITIONS,
  calculateOverall,
  generateInitialAttributes,
  getPositionMeta,
} from '../data/positions';
import { drawPixelPlayerSprite } from '../engine/pixelRenderer';
import {
  AccessoryType,
  BeardStyle,
  BodyType,
  BootModel,
  DominantFoot,
  EyeStyle,
  EyebrowStyle,
  FaceStyle,
  HairStyle,
  MustacheStyle,
  PlayerAppearance,
  PlayerAttributes,
  PlayerPersonalInfo,
  PlaystyleId,
  PositionGroup,
  PositionId,
  SleeveLength,
  SockType,
  SportGear,
} from '../types/game';
import { calculateAge } from '../utils/storage';

export interface CreatedCharacterDraft {
  personal: PlayerPersonalInfo;
  appearance: PlayerAppearance;
  gear: SportGear;
  position: PositionId;
  playstyle: PlaystyleId;
  attributes: PlayerAttributes;
}

interface CharacterCreatorProps {
  onBack: () => void;
  onComplete: (draft: CreatedCharacterDraft) => void;
}

type CreatorTab = 'PESSOAL' | 'APARENCIA' | 'ESPORTIVO' | 'POSICAO' | 'ATRIBUTOS';

const SKIN_TONES = ['#F6D2B8', '#E8B896', '#D19A6E', '#A8704A', '#73452A', '#4D2D1B'];
const HAIR_COLORS = ['#18181B', '#3F2718', '#6F4724', '#C49A45', '#991B1B', '#CBD5E1'];
const BOOT_COLORS = ['#10B981', '#FACC15', '#EF4444', '#3B82F6', '#F8FAFC', '#111827'];
const HAIR_STYLES: HairStyle[] = ['Curto', 'Moicano', 'BlackPower', 'Longo', 'Raspado', 'Topete', 'Tranças'];
const FACE_STYLES: FaceStyle[] = ['Sério', 'Confiante', 'Determinado', 'Sorriso'];
const EYE_STYLES: EyeStyle[] = ['Padrão', 'Focado', 'Expressivo'];
const BROW_STYLES: EyebrowStyle[] = ['Fina', 'Grossa', 'Arqueada'];
const BEARD_STYLES: BeardStyle[] = ['Nenhuma', 'Rala', 'Cheia', 'Cavanhaque'];
const MUSTACHE_STYLES: MustacheStyle[] = ['Nenhum', 'Fino', 'Clássico'];
const BODY_TYPES: BodyType[] = ['Magro', 'Atlético', 'Forte'];
const BOOT_MODELS: BootModel[] = ['Clássica', 'Velocidade', 'Controle', 'TravaAlta'];
const ACCESSORIES: AccessoryType[] = ['Nenhum', 'Munhequeira', 'Faixa', 'Joelho', 'Luvas'];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  onBack,
  onComplete,
}) => {
  const [tab, setTab] = useState<CreatorTab>('PESSOAL');
  const [previewKitIdx, setPreviewKitIdx] = useState(0);

  const [personal, setPersonal] = useState<PlayerPersonalInfo>({
    firstName: 'Gabriel',
    lastName: 'Mendes',
    nickname: 'Gabi',
    birthDate: '2007-05-14',
    nationality: 'Brasil',
    hometown: 'São Paulo',
    heightCm: 177,
    weightKg: 72,
  });

  const [appearance, setAppearance] = useState<PlayerAppearance>({
    skinColor: SKIN_TONES[2],
    hairStyle: 'Topete',
    hairColor: HAIR_COLORS[0],
    faceStyle: 'Confiante',
    eyeStyle: 'Focado',
    eyebrowStyle: 'Grossa',
    beardStyle: 'Nenhuma',
    mustacheStyle: 'Nenhum',
    bodyType: 'Atlético',
    visualHeightScale: 1.0,
  });

  const [gear, setGear] = useState<SportGear>({
    jerseyNumber: 10,
    dominantFoot: 'Direito',
    bootModel: 'Velocidade',
    bootColor: BOOT_COLORS[0],
    sleeveLength: 'Curta',
    sockType: 'Alta',
    accessory: 'Munhequeira',
  });

  const [position, setPosition] = useState<PositionId>('CAM');
  const [playstyle, setPlaystyle] = useState<PlaystyleId>('ARMADOR');
  const [bonusPoints, setBonusPoints] = useState(6);
  const [attributes, setAttributes] = useState<PlayerAttributes>(() =>
    generateInitialAttributes('CAM', 'ARMADOR')
  );

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const age = useMemo(() => calculateAge(personal.birthDate), [personal.birthDate]);
  const ovr = useMemo(() => calculateOverall(attributes, position), [attributes, position]);
  const posMeta = useMemo(() => getPositionMeta(position), [position]);

  const handlePositionOrStyleChange = (nextPos: PositionId, nextStyle: PlaystyleId) => {
    setPosition(nextPos);
    setPlaystyle(nextStyle);
    setAttributes(generateInitialAttributes(nextPos, nextStyle));
    setBonusPoints(6);
    if (nextPos === 'GK_TRAD' || nextPos === 'GK_SWEEPER') {
      setGear((g) => ({ ...g, accessory: 'Luvas', jerseyNumber: 1 }));
    }
  };

  const adjustAttr = (key: keyof PlayerAttributes, delta: 1 | -1) => {
    if (delta === 1 && bonusPoints <= 0) return;
    const base = generateInitialAttributes(position, playstyle)[key];
    const current = attributes[key];
    if (delta === -1 && current <= base) return;
    if (delta === 1 && current >= 88) return;

    soundEngine.play('menu');
    setAttributes((prev) => ({ ...prev, [key]: prev[key] + delta }));
    setBonusPoints((p) => p - delta);
  };

  const randomizeCharacter = () => {
    soundEngine.play('menu');
    const names = ['Lucas', 'Kauã', 'Mateus', 'Rafael', 'Thiago', 'Bruno', 'Vitor', 'Igor'];
    const lasts = ['Silva', 'Oliveira', 'Costa', 'Pereira', 'Rocha', 'Almeida', 'Santos'];
    const cities = ['Rio de Janeiro', 'Belo Horizonte', 'Recife', 'Porto Alegre', 'Salvador', 'Curitiba'];
    const fn = names[Math.floor(Math.random() * names.length)];
    const ln = lasts[Math.floor(Math.random() * lasts.length)];
    setPersonal((p) => ({
      ...p,
      firstName: fn,
      lastName: ln,
      nickname: fn,
      hometown: cities[Math.floor(Math.random() * cities.length)],
      heightCm: 168 + Math.floor(Math.random() * 24),
      weightKg: 64 + Math.floor(Math.random() * 22),
    }));
    setAppearance({
      skinColor: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
      hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      faceStyle: FACE_STYLES[Math.floor(Math.random() * FACE_STYLES.length)],
      eyeStyle: EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)],
      eyebrowStyle: BROW_STYLES[Math.floor(Math.random() * BROW_STYLES.length)],
      beardStyle: BEARD_STYLES[Math.floor(Math.random() * BEARD_STYLES.length)],
      mustacheStyle: MUSTACHE_STYLES[Math.floor(Math.random() * MUSTACHE_STYLES.length)],
      bodyType: BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)],
      visualHeightScale: 0.94 + Math.random() * 0.14,
    });
    setGear((g) => ({
      ...g,
      jerseyNumber: 2 + Math.floor(Math.random() * 30),
      bootColor: BOOT_COLORS[Math.floor(Math.random() * BOOT_COLORS.length)],
      bootModel: BOOT_MODELS[Math.floor(Math.random() * BOOT_MODELS.length)],
    }));
  };

  // Live Pixel Art preview loop
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const kits = [
      { primary: '#10B981', secondary: '#0F172A', shorts: '#0F172A', socks: '#10B981', pattern: 'stripes' as const, gkPrimary: '#FACC15' },
      { primary: '#DC2626', secondary: '#FFFFFF', shorts: '#111827', socks: '#DC2626', pattern: 'sash' as const, gkPrimary: '#38BDF8' },
      { primary: '#1D4ED8', secondary: '#F8FAFC', shorts: '#1E3A8A', socks: '#F8FAFC', pattern: 'halves' as const, gkPrimary: '#FB923C' },
    ];

    let raf = 0;
    let phase = 0;
    const draw = () => {
      phase += 0.06;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0F1A2A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pixel pitch pedestal
      ctx.fillStyle = '#1B6E3A';
      ctx.fillRect(24, canvas.height - 52, canvas.width - 48, 30);
      ctx.fillStyle = '#1F7A41';
      ctx.fillRect(36, canvas.height - 46, canvas.width - 72, 18);

      const isGk = position === 'GK_TRAD' || position === 'GK_SWEEPER';
      drawPixelPlayerSprite(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + 28 + Math.sin(phase) * 1.2,
        8.5,
        {
          appearance,
          gear,
          kit: kits[previewKitIdx % kits.length],
          isGoalkeeper: isGk,
          isUserControlled: false,
          facingAngle: 0,
          animPhase: phase,
          isSprinting: false,
          isDribbling: false,
          hasBall: false,
        },
        'preview'
      );

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [appearance, gear, position, previewKitIdx]);

  const handleSubmit = () => {
    soundEngine.play('menu');
    onComplete({
      personal: {
        ...personal,
        firstName: personal.firstName.trim() || 'Jogador',
        lastName: personal.lastName.trim() || 'Silva',
        nickname: personal.nickname.trim() || personal.firstName.trim() || 'Craque',
      },
      appearance,
      gear,
      position,
      playstyle,
      attributes,
    });
  };

  const posGroups: { id: PositionGroup; label: string }[] = [
    { id: 'GOLEIRO', label: 'Goleiro' },
    { id: 'DEFESA', label: 'Defesa' },
    { id: 'MEIO_CAMPO', label: 'Meio-Campo' },
    { id: 'ATAQUE', label: 'Ataque' },
  ];

  return (
    <div className="w-full h-[100dvh] bg-[#0B121D] text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-2.5 border-b border-slate-800 bg-[#0D1624] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={15} />
            Menu
          </button>
          <h1 className="font-display font-bold text-base sm:text-lg text-white whitespace-nowrap">
            Criação de Personagem
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={randomizeCharacter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Shuffle size={14} />
            Aleatório
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
          >
            Escolher Clube
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Main Horizontal Split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Left Live Pixel Art Preview */}
        <aside className="md:col-span-4 bg-[#0E1826] border-b md:border-b-0 md:border-r border-slate-800 p-3 sm:p-4 flex flex-row md:flex-col items-center justify-between gap-3 shrink-0">
          <div className="relative flex flex-col items-center">
            <canvas
              ref={previewCanvasRef}
              width={210}
              height={210}
              className="w-[130px] h-[130px] sm:w-[190px] sm:h-[190px] rounded-xl border border-slate-700/80 pixelated bg-[#0F1A2A]"
            />
            <button
              type="button"
              onClick={() => {
                soundEngine.play('menu');
                setPreviewKitIdx((i) => i + 1);
              }}
              className="mt-2 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 cursor-pointer whitespace-nowrap"
            >
              Alternar Uniforme Teste
            </button>
          </div>

          <div className="flex-1 md:w-full bg-slate-900/75 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-display font-bold text-base text-white truncate">
                  {personal.nickname || `${personal.firstName} ${personal.lastName}`}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {posMeta.name} · {age} anos · #{gear.jerseyNumber}
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">OVR</div>
                <div className="font-mono-num text-2xl font-extrabold text-emerald-400 leading-none">
                  {ovr}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 flex justify-between">
              <span>{personal.heightCm} cm · {personal.weightKg} kg</span>
              <span>Pé: {gear.dominantFoot}</span>
            </div>
          </div>
        </aside>

        {/* Right Tabbed Editor */}
        <section className="md:col-span-8 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800 bg-[#0D1624] overflow-x-auto shrink-0">
            {(
              [
                { id: 'PESSOAL', label: 'Dados Pessoais' },
                { id: 'APARENCIA', label: 'Aparência' },
                { id: 'ESPORTIVO', label: 'Esportivo' },
                { id: 'POSICAO', label: 'Posição & Estilo' },
                { id: 'ATRIBUTOS', label: 'Atributos' },
              ] as { id: CreatorTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  soundEngine.play('menu');
                  setTab(t.id);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  tab === t.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Panel Body */}
          <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
            {tab === 'PESSOAL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Nome">
                  <input
                    type="text"
                    maxLength={18}
                    value={personal.firstName}
                    onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label="Sobrenome">
                  <input
                    type="text"
                    maxLength={20}
                    value={personal.lastName}
                    onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label="Apelido em campo">
                  <input
                    type="text"
                    maxLength={14}
                    value={personal.nickname}
                    onChange={(e) => setPersonal({ ...personal, nickname: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label={`Data de nascimento (${age} anos)`}>
                  <input
                    type="date"
                    min="1985-01-01"
                    max="2010-12-31"
                    value={personal.birthDate}
                    onChange={(e) => setPersonal({ ...personal, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label="Nacionalidade">
                  <input
                    type="text"
                    maxLength={22}
                    value={personal.nationality}
                    onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                </Field>
                <Field label="Cidade natal">
                  <input
                    type="text"
                    maxLength={24}
                    value={personal.hometown}
                    onChange={(e) => setPersonal({ ...personal, hometown: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:border-emerald-500 outline-none"
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-1.5">Cor da pele</div>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_TONES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAppearance({ ...appearance, skinColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-lg border-2 cursor-pointer ${
                            appearance.skinColor === c ? 'border-emerald-400 scale-110' : 'border-slate-700'
                          }`}
                          aria-label={`Tom de pele ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-1.5">Cor do cabelo</div>
                    <div className="flex flex-wrap gap-2">
                      {HAIR_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAppearance({ ...appearance, hairColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-lg border-2 cursor-pointer ${
                            appearance.hairColor === c ? 'border-emerald-400 scale-110' : 'border-slate-700'
                          }`}
                          aria-label={`Cor de cabelo ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <OptionChips
                  label="Tipo de cabelo"
                  options={HAIR_STYLES}
                  value={appearance.hairStyle}
                  onChange={(v) => setAppearance({ ...appearance, hairStyle: v })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <OptionChips
                    label="Estilo do rosto"
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
                    label="Tipo físico"
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="text-xs font-semibold text-slate-300 mb-1.5">Cor da chuteira</div>
                    <div className="flex flex-wrap gap-2">
                      {BOOT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setGear({ ...gear, bootColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-lg border-2 cursor-pointer ${
                            gear.bootColor === c ? 'border-emerald-400 scale-110' : 'border-slate-700'
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
                    label="Tipo de meia"
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

            {tab === 'POSICAO' && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Escolha sua Posição Principal
                  </div>
                  <div className="space-y-3">
                    {posGroups.map((grp) => (
                      <div key={grp.id}>
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
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
                              className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                                position === p.id
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
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

                <div className="border-t border-slate-800 pt-3">
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Estilo de Jogo
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
                        className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          playstyle === st.id
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold">{st.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{st.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'ATRIBUTOS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-lg px-3.5 py-2.5">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Distribuição Inicial Equilibrada · OVR {ovr}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Atributos ajustados pela posição ({posMeta.name}) e estilo ({playstyle}).
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-emerald-400 font-mono-num">
                      {bonusPoints} pontos bônus
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ATTRIBUTE_LABELS.map((item) => {
                    const isGkAttr = item.category === 'Goleiro';
                    const playerIsGk = position === 'GK_TRAD' || position === 'GK_SWEEPER';
                    if (isGkAttr && !playerIsGk) return null;
                    const val = attributes[item.key];
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
                      >
                        <span className="text-xs text-slate-300 truncate">{item.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustAttr(item.key, -1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-mono-num text-xs font-bold text-emerald-400">
                            {val}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustAttr(item.key, 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                          >
                            +
                          </button>
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
      <span className="text-xs font-semibold text-slate-300">{label}</span>
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
      <div className="text-xs font-semibold text-slate-300">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              soundEngine.play('menu');
              onChange(opt);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              value === opt
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

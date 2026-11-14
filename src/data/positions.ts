import {
  PlayerAttributes,
  PlaystyleId,
  PositionGroup,
  PositionId,
} from '../types/game';

export interface PositionMeta {
  id: PositionId;
  code: string;
  name: string;
  group: PositionGroup;
  description: string;
  weights: Partial<Record<keyof PlayerAttributes, number>>;
}

export const POSITIONS: PositionMeta[] = [
  // GOLEIRO
  {
    id: 'GK_TRAD',
    code: 'GOL',
    name: 'Goleiro tradicional',
    group: 'GOLEIRO',
    description: 'Especialista debaixo das traves, foco em reflexos, elasticidade e defesa de chutes.',
    weights: {
      reflexos: 0.23,
      elasticidade: 0.19,
      posicionamentoGk: 0.21,
      saidasGol: 0.12,
      defesaPenaltis: 0.11,
      reposicao: 0.08,
      compostura: 0.06,
    },
  },
  {
    id: 'GK_SWEEPER',
    code: 'GOL',
    name: 'Goleiro líbero',
    group: 'GOLEIRO',
    description: 'Atua avançado na área, participa da saída de bola e antecipa lançamentos.',
    weights: {
      reflexos: 0.18,
      elasticidade: 0.15,
      posicionamentoGk: 0.17,
      saidasGol: 0.18,
      reposicao: 0.14,
      passeCurto: 0.07,
      passeLongo: 0.06,
      decisoes: 0.05,
    },
  },
  // DEFESA
  {
    id: 'CB_STOPPER',
    code: 'ZAG',
    name: 'Zagueiro',
    group: 'DEFESA',
    description: 'Defensor central sólido nos duelos físicos, impulsão, cabeceio e cortes na área.',
    weights: {
      marcacao: 0.18,
      desarme: 0.16,
      posicionamentoDefensivo: 0.15,
      forcaFisica: 0.13,
      impulsao: 0.11,
      cabeceio: 0.11,
      interceptacao: 0.10,
      compostura: 0.06,
    },
  },
  {
    id: 'CB_BALL',
    code: 'ZAG',
    name: 'Zagueiro construtor',
    group: 'DEFESA',
    description: 'Inicia jogadas desde a defesa com passes precisos e leitura tática.',
    weights: {
      marcacao: 0.14,
      desarme: 0.13,
      posicionamentoDefensivo: 0.14,
      interceptacao: 0.12,
      passeCurto: 0.15,
      passeLongo: 0.13,
      visaoJogo: 0.10,
      compostura: 0.09,
    },
  },
  {
    id: 'RB',
    code: 'LD',
    name: 'Lateral-direito',
    group: 'DEFESA',
    description: 'Equilíbrio entre marcação pelo corredor direito e apoio ao ataque.',
    weights: {
      velocidade: 0.15,
      aceleracao: 0.13,
      resistencia: 0.14,
      cruzamento: 0.14,
      marcacao: 0.14,
      desarme: 0.13,
      posicionamentoDefensivo: 0.09,
      passeCurto: 0.08,
    },
  },
  {
    id: 'LB',
    code: 'LE',
    name: 'Lateral-esquerdo',
    group: 'DEFESA',
    description: 'Velocidade e fôlego para fechar o lado esquerdo e cruzar bolas na área.',
    weights: {
      velocidade: 0.15,
      aceleracao: 0.13,
      resistencia: 0.14,
      cruzamento: 0.14,
      marcacao: 0.14,
      desarme: 0.13,
      posicionamentoDefensivo: 0.09,
      passeCurto: 0.08,
    },
  },
  {
    id: 'WB',
    code: 'ALA',
    name: 'Ala',
    group: 'DEFESA',
    description: 'Domina toda a faixa lateral do campo, com grande apoio ofensivo e fôlego.',
    weights: {
      velocidade: 0.16,
      resistencia: 0.16,
      cruzamento: 0.15,
      drible: 0.13,
      aceleracao: 0.12,
      desarme: 0.11,
      passeCurto: 0.10,
      decisoes: 0.07,
    },
  },
  // MEIO-CAMPO
  {
    id: 'CDM_ANCHOR',
    code: 'VOL',
    name: 'Primeiro volante',
    group: 'MEIO_CAMPO',
    description: 'Cão de guarda à frente da zaga, forte em desarmes e posicionamento defensivo.',
    weights: {
      desarme: 0.19,
      interceptacao: 0.16,
      posicionamentoDefensivo: 0.16,
      marcacao: 0.14,
      forcaFisica: 0.11,
      passeCurto: 0.11,
      decisoes: 0.07,
      resistencia: 0.06,
    },
  },
  {
    id: 'CDM_BOX',
    code: 'VOL',
    name: 'Segundo volante',
    group: 'MEIO_CAMPO',
    description: 'Dinâmico de área a área, participa tanto da marcação quanto da criação.',
    weights: {
      resistencia: 0.15,
      passeCurto: 0.15,
      desarme: 0.13,
      interceptacao: 0.12,
      visaoJogo: 0.12,
      potenciaChute: 0.09,
      velocidade: 0.09,
      decisoes: 0.08,
      controleBola: 0.07,
    },
  },
  {
    id: 'CM',
    code: 'MC',
    name: 'Meia central',
    group: 'MEIO_CAMPO',
    description: 'Motor do meio-campo, controla o ritmo com passes, domínio e equilíbrio.',
    weights: {
      passeCurto: 0.19,
      passeLongo: 0.14,
      visaoJogo: 0.17,
      controleBola: 0.14,
      decisoes: 0.10,
      resistencia: 0.10,
      drible: 0.09,
      interceptacao: 0.07,
    },
  },
  {
    id: 'CAM',
    code: 'MEI',
    name: 'Meia-atacante',
    group: 'MEIO_CAMPO',
    description: 'Atua nas entrelinhas buscando assistências decisivas e chutes de fora.',
    weights: {
      visaoJogo: 0.17,
      passeCurto: 0.15,
      drible: 0.15,
      controleBola: 0.13,
      finalizacao: 0.13,
      precisaoChute: 0.11,
      decisoes: 0.08,
      agilidade: 0.08,
    },
  },
  {
    id: 'PLAYMAKER',
    code: 'ARM',
    name: 'Armador',
    group: 'MEIO_CAMPO',
    description: 'Cérebro criativo da equipe, especialista em enfiadas e lançamentos.',
    weights: {
      visaoJogo: 0.22,
      passeCurto: 0.19,
      passeLongo: 0.16,
      controleBola: 0.13,
      decisoes: 0.11,
      compostura: 0.09,
      drible: 0.10,
    },
  },
  // ATAQUE
  {
    id: 'RW',
    code: 'PD',
    name: 'Ponta-direita',
    group: 'ATAQUE',
    description: 'Atacante veloz pelo lado direito, especialista em 1v1, cruzamentos e cortes.',
    weights: {
      velocidade: 0.17,
      aceleracao: 0.15,
      drible: 0.17,
      cruzamento: 0.13,
      agilidade: 0.11,
      finalizacao: 0.11,
      controleBola: 0.09,
      compostura: 0.07,
    },
  },
  {
    id: 'LW',
    code: 'PE',
    name: 'Ponta-esquerda',
    group: 'ATAQUE',
    description: 'Explosão pela esquerda para driblar marcadores e finalizar em diagonal.',
    weights: {
      velocidade: 0.17,
      aceleracao: 0.15,
      drible: 0.17,
      cruzamento: 0.13,
      agilidade: 0.11,
      finalizacao: 0.11,
      controleBola: 0.09,
      compostura: 0.07,
    },
  },
  {
    id: 'SS',
    code: 'SA',
    name: 'Segundo atacante',
    group: 'ATAQUE',
    description: 'Movimentação livre atrás do centroavante, combinando drible, passe e gol.',
    weights: {
      finalizacao: 0.17,
      drible: 0.15,
      controleBola: 0.13,
      visaoJogo: 0.13,
      aceleracao: 0.11,
      precisaoChute: 0.12,
      voleio: 0.09,
      compostura: 0.10,
    },
  },
  {
    id: 'ST',
    code: 'ATA',
    name: 'Centroavante',
    group: 'ATAQUE',
    description: 'Referência na grande área, letal em finalizações, voleios, cabeceio e posicionamento.',
    weights: {
      finalizacao: 0.21,
      posicionamento: 0.14,
      potenciaChute: 0.12,
      precisaoChute: 0.12,
      voleio: 0.10,
      cabeceio: 0.11,
      impulsao: 0.07,
      compostura: 0.07,
      forcaFisica: 0.06,
    },
  },
  {
    id: 'FALSE_9',
    code: 'F9',
    name: 'Falso 9',
    group: 'ATAQUE',
    description: 'Recua da referência para criar espaços, tabelar e finalizar com precisão.',
    weights: {
      passeCurto: 0.15,
      visaoJogo: 0.15,
      controleBola: 0.15,
      drible: 0.13,
      finalizacao: 0.15,
      decisoes: 0.10,
      compostura: 0.09,
      agilidade: 0.08,
    },
  },
];

export interface PlaystyleMeta {
  id: PlaystyleId;
  name: string;
  description: string;
  bonuses: Partial<Record<keyof PlayerAttributes, number>>;
}

export const PLAYSTYLES: PlaystyleMeta[] = [
  {
    id: 'ARMADOR',
    name: 'Armador',
    description: 'Passes cirúrgicos e leitura privilegiada de espaços no meio-campo.',
    bonuses: { visaoJogo: 8, passeCurto: 7, passeLongo: 6, decisoes: 5, controleBola: 3 },
  },
  {
    id: 'FINALIZADOR',
    name: 'Finalizador',
    description: 'Frieza diante do gol, chute potente, voleio e precisão letal nas redes.',
    bonuses: { finalizacao: 9, precisaoChute: 7, potenciaChute: 5, voleio: 5, compostura: 4 },
  },
  {
    id: 'VELOCISTA',
    name: 'Velocista',
    description: 'Explosão física para vencer na corrida e puxar contra-ataques.',
    bonuses: { velocidade: 8, aceleracao: 8, resistencia: 4, agilidade: 4, impulsao: 3 },
  },
  {
    id: 'DRIBLADOR',
    name: 'Driblador',
    description: 'Controle curto impecável e ginga para superar marcadores.',
    bonuses: { drible: 9, agilidade: 6, controleBola: 6, equilibrio: 4 },
  },
  {
    id: 'VOLANTE_MARCADOR',
    name: 'Volante marcador',
    description: 'Cão de guarda à frente da zaga, forte em desarmes e saída rápida.',
    bonuses: { desarme: 8, interceptacao: 7, posicionamentoDefensivo: 7, marcacao: 6, passeCurto: 3 },
  },
  {
    id: 'PONTA_OFENSIVO',
    name: 'Ponta ofensivo',
    description: 'Verticalidade pelas beiradas, drible em velocidade e cruzamentos precisos.',
    bonuses: { velocidade: 7, aceleracao: 6, cruzamento: 7, drible: 6 },
  },
  {
    id: 'DEFENSOR',
    name: 'Defensor',
    description: 'Segurança nos duelos aéreos, antecipação e proteção da grande área.',
    bonuses: { marcacao: 8, desarme: 7, posicionamentoDefensivo: 6, impulsao: 6, cabeceio: 6, forcaFisica: 4 },
  },
  {
    id: 'GOLEIRO',
    name: 'Goleiro',
    description: 'Reflexos apurados debaixo das traves, elasticidade e reposição ágil.',
    bonuses: { reflexos: 9, elasticidade: 8, posicionamentoGk: 8, saidasGol: 6, reposicao: 5 },
  },
];

const LEGACY_PLAYSTYLES: Record<string, PlaystyleMeta> = {
  MARCADOR: PLAYSTYLES[4],
  CONSTRUTOR: PLAYSTYLES[0],
  COMPLETO: {
    id: 'COMPLETO',
    name: 'Completo',
    description: 'Distribuição equilibrada em todas as valências do futebol.',
    bonuses: {
      velocidade: 3,
      resistencia: 4,
      passeCurto: 3,
      finalizacao: 3,
      drible: 3,
      marcacao: 3,
      posicionamento: 3,
      decisoes: 3,
      reflexos: 4,
    },
  },
};

export function getPlaystyleMeta(id: PlaystyleId): PlaystyleMeta {
  return PLAYSTYLES.find((p) => p.id === id) || LEGACY_PLAYSTYLES[id] || PLAYSTYLES[0];
}

export type AttributeCategory =
  | 'Finalização'
  | 'Passes'
  | 'Drible'
  | 'Defesa'
  | 'Físico'
  | 'Mental'
  | 'Goleiro';

export const ATTRIBUTE_CATEGORIES: AttributeCategory[] = [
  'Finalização',
  'Passes',
  'Drible',
  'Defesa',
  'Físico',
  'Mental',
  'Goleiro',
];

export const ATTRIBUTE_LABELS: {
  key: keyof PlayerAttributes;
  label: string;
  category: AttributeCategory;
}[] = [
  // Finalização
  { key: 'finalizacao', label: 'Finalização', category: 'Finalização' },
  { key: 'potenciaChute', label: 'Potência do chute', category: 'Finalização' },
  { key: 'precisaoChute', label: 'Precisão do chute', category: 'Finalização' },
  { key: 'cabeceio', label: 'Cabeceio', category: 'Finalização' },
  { key: 'voleio', label: 'Voleio', category: 'Finalização' },
  // Passes
  { key: 'passeCurto', label: 'Passe curto', category: 'Passes' },
  { key: 'passeLongo', label: 'Passe longo', category: 'Passes' },
  { key: 'visaoJogo', label: 'Visão de jogo', category: 'Passes' },
  { key: 'cruzamento', label: 'Cruzamento', category: 'Passes' },
  // Drible
  { key: 'controleBola', label: 'Controle de bola', category: 'Drible' },
  { key: 'drible', label: 'Drible', category: 'Drible' },
  { key: 'dominio', label: 'Domínio', category: 'Drible' },
  { key: 'agilidade', label: 'Agilidade', category: 'Drible' },
  { key: 'equilibrio', label: 'Equilíbrio', category: 'Drible' },
  // Defesa
  { key: 'marcacao', label: 'Marcação', category: 'Defesa' },
  { key: 'desarme', label: 'Desarme', category: 'Defesa' },
  { key: 'interceptacao', label: 'Interceptação', category: 'Defesa' },
  { key: 'posicionamentoDefensivo', label: 'Posicionamento defensivo', category: 'Defesa' },
  // Físico
  { key: 'velocidade', label: 'Velocidade', category: 'Físico' },
  { key: 'aceleracao', label: 'Aceleração', category: 'Físico' },
  { key: 'resistencia', label: 'Resistência', category: 'Físico' },
  { key: 'forcaFisica', label: 'Força física', category: 'Físico' },
  { key: 'impulsao', label: 'Impulsão', category: 'Físico' },
  // Mental
  { key: 'decisoes', label: 'Decisões', category: 'Mental' },
  { key: 'compostura', label: 'Compostura', category: 'Mental' },
  { key: 'posicionamento', label: 'Posicionamento ofensivo', category: 'Mental' },
  { key: 'lideranca', label: 'Liderança', category: 'Mental' },
  // Goleiro
  { key: 'reflexos', label: 'Reflexos', category: 'Goleiro' },
  { key: 'elasticidade', label: 'Elasticidade', category: 'Goleiro' },
  { key: 'posicionamentoGk', label: 'Posicionamento (GOL)', category: 'Goleiro' },
  { key: 'saidasGol', label: 'Saídas do gol', category: 'Goleiro' },
  { key: 'defesaPenaltis', label: 'Defesa de pênaltis', category: 'Goleiro' },
  { key: 'reposicao', label: 'Reposição', category: 'Goleiro' },
];

export function getPositionMeta(id: PositionId): PositionMeta {
  return POSITIONS.find((p) => p.id === id) || POSITIONS[15];
}

export function normalizeAttributes(
  raw: Partial<PlayerAttributes> | undefined,
  posId: PositionId = 'ST'
): PlayerAttributes {
  const isGK = posId === 'GK_TRAD' || posId === 'GK_SWEEPER';
  const r = raw || {};
  const fallback = (val: number | undefined, def: number) =>
    typeof val === 'number' && Number.isFinite(val) ? Math.max(20, Math.min(99, Math.round(val))) : def;

  const finalizacao = fallback(r.finalizacao, isGK ? 32 : 58);
  const cabeceio = fallback(r.cabeceio, 56);
  const posicionamento = fallback(r.posicionamento, 58);
  const visaoJogo = fallback(r.visaoJogo, 57);
  const marcacao = fallback(r.marcacao, isGK ? 35 : 53);
  const forcaFisica = fallback(r.forcaFisica, 58);
  const reflexos = fallback(r.reflexos, isGK ? 66 : 24);

  return {
    velocidade: fallback(r.velocidade, isGK ? 46 : 60),
    aceleracao: fallback(r.aceleracao, isGK ? 48 : 60),
    resistencia: fallback(r.resistencia, isGK ? 55 : 62),
    forcaFisica,
    agilidade: fallback(r.agilidade, 60),
    equilibrio: fallback(r.equilibrio, 59),
    impulsao: fallback(r.impulsao, Math.round((forcaFisica + cabeceio) / 2)),
    finalizacao,
    potenciaChute: fallback(r.potenciaChute, isGK ? 54 : 58),
    precisaoChute: fallback(r.precisaoChute, isGK ? 38 : 56),
    voleio: fallback(r.voleio, isGK ? 28 : Math.max(40, Math.round(finalizacao * 0.92))),
    passeCurto: fallback(r.passeCurto, 58),
    passeLongo: fallback(r.passeLongo, 55),
    cruzamento: fallback(r.cruzamento, isGK ? 36 : 54),
    visaoJogo,
    drible: fallback(r.drible, isGK ? 38 : 57),
    controleBola: fallback(r.controleBola, isGK ? 44 : 59),
    dominio: fallback(r.dominio, isGK ? 48 : 59),
    cabeceio,
    marcacao,
    desarme: fallback(r.desarme, isGK ? 34 : 53),
    posicionamento,
    posicionamentoDefensivo: fallback(r.posicionamentoDefensivo, isGK ? 40 : Math.round((marcacao + posicionamento) / 2)),
    interceptacao: fallback(r.interceptacao, isGK ? 38 : 54),
    decisoes: fallback(r.decisoes, Math.round((visaoJogo + posicionamento) / 2)),
    compostura: fallback(r.compostura, Math.round((visaoJogo + 58) / 2)),
    lideranca: fallback(r.lideranca, 55),
    reflexos,
    elasticidade: fallback(r.elasticidade, isGK ? Math.max(60, reflexos - 1) : 25),
    posicionamentoGk: fallback(r.posicionamentoGk, isGK ? 65 : 24),
    saidasGol: fallback(r.saidasGol, isGK ? 63 : 24),
    defesaPenaltis: fallback(r.defesaPenaltis, isGK ? 62 : 26),
    reposicao: fallback(r.reposicao, isGK ? 64 : 30),
  };
}

export function calculateOverall(attrs: PlayerAttributes, posId: PositionId): number {
  const meta = getPositionMeta(posId);
  const safe = normalizeAttributes(attrs, posId);
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [k, w] of Object.entries(meta.weights)) {
    const val = safe[k as keyof PlayerAttributes] ?? 55;
    const weight = w ?? 0;
    weightedSum += val * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return 60;
  return Math.max(40, Math.min(99, Math.round(weightedSum / totalWeight)));
}

export function generateInitialAttributes(
  posId: PositionId,
  playstyleId: PlaystyleId,
  age = 19
): PlayerAttributes {
  const isGK = posId === 'GK_TRAD' || posId === 'GK_SWEEPER';
  const meta = getPositionMeta(posId);
  const style = getPlaystyleMeta(playstyleId);
  const ageBoost = age <= 18 ? -1 : age <= 21 ? 0 : age <= 26 ? 3 : age <= 31 ? 4 : 2;

  const base: PlayerAttributes = {
    velocidade: isGK ? 46 : 60,
    aceleracao: isGK ? 48 : 60,
    resistencia: isGK ? 55 : 62,
    forcaFisica: 58,
    agilidade: 60,
    equilibrio: 59,
    impulsao: 58,
    finalizacao: isGK ? 32 : 55,
    potenciaChute: isGK ? 54 : 58,
    precisaoChute: isGK ? 38 : 55,
    voleio: isGK ? 28 : 53,
    passeCurto: 58,
    passeLongo: 55,
    cruzamento: isGK ? 36 : 54,
    visaoJogo: 57,
    drible: isGK ? 38 : 57,
    controleBola: isGK ? 44 : 59,
    dominio: isGK ? 48 : 59,
    cabeceio: 55,
    marcacao: isGK ? 35 : 53,
    desarme: isGK ? 34 : 53,
    posicionamento: 58,
    posicionamentoDefensivo: isGK ? 40 : 54,
    interceptacao: isGK ? 38 : 54,
    decisoes: 57 + Math.max(0, ageBoost),
    compostura: 57 + Math.max(0, ageBoost),
    lideranca: 50 + Math.max(0, Math.round((age - 17) * 1.4)),
    reflexos: isGK ? 66 : 24,
    elasticidade: isGK ? 65 : 24,
    posicionamentoGk: isGK ? 65 : 24,
    saidasGol: isGK ? 63 : 24,
    defesaPenaltis: isGK ? 62 : 26,
    reposicao: isGK ? 64 : 30,
  };

  for (const [k, w] of Object.entries(meta.weights)) {
    const key = k as keyof PlayerAttributes;
    const weight = w ?? 0;
    base[key] = Math.min(78, Math.max(40, Math.round(base[key] + weight * 38 + ageBoost)));
  }

  for (const [k, bonus] of Object.entries(style.bonuses)) {
    const key = k as keyof PlayerAttributes;
    if (
      isGK &&
      key !== 'reflexos' &&
      key !== 'elasticidade' &&
      key !== 'posicionamentoGk' &&
      key !== 'reposicao' &&
      key !== 'velocidade' &&
      key !== 'passeCurto' &&
      key !== 'passeLongo'
    ) {
      base[key] = Math.min(84, base[key] + Math.round((bonus ?? 0) * 0.5));
    } else {
      base[key] = Math.min(84, base[key] + (bonus ?? 0));
    }
  }

  return normalizeAttributes(base, posId);
}

export function generateBalancedPoolAttributes(
  posId: PositionId,
  playstyleId: PlaystyleId,
  age = 19
): { baseAttributes: PlayerAttributes; bonusPoints: number } {
  const auto = generateInitialAttributes(posId, playstyleId, age);
  const baseAttributes = { ...auto };
  const keys = Object.keys(baseAttributes) as (keyof PlayerAttributes)[];
  for (const k of keys) {
    baseAttributes[k] = Math.max(30, baseAttributes[k] - 4);
  }
  return {
    baseAttributes,
    bonusPoints: 36,
  };
}

export function estimatePotential(ovr: number, age: number): number {
  if (age <= 18) return Math.min(96, Math.max(ovr + 8, ovr + 14));
  if (age <= 21) return Math.min(95, Math.max(ovr + 6, ovr + 10));
  if (age <= 24) return Math.min(93, ovr + 6);
  if (age <= 28) return Math.min(92, ovr + 2);
  return Math.max(ovr, ovr);
}

export function calculateMarketValue(
  ovr: number,
  potential: number,
  age: number,
  posId: PositionId
): number {
  const group = getPositionMeta(posId).group;
  const posMult = group === 'ATAQUE' ? 1.22 : group === 'MEIO_CAMPO' ? 1.12 : group === 'DEFESA' ? 0.96 : 0.88;
  const ageFactor = age <= 21 ? 1.35 : age <= 25 ? 1.2 : age <= 29 ? 1.0 : 0.72;
  const ovrBase = Math.pow(Math.max(1, ovr - 45), 2.18) * 1450;
  const potBonus = Math.max(0, potential - ovr) * 75000;
  return Math.max(350000, Math.round((ovrBase * posMult * ageFactor + potBonus) / 50000) * 50000);
}

export function suggestWeeklySalary(ovr: number, clubQuality: number, marketValue: number): number {
  const raw = clubQuality * 135 + ovr * 115 + marketValue * 0.00055;
  return Math.max(3500, Math.round(raw / 100) * 100);
}

export function derivePlayerTraits(
  attrs: PlayerAttributes,
  posId: PositionId,
  playstyleId: PlaystyleId
): string[] {
  const safe = normalizeAttributes(attrs, posId);
  const traits: string[] = [];
  if (safe.finalizacao >= 72 || safe.precisaoChute >= 74) traits.push('Artilheiro Frio');
  if (safe.voleio >= 70) traits.push('Especialista em Voleio');
  if (safe.visaoJogo >= 72 || safe.passeCurto >= 74) traits.push('Maestro de Passes');
  if (safe.velocidade >= 75 && safe.aceleracao >= 74) traits.push('Flecha de Transição');
  if (safe.drible >= 73 && safe.agilidade >= 72) traits.push('Ginga 1v1');
  if (safe.marcacao >= 72 || safe.desarme >= 72) traits.push('Cão de Guarda');
  if (safe.impulsao >= 72 && safe.cabeceio >= 70) traits.push('Domínio Aéreo');
  if (safe.compostura >= 72 && safe.decisoes >= 71) traits.push('Sangue Frio');
  if (safe.lideranca >= 72) traits.push('Voz de Vestiário');
  if (posId.startsWith('GK') && (safe.reflexos >= 72 || safe.elasticidade >= 72)) {
    traits.push('Gato Sob as Traves');
  }
  if (traits.length === 0) {
    traits.push(getPlaystyleMeta(playstyleId).name);
  }
  return traits.slice(0, 4);
}


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
    description: 'Especialista debaixo das traves, foco em reflexos e defesa de chutes.',
    weights: {
      reflexos: 0.28,
      posicionamentoGk: 0.25,
      saidasGol: 0.14,
      defesaPenaltis: 0.13,
      reposicao: 0.10,
      agilidade: 0.05,
      forcaFisica: 0.05,
    },
  },
  {
    id: 'GK_SWEEPER',
    code: 'GOL',
    name: 'Goleiro líbero',
    group: 'GOLEIRO',
    description: 'Atua avançado na área, participa da saída de bola e antecipa lançamentos.',
    weights: {
      reflexos: 0.22,
      posicionamentoGk: 0.20,
      saidasGol: 0.20,
      reposicao: 0.16,
      passeCurto: 0.08,
      passeLongo: 0.08,
      velocidade: 0.06,
    },
  },
  // DEFESA
  {
    id: 'CB_STOPPER',
    code: 'ZAG',
    name: 'Zagueiro',
    group: 'DEFESA',
    description: 'Defensor central sólido nos duelos físicos, cabeceio e cortes na área.',
    weights: {
      marcacao: 0.20,
      desarme: 0.18,
      forcaFisica: 0.15,
      cabeceio: 0.14,
      interceptacao: 0.13,
      posicionamento: 0.12,
      velocidade: 0.08,
    },
  },
  {
    id: 'CB_BALL',
    code: 'ZAG',
    name: 'Zagueiro construtor',
    group: 'DEFESA',
    description: 'Inicia jogadas desde a defesa com passes precisos e leitura tática.',
    weights: {
      marcacao: 0.16,
      desarme: 0.14,
      interceptacao: 0.14,
      passeCurto: 0.16,
      passeLongo: 0.14,
      visaoJogo: 0.12,
      posicionamento: 0.14,
    },
  },
  {
    id: 'RB',
    code: 'LD',
    name: 'Lateral-direito',
    group: 'DEFESA',
    description: 'Equilíbrio entre marcação pelo corredor direito e apoio ao ataque.',
    weights: {
      velocidade: 0.16,
      aceleracao: 0.14,
      resistencia: 0.14,
      cruzamento: 0.14,
      marcacao: 0.15,
      desarme: 0.15,
      passeCurto: 0.12,
    },
  },
  {
    id: 'LB',
    code: 'LE',
    name: 'Lateral-esquerdo',
    group: 'DEFESA',
    description: 'Velocidade e fôlego para fechar o lado esquerdo e cruzar bolas na área.',
    weights: {
      velocidade: 0.16,
      aceleracao: 0.14,
      resistencia: 0.14,
      cruzamento: 0.14,
      marcacao: 0.15,
      desarme: 0.15,
      passeCurto: 0.12,
    },
  },
  {
    id: 'WB',
    code: 'ALA',
    name: 'Ala',
    group: 'DEFESA',
    description: 'Domina toda a faixa lateral do campo, com grande apoio ofensivo e fôlego.',
    weights: {
      velocidade: 0.17,
      resistencia: 0.17,
      cruzamento: 0.16,
      drible: 0.13,
      aceleracao: 0.13,
      desarme: 0.12,
      passeCurto: 0.12,
    },
  },
  // MEIO-CAMPO
  {
    id: 'CDM_ANCHOR',
    code: 'VOL',
    name: 'Primeiro volante',
    group: 'MEIO_CAMPO',
    description: 'Cão de guarda à frente da zaga, forte em desarmes e interceptações.',
    weights: {
      desarme: 0.20,
      interceptacao: 0.18,
      marcacao: 0.16,
      posicionamento: 0.14,
      forcaFisica: 0.12,
      passeCurto: 0.12,
      resistencia: 0.08,
    },
  },
  {
    id: 'CDM_BOX',
    code: 'VOL',
    name: 'Segundo volante',
    group: 'MEIO_CAMPO',
    description: 'Dinâmico de área a área, participa tanto da marcação quanto da criação.',
    weights: {
      resistencia: 0.16,
      passeCurto: 0.16,
      desarme: 0.14,
      interceptacao: 0.14,
      visaoJogo: 0.12,
      potenciaChute: 0.10,
      velocidade: 0.10,
      controleBola: 0.08,
    },
  },
  {
    id: 'CM',
    code: 'MC',
    name: 'Meia central',
    group: 'MEIO_CAMPO',
    description: 'Motor do meio-campo, controla o ritmo com passes, domínio e equilíbrio.',
    weights: {
      passeCurto: 0.20,
      passeLongo: 0.15,
      visaoJogo: 0.18,
      controleBola: 0.15,
      resistencia: 0.12,
      drible: 0.10,
      interceptacao: 0.10,
    },
  },
  {
    id: 'CAM',
    code: 'MEI',
    name: 'Meia-atacante',
    group: 'MEIO_CAMPO',
    description: 'Atua nas entrelinhas buscando assistências decisivas e chutes de fora.',
    weights: {
      visaoJogo: 0.18,
      passeCurto: 0.16,
      drible: 0.16,
      controleBola: 0.14,
      finalizacao: 0.14,
      precisaoChute: 0.12,
      agilidade: 0.10,
    },
  },
  {
    id: 'PLAYMAKER',
    code: 'ARM',
    name: 'Armador',
    group: 'MEIO_CAMPO',
    description: 'Cérebro criativo da equipe, especialista em enfiadas e lançamentos.',
    weights: {
      visaoJogo: 0.24,
      passeCurto: 0.20,
      passeLongo: 0.18,
      controleBola: 0.14,
      drible: 0.12,
      dominio: 0.12,
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
      velocidade: 0.18,
      aceleracao: 0.16,
      drible: 0.18,
      cruzamento: 0.14,
      agilidade: 0.12,
      finalizacao: 0.12,
      controleBola: 0.10,
    },
  },
  {
    id: 'LW',
    code: 'PE',
    name: 'Ponta-esquerda',
    group: 'ATAQUE',
    description: 'Explosão pela esquerda para driblar marcadores e finalizar em diagonal.',
    weights: {
      velocidade: 0.18,
      aceleracao: 0.16,
      drible: 0.18,
      cruzamento: 0.14,
      agilidade: 0.12,
      finalizacao: 0.12,
      controleBola: 0.10,
    },
  },
  {
    id: 'SS',
    code: 'SA',
    name: 'Segundo atacante',
    group: 'ATAQUE',
    description: 'Movimentação livre atrás do centroavante, combinando drible, passe e gol.',
    weights: {
      finalizacao: 0.18,
      drible: 0.16,
      controleBola: 0.14,
      visaoJogo: 0.14,
      aceleracao: 0.12,
      precisaoChute: 0.14,
      agilidade: 0.12,
    },
  },
  {
    id: 'ST',
    code: 'ATA',
    name: 'Centroavante',
    group: 'ATAQUE',
    description: 'Referência na grande área, letal em finalizações, cabeceio e posicionamento.',
    weights: {
      finalizacao: 0.24,
      posicionamento: 0.16,
      potenciaChute: 0.14,
      precisaoChute: 0.14,
      cabeceio: 0.12,
      forcaFisica: 0.10,
      velocidade: 0.10,
    },
  },
  {
    id: 'FALSE_9',
    code: 'F9',
    name: 'Falso 9',
    group: 'ATAQUE',
    description: 'Recua da referência para criar espaços, tabelar e finalizar com precisão.',
    weights: {
      passeCurto: 0.16,
      visaoJogo: 0.16,
      controleBola: 0.16,
      drible: 0.14,
      finalizacao: 0.16,
      dominio: 0.12,
      agilidade: 0.10,
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
    bonuses: { visaoJogo: 8, passeCurto: 7, passeLongo: 6, controleBola: 3 },
  },
  {
    id: 'FINALIZADOR',
    name: 'Finalizador',
    description: 'Frieza diante do gol, chute potente e precisão letal nas redes.',
    bonuses: { finalizacao: 9, precisaoChute: 7, potenciaChute: 5, posicionamento: 3 },
  },
  {
    id: 'VELOCISTA',
    name: 'Velocista',
    description: 'Explosão física para vencer na corrida e puxar contra-ataques.',
    bonuses: { velocidade: 8, aceleracao: 8, resistencia: 4, agilidade: 4 },
  },
  {
    id: 'DRIBLADOR',
    name: 'Driblador',
    description: 'Controle curto impecável e ginga para superar marcadores.',
    bonuses: { drible: 9, agilidade: 6, controleBola: 6, equilibrio: 3 },
  },
  {
    id: 'VOLANTE_MARCADOR',
    name: 'Volante marcador',
    description: 'Cão de guarda à frente da zaga, forte em desarmes e saída rápida.',
    bonuses: { desarme: 8, interceptacao: 7, marcacao: 6, passeCurto: 4 },
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
    bonuses: { marcacao: 8, desarme: 7, cabeceio: 6, forcaFisica: 5 },
  },
  {
    id: 'GOLEIRO',
    name: 'Goleiro',
    description: 'Reflexos apurados debaixo das traves, saídas firmes e reposição ágil.',
    bonuses: { reflexos: 9, posicionamentoGk: 8, saidasGol: 6, reposicao: 5 },
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
      reflexos: 4,
    },
  },
};

export function getPlaystyleMeta(id: PlaystyleId): PlaystyleMeta {
  return PLAYSTYLES.find((p) => p.id === id) || LEGACY_PLAYSTYLES[id] || PLAYSTYLES[0];
}

export const ATTRIBUTE_LABELS: {
  key: keyof PlayerAttributes;
  label: string;
  category: 'Físico' | 'Ataque & Passe' | 'Técnica' | 'Defesa' | 'Goleiro';
}[] = [
  { key: 'velocidade', label: 'Velocidade', category: 'Físico' },
  { key: 'aceleracao', label: 'Aceleração', category: 'Físico' },
  { key: 'resistencia', label: 'Resistência', category: 'Físico' },
  { key: 'forcaFisica', label: 'Força física', category: 'Físico' },
  { key: 'agilidade', label: 'Agilidade', category: 'Físico' },
  { key: 'equilibrio', label: 'Equilíbrio', category: 'Físico' },
  { key: 'finalizacao', label: 'Finalização', category: 'Ataque & Passe' },
  { key: 'potenciaChute', label: 'Potência do chute', category: 'Ataque & Passe' },
  { key: 'precisaoChute', label: 'Precisão do chute', category: 'Ataque & Passe' },
  { key: 'passeCurto', label: 'Passe curto', category: 'Ataque & Passe' },
  { key: 'passeLongo', label: 'Passe longo', category: 'Ataque & Passe' },
  { key: 'cruzamento', label: 'Cruzamento', category: 'Ataque & Passe' },
  { key: 'visaoJogo', label: 'Visão de jogo', category: 'Técnica' },
  { key: 'drible', label: 'Drible', category: 'Técnica' },
  { key: 'controleBola', label: 'Controle de bola', category: 'Técnica' },
  { key: 'dominio', label: 'Domínio', category: 'Técnica' },
  { key: 'cabeceio', label: 'Cabeceio', category: 'Técnica' },
  { key: 'marcacao', label: 'Marcação', category: 'Defesa' },
  { key: 'desarme', label: 'Desarme', category: 'Defesa' },
  { key: 'posicionamento', label: 'Posicionamento', category: 'Defesa' },
  { key: 'interceptacao', label: 'Interceptação', category: 'Defesa' },
  { key: 'reflexos', label: 'Reflexos', category: 'Goleiro' },
  { key: 'posicionamentoGk', label: 'Posicionamento (GOL)', category: 'Goleiro' },
  { key: 'saidasGol', label: 'Saídas do gol', category: 'Goleiro' },
  { key: 'defesaPenaltis', label: 'Defesa de pênaltis', category: 'Goleiro' },
  { key: 'reposicao', label: 'Reposição', category: 'Goleiro' },
];

export function getPositionMeta(id: PositionId): PositionMeta {
  return POSITIONS.find((p) => p.id === id) || POSITIONS[15];
}

export function calculateOverall(attrs: PlayerAttributes, posId: PositionId): number {
  const meta = getPositionMeta(posId);
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [k, w] of Object.entries(meta.weights)) {
    const val = attrs[k as keyof PlayerAttributes] ?? 55;
    const weight = w ?? 0;
    weightedSum += val * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return 60;
  return Math.max(40, Math.min(99, Math.round(weightedSum / totalWeight)));
}

export function generateInitialAttributes(
  posId: PositionId,
  playstyleId: PlaystyleId
): PlayerAttributes {
  const isGK = posId === 'GK_TRAD' || posId === 'GK_SWEEPER';
  const meta = getPositionMeta(posId);
  const style = getPlaystyleMeta(playstyleId);

  const base: PlayerAttributes = {
    velocidade: isGK ? 46 : 60,
    aceleracao: isGK ? 48 : 60,
    resistencia: isGK ? 55 : 62,
    forcaFisica: 58,
    agilidade: 60,
    equilibrio: 59,
    finalizacao: isGK ? 32 : 55,
    potenciaChute: isGK ? 54 : 58,
    precisaoChute: isGK ? 38 : 55,
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
    interceptacao: isGK ? 38 : 54,
    reflexos: isGK ? 66 : 24,
    posicionamentoGk: isGK ? 65 : 24,
    saidasGol: isGK ? 63 : 24,
    defesaPenaltis: isGK ? 62 : 26,
    reposicao: isGK ? 64 : 30,
  };

  // Boost position-weighted attributes modestly for balanced ~64-67 starter
  for (const [k, w] of Object.entries(meta.weights)) {
    const key = k as keyof PlayerAttributes;
    const weight = w ?? 0;
    base[key] = Math.min(76, Math.round(base[key] + weight * 38));
  }

  // Apply playstyle bonus
  for (const [k, bonus] of Object.entries(style.bonuses)) {
    const key = k as keyof PlayerAttributes;
    if (isGK && key !== 'reflexos' && key !== 'posicionamentoGk' && key !== 'reposicao' && key !== 'velocidade' && key !== 'passeCurto' && key !== 'passeLongo') {
      base[key] = Math.min(82, base[key] + Math.round((bonus ?? 0) * 0.5));
    } else {
      base[key] = Math.min(82, base[key] + (bonus ?? 0));
    }
  }

  return base;
}

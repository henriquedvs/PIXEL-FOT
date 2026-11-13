import {
  ClubKit,
  CrowdMood,
  GraphicsQuality,
  HairStyle,
  MascotId,
  MatchEnvironment,
  PlayerAnimAction,
  PlayerAppearance,
  SportGear,
  StadiumSpec,
} from '../types/game';

export type { CrowdMood, PlayerAnimAction };

export interface PixelPlayerVisual {
  appearance: PlayerAppearance;
  gear: SportGear;
  kit: ClubKit;
  isGoalkeeper: boolean;
  isUserControlled: boolean;
  facingAngle: number;
  animPhase: number;
  isSprinting: boolean;
  isDribbling: boolean;
  hasBall: boolean;
  action?: PlayerAnimAction;
  zOffset?: number;
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawPixelPlayerSprite(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  pixelScale: number,
  visual: PixelPlayerVisual,
  mode: 'preview' | 'match' = 'match',
  sunShadowOffset = { x: 0, y: 0 }
) {
  const { appearance, gear, kit, isGoalkeeper, animPhase, action = 'idle', zOffset = 0 } = visual;
  const s = pixelScale * appearance.visualHeightScale;
  const widthFactor =
    appearance.bodyType === 'Forte'
      ? 1.18
      : appearance.bodyType === 'Magro'
      ? 0.88
      : 1.0;

  const shirtMain = isGoalkeeper ? kit.gkPrimary : kit.primary;
  const shirtAlt = isGoalkeeper ? '#0F172A' : kit.secondary;
  const shortsCol = isGoalkeeper ? '#0F172A' : kit.shorts;
  const sockCol = isGoalkeeper ? kit.gkPrimary : kit.socks;

  const isCelebrating =
    action === 'celebrate_arms' || action === 'celebrate_jump' || action === 'celebrate_hug';
  const jumpLift =
    action === 'celebrate_jump'
      ? Math.abs(Math.sin(animPhase * 1.4)) * 6 * s
      : action === 'header'
      ? 5 * s
      : zOffset;

  const stride =
    action === 'sprint' || visual.isSprinting
      ? Math.sin(animPhase) * 3.0
      : action === 'walk'
      ? Math.sin(animPhase) * 1.1
      : action === 'idle'
      ? 0
      : Math.sin(animPhase) * 1.8;
  const armSwing = -stride * 0.85;

  ctx.save();
  ctx.translate(Math.round(centerX), Math.round(centerY));

  // Coherent ground shadow (scales slightly when jumping for header or celebration)
  const shadowShrink = Math.max(0.6, 1 - jumpLift / (26 * s));
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.fillRect(
    Math.round(-5 * s * widthFactor * shadowShrink + sunShadowOffset.x),
    Math.round(5.5 * s + sunShadowOffset.y),
    Math.round(10 * s * widthFactor * shadowShrink),
    Math.round(3 * s * shadowShrink)
  );

  if (mode === 'match' && visual.isUserControlled) {
    ctx.strokeStyle = visual.hasBall ? '#FACC15' : '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 6 * s, 7.8 * s, 4.2 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Apply airborne lift & pose tilt for dives, tackles, falls, kicks
  ctx.translate(0, Math.round(-jumpLift));

  const facingRight = mode === 'preview' ? false : Math.cos(visual.facingAngle) >= 0;
  if (mode === 'match') {
    if (action === 'dive') {
      ctx.rotate(facingRight ? 0.95 : -0.95);
    } else if (action === 'tackle') {
      ctx.rotate(facingRight ? -0.58 : 0.58);
    } else if (action === 'fall') {
      ctx.rotate(facingRight ? 1.15 : -1.15);
    } else if (action === 'kick') {
      ctx.rotate(facingRight ? -0.14 : 0.14);
    }
  }

  const w = widthFactor;
  let leftLegY = mode === 'match' ? 2 * s + stride * 0.5 * s : 2 * s;
  let rightLegY = mode === 'match' ? 2 * s - stride * 0.5 * s : 2 * s;
  let kickLegOffsetX = 0;

  if (mode === 'match') {
    if (action === 'kick' || action === 'pass') {
      kickLegOffsetX = (facingRight ? 1 : -1) * (action === 'kick' ? 2.6 * s : 1.6 * s);
      rightLegY -= 0.8 * s;
    } else if (action === 'tackle') {
      kickLegOffsetX = (facingRight ? 1 : -1) * 3.2 * s;
    }
  }

  px(ctx, -2.5 * s * w, leftLegY, 2 * s, 3.2 * s, appearance.skinColor);
  px(ctx, 0.5 * s * w + kickLegOffsetX, rightLegY, 2 * s, 3.2 * s, appearance.skinColor);

  if (gear.accessory === 'Joelho') {
    px(ctx, -2.5 * s * w, leftLegY + 0.6 * s, 2 * s, 0.9 * s, '#F8FAFC');
    px(ctx, 0.5 * s * w + kickLegOffsetX, rightLegY + 0.6 * s, 2 * s, 0.9 * s, '#F8FAFC');
  }

  const sockH = gear.sockType === 'Alta' ? 2.8 : gear.sockType === 'Média' ? 2.0 : 1.2;
  const sockOff = 3.2 - sockH;
  px(ctx, -2.5 * s * w, leftLegY + sockOff * s, 2 * s, sockH * s, sockCol);
  px(ctx, 0.5 * s * w + kickLegOffsetX, rightLegY + sockOff * s, 2 * s, sockH * s, sockCol);

  const bootH = gear.bootModel === 'TravaAlta' ? 1.5 : 1.2;
  px(ctx, -2.8 * s * w, leftLegY + 3.0 * s, 2.4 * s, bootH * s, gear.bootColor);
  px(ctx, 0.4 * s * w + kickLegOffsetX, rightLegY + 3.0 * s, 2.4 * s, bootH * s, gear.bootColor);
  if (gear.bootModel === 'Velocidade' || gear.bootModel === 'Controle') {
    px(ctx, -2.6 * s * w, leftLegY + 3.2 * s, 1 * s, 0.5 * s, '#FFFFFF');
    px(ctx, 0.6 * s * w + kickLegOffsetX, rightLegY + 3.2 * s, 1 * s, 0.5 * s, '#FFFFFF');
  }

  px(ctx, -3.5 * s * w, 0.2 * s, 7 * s * w, 2.5 * s, shortsCol);

  const torsoX = -3.8 * s * w;
  const torsoY = -4.6 * s;
  const torsoW = 7.6 * s * w;
  const torsoH = 5.0 * s;
  px(ctx, torsoX, torsoY, torsoW, torsoH, shirtMain);

  if (!isGoalkeeper) {
    if (kit.pattern === 'stripes') {
      px(ctx, torsoX + 1.5 * s * w, torsoY, 1.3 * s * w, torsoH, shirtAlt);
      px(ctx, torsoX + 4.8 * s * w, torsoY, 1.3 * s * w, torsoH, shirtAlt);
    } else if (kit.pattern === 'hoops') {
      px(ctx, torsoX, torsoY + 1.3 * s, torsoW, 1.1 * s, shirtAlt);
      px(ctx, torsoX, torsoY + 3.2 * s, torsoW, 1.1 * s, shirtAlt);
    } else if (kit.pattern === 'halves') {
      px(ctx, 0, torsoY, torsoW / 2, torsoH, shirtAlt);
    } else if (kit.pattern === 'sash') {
      for (let i = 0; i < 4; i++) {
        px(ctx, torsoX + i * 1.6 * s * w, torsoY + i * 1.1 * s, 2.2 * s * w, 1.4 * s, shirtAlt);
      }
    }
  }

  // Arms — raised high for celebrations, stretched for GK dives, swinging for run/sprint
  const sleeveH = gear.sleeveLength === 'Longa' ? 3.5 : 1.9;
  if (mode === 'match' && isCelebrating) {
    const pump = Math.sin(animPhase * 1.6) * 1.2 * s;
    const armUpY = action === 'celebrate_hug' ? -5.8 * s : -8.5 * s + pump;
    const armOut = action === 'celebrate_hug' ? 1.8 * s : 0.4 * s;
    px(ctx, torsoX - 1.6 * s - armOut, armUpY, 1.6 * s, 4.0 * s, appearance.skinColor);
    px(ctx, torsoX + torsoW + armOut, armUpY, 1.6 * s, 4.0 * s, appearance.skinColor);
    px(ctx, torsoX - 1.6 * s - armOut, armUpY + (4.0 - sleeveH) * s, 1.6 * s, sleeveH * s, shirtMain);
    px(ctx, torsoX + torsoW + armOut, armUpY + (4.0 - sleeveH) * s, 1.6 * s, sleeveH * s, shirtMain);
  } else {
    const leftArmY = -4.3 * s + armSwing * 0.4 * s;
    const rightArmY = -4.3 * s - armSwing * 0.4 * s;
    px(ctx, torsoX - 1.6 * s, leftArmY, 1.6 * s, 3.8 * s, appearance.skinColor);
    px(ctx, torsoX + torsoW, rightArmY, 1.6 * s, 3.8 * s, appearance.skinColor);
    px(ctx, torsoX - 1.6 * s, leftArmY, 1.6 * s, sleeveH * s, shirtMain);
    px(ctx, torsoX + torsoW, rightArmY, 1.6 * s, sleeveH * s, shirtMain);

    if (gear.accessory === 'Munhequeira') {
      px(ctx, torsoX - 1.6 * s, leftArmY + 2.8 * s, 1.6 * s, 0.8 * s, '#F8FAFC');
      px(ctx, torsoX + torsoW, rightArmY + 2.8 * s, 1.6 * s, 0.8 * s, '#F8FAFC');
    } else if (gear.accessory === 'Luvas' || isGoalkeeper) {
      px(ctx, torsoX - 1.8 * s, leftArmY + 3.1 * s, 1.9 * s, 1.2 * s, '#F8FAFC');
      px(ctx, torsoX + torsoW - 0.1 * s, rightArmY + 3.1 * s, 1.9 * s, 1.2 * s, '#F8FAFC');
    }
  }

  if (mode === 'preview') {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(Math.round(-2.2 * s), Math.round(-3.5 * s), Math.round(4.4 * s), Math.round(2.8 * s));
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(8, Math.round(2.3 * s))}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(gear.jerseyNumber), 0, Math.round(-2.0 * s));
  }

  const headX = -2.8 * s;
  const headY = -9.4 * s;
  const headW = 5.6 * s;
  const headH = 4.9 * s;
  px(ctx, headX, headY, headW, headH, appearance.skinColor);

  const eyeOffsetX = mode === 'preview' ? 0 : facingRight ? 0.5 * s : -0.5 * s;
  const eyeH =
    appearance.eyeStyle === 'Focado'
      ? 0.55 * s
      : appearance.eyeStyle === 'Expressivo'
      ? 0.95 * s
      : 0.75 * s;
  px(ctx, -1.6 * s + eyeOffsetX, headY + 2.2 * s, 0.8 * s, eyeH, '#111827');
  px(ctx, 0.8 * s + eyeOffsetX, headY + 2.2 * s, 0.8 * s, eyeH, '#111827');

  const browH = appearance.eyebrowStyle === 'Grossa' ? 0.65 * s : 0.4 * s;
  const browDrop = appearance.eyebrowStyle === 'Arqueada' ? -0.25 * s : 0;
  px(ctx, -1.8 * s + eyeOffsetX, headY + 1.4 * s + browDrop, 1.2 * s, browH, appearance.hairColor);
  px(ctx, 0.6 * s + eyeOffsetX, headY + 1.4 * s + browDrop, 1.2 * s, browH, appearance.hairColor);

  if (mode === 'preview' || isCelebrating) {
    if (appearance.faceStyle === 'Sorriso' || isCelebrating) {
      px(ctx, -1.0 * s, headY + 3.6 * s, 2.0 * s, 0.5 * s, '#FFFFFF');
    } else if (appearance.faceStyle === 'Confiante') {
      px(ctx, -0.7 * s, headY + 3.7 * s, 1.6 * s, 0.4 * s, '#7C2D12');
    } else {
      px(ctx, -0.9 * s, headY + 3.8 * s, 1.8 * s, 0.4 * s, '#5C2B18');
    }
  }

  if (appearance.mustacheStyle !== 'Nenhum') {
    const mW = appearance.mustacheStyle === 'Clássico' ? 2.8 * s : 2.0 * s;
    px(ctx, -mW / 2 + eyeOffsetX, headY + 3.1 * s, mW, 0.55 * s, appearance.hairColor);
  }

  if (appearance.beardStyle === 'Rala') {
    px(ctx, headX + 0.4 * s, headY + 3.6 * s, headW - 0.8 * s, 1.2 * s, `${appearance.hairColor}88`);
  } else if (appearance.beardStyle === 'Cheia') {
    px(ctx, headX + 0.2 * s, headY + 3.3 * s, headW - 0.4 * s, 1.8 * s, appearance.hairColor);
  } else if (appearance.beardStyle === 'Cavanhaque') {
    px(ctx, -1.1 * s + eyeOffsetX, headY + 3.5 * s, 2.2 * s, 1.5 * s, appearance.hairColor);
  }

  const hc = appearance.hairColor;
  switch (appearance.hairStyle) {
    case 'Curto':
      px(ctx, headX - 0.2 * s, headY - 0.7 * s, headW + 0.4 * s, 1.6 * s, hc);
      px(ctx, headX - 0.2 * s, headY, 0.8 * s, 1.8 * s, hc);
      px(ctx, headX + headW - 0.6 * s, headY, 0.8 * s, 1.8 * s, hc);
      break;
    case 'Moicano':
      px(ctx, -1.1 * s, headY - 2.2 * s, 2.2 * s, 2.8 * s, hc);
      break;
    case 'BlackPower':
      px(ctx, headX - 1.2 * s, headY - 2.1 * s, headW + 2.4 * s, 3.2 * s, hc);
      break;
    case 'Longo':
      px(ctx, headX - 0.5 * s, headY - 0.9 * s, headW + 1.0 * s, 1.8 * s, hc);
      px(ctx, headX - 0.9 * s, headY, 1.1 * s, 4.6 * s, hc);
      px(ctx, headX + headW - 0.2 * s, headY, 1.1 * s, 4.6 * s, hc);
      break;
    case 'Topete':
      px(ctx, headX, headY - 1.2 * s, headW, 1.8 * s, hc);
      px(ctx, -1.6 * s, headY - 2.0 * s, 3.4 * s, 1.2 * s, hc);
      break;
    case 'Tranças':
      px(ctx, headX - 0.3 * s, headY - 1.0 * s, headW + 0.6 * s, 1.6 * s, hc);
      px(ctx, headX - 0.8 * s, headY + 0.4 * s, 0.9 * s, 4.1 * s, hc);
      px(ctx, headX + headW - 0.1 * s, headY + 0.4 * s, 0.9 * s, 4.1 * s, hc);
      break;
    case 'Raspado':
    default:
      px(ctx, headX + 0.2 * s, headY - 0.3 * s, headW - 0.4 * s, 0.9 * s, hc);
      break;
  }

  if (gear.accessory === 'Faixa') {
    px(ctx, headX - 0.2 * s, headY + 0.6 * s, headW + 0.4 * s, 0.8 * s, '#F8FAFC');
  }

  ctx.restore();
}

export function drawPixelPortrait(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    skinColor: string;
    hairColor: string;
    hairStyle: HairStyle;
    shirtPrimary: string;
    shirtSecondary: string;
    isCoach?: boolean;
    beard?: boolean;
  }
) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, h);

  const u = w / 16;
  px(ctx, u, u, 14 * u, 14 * u, '#172336');

  if (opts.isCoach) {
    px(ctx, 2 * u, 11 * u, 12 * u, 5 * u, '#334155');
    px(ctx, 6 * u, 11 * u, 4 * u, 5 * u, '#F8FAFC');
    px(ctx, 7.2 * u, 12 * u, 1.6 * u, 4 * u, opts.shirtPrimary);
  } else {
    px(ctx, 2 * u, 11 * u, 12 * u, 5 * u, opts.shirtPrimary);
    px(ctx, 6 * u, 11 * u, 4 * u, 5 * u, opts.shirtSecondary);
  }

  px(ctx, 6.5 * u, 9.5 * u, 3 * u, 2 * u, opts.skinColor);
  px(ctx, 4.5 * u, 3.5 * u, 7 * u, 6.5 * u, opts.skinColor);

  px(ctx, 5.8 * u, 6.2 * u, 1.1 * u, 1.1 * u, '#0F172A');
  px(ctx, 9.1 * u, 6.2 * u, 1.1 * u, 1.1 * u, '#0F172A');

  px(ctx, 5.5 * u, 5.2 * u, 1.6 * u, 0.6 * u, opts.hairColor);
  px(ctx, 8.9 * u, 5.2 * u, 1.6 * u, 0.6 * u, opts.hairColor);

  px(ctx, 7 * u, 8.4 * u, 2 * u, 0.6 * u, '#6D3520');

  if (opts.beard) {
    px(ctx, 4.5 * u, 8.2 * u, 7 * u, 1.8 * u, opts.hairColor);
  }

  const hc = opts.hairColor;
  if (opts.hairStyle === 'Moicano') {
    px(ctx, 6.6 * u, 1.4 * u, 2.8 * u, 2.6 * u, hc);
  } else if (opts.hairStyle === 'BlackPower') {
    px(ctx, 3.2 * u, 1.6 * u, 9.6 * u, 3.4 * u, hc);
  } else if (opts.hairStyle === 'Longo' || opts.hairStyle === 'Tranças') {
    px(ctx, 4.0 * u, 2.2 * u, 8.0 * u, 2.0 * u, hc);
    px(ctx, 3.6 * u, 3.6 * u, 1.2 * u, 5.6 * u, hc);
    px(ctx, 11.2 * u, 3.6 * u, 1.2 * u, 5.6 * u, hc);
  } else if (opts.hairStyle === 'Topete') {
    px(ctx, 4.3 * u, 2.0 * u, 7.4 * u, 2.0 * u, hc);
    px(ctx, 5.5 * u, 1.2 * u, 4.5 * u, 1.2 * u, hc);
  } else if (opts.hairStyle === 'Raspado') {
    px(ctx, 4.7 * u, 3.0 * u, 6.6 * u, 0.9 * u, hc);
  } else {
    px(ctx, 4.2 * u, 2.3 * u, 7.6 * u, 1.8 * u, hc);
  }
}

export interface PitchGeometry {
  worldW: number;
  worldH: number;
  pitchX: number;
  pitchY: number;
  pitchW: number;
  pitchH: number;
  goalH: number;
  goalDepth: number;
}

export const PITCH_GEO: PitchGeometry = {
  worldW: 1600,
  worldH: 1020,
  pitchX: 240,
  pitchY: 180,
  pitchW: 1120,
  pitchH: 660,
  goalH: 136,
  goalDepth: 36,
};

export interface CrowdSpectator {
  x: number;
  y: number;
  shirtColor: string;
  skinColor: string;
  hatColor: string | null;
  phase: number;
  freq: number;
  sector: 'north' | 'south' | 'west' | 'east';
  isAwaySector: boolean;
  isOrganized: boolean;
  hasFlag: boolean;
  isGiantFlag: boolean;
  behavior: 'jumper' | 'clapper' | 'waver' | 'calm';
}

const SKIN_TONES = ['#F5CBA7', '#E0AC69', '#C68642', '#8D5524', '#5C3820'];

function hashNum(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function generateCrowd(
  homePrimary: string,
  homeSecondary: string,
  awayPrimary: string,
  quality: GraphicsQuality,
  opts?: {
    awaySecondary?: string;
    capacity?: number;
    importance?: number; // 0..1
  }
): CrowdSpectator[] {
  const specs: CrowdSpectator[] = [];
  const awaySec = opts?.awaySecondary || '#F8FAFC';
  const capacity = opts?.capacity ?? 42000;
  const importance = opts?.importance ?? 0.65;

  // Occupancy percentage depends on stadium size & match importance
  const capNorm = Math.min(1, Math.max(0.55, capacity / 55000));
  const fillRate = Math.min(0.99, 0.68 + importance * 0.24 + capNorm * 0.08);

  const stepX = quality === 'high' ? 11 : quality === 'medium' ? 17 : 28;
  const stepY = quality === 'high' ? 13 : quality === 'medium' ? 19 : 30;
  const rowsNS = quality === 'high' ? 6 : quality === 'medium' ? 4 : 3;
  const colsWE = quality === 'high' ? 6 : quality === 'medium' ? 4 : 3;

  const homeColors = [homePrimary, homePrimary, homeSecondary, '#F8FAFC', '#FACC15', '#1E293B'];
  const awayColors = [awayPrimary, awayPrimary, awaySec, '#F8FAFC'];
  const behaviors: CrowdSpectator['behavior'][] = ['jumper', 'clapper', 'waver', 'calm'];

  const addSpec = (
    x: number,
    y: number,
    sector: CrowdSpectator['sector'],
    seedIdx: number,
    isAway: boolean,
    isOrg: boolean
  ) => {
    const r1 = hashNum(seedIdx);
    if (r1 > fillRate) return;
    const r2 = hashNum(seedIdx + 101);
    const r3 = hashNum(seedIdx + 307);
    const r4 = hashNum(seedIdx + 619);

    const palette = isAway ? awayColors : homeColors;
    const shirtColor = palette[Math.floor(r2 * palette.length)];
    const skinColor = SKIN_TONES[Math.floor(r3 * SKIN_TONES.length)];
    const hatColor = r4 > 0.72 ? (isAway ? awayPrimary : r4 > 0.86 ? homeSecondary : homePrimary) : null;
    const behavior = isOrg
      ? behaviors[Math.floor(r2 * 3)]
      : behaviors[Math.floor(r4 * behaviors.length)];

    const flagThreshold = isOrg ? 0.14 : 0.045;
    const hasFlag = r3 < flagThreshold;
    const isGiantFlag = isOrg && r3 < 0.022;

    specs.push({
      x: Math.round(x + (r2 - 0.5) * 3),
      y: Math.round(y + (r3 - 0.5) * 2),
      shirtColor,
      skinColor,
      hatColor,
      phase: r2 * Math.PI * 2,
      freq: 0.85 + r4 * 0.45,
      sector,
      isAwaySector: isAway,
      isOrganized: isOrg,
      hasFlag,
      isGiantFlag,
      behavior,
    });
  };

  let idx = 1;
  // North & South multi-tier stands (leaving aisle gaps every ~160px)
  for (let x = 135; x < PITCH_GEO.worldW - 135; x += stepX) {
    const inAisle = (x - 135) % 180 < 16;
    if (inAisle) continue;
    for (let row = 0; row < rowsNS; row++) {
      const yTop = 26 + row * 17;
      const yBot = PITCH_GEO.worldH - 28 - row * 17;
      const isAwayEastCorner = x > PITCH_GEO.worldW - 420;
      addSpec(x + (row % 2) * 4, yTop, 'north', idx++, false, x < 540);
      addSpec(x + (row % 2) * 4, yBot, 'south', idx++, isAwayEastCorner, x < 480);
    }
  }

  // West (Home Organized Fan Sector) & East (Visitor Sector) behind goals
  for (let y = 165; y < PITCH_GEO.worldH - 165; y += stepY) {
    const inAisle = (y - 165) % 190 < 16;
    if (inAisle) continue;
    for (let col = 0; col < colsWE; col++) {
      const xWest = 28 + col * 21;
      const xEast = PITCH_GEO.worldW - 30 - col * 21;
      addSpec(xWest, y + (col % 2) * 3, 'west', idx++, false, true);
      addSpec(xEast, y + (col % 2) * 3, 'east', idx++, true, true);
    }
  }

  return specs;
}

const MASCOT_GRIDS: Record<MascotId, string[]> = {
  leao: [
    '01111110',
    '11222211',
    '12022021',
    '12211221',
    '11222211',
    '01122110',
  ],
  aguia: [
    '10011001',
    '11022011',
    '11122111',
    '01111110',
    '00122100',
    '00100100',
  ],
  lobo: [
    '10000001',
    '11011011',
    '12111121',
    '01122110',
    '00111100',
    '00011000',
  ],
  tigre: [
    '11011011',
    '21222212',
    '12011021',
    '21222212',
    '01122110',
    '00111100',
  ],
  dragao: [
    '01011010',
    '11122111',
    '01211210',
    '11122111',
    '10111101',
    '00100100',
  ],
  estrela: [
    '00022000',
    '00222200',
    '22211222',
    '02211220',
    '02200220',
    '20000002',
  ],
  touro: [
    '20000002',
    '21011012',
    '01111110',
    '01011010',
    '00122100',
    '00111100',
  ],
  coroa: [
    '20022002',
    '21022012',
    '21222212',
    '11111111',
    '22222222',
    '11111111',
  ],
  ancora: [
    '00022000',
    '00122100',
    '00022000',
    '20022002',
    '22022022',
    '02222220',
  ],
  pinheiro: [
    '00011000',
    '00111100',
    '01122110',
    '11111111',
    '00022000',
    '00022000',
  ],
  falcao: [
    '00111100',
    '01211210',
    '11122111',
    '00111100',
    '01100110',
    '10000001',
  ],
  raio: [
    '00022200',
    '00222000',
    '02222220',
    '00022200',
    '00220000',
    '02000000',
  ],
};

const MASCOT_SLOGANS: Record<MascotId, string> = {
  aguia: 'VOO DA GLÓRIA',
  leao: 'GARRA & RAÇA',
  lobo: 'FORÇA DA MATILHA',
  tigre: 'FUROR EM CAMPO',
  dragao: 'CHAMA ETERNA',
  estrela: 'BRILHO SUL',
  touro: 'ÍMPETO TOTAL',
  coroa: 'TRADIÇÃO REAL',
  ancora: 'PORTO INVICTO',
  pinheiro: 'RAIZ FORTE',
  falcao: 'DOMÍNIO AÉREO',
  raio: 'VELOZ & LETAL',
};

function drawMascotMosaic(
  ctx: CanvasRenderingContext2D,
  mascot: MascotId,
  primary: string,
  secondary: string,
  timeSec: number,
  openProgress = 1
) {
  const grid = MASCOT_GRIDS[mascot] || MASCOT_GRIDS.estrela;
  const totalW = 360;
  const visibleW = Math.max(24, Math.round(totalW * Math.min(1, Math.max(0.08, openProgress))));
  const startX = Math.round(PITCH_GEO.worldW / 2 - visibleW / 2);
  const startY = 22;

  // Giant Tifo / Bandeirão unfurling cloth
  ctx.fillStyle = primary;
  ctx.fillRect(startX, startY, visibleW, 82);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 3;
  ctx.strokeRect(startX, startY, visibleW, 82);

  // Decorative side stripes on Bandeirão
  if (visibleW > 120) {
    ctx.fillStyle = secondary;
    ctx.fillRect(startX + 10, startY + 6, 12, 70);
    ctx.fillRect(startX + visibleW - 22, startY + 6, 12, 70);
  }

  if (openProgress >= 0.45) {
    const cellW = 30;
    const cellH = 9;
    const gridX = PITCH_GEO.worldW / 2 - (8 * cellW) / 2;
    const gridY = startY + 8;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const ch = grid[r][c];
        if (ch === '0') continue;
        ctx.fillStyle = ch === '2' ? '#FACC15' : secondary;
        const bounce = Math.round(Math.sin(timeSec * 5 + c * 0.5) * 1.5);
        ctx.fillRect(gridX + c * cellW, gridY + r * cellH + bounce, cellW - 2, cellH - 1);
      }
    }

    // Slogan ribbon below pixel emblem
    ctx.fillStyle = '#0B121D';
    ctx.fillRect(PITCH_GEO.worldW / 2 - 90, startY + 65, 180, 14);
    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(MASCOT_SLOGANS[mascot] || 'RAÇA & VITÓRIA', PITCH_GEO.worldW / 2, startY + 72);
  }

  // Secondary West-stand Bandeirão during entrance or big goals
  ctx.fillStyle = secondary;
  ctx.fillRect(26, PITCH_GEO.worldH / 2 - 120, 74, 240);
  ctx.fillStyle = primary;
  ctx.fillRect(34, PITCH_GEO.worldH / 2 - 110, 58, 220);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(48, PITCH_GEO.worldH / 2 - 22, 30, 44);
}

interface AdBrand {
  name: string;
  bg: string;
  fg: string;
  accent: string;
}

const AD_BRANDS: AdBrand[] = [
  { name: 'BRASA', bg: '#065F46', fg: '#ECFDF5', accent: '#FACC15' },
  { name: 'AURORA', bg: '#1E293B', fg: '#FEF3C7', accent: '#F59E0B' },
  { name: 'SOLAR', bg: '#0369A1', fg: '#F0F9FF', accent: '#38BDF8' },
  { name: 'VELOZ', bg: '#991B1B', fg: '#FEF2F2', accent: '#FFFFFF' },
  { name: 'VOAR', bg: '#312E81', fg: '#EEF2FF', accent: '#A5B4FC' },
  { name: 'CERRADO', bg: '#451A03', fg: '#FEF3C7', accent: '#D97706' },
  { name: 'ENERGIA', bg: '#365314', fg: '#F7FEE7', accent: '#A3E635' },
  { name: 'PIXELNET', bg: '#831843', fg: '#FDF2F8', accent: '#F472B6' },
];

function drawAdvertisingBoards(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  goalExcitement: number,
  goalClubPrimary: string,
  goalClubSecondary: string,
  lightsOn: boolean
) {
  const g = PITCH_GEO;
  const boardCount = 11;
  const boardW = Math.floor((g.pitchW - 24) / boardCount);
  const gap = 3;
  const safeTime = Number.isFinite(timeSec) && timeSec > 0 ? timeSec : 0;
  const len = AD_BRANDS.length;
  const cycleIdx = Math.floor(safeTime / 7);
  const modTime = safeTime % 7;
  const transitionFrac = modTime > 6.5 ? (modTime - 6.5) / 0.5 : 0;
  const isGoalFlash = goalExcitement > 0.2 && Math.floor(safeTime * 8) % 2 === 0;

  // Top & Bottom LED perimeter boards
  for (let i = 0; i < boardCount; i++) {
    const bx = g.pitchX + 12 + i * boardW;
    const bw = boardW - gap;
    const brand = AD_BRANDS[(((i + cycleIdx) % len) + len) % len];
    const bg = isGoalFlash ? goalClubPrimary : brand.bg;
    const fg = isGoalFlash ? goalClubSecondary : brand.fg;
    const label = isGoalFlash ? 'GOOOOL!' : brand.name;

    // Top LED board (with slight vertical depth frame)
    const ty = g.pitchY - 22;
    px(ctx, bx, ty, bw, 13, '#0B121D');
    px(ctx, bx + 1, ty + 1, bw - 2, 11, bg);
    px(ctx, bx + 3, ty + 3, 5, 7, isGoalFlash ? '#FACC15' : brand.accent);

    if (transitionFrac > 0) {
      px(ctx, bx + 1, ty + 1, Math.round((bw - 2) * transitionFrac), 11, 'rgba(255,255,255,0.22)');
    }

    ctx.fillStyle = fg;
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw / 2 + 3, ty + 7);

    // Bottom static/LED board
    const by = g.pitchY + g.pitchH + 9;
    px(ctx, bx, by, bw, 13, '#0B121D');
    px(ctx, bx + 1, by + 1, bw - 2, 11, bg);
    px(ctx, bx + 3, by + 3, 5, 7, isGoalFlash ? '#FACC15' : brand.accent);
    ctx.fillStyle = fg;
    ctx.fillText(label, bx + bw / 2 + 3, by + 7);

    if (lightsOn) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(bx, ty + 13, bw, 4);
    }
  }

  // Behind-goal flanking static sponsor boards (top & bottom of each goal)
  const midY = g.pitchY + g.pitchH / 2;
  const goalTop = midY - g.goalH / 2;
  const goalBot = midY + g.goalH / 2;
  const sideZones = [
    { y: g.pitchY + 12, h: goalTop - g.pitchY - 28 },
    { y: goalBot + 16, h: g.pitchY + g.pitchH - 12 - (goalBot + 16) },
  ];

  sideZones.forEach((zone, zIdx) => {
    const segs = 3;
    const segH = Math.floor(zone.h / segs) - 3;
    for (let s = 0; s < segs; s++) {
      const sy = zone.y + s * (segH + 3);
      const brand = AD_BRANDS[(((s + zIdx * 3) % len) + len) % len];
      // Left endzone
      px(ctx, g.pitchX - 52, sy, 12, segH, '#0F172A');
      px(ctx, g.pitchX - 50, sy + 1, 8, segH - 2, brand.bg);
      px(ctx, g.pitchX - 50, sy + 2, 8, 6, brand.accent);
      // Right endzone
      px(ctx, g.pitchX + g.pitchW + 40, sy, 12, segH, '#0F172A');
      px(ctx, g.pitchX + g.pitchW + 42, sy + 1, 8, segH - 2, brand.bg);
      px(ctx, g.pitchX + g.pitchW + 42, sy + 2, 8, 6, brand.accent);
    }
  });
}

function drawJumbotron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  homeShort: string,
  awayShort: string,
  homeScore: number,
  awayScore: number,
  minuteStr: string,
  homePrimary: string,
  awayPrimary: string,
  goalExcitement: number,
  timeSec: number,
  lightsOn: boolean
) {
  px(ctx, x - 4, y - 4, 156, 38, '#090D16');
  px(ctx, x - 2, y - 2, 152, 34, '#334155');
  px(ctx, x, y, 148, 30, '#020617');

  if (goalExcitement > 0.3 && Math.floor(timeSec * 6) % 2 === 0) {
    px(ctx, x + 2, y + 2, 144, 26, homePrimary);
    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GOOOOL!', x + 74, y + 15);
  } else {
    px(ctx, x + 3, y + 4, 6, 22, homePrimary);
    px(ctx, x + 139, y + 4, 6, 22, awayPrimary);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${homeShort} ${homeScore} - ${awayScore} ${awayShort}`, x + 74, y + 11);
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.fillText(minuteStr, x + 74, y + 23);
  }

  if (lightsOn) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(x - 8, y - 8, 164, 46);
  }
}

function drawDugoutAndCoach(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kit: ClubKit,
  isHome: boolean,
  goalCelebrate: boolean,
  timeSec: number
) {
  // Technical area chalk outline
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 6, y + 14, 96, 18);

  // Bench shelter roof & glass/metal back
  px(ctx, x, y, 84, 14, '#0F172A');
  px(ctx, x + 2, y + 2, 80, 10, '#1E293B');
  px(ctx, x, y, 84, 3, kit.primary);

  // Seated reserve players in colorful bibs
  for (let i = 0; i < 5; i++) {
    const sx = x + 10 + i * 14;
    const bounce = goalCelebrate ? Math.round(Math.abs(Math.sin(timeSec * 12 + i)) * 3) : 0;
    px(ctx, sx, y + 5 - bounce, 7, 6, i % 2 === 0 ? '#FACC15' : kit.secondary);
    px(ctx, sx + 1, y + 2 - bounce, 5, 4, SKIN_TONES[(i + (isHome ? 0 : 2)) % SKIN_TONES.length]);
  }

  // Coach standing in technical area
  const coachX = isHome ? x + 88 : x - 10;
  const coachJump = goalCelebrate ? Math.round(Math.abs(Math.sin(timeSec * 11)) * 4) : 0;
  px(ctx, coachX - 3, y + 17 - coachJump, 7, 8, '#334155');
  px(ctx, coachX - 2, y + 12 - coachJump, 5, 5, '#E0AC69');
  if (goalCelebrate) {
    px(ctx, coachX - 5, y + 13 - coachJump, 2, 5, '#334155');
    px(ctx, coachX + 4, y + 13 - coachJump, 2, 5, '#334155');
  }
}

export function drawPixelStadium(
  ctx: CanvasRenderingContext2D,
  crowd: CrowdSpectator[],
  timeSec: number,
  goalExcitement: number,
  netRippleLeft: number,
  netRippleRight: number,
  quality: GraphicsQuality,
  options?: {
    stadium?: StadiumSpec;
    homeKit?: ClubKit;
    awayKit?: ClubKit;
    homeShort?: string;
    awayShort?: string;
    homeScore?: number;
    awayScore?: number;
    matchMinuteStr?: string;
    mascot?: MascotId;
    crowdMood?: CrowdMood;
    showMosaic?: boolean;
    mosaicProgress?: number;
    env?: MatchEnvironment;
    environmentalEffects?: boolean;
    effectsIntensity?: number;
  }
) {
  const g = PITCH_GEO;
  const st = options?.stadium;
  const arch = st?.architecture || 'modern';
  const homePrimary = options?.homeKit?.primary || '#10B981';
  const homeSecondary = options?.homeKit?.secondary || '#FFFFFF';
  const awayPrimary = options?.awayKit?.primary || '#3B82F6';
  const mood = options?.crowdMood || 'calm';
  const lightsOn =
    options?.env?.timeOfDay === 'Noite' || options?.env?.timeOfDay === 'Fim de tarde';
  const isRain =
    options?.environmentalEffects !== false &&
    (options?.env?.weather === 'Chuva fraca' || options?.env?.weather === 'Chuva forte');

  // 1. Outer Arena Exterior
  ctx.fillStyle = '#070C14';
  ctx.fillRect(0, 0, g.worldW, g.worldH);

  // Municipal parks/trees outside small stadiums
  if (arch === 'municipal' || arch === 'compact') {
    for (let tx = 40; tx < g.worldW; tx += 110) {
      px(ctx, tx, 4, 18, 12, '#14532D');
      px(ctx, tx + 4, 2, 10, 10, '#166534');
      px(ctx, tx, g.worldH - 16, 18, 12, '#14532D');
    }
  }

  // 2. Stepped Multi-Tier Bleachers
  ctx.fillStyle = st?.standColor || '#182433';
  ctx.fillRect(14, 14, g.worldW - 28, g.worldH - 28);

  // Tier steps shading (distinct architectural tiers)
  const tierColors =
    arch === 'grand'
      ? ['#1E293B', '#263449', '#334155']
      : arch === 'cauldron'
      ? ['#171F2E', '#202B3D', '#2A374C']
      : ['#16202E', '#1D293A', '#243347'];
  for (let t = 0; t < 3; t++) {
    ctx.strokeStyle = tierColors[t];
    ctx.lineWidth = 14;
    ctx.strokeRect(24 + t * 24, 24 + t * 20, g.worldW - 48 - t * 48, g.worldH - 48 - t * 40);
  }

  // Aisle staircases (Escadarias) & Sector Divider Rails
  ctx.fillStyle = '#475569';
  for (let x = 135; x < g.worldW - 135; x += 180) {
    ctx.fillRect(x, 18, 14, 110);
    ctx.fillRect(x, g.worldH - 128, 14, 110);
    // Yellow safety handrail steps
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(x + 6, 22, 2, 102);
    ctx.fillRect(x + 6, g.worldH - 124, 2, 102);
    ctx.fillStyle = '#475569';
  }
  for (let y = 165; y < g.worldH - 165; y += 190) {
    ctx.fillRect(18, y, 136, 14);
    ctx.fillRect(g.worldW - 154, y, 136, 14);
  }

  // Perimeter inner wall & track / apron around pitch
  if (st?.trackBorder || arch === 'traditional') {
    // Classic Olympic athletics track with white lane lines
    px(ctx, 152, 130, g.worldW - 304, g.worldH - 260, '#7C2D12');
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(156, 134, g.worldW - 312, g.worldH - 268);
    ctx.strokeRect(164, 142, g.worldW - 328, g.worldH - 284);
  } else {
    px(ctx, 152, 130, g.worldW - 304, g.worldH - 260, '#111A26');
  }

  // Perimeter security fence / wall
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 3;
  ctx.strokeRect(150, 128, g.worldW - 300, g.worldH - 256);

  // Sector Signage & Club Banners (Faixas)
  const sectorNames = [
    { x: 310, y: 122, text: 'SETOR NORTE' },
    { x: g.worldW - 360, y: 122, text: 'TRIBUNA DE HONRA' },
    { x: 310, y: g.worldH - 126, text: 'ARQUIBANCADA SUL' },
    { x: g.worldW - 360, y: g.worldH - 126, text: 'SETOR VISITANTE' },
  ];
  sectorNames.forEach((sec) => {
    px(ctx, sec.x - 52, sec.y, 104, 11, '#0F172A');
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sec.text, sec.x, sec.y + 6);
  });

  // Club banners along stands
  px(ctx, 180, 130, 220, 8, homePrimary);
  px(ctx, g.worldW - 400, 130, 220, 8, homePrimary);
  px(ctx, 190, g.worldH - 138, 200, 8, homeSecondary);
  px(ctx, g.worldW - 390, g.worldH - 138, 200, 8, awayPrimary);

  // 3. Player Entrance Tunnel (bottom center) + Press Cabins (top center) + Dugouts
  // Entrance Tunnel
  const tunnelX = g.worldW / 2 - 36;
  const tunnelY = g.worldH - 132;
  px(ctx, tunnelX, tunnelY, 72, 28, '#020617');
  px(ctx, tunnelX + 4, tunnelY, 64, 8, homePrimary);
  px(ctx, tunnelX + 12, tunnelY + 2, 48, 4, homeSecondary);

  // Press Cabins (Cabines de Imprensa) in North upper structure
  px(ctx, g.worldW / 2 - 120, 6, 240, 16, '#1E293B');
  for (let c = 0; c < 6; c++) {
    px(ctx, g.worldW / 2 - 106 + c * 36, 9, 28, 9, lightsOn ? '#FEF08A' : '#38BDF8');
  }

  // Home & Away Dugouts (Bancos de Reservas)
  if (options?.homeKit && options?.awayKit) {
    drawDugoutAndCoach(
      ctx,
      g.pitchX + 180,
      g.pitchY - 48,
      options.homeKit,
      true,
      mood === 'goal_home' || mood === 'celebrating_victory',
      timeSec
    );
    drawDugoutAndCoach(
      ctx,
      g.pitchX + g.pitchW - 265,
      g.pitchY - 48,
      options.awayKit,
      false,
      mood === 'goal_away',
      timeSec
    );
  }

  // 4. Live Jumbotrons / Telões
  drawJumbotron(
    ctx,
    g.worldW / 2 - 74,
    132,
    options?.homeShort || 'CAS',
    options?.awayShort || 'VIS',
    options?.homeScore ?? 0,
    options?.awayScore ?? 0,
    options?.matchMinuteStr || "00'",
    homePrimary,
    awayPrimary,
    goalExcitement,
    timeSec,
    lightsOn
  );
  if (arch === 'grand' || arch === 'modern') {
    drawJumbotron(
      ctx,
      166,
      132,
      options?.homeShort || 'CAS',
      options?.awayShort || 'VIS',
      options?.homeScore ?? 0,
      options?.awayScore ?? 0,
      options?.matchMinuteStr || "00'",
      homePrimary,
      awayPrimary,
      goalExcitement,
      timeSec,
      lightsOn
    );
  }

  // 5. Advertising Boards (LED & Static)
  drawAdvertisingBoards(ctx, timeSec, goalExcitement, homePrimary, homeSecondary, lightsOn);

  // 6. Rich Animated Pixel Crowd
  const isGoalHome = mood === 'goal_home' || mood === 'celebrating_victory';
  const isGoalAway = mood === 'goal_away';
  const olaWaveCenter = ((timeSec * 380) % (g.worldW + 200)) - 100;

  for (let i = 0; i < crowd.length; i++) {
    const sp = crowd[i];
    const cheering =
      (isGoalHome && !sp.isAwaySector) ||
      (isGoalAway && sp.isAwaySector) ||
      goalExcitement > 0.35;
    const disappointed =
      mood === 'disappointed' || (isGoalAway && !sp.isAwaySector) || (isGoalHome && sp.isAwaySector);

    // Mexican wave (Ola) ripple during excitement or home goals
    const olaBoost =
      (mood === 'excited' || isGoalHome) && Math.abs(sp.x - olaWaveCenter) < 90
        ? Math.sin(((sp.x - olaWaveCenter + 90) / 180) * Math.PI) * 4.5
        : 0;

    let speed = 2.8 * sp.freq;
    let amp = 0.9;
    if (cheering) {
      speed = 13.5 * sp.freq;
      amp = 4.6;
    } else if (mood === 'excited') {
      speed = 8.2 * sp.freq;
      amp = 2.6;
    } else if (mood === 'tense') {
      speed = 6.0 * sp.freq;
      amp = 1.4;
    } else if (disappointed) {
      speed = 1.4;
      amp = 0.4;
    }

    const jump =
      sp.behavior === 'calm' && !cheering
        ? Math.round(Math.sin(timeSec * 2 + sp.phase) * 0.5)
        : Math.round(Math.sin(timeSec * speed + sp.phase) * amp + olaBoost);

    const sx = sp.x;
    const sy = sp.y - Math.max(0, jump);

    // Torso
    px(ctx, sx - 3, sy - 3, 7, 6, sp.shirtColor);
    // Head
    px(ctx, sx - 2, sy - 7, 4, 4, sp.skinColor);
    if (sp.hatColor) {
      px(ctx, sx - 2, sy - 8, 4, 2, sp.hatColor);
    }

    // Arms behavior (raising arms, clapping, hands on head)
    if (cheering || (sp.behavior === 'waver' && mood === 'excited')) {
      const armWave = Math.round(Math.sin(timeSec * 15 + sp.phase) * 2);
      px(ctx, sx - 5, sy - 7 + armWave, 2, 4, sp.skinColor);
      px(ctx, sx + 4, sy - 7 - armWave, 2, 4, sp.skinColor);
    } else if (disappointed) {
      // Hands on head / slumped
      px(ctx, sx - 4, sy - 7, 2, 3, sp.skinColor);
      px(ctx, sx + 3, sy - 7, 2, 3, sp.skinColor);
    } else if (sp.behavior === 'clapper' && Math.sin(timeSec * 9 + sp.phase) > 0.2) {
      px(ctx, sx - 2, sy - 2, 5, 2, sp.skinColor);
    }

    // Waving Flags & Giant Bandeirões
    if (sp.hasFlag && quality !== 'low') {
      const waveSpeed = cheering ? 12 : 6;
      const wave = Math.round(Math.sin(timeSec * waveSpeed + sp.phase) * 3);
      const flagColor = sp.isAwaySector ? awayPrimary : homePrimary;
      const flagAlt = sp.isAwaySector ? '#FFFFFF' : homeSecondary;
      if (sp.isGiantFlag && quality === 'high') {
        px(ctx, sx + 3, sy - 26, 2, 22, '#E2E8F0');
        px(ctx, sx + 5, sy - 26, 16 + wave, 11, flagColor);
        px(ctx, sx + 5, sy - 22, 16 + wave, 4, flagAlt);
      } else {
        px(ctx, sx + 3, sy - 16, 2, 12, '#E2E8F0');
        px(ctx, sx + 5, sy - 16, 9 + Math.round(wave * 0.5), 6, flagColor);
      }
    }
  }

  // 7. Stadium Roof Canopy & Steel Trusses (semi-transparent architectural overhang)
  if (st?.roofCover || arch === 'grand' || arch === 'modern') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
    ctx.fillRect(10, 10, g.worldW - 20, 26);
    ctx.fillRect(10, g.worldH - 36, g.worldW - 20, 26);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
    for (let tx = 40; tx < g.worldW - 40; tx += 95) {
      ctx.fillRect(tx, 10, 3, 28);
      ctx.fillRect(tx, g.worldH - 38, 3, 28);
    }
  }

  // 8. Mascot Mosaic / Bandeirão (pre-match opening & big goal celebrations)
  if ((options?.showMosaic || goalExcitement > 0.65) && options?.mascot) {
    drawMascotMosaic(
      ctx,
      options.mascot,
      homePrimary,
      homeSecondary,
      timeSec,
      options?.mosaicProgress ?? 1
    );
  }

  // 9. Flares / Sinalizadores on goals or opening mosaic
  if ((options?.showMosaic || goalExcitement > 0.2) && options?.environmentalEffects !== false) {
    const flareSpots = [190, 490, 1110, 1410];
    flareSpots.forEach((fx, idx) => {
      const fy = idx % 2 === 0 ? 108 : g.worldH - 108;
      const flicker = 5 + Math.sin(timeSec * 22 + idx) * 2.5;
      ctx.fillStyle = homePrimary;
      ctx.fillRect(fx - flicker, fy - flicker, flicker * 2, flicker * 2);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(fx - 2, fy - 2, 5, 5);
    });
  }

  // 10. Floodlight Towers / Ring / Poles + Aviation Warning Beacons
  const towers = [
    [32, 32],
    [g.worldW - 50, 32],
    [32, g.worldH - 50],
    [g.worldW - 50, g.worldH - 50],
  ];
  towers.forEach(([tx, ty], tIdx) => {
    px(ctx, tx, ty, 18, 18, '#1E293B');
    px(ctx, tx + 2, ty + 2, 14, 14, '#334155');
    // Lamp grid
    for (let lx = 0; lx < 3; lx++) {
      for (let ly = 0; ly < 2; ly++) {
        px(
          ctx,
          tx + 3 + lx * 4,
          ty + 4 + ly * 5,
          3,
          3,
          lightsOn ? '#FEF9C3' : '#64748B'
        );
      }
    }
    // Red warning light blinking at night
    if (lightsOn && Math.floor(timeSec * 2 + tIdx) % 2 === 0) {
      px(ctx, tx + 7, ty - 2, 3, 3, '#EF4444');
    }
  });

  // 11. Pitch Mowed Grass Stripes
  const toneA = st?.turfToneA || '#1B6E3A';
  const toneB = st?.turfToneB || '#1F7A41';
  const stripes = 14;
  const sw = g.pitchW / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? toneA : toneB;
    ctx.fillRect(Math.round(g.pitchX + i * sw), g.pitchY, Math.ceil(sw), g.pitchH);
  }

  // Wet Turf Puddles & Floodlight Reflections in Rain
  if (isRain && options?.env) {
    const puddleCount = options.env.weather === 'Chuva forte' ? 11 : 5;
    for (let i = 0; i < puddleCount; i++) {
      const pxPos = g.pitchX + 95 + ((i * 193) % (g.pitchW - 190));
      const pyPos = g.pitchY + 65 + ((i * 137) % (g.pitchH - 130));
      ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
      ctx.fillRect(pxPos, pyPos, 30, 12);
      ctx.fillRect(pxPos + 6, pyPos - 3, 18, 18);
      if (lightsOn) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
        ctx.fillRect(pxPos + 8 + Math.round(Math.sin(timeSec * 5 + i) * 2), pyPos + 2, 10, 4);
      }
    }
  }

  if (quality === 'high') {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = g.pitchX + 18; x < g.pitchX + g.pitchW; x += 48) {
      for (let y = g.pitchY + 18; y < g.pitchY + g.pitchH; y += 48) {
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  // 12. Crisp Pitch Markings
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.92)';
  ctx.lineWidth = 3;
  ctx.strokeRect(g.pitchX, g.pitchY, g.pitchW, g.pitchH);

  const midX = g.pitchX + g.pitchW / 2;
  const midY = g.pitchY + g.pitchH / 2;
  ctx.beginPath();
  ctx.moveTo(midX, g.pitchY);
  ctx.lineTo(midX, g.pitchY + g.pitchH);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, 82, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(midX - 4, midY - 4, 8, 8);

  const penW = 162;
  const penH = 340;
  const sixW = 58;
  const sixH = 168;
  const boxTop = midY - penH / 2;
  const sixTop = midY - sixH / 2;

  ctx.strokeRect(g.pitchX, boxTop, penW, penH);
  ctx.strokeRect(g.pitchX, sixTop, sixW, sixH);
  ctx.fillRect(g.pitchX + 112 - 3, midY - 3, 6, 6);

  ctx.strokeRect(g.pitchX + g.pitchW - penW, boxTop, penW, penH);
  ctx.strokeRect(g.pitchX + g.pitchW - sixW, sixTop, sixW, sixH);
  ctx.fillRect(g.pitchX + g.pitchW - 112 - 3, midY - 3, 6, 6);

  ctx.beginPath();
  ctx.arc(g.pitchX + 112, midY, 74, -0.68, 0.68);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(g.pitchX + g.pitchW - 112, midY, 74, Math.PI - 0.68, Math.PI + 0.68);
  ctx.stroke();

  const corners = [
    [g.pitchX, g.pitchY, 0, Math.PI / 2],
    [g.pitchX + g.pitchW, g.pitchY, Math.PI / 2, Math.PI],
    [g.pitchX + g.pitchW, g.pitchY + g.pitchH, Math.PI, Math.PI * 1.5],
    [g.pitchX, g.pitchY + g.pitchH, Math.PI * 1.5, Math.PI * 2],
  ];
  corners.forEach(([cx, cy, a1, a2]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 18, a1, a2);
    ctx.stroke();
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(cx - 2, cy - 12, 3, 12);
    const wave = Math.sin(timeSec * 6 + cx) * 2;
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(cx + 1, cy - 12 + wave * 0.4, 8, 5);
  });

  const goalTop = midY - g.goalH / 2;
  drawGoalNet(ctx, g.pitchX - g.goalDepth, goalTop, g.goalDepth, g.goalH, 'left', netRippleLeft, timeSec);
  drawGoalNet(ctx, g.pitchX + g.pitchW, goalTop, g.goalDepth, g.goalH, 'right', netRippleRight, timeSec);
}

export function drawWeatherAndLightingOverlay(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  timeSec: number,
  env?: MatchEnvironment,
  enabled = true,
  intensity = 0.9,
  goalCelebrationPulse = 0
) {
  if (!env || !enabled) return;

  if (env.timeOfDay === 'Fim de tarde') {
    const sunset = ctx.createLinearGradient(0, 0, canvasW, canvasH);
    sunset.addColorStop(0, `rgba(251, 146, 60, ${0.14 * intensity})`);
    sunset.addColorStop(1, `rgba(124, 45, 18, ${0.1 * intensity})`);
    ctx.fillStyle = sunset;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (env.timeOfDay === 'Noite') {
    // Illuminated central stadium pool with darker outer stands vignette
    const grad = ctx.createRadialGradient(
      canvasW / 2,
      canvasH / 2,
      Math.min(canvasW, canvasH) * 0.3,
      canvasW / 2,
      canvasH / 2,
      Math.max(canvasW, canvasH) * 0.75
    );
    grad.addColorStop(0, 'rgba(254, 249, 195, 0.03)');
    grad.addColorStop(0.65, `rgba(15, 23, 42, ${0.16 * intensity})`);
    grad.addColorStop(1, `rgba(2, 6, 18, ${0.52 * intensity})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle corner floodlight cones
    ctx.fillStyle = `rgba(254, 249, 195, ${0.045 * intensity})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvasW * 0.35, canvasH * 0.28);
    ctx.lineTo(canvasW * 0.22, canvasH * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(canvasW, 0);
    ctx.lineTo(canvasW * 0.65, canvasH * 0.28);
    ctx.lineTo(canvasW * 0.78, canvasH * 0.42);
    ctx.closePath();
    ctx.fill();
  } else if (env.weather === 'Nublado') {
    ctx.fillStyle = `rgba(100, 116, 139, ${0.09 * intensity})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (env.timeOfDay === 'Manhã') {
    ctx.fillStyle = `rgba(224, 242, 254, ${0.06 * intensity})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Goal celebration stadium flash / floodlight pulse
  if (goalCelebrationPulse > 0.3 && Math.floor(timeSec * 10) % 3 === 0) {
    ctx.fillStyle = `rgba(250, 204, 21, ${0.07 * intensity})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Multi-depth animated Pixel Rain + water splash pixels
  if (env.weather === 'Chuva fraca' || env.weather === 'Chuva forte') {
    const isHeavy = env.weather === 'Chuva forte';
    const dropCount = isHeavy ? 115 : 48;
    const count = Math.round(dropCount * intensity);
    ctx.fillStyle = isHeavy ? 'rgba(186, 230, 253, 0.48)' : 'rgba(186, 230, 253, 0.36)';
    for (let i = 0; i < count; i++) {
      const rx = ((i * 197 + timeSec * 255) % (canvasW + 90)) - 45;
      const ry = ((i * 131 + timeSec * 560) % (canvasH + 40)) - 20;
      ctx.fillRect(Math.round(rx), Math.round(ry), 2, isHeavy ? 12 : 9);
      if (isHeavy && i % 5 === 0 && ry > canvasH * 0.3 && ry < canvasH * 0.85) {
        ctx.fillRect(Math.round(rx - 2), Math.round(ry + 12), 5, 1);
      }
    }
  }
}

function drawGoalNet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  side: 'left' | 'right',
  ripple: number,
  timeSec: number
) {
  const offset = ripple > 0 ? Math.sin(timeSec * 28) * ripple * 5 * (side === 'left' ? -1 : 1) : 0;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.fillRect(x + offset, y, w, h);

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.58)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let nx = x; nx <= x + w; nx += 7) {
    ctx.moveTo(nx + offset * 0.6, y);
    ctx.lineTo(nx + offset * 0.6, y + h);
  }
  for (let ny = y; ny <= y + h; ny += 7) {
    ctx.moveTo(x + offset, ny);
    ctx.lineTo(x + w + offset * 0.3, ny);
  }
  ctx.stroke();

  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + offset * 0.5, y, w, h);

  const postX = side === 'left' ? x + w : x;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(postX - 4, y - 4, 8, 8);
  ctx.fillRect(postX - 4, y + h - 4, 8, 8);
}

export function drawPixelBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  spin: number
) {
  const shadowScale = Math.max(0.55, 1 - z / 90);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(
    Math.round(x - 6 * shadowScale),
    Math.round(y + 3),
    Math.round(12 * shadowScale),
    Math.round(5 * shadowScale)
  );

  const drawY = Math.round(y - z);
  const r = Math.round(6 + Math.min(3, z * 0.04));

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(Math.round(x - r), drawY - r, r * 2, r * 2);

  const pOff = Math.round(Math.sin(spin) * 2.5);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(Math.round(x - 2 + pOff), drawY - 2, 4, 4);
  ctx.fillRect(Math.round(x - r), drawY - 1, 2, 3);
  ctx.fillRect(Math.round(x + r - 2), drawY - 1, 2, 3);

  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(x - r), drawY - r, r * 2, r * 2);
}

export function drawPixelReferee(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animPhase: number
) {
  const stride = Math.sin(animPhase) * 2;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(-7, 9, 14, 4);

  px(ctx, -4, 3 + stride * 0.6, 3, 6, '#111827');
  px(ctx, 1, 3 - stride * 0.6, 3, 6, '#111827');
  px(ctx, -5, 0, 10, 4, '#0F172A');
  px(ctx, -6, -8, 12, 8, '#FDE047');
  px(ctx, -2, -8, 4, 8, '#111827');
  px(ctx, -4, -15, 8, 7, '#E2B48F');
  px(ctx, -4, -17, 8, 3, '#1E293B');

  ctx.restore();
}

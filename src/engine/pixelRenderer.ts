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
  isCaptain?: boolean;
  isMotmLeader?: boolean;
  facingAngle: number;
  animPhase: number;
  isSprinting: boolean;
  isDribbling: boolean;
  hasBall: boolean;
  action?: PlayerAnimAction;
  zOffset?: number;
  viewAngle?: 'front' | 'back' | 'side';
}

export interface TurfScuffMark {
  x: number;
  y: number;
  angle: number;
  length: number;
  alpha: number;
  kind: 'slide' | 'scuff';
}

export interface BallTrailPoint {
  x: number;
  y: number;
  z: number;
  alpha: number;
  isPower?: boolean;
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

function pxOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  outline = 'rgba(10, 16, 28, 0.72)',
  pad = 1
) {
  px(ctx, x - pad, y - pad, w + pad * 2, h + pad * 2, outline);
  px(ctx, x, y, w, h, color);
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
  const {
    appearance,
    gear,
    kit,
    isGoalkeeper,
    animPhase,
    action = 'idle',
    zOffset = 0,
    viewAngle = 'front',
  } = visual;
  const s = pixelScale * appearance.visualHeightScale;
  const ol = Math.max(1, Math.round(0.45 * s));
  const widthFactor =
    appearance.bodyType === 'Forte'
      ? 1.18
      : appearance.bodyType === 'Magro'
      ? 0.88
      : 1.0;

  const isBackView = mode === 'preview' && viewAngle === 'back';
  const isSideView = mode === 'preview' && viewAngle === 'side';

  const shirtMain = isGoalkeeper ? kit.gkPrimary : kit.primary;
  const shirtAlt = isGoalkeeper ? '#0F172A' : kit.secondary;
  const shortsCol = isGoalkeeper ? '#0F172A' : kit.shorts;
  const sockCol = isGoalkeeper ? kit.gkPrimary : kit.socks;

  const isCelebrating = action.startsWith('celebrate_');
  const jumpLift =
    action === 'celebrate_jump'
      ? Math.abs(Math.sin(animPhase * 1.4)) * 7.2 * s
      : action === 'celebrate_dance'
      ? Math.abs(Math.sin(animPhase * 2.2)) * 2.6 * s
      : action === 'header'
      ? 6.2 * s
      : zOffset;

  const stride =
    action === 'sprint' || visual.isSprinting
      ? Math.sin(animPhase) * 3.3
      : action === 'walk'
      ? Math.sin(animPhase) * 1.15
      : action === 'celebrate_dance'
      ? Math.sin(animPhase * 2.2) * 1.8
      : action === 'idle' || action === 'celebrate_slide' || action === 'celebrate_sky'
      ? 0
      : Math.sin(animPhase) * 2.0;
  const armSwing = -stride * 0.9;

  ctx.save();
  ctx.translate(Math.round(centerX), Math.round(centerY));

  // Soft Ground Shadow + Turf Contact
  const shadowShrink = Math.max(0.55, 1 - jumpLift / (26 * s));
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.fillRect(
    Math.round(-5.5 * s * widthFactor * shadowShrink + sunShadowOffset.x),
    Math.round(5.4 * s + sunShadowOffset.y),
    Math.round(11 * s * widthFactor * shadowShrink),
    Math.round(3.2 * s * shadowShrink)
  );

  // Knee-slide grass skid trail!
  if (action === 'celebrate_slide') {
    const slideDir = Math.cos(visual.facingAngle) >= 0 ? -1 : 1;
    px(ctx, slideDir * 2 * s, 4.8 * s, slideDir * 10 * s, 1.5 * s, '#14532D');
    px(ctx, slideDir * 3 * s, 3.8 * s, slideDir * 6 * s, 1.0 * s, '#4ADE80');
  }

  if (mode === 'match' && visual.isUserControlled) {
    ctx.strokeStyle = visual.hasBall ? '#FACC15' : '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 6 * s, 8.2 * s, 4.3 * s, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp directional aim triangle under controlled player's feet
    const dirX = Math.cos(visual.facingAngle) * 11 * s;
    const dirY = Math.sin(visual.facingAngle) * 6 * s + 6 * s;
    ctx.fillStyle = visual.hasBall ? '#FACC15' : '#34D399';
    ctx.fillRect(Math.round(dirX - 2), Math.round(dirY - 2), 5, 5);
  }

  // Skill dribble sparkle boots glow
  if (mode === 'match' && visual.isDribbling) {
    const spOff = Math.sin(animPhase * 4) * 3.2 * s;
    px(ctx, -6 * s + spOff, 4 * s, 2.2 * s, 2.2 * s, '#FACC15');
    px(ctx, 4 * s - spOff, 3 * s, 2.2 * s, 2.2 * s, '#38BDF8');
  }

  // Golden CRAQUE leader star badge
  if (mode === 'match' && visual.isMotmLeader && (isCelebrating || !visual.isUserControlled)) {
    const bob = Math.round(Math.sin(animPhase * 0.8) * 1.5);
    px(ctx, -2.5 * s, -13.5 * s - jumpLift + bob, 5 * s, 1.2 * s, '#FACC15');
    px(ctx, -1.3 * s, -14.8 * s - jumpLift + bob, 2.6 * s, 3.6 * s, '#FDE047');
  }

  ctx.translate(0, Math.round(-jumpLift));

  const facingRight = mode === 'preview' ? isSideView : Math.cos(visual.facingAngle) >= 0;
  if (mode === 'match') {
    if (action === 'dive') {
      ctx.rotate(facingRight ? 1.05 : -1.05);
    } else if (action === 'tackle') {
      ctx.rotate(facingRight ? -0.68 : 0.68);
    } else if (action === 'fall') {
      ctx.rotate(facingRight ? 1.15 : -1.15);
    } else if (action === 'kick') {
      ctx.rotate(facingRight ? -0.18 : 0.18);
    } else if (action === 'sprint' || visual.isSprinting) {
      ctx.rotate(facingRight ? 0.08 : -0.08);
    } else if (action === 'celebrate_slide') {
      ctx.rotate(facingRight ? -0.2 : 0.2);
    } else if (action === 'celebrate_dance') {
      ctx.rotate(Math.sin(animPhase * 2.0) * 0.14);
    }
  }

  const w = isSideView ? widthFactor * 0.72 : widthFactor;
  let leftLegY = mode === 'match' || isCelebrating ? 2 * s + stride * 0.55 * s : 2 * s;
  let rightLegY = mode === 'match' || isCelebrating ? 2 * s - stride * 0.55 * s : 2 * s;
  let kickLegOffsetX = 0;

  if (mode === 'match') {
    if (action === 'kick' || action === 'pass') {
      kickLegOffsetX = (facingRight ? 1 : -1) * (action === 'kick' ? 2.8 * s : 1.7 * s);
      rightLegY -= 0.9 * s;
    } else if (action === 'tackle') {
      kickLegOffsetX = (facingRight ? 1 : -1) * 3.6 * s;
    }
  }

  if (action === 'celebrate_slide') {
    // Bent kneeling legs pose (pixel knee-slide artwork)
    const dirSign = facingRight ? 1 : -1;
    pxOutline(ctx, -2.5 * s * w, 2.2 * s, 3.8 * s, 2.2 * s, appearance.skinColor, 'rgba(10,16,28,0.68)', ol);
    pxOutline(ctx, -3.5 * s * w - dirSign * 1.4 * s, 3.6 * s, 3.0 * s, 1.5 * s, sockCol, 'rgba(10,16,28,0.68)', ol);
    px(ctx, -4.5 * s * w - dirSign * 1.9 * s, 4.1 * s, 2.2 * s, 1.3 * s, gear.bootColor);
  } else {
    pxOutline(ctx, -2.6 * s * w, leftLegY, 2.1 * s, 3.3 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
    pxOutline(ctx, 0.5 * s * w + kickLegOffsetX, rightLegY, 2.1 * s, 3.3 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);

    if (gear.accessory === 'Joelho') {
      px(ctx, -2.6 * s * w, leftLegY + 0.6 * s, 2.1 * s, 0.9 * s, '#F8FAFC');
      px(ctx, 0.5 * s * w + kickLegOffsetX, rightLegY + 0.6 * s, 2.1 * s, 0.9 * s, '#F8FAFC');
    }

    const sockH = gear.sockType === 'Alta' ? 2.8 : gear.sockType === 'Média' ? 2.0 : 1.2;
    const sockOff = 3.3 - sockH;
    px(ctx, -2.6 * s * w, leftLegY + sockOff * s, 2.1 * s, sockH * s, sockCol);
    px(ctx, 0.5 * s * w + kickLegOffsetX, rightLegY + sockOff * s, 2.1 * s, sockH * s, sockCol);
    // Crisp folded top sock cuff stripe
    const cuffCol = sockCol.toUpperCase() === '#FFFFFF' ? kit.primary : '#F8FAFC';
    px(ctx, -2.6 * s * w, leftLegY + sockOff * s, 2.1 * s, 0.55 * s, cuffCol);
    px(ctx, 0.5 * s * w + kickLegOffsetX, rightLegY + sockOff * s, 2.1 * s, 0.55 * s, cuffCol);

    const bootH = gear.bootModel === 'TravaAlta' ? 1.55 : 1.25;
    pxOutline(ctx, -2.9 * s * w, leftLegY + 3.0 * s, 2.5 * s, bootH * s, gear.bootColor, 'rgba(10,16,28,0.75)', ol);
    pxOutline(ctx, 0.4 * s * w + kickLegOffsetX, rightLegY + 3.0 * s, 2.5 * s, bootH * s, gear.bootColor, 'rgba(10,16,28,0.75)', ol);
    // Cleat studs (travas) & boot accent
    px(ctx, -2.7 * s * w, leftLegY + 3.0 * s + bootH * s, 0.6 * s, 0.45 * s, '#CBD5E1');
    px(ctx, -1.2 * s * w, leftLegY + 3.0 * s + bootH * s, 0.6 * s, 0.45 * s, '#CBD5E1');
    px(ctx, 0.6 * s * w + kickLegOffsetX, rightLegY + 3.0 * s + bootH * s, 0.6 * s, 0.45 * s, '#CBD5E1');
    px(ctx, 2.1 * s * w + kickLegOffsetX, rightLegY + 3.0 * s + bootH * s, 0.6 * s, 0.45 * s, '#CBD5E1');
    if (gear.bootModel === 'Velocidade' || gear.bootModel === 'Controle') {
      px(ctx, -2.6 * s * w, leftLegY + 3.2 * s, 1.1 * s, 0.5 * s, '#FFFFFF');
      px(ctx, 0.6 * s * w + kickLegOffsetX, rightLegY + 3.2 * s, 1.1 * s, 0.5 * s, '#FFFFFF');
    }
  }

  // Outlined 2-tone shorts with side stripe & center seam
  pxOutline(ctx, -3.6 * s * w, 0.1 * s, 7.2 * s * w, 2.6 * s, shortsCol, 'rgba(10,16,28,0.72)', ol);
  px(ctx, -3.6 * s * w, 0.2 * s, 0.7 * s * w, 2.4 * s, shirtAlt);
  px(ctx, 2.9 * s * w, 0.2 * s, 0.7 * s * w, 2.4 * s, shirtAlt);
  px(ctx, -0.3 * s, 1.4 * s, 0.6 * s, 1.3 * s, 'rgba(10,16,28,0.35)');

  // Outlined Jersey Torso
  const torsoX = -3.9 * s * w;
  const torsoY = -4.7 * s;
  const torsoW = 7.8 * s * w;
  const torsoH = 5.1 * s;
  pxOutline(ctx, torsoX, torsoY, torsoW, torsoH, shirtMain, 'rgba(10,16,28,0.76)', ol);

  if (!isGoalkeeper) {
    if (kit.pattern === 'stripes') {
      px(ctx, torsoX + 1.5 * s * w, torsoY, 1.3 * s * w, torsoH, shirtAlt);
      px(ctx, torsoX + 4.9 * s * w, torsoY, 1.3 * s * w, torsoH, shirtAlt);
    } else if (kit.pattern === 'hoops') {
      px(ctx, torsoX, torsoY + 1.3 * s, torsoW, 1.1 * s, shirtAlt);
      px(ctx, torsoX, torsoY + 3.2 * s, torsoW, 1.1 * s, shirtAlt);
    } else if (kit.pattern === 'halves') {
      px(ctx, 0, torsoY, torsoW / 2, torsoH, shirtAlt);
    } else if (kit.pattern === 'sash') {
      for (let i = 0; i < 4; i++) {
        px(ctx, torsoX + i * 1.6 * s * w, torsoY + i * 1.1 * s, 2.3 * s * w, 1.4 * s, shirtAlt);
      }
    }
  } else {
    // Goalkeeper chest chevron accent
    px(ctx, torsoX + 1.2 * s * w, torsoY + 1.1 * s, torsoW - 2.4 * s * w, 0.9 * s, 'rgba(255,255,255,0.22)');
  }

  // Subtle 16-bit shoulder highlight & bottom waist shadow
  px(ctx, torsoX + 0.6 * s * w, torsoY + 0.2 * s, torsoW - 1.2 * s * w, 0.65 * s, 'rgba(255,255,255,0.16)');
  px(ctx, torsoX, torsoY + torsoH - 0.7 * s, torsoW, 0.7 * s, 'rgba(0,0,0,0.18)');

  // Collar Style + Shaded Neck Pixel
  const collarCol = kit.secondary === shirtMain ? '#FFFFFF' : kit.secondary;
  px(ctx, -1.1 * s, torsoY - 0.8 * s, 2.2 * s, 1.0 * s, appearance.skinColor);
  if (gear.collarStyle === 'Polo') {
    px(ctx, -2.0 * s * w, torsoY - 0.35 * s, 4.0 * s * w, 0.95 * s, collarCol);
    px(ctx, -0.4 * s, torsoY + 0.5 * s, 0.8 * s, 1.1 * s, collarCol);
  } else if (gear.collarStyle === 'Gola V') {
    px(ctx, -1.7 * s * w, torsoY, 3.4 * s * w, 0.65 * s, collarCol);
    px(ctx, -0.9 * s * w, torsoY + 0.5 * s, 1.8 * s * w, 0.7 * s, appearance.skinColor);
  } else {
    px(ctx, -1.6 * s * w, torsoY, 3.2 * s * w, 0.65 * s, collarCol);
  }

  // Arms — 8 distinct celebration animations + regular running/gk/dive poses
  const sleeveH = gear.sleeveLength === 'Longa' ? 3.5 : 1.9;
  const sleeveTrim = collarCol;
  if ((mode === 'match' || animPhase > 0) && isCelebrating) {
    const pump = Math.sin(animPhase * 1.7) * 1.1 * s;
    if (action === 'celebrate_sky') {
      pxOutline(ctx, torsoX - 1.7 * s, -4.2 * s, 1.6 * s, 3.6 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      pxOutline(ctx, torsoX + torsoW + 0.2 * s, -10.8 * s, 1.6 * s, 6.2 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      px(ctx, torsoX + torsoW + 0.2 * s, -6.5 * s, 1.6 * s, sleeveH * s, shirtMain);
      px(ctx, torsoX - 1.7 * s, -4.2 * s, 1.6 * s, sleeveH * s, shirtMain);
    } else if (action === 'celebrate_slide') {
      pxOutline(ctx, torsoX - 2.7 * s, -5.6 * s, 2.7 * s, 1.7 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      pxOutline(ctx, torsoX + torsoW, -5.8 * s, 2.9 * s, 1.7 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      px(ctx, torsoX - 1.5 * s, -5.6 * s, 1.5 * s, 1.7 * s, shirtMain);
      px(ctx, torsoX + torsoW, -5.8 * s, 1.5 * s, 1.7 * s, shirtMain);
    } else if (action === 'celebrate_shirt') {
      pxOutline(ctx, torsoX - 1.8 * s, -8.8 * s, 1.6 * s, 4.2 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      pxOutline(ctx, torsoX + torsoW + 0.2 * s, -8.2 * s, 1.6 * s, 3.8 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      pxOutline(ctx, torsoX + torsoW + 0.2 * s, -9.2 * s, 2.2 * s, 2.2 * s, shirtMain, 'rgba(10,16,28,0.75)', ol);
      px(ctx, torsoX - 1.8 * s, -6.4 * s, 1.6 * s, sleeveH * s, shirtMain);
    } else if (action === 'celebrate_dance') {
      const sway = Math.sin(animPhase * 2.4) * 1.9 * s;
      pxOutline(ctx, torsoX - 1.8 * s, -6.8 * s + sway, 1.6 * s, 3.8 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      pxOutline(ctx, torsoX + torsoW + 0.2 * s, -6.8 * s - sway, 1.6 * s, 3.8 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      px(ctx, torsoX - 1.8 * s, -5.2 * s + sway, 1.6 * s, sleeveH * s, shirtMain);
      px(ctx, torsoX + torsoW + 0.2 * s, -5.2 * s - sway, 1.6 * s, sleeveH * s, shirtMain);
    } else {
      const armUpY = action === 'celebrate_hug' ? -5.6 * s : -8.5 * s + pump;
      const armOut = action === 'celebrate_arms' || action === 'celebrate_crowd' ? 1.8 * s : 0.5 * s;
      pxOutline(ctx, torsoX - 1.6 * s - armOut, armUpY, 1.6 * s, 4.0 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      pxOutline(ctx, torsoX + torsoW + armOut, armUpY, 1.6 * s, 4.0 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
      px(ctx, torsoX - 1.6 * s - armOut, armUpY + (4.0 - sleeveH) * s, 1.6 * s, sleeveH * s, shirtMain);
      px(ctx, torsoX + torsoW + armOut, armUpY + (4.0 - sleeveH) * s, 1.6 * s, sleeveH * s, shirtMain);
    }
  } else if (action === 'dive' && mode === 'match') {
    // Stretched flying goalkeeper save pose
    pxOutline(ctx, torsoX - 1.7 * s, -9.2 * s, 1.7 * s, 4.8 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
    pxOutline(ctx, torsoX + torsoW, -9.2 * s, 1.7 * s, 4.8 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
    px(ctx, torsoX - 1.7 * s, -6.8 * s, 1.7 * s, sleeveH * s, shirtMain);
    px(ctx, torsoX + torsoW, -6.8 * s, 1.7 * s, sleeveH * s, shirtMain);
    px(ctx, torsoX - 2.0 * s, -10.2 * s, 2.2 * s, 1.5 * s, '#F8FAFC');
    px(ctx, torsoX + torsoW - 0.2 * s, -10.2 * s, 2.2 * s, 1.5 * s, '#F8FAFC');
  } else {
    const leftArmY = -4.4 * s + (isSideView ? 0 : armSwing * 0.45 * s);
    const rightArmY = -4.4 * s - (isSideView ? 0 : armSwing * 0.45 * s);
    pxOutline(ctx, torsoX - 1.6 * s, leftArmY, 1.6 * s, 3.8 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
    pxOutline(ctx, torsoX + torsoW, rightArmY, 1.6 * s, 3.8 * s, appearance.skinColor, 'rgba(10,16,28,0.65)', ol);
    px(ctx, torsoX - 1.6 * s, leftArmY, 1.6 * s, sleeveH * s, shirtMain);
    px(ctx, torsoX + torsoW, rightArmY, 1.6 * s, sleeveH * s, shirtMain);
    px(ctx, torsoX - 1.6 * s, leftArmY + (sleeveH - 0.5) * s, 1.6 * s, 0.5 * s, sleeveTrim);
    px(ctx, torsoX + torsoW, rightArmY + (sleeveH - 0.5) * s, 1.6 * s, 0.5 * s, sleeveTrim);

    if (gear.accessory === 'Bracadeira' || visual.isCaptain) {
      px(ctx, torsoX - 1.6 * s, leftArmY + 1.4 * s, 1.6 * s, 0.9 * s, '#FACC15');
    } else if (gear.accessory === 'Munhequeira') {
      px(ctx, torsoX - 1.6 * s, leftArmY + 2.8 * s, 1.6 * s, 0.8 * s, '#F8FAFC');
      px(ctx, torsoX + torsoW, rightArmY + 2.8 * s, 1.6 * s, 0.8 * s, '#F8FAFC');
    } else if (gear.accessory === 'Luvas' || isGoalkeeper) {
      px(ctx, torsoX - 1.8 * s, leftArmY + 3.1 * s, 1.9 * s, 1.3 * s, '#F8FAFC');
      px(ctx, torsoX + torsoW - 0.1 * s, rightArmY + 3.1 * s, 1.9 * s, 1.3 * s, '#F8FAFC');
    }
  }

  // Crisp jersey number visible on sprites during match + Preview Name/Number
  if (mode === 'match') {
    const numCol =
      shirtMain.toUpperCase() === '#FFFFFF' || shirtMain.toUpperCase() === '#F8FAFC'
        ? '#0F172A'
        : '#FFFFFF';
    ctx.fillStyle = numCol;
    ctx.font = `bold ${Math.max(7, Math.round(1.9 * s))}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(gear.jerseyNumber), 0, Math.round(-2.1 * s));
  } else if (mode === 'preview') {
    if (isBackView) {
      const backName = (gear.shirtName || 'CRAQUE').toUpperCase().slice(0, 10);
      ctx.fillStyle = '#0B121D';
      ctx.fillRect(Math.round(-3.1 * s), Math.round(-4.1 * s), Math.round(6.2 * s), Math.round(4.1 * s));
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(7, Math.round(1.05 * s))}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(backName, 0, Math.round(-3.4 * s));
      ctx.fillStyle = '#FACC15';
      ctx.font = `bold ${Math.max(10, Math.round(2.4 * s))}px "JetBrains Mono", monospace`;
      ctx.fillText(String(gear.jerseyNumber), 0, Math.round(-1.5 * s));
    } else if (!isSideView) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(Math.round(-2.1 * s), Math.round(-3.1 * s), Math.round(4.2 * s), Math.round(2.5 * s));
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(8, Math.round(2.1 * s))}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(gear.jerseyNumber), 0, Math.round(-1.8 * s));
    }
  }

  // Head with Face Shape support & Pixel Outline + Ears
  const shapeWMod =
    appearance.faceShape === 'Quadrado'
      ? 1.08
      : appearance.faceShape === 'Fino'
      ? 0.88
      : appearance.faceShape === 'Redondo'
      ? 1.06
      : 1.0;
  const headW = (isSideView ? 4.4 : 5.6) * s * shapeWMod;
  const headH = (appearance.faceShape === 'Redondo' ? 4.6 : 4.9) * s;
  const headX = -headW / 2;
  const headY = -4.6 * s - headH;
  if (!isSideView) {
    px(ctx, headX - 0.65 * s, headY + 1.8 * s, 0.7 * s, 1.3 * s, appearance.skinColor);
    px(ctx, headX + headW - 0.05 * s, headY + 1.8 * s, 0.7 * s, 1.3 * s, appearance.skinColor);
  }
  pxOutline(ctx, headX, headY, headW, headH, appearance.skinColor, 'rgba(10,16,28,0.75)', ol);
  // Subtle jawline shadow
  px(ctx, headX + 0.3 * s, headY + headH - 0.55 * s, headW - 0.6 * s, 0.55 * s, 'rgba(120,53,15,0.22)');

  // Face details only when not viewed from behind
  if (!isBackView) {
    const eyeOffsetX = mode === 'preview' ? (isSideView ? 0.9 * s : 0) : facingRight ? 0.55 * s : -0.55 * s;
    const eyeH =
      appearance.eyeStyle === 'Focado'
        ? 0.6 * s
        : appearance.eyeStyle === 'Expressivo'
        ? 0.95 * s
        : 0.78 * s;

    if (isSideView) {
      px(ctx, 0.3 * s, headY + 2.1 * s, 1.1 * s, eyeH, '#FFFFFF');
      px(ctx, 0.7 * s, headY + 2.1 * s, 0.75 * s, eyeH, '#111827');
      px(ctx, 0.3 * s, headY + 1.3 * s, 1.2 * s, 0.5 * s, appearance.hairColor);
    } else {
      // Shaded eyes with sclera highlights in preview & larger scales
      if (s >= 3.0) {
        px(ctx, -1.8 * s + eyeOffsetX, headY + 2.2 * s, 1.1 * s, eyeH, '#FFFFFF');
        px(ctx, 0.7 * s + eyeOffsetX, headY + 2.2 * s, 1.1 * s, eyeH, '#FFFFFF');
      }
      px(ctx, -1.6 * s + eyeOffsetX, headY + 2.2 * s, 0.8 * s, eyeH, '#111827');
      px(ctx, 0.8 * s + eyeOffsetX, headY + 2.2 * s, 0.8 * s, eyeH, '#111827');

      const browH = appearance.eyebrowStyle === 'Grossa' ? 0.65 * s : 0.42 * s;
      const browDrop = appearance.eyebrowStyle === 'Arqueada' ? -0.25 * s : 0;
      px(ctx, -1.8 * s + eyeOffsetX, headY + 1.4 * s + browDrop, 1.2 * s, browH, appearance.hairColor);
      px(ctx, 0.6 * s + eyeOffsetX, headY + 1.4 * s + browDrop, 1.2 * s, browH, appearance.hairColor);
    }

    // Facial Details (Sardas, Cicatriz, Pintura)
    if (appearance.facialDetail === 'Sardas' && !isSideView) {
      px(ctx, -1.8 * s, headY + 3.1 * s, 0.4 * s, 0.4 * s, '#9A3412');
      px(ctx, -1.1 * s, headY + 3.3 * s, 0.4 * s, 0.4 * s, '#9A3412');
      px(ctx, 1.4 * s, headY + 3.1 * s, 0.4 * s, 0.4 * s, '#9A3412');
      px(ctx, 0.8 * s, headY + 3.3 * s, 0.4 * s, 0.4 * s, '#9A3412');
    } else if (appearance.facialDetail === 'Cicatriz') {
      px(ctx, 1.1 * s, headY + 1.6 * s, 0.45 * s, 1.9 * s, '#991B1B');
    } else if (appearance.facialDetail === 'Pintura') {
      px(ctx, -2.1 * s, headY + 2.9 * s, 1.3 * s, 0.55 * s, '#0F172A');
      px(ctx, 0.8 * s, headY + 2.9 * s, 1.3 * s, 0.55 * s, '#0F172A');
    }

    if ((mode === 'preview' || isCelebrating) && !isSideView) {
      if (isCelebrating) {
        px(ctx, -0.95 * s + eyeOffsetX * 0.5, headY + 3.55 * s, 1.9 * s, 0.8 * s, '#7F1D1D');
        px(ctx, -0.75 * s + eyeOffsetX * 0.5, headY + 3.55 * s, 1.5 * s, 0.35 * s, '#FFFFFF');
      } else if (appearance.faceStyle === 'Sorriso') {
        px(ctx, -1.0 * s, headY + 3.6 * s, 2.0 * s, 0.5 * s, '#FFFFFF');
      } else if (appearance.faceStyle === 'Confiante') {
        px(ctx, -0.7 * s, headY + 3.7 * s, 1.6 * s, 0.4 * s, '#7C2D12');
      } else {
        px(ctx, -0.9 * s, headY + 3.8 * s, 1.8 * s, 0.4 * s, '#5C2B18');
      }
    }

    if (appearance.mustacheStyle !== 'Nenhum' && !isSideView) {
      const mW = appearance.mustacheStyle === 'Clássico' ? 2.8 * s : 2.0 * s;
      px(ctx, -mW / 2 + eyeOffsetX, headY + 3.1 * s, mW, 0.55 * s, appearance.hairColor);
    }

    if (appearance.beardStyle === 'Rala') {
      px(ctx, headX + 0.4 * s, headY + 3.6 * s, headW - 0.8 * s, 1.2 * s, `${appearance.hairColor}88`);
    } else if (appearance.beardStyle === 'Cheia') {
      px(ctx, headX + 0.2 * s, headY + 3.3 * s, headW - 0.4 * s, 1.8 * s, appearance.hairColor);
    } else if (appearance.beardStyle === 'Cavanhaque' && !isSideView) {
      px(ctx, -1.1 * s + eyeOffsetX, headY + 3.5 * s, 2.2 * s, 1.5 * s, appearance.hairColor);
    }
  }

  // Hair styles (including Cacheado & Franja, plus full back coverage in back view)
  const hc = appearance.hairColor;
  if (isBackView && appearance.hairStyle !== 'Raspado') {
    px(ctx, headX - 0.2 * s, headY - 0.8 * s, headW + 0.4 * s, headH * 0.72, hc);
  }
  switch (appearance.hairStyle) {
    case 'Curto':
      pxOutline(ctx, headX - 0.2 * s, headY - 0.8 * s, headW + 0.4 * s, 1.6 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      px(ctx, headX - 0.2 * s, headY, 0.8 * s, 1.8 * s, hc);
      px(ctx, headX + headW - 0.6 * s, headY, 0.8 * s, 1.8 * s, hc);
      break;
    case 'Moicano':
      pxOutline(ctx, -1.1 * s, headY - 2.3 * s, 2.2 * s, 2.9 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      break;
    case 'BlackPower':
      pxOutline(ctx, headX - 1.2 * s, headY - 2.1 * s, headW + 2.4 * s, 3.2 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      break;
    case 'Cacheado':
      pxOutline(ctx, headX - 0.8 * s, headY - 1.7 * s, headW + 1.6 * s, 2.4 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      px(ctx, headX - 1.0 * s, headY - 0.2 * s, 1.0 * s, 2.2 * s, hc);
      px(ctx, headX + headW, headY - 0.2 * s, 1.0 * s, 2.2 * s, hc);
      break;
    case 'Franja':
      pxOutline(ctx, headX - 0.3 * s, headY - 0.9 * s, headW + 0.6 * s, 1.8 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      if (!isBackView) {
        px(ctx, headX + 0.4 * s, headY + 0.4 * s, headW - 1.4 * s, 1.1 * s, hc);
      }
      break;
    case 'Longo':
      pxOutline(ctx, headX - 0.5 * s, headY - 0.9 * s, headW + 1.0 * s, 1.8 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      px(ctx, headX - 0.9 * s, headY, 1.1 * s, 4.6 * s, hc);
      px(ctx, headX + headW - 0.2 * s, headY, 1.1 * s, 4.6 * s, hc);
      break;
    case 'Topete':
      px(ctx, headX, headY - 1.2 * s, headW, 1.8 * s, hc);
      pxOutline(ctx, -1.6 * s, headY - 2.0 * s, 3.4 * s, 1.2 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      break;
    case 'Tranças':
      pxOutline(ctx, headX - 0.3 * s, headY - 1.0 * s, headW + 0.6 * s, 1.6 * s, hc, 'rgba(10,16,28,0.5)', ol * 0.7);
      px(ctx, headX - 0.8 * s, headY + 0.4 * s, 0.9 * s, 4.1 * s, hc);
      px(ctx, headX + headW - 0.1 * s, headY + 0.4 * s, 0.9 * s, 4.1 * s, hc);
      break;
    case 'Raspado':
    default:
      px(ctx, headX + 0.2 * s, headY - 0.3 * s, headW - 0.4 * s, 0.9 * s, hc);
      break;
  }

  if (gear.accessory === 'Faixa' || gear.accessory === 'FaixaCabelo') {
    px(
      ctx,
      headX - 0.2 * s,
      headY + 0.6 * s,
      headW + 0.4 * s,
      0.8 * s,
      gear.accessory === 'FaixaCabelo' ? kit.primary : '#F8FAFC'
    );
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
  } else if (opts.hairStyle === 'Cacheado') {
    px(ctx, 3.5 * u, 1.6 * u, 9.0 * u, 2.8 * u, hc);
    px(ctx, 3.4 * u, 3.8 * u, 1.3 * u, 2.8 * u, hc);
    px(ctx, 11.3 * u, 3.8 * u, 1.3 * u, 2.8 * u, hc);
  } else if (opts.hairStyle === 'Franja') {
    px(ctx, 4.1 * u, 2.0 * u, 7.8 * u, 2.0 * u, hc);
    px(ctx, 4.8 * u, 3.8 * u, 5.4 * u, 1.2 * u, hc);
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
  shirtStripe: string | null;
  skinColor: string;
  hairColor: string;
  hairShape: 'short' | 'afro' | 'spiky' | 'long';
  hatColor: string | null;
  hasScarf: boolean;
  hasDrum: boolean;
  flagPattern: 'stripes' | 'halves' | 'quartered' | 'cross';
  seatEmpty: boolean;
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
const CROWD_HAIR_COLORS = ['#0F172A', '#3B2314', '#78350F', '#D97706', '#FDE047', '#94A3B8'];
const HAIR_SHAPES: CrowdSpectator['hairShape'][] = ['short', 'afro', 'spiky', 'long'];
const FLAG_PATTERNS: CrowdSpectator['flagPattern'][] = ['stripes', 'halves', 'quartered', 'cross'];

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

  const capNorm = Math.min(1, Math.max(0.55, capacity / 55000));
  const fillRate = Math.min(0.99, 0.72 + importance * 0.21 + capNorm * 0.06);

  const stepX = quality === 'high' ? 10 : quality === 'medium' ? 16 : 26;
  const stepY = quality === 'high' ? 12 : quality === 'medium' ? 18 : 28;
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
    const r2 = hashNum(seedIdx + 101);
    const r3 = hashNum(seedIdx + 307);
    const r4 = hashNum(seedIdx + 619);
    const r5 = hashNum(seedIdx + 911);

    const seatEmpty = r1 > fillRate;
    const palette = isAway ? awayColors : homeColors;
    const shirtColor = palette[Math.floor(r2 * palette.length)];
    const shirtStripe = r5 > 0.62 ? (isAway ? awaySec : homeSecondary) : null;
    const skinColor = SKIN_TONES[Math.floor(r3 * SKIN_TONES.length)];
    const hairColor = CROWD_HAIR_COLORS[Math.floor(r5 * CROWD_HAIR_COLORS.length)];
    const hairShape = HAIR_SHAPES[Math.floor(r4 * HAIR_SHAPES.length)];
    const hatColor = r4 > 0.74 ? (isAway ? awayPrimary : r4 > 0.87 ? homeSecondary : homePrimary) : null;
    const behavior = isOrg
      ? behaviors[Math.floor(r2 * 3)]
      : behaviors[Math.floor(r4 * behaviors.length)];

    const flagThreshold = isOrg ? 0.16 : 0.05;
    const hasFlag = !seatEmpty && r3 < flagThreshold;
    const isGiantFlag = !seatEmpty && isOrg && r3 < 0.026;
    const hasScarf = !seatEmpty && !hasFlag && (isOrg ? r5 < 0.34 : r5 < 0.12);
    const hasDrum = !seatEmpty && isOrg && (sector === 'west' || sector === 'north') && r2 > 0.91 && r3 > 0.45;
    const flagPattern = FLAG_PATTERNS[Math.floor(r5 * FLAG_PATTERNS.length)];

    specs.push({
      x: Math.round(x + (r2 - 0.5) * 2.5),
      y: Math.round(y + (r3 - 0.5) * 2),
      shirtColor,
      shirtStripe,
      skinColor,
      hairColor,
      hairShape,
      hatColor,
      hasScarf,
      hasDrum,
      flagPattern,
      seatEmpty,
      phase: r2 * Math.PI * 2,
      freq: 0.85 + r4 * 0.48,
      sector,
      isAwaySector: isAway,
      isOrganized: isOrg,
      hasFlag,
      isGiantFlag,
      behavior,
    });
  };

  let idx = 1;
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

// High-Detail 16x12 Multi-Color Pixel Mascot Grids
// 0=bg, 1=secondary/club, 2=gold/accent, 3=dark outline/pupil, 4=white eye/teeth/highlight
const MASCOT_GRIDS: Record<MascotId, string[]> = {
  leao: [
    '0003322222233000',
    '0032211221122300',
    '0321222222221230',
    '3212443223442123',
    '3212433223342123',
    '3222223333222223',
    '3122243443422213',
    '0322344334432230',
    '0312233333322130',
    '0032211221122300',
    '0003322222233000',
    '0000033333300000',
  ],
  aguia: [
    '0330003443000330',
    '3113034444303113',
    '3141343443431413',
    '3111444224441113',
    '0311142222411130',
    '0031112222111300',
    '0003141331413000',
    '0003111111113000',
    '0000322002230000',
    '0003220000223000',
    '0000000000000000',
    '0000000000000000',
  ],
  lobo: [
    '0330000000000330',
    '3143003333003413',
    '3141311111131413',
    '0311143113411130',
    '0311132112311130',
    '0311111331111130',
    '0031443333441300',
    '0031344334431300',
    '0003113333113000',
    '0000311111130000',
    '0000033333300000',
    '0000000000000000',
  ],
  tigre: [
    '0333003333003330',
    '3212322332232123',
    '3232221221222323',
    '0322432222342230',
    '0332443223442330',
    '0322223333222230',
    '0344234444324430',
    '0034433443344300',
    '0003223333223000',
    '0000322112230000',
    '0000033333300000',
    '0000000000000000',
  ],
  dragao: [
    '3300330000330033',
    '3233113003113323',
    '0321111331111230',
    '0314311111134130',
    '3112211111122113',
    '3111123113211113',
    '0314432222344130',
    '0032222442222300',
    '0003224224223000',
    '0000322222230000',
    '0000033223300000',
    '0000000330000000',
  ],
  estrela: [
    '0000003223000000',
    '0000032442300000',
    '0000324224230000',
    '3333222112223333',
    '3244221441222223',
    '0322221441222230',
    '0032222112222300',
    '0032222222222300',
    '0322230000322230',
    '3223000000003223',
    '3300000000000033',
    '0000000000000000',
  ],
  touro: [
    '4300000000000034',
    '4430033333300344',
    '0343311111133430',
    '0031111111111300',
    '0031431111341300',
    '0031111111111300',
    '0003112222113000',
    '0003132112313000',
    '0000322222230000',
    '0000032442300000',
    '0000003333000000',
    '0000000000000000',
  ],
  coroa: [
    '0300000330000030',
    '3230003243000323',
    '3223032442303223',
    '3212322112232123',
    '3222221441222223',
    '3112222222222113',
    '3222222222222223',
    '3113411331143113',
    '3222222222222223',
    '0333333333333330',
    '0000000000000000',
    '0000000000000000',
  ],
  ancora: [
    '0000003223000000',
    '0000032442300000',
    '0000003223000000',
    '0003333223333000',
    '0003422222243000',
    '0000003223000000',
    '0330003223000330',
    '3423003223003243',
    '3222303223032223',
    '0322232222322230',
    '0032222222222300',
    '0003333333333000',
  ],
  pinheiro: [
    '0000003113000000',
    '0000031441300000',
    '0000311221130000',
    '0003111111113000',
    '0031411111141300',
    '0311112222111130',
    '3111111111111113',
    '0333111111113330',
    '0000032222300000',
    '0000032332300000',
    '0000032222300000',
    '0000333333330000',
  ],
  falcao: [
    '0000033333300000',
    '0003111111113000',
    '0031431111341300',
    '0311114224111130',
    '3111112222111113',
    '3110311221130113',
    '3100031111300013',
    '0000031441300000',
    '0000311001130000',
    '0003220000223000',
    '0000000000000000',
    '0000000000000000',
  ],
  raio: [
    '0000003222223000',
    '0000032442230000',
    '0000324422300000',
    '0003222222233000',
    '0032222222223000',
    '0033333222230000',
    '0000032222300000',
    '0000322230000000',
    '0003223000000000',
    '0032230000000000',
    '0033000000000000',
    '0000000000000000',
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
  const totalW = 460;
  const visibleW = Math.max(36, Math.round(totalW * Math.min(1, Math.max(0.08, openProgress))));
  const startX = Math.round(PITCH_GEO.worldW / 2 - visibleW / 2);
  const startY = 18;
  const totalH = 98;

  // Shimmering card mosaic backdrop across North stand
  ctx.fillStyle = primary;
  ctx.fillRect(startX, startY, visibleW, totalH);
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, visibleW, totalH);

  // Card-tile grid texture (thousands of plaquinhas shimmer)
  const tileW = 10;
  const tileH = 7;
  for (let gx = startX + 2; gx < startX + visibleW - 6; gx += tileW) {
    for (let gy = startY + 2; gy < startY + totalH - 6; gy += tileH) {
      const shimmer = Math.sin(timeSec * 5 + gx * 0.08 + gy * 0.14);
      if (shimmer > 0.35) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(gx, gy, tileW - 2, tileH - 2);
      } else if (shimmer < -0.5) {
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        ctx.fillRect(gx, gy, tileW - 2, tileH - 2);
      }
    }
  }

  // Diagonal rays & flanking pixel club shields + golden stars on mosaic
  if (visibleW > 180) {
    ctx.fillStyle = secondary;
    ctx.fillRect(startX + 10, startY + 6, 16, totalH - 12);
    ctx.fillRect(startX + 32, startY + 6, 8, totalH - 12);
    ctx.fillRect(startX + visibleW - 26, startY + 6, 16, totalH - 12);
    ctx.fillRect(startX + visibleW - 40, startY + 6, 8, totalH - 12);

    // Flanking Pixel Club Crest Shields
    const drawPixelShield = (sx: number, sy: number) => {
      px(ctx, sx, sy, 26, 28, '#0B121D');
      px(ctx, sx + 2, sy + 2, 22, 24, '#FACC15');
      px(ctx, sx + 4, sy + 4, 18, 20, primary);
      px(ctx, sx + 10, sy + 4, 6, 20, secondary);
      px(ctx, sx + 4, sy + 24, 18, 3, '#0B121D');
    };
    drawPixelShield(startX + 52, startY + 32);
    drawPixelShield(startX + visibleW - 78, startY + 32);

    // Golden star wings flanking the mascot emblem
    for (let st = 0; st < 3; st++) {
      const lx = startX + 86 + st * 20;
      const rx = startX + visibleW - 92 - st * 20;
      const pulse = Math.round(Math.sin(timeSec * 6 + st) * 1.5);
      px(ctx, lx, startY + 42 + pulse, 7, 7, '#FACC15');
      px(ctx, lx + 2, startY + 40 + pulse, 3, 11, '#FDE047');
      px(ctx, rx, startY + 42 + pulse, 7, 7, '#FACC15');
      px(ctx, rx + 2, startY + 40 + pulse, 3, 11, '#FDE047');
    }
  }

  if (openProgress >= 0.4) {
    const cols = grid[0].length;
    const cellW = 11;
    const cellH = 6;
    const gridX = Math.round(PITCH_GEO.worldW / 2 - (cols * cellW) / 2);
    const gridY = startY + 6;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = grid[r][c];
        if (ch === '0') continue;
        ctx.fillStyle =
          ch === '3'
            ? '#0B121D'
            : ch === '4'
            ? '#FFFFFF'
            : ch === '2'
            ? '#FACC15'
            : secondary;
        const waveY = Math.round(Math.sin(timeSec * 5.2 + c * 0.42 + r * 0.2) * 1.4);
        ctx.fillRect(gridX + c * cellW, gridY + r * cellH + waveY, cellW - 1, cellH - 1);
      }
    }

    // Slogan ribbon below pixel emblem
    ctx.fillStyle = '#0B121D';
    ctx.fillRect(PITCH_GEO.worldW / 2 - 105, startY + 80, 210, 14);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1;
    ctx.strokeRect(PITCH_GEO.worldW / 2 - 105, startY + 80, 210, 14);
    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(MASCOT_SLOGANS[mascot] || 'RAÇA & VITÓRIA', PITCH_GEO.worldW / 2, startY + 87);
  }

  // Secondary West-stand Vertical Bandeirão with stitched crest bar
  const westWave = Math.round(Math.sin(timeSec * 4) * 2);
  ctx.fillStyle = secondary;
  ctx.fillRect(24, PITCH_GEO.worldH / 2 - 135 + westWave, 82, 270);
  ctx.fillStyle = primary;
  ctx.fillRect(32, PITCH_GEO.worldH / 2 - 125 + westWave, 66, 250);
  ctx.fillStyle = '#0B121D';
  ctx.fillRect(42, PITCH_GEO.worldH / 2 - 36 + westWave, 46, 72);
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(48, PITCH_GEO.worldH / 2 - 28 + westWave, 34, 56);
  ctx.fillStyle = primary;
  ctx.fillRect(56, PITCH_GEO.worldH / 2 - 14 + westWave, 18, 28);

  // South stand horizontal support strip during full mosaic opening
  if (openProgress >= 0.7) {
    const southWave = Math.round(Math.cos(timeSec * 4.2) * 1.5);
    const stripW = 340;
    const stripX = Math.round(PITCH_GEO.worldW / 2 - stripW / 2);
    const stripY = PITCH_GEO.worldH - 64 + southWave;
    px(ctx, stripX, stripY, stripW, 20, '#0B121D');
    px(ctx, stripX + 2, stripY + 2, stripW - 4, 16, primary);
    px(ctx, stripX + 2, stripY + 2, 28, 16, secondary);
    px(ctx, stripX + stripW - 30, stripY + 2, 28, 16, secondary);
    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(MASCOT_SLOGANS[mascot] || 'RAÇA & VITÓRIA', PITCH_GEO.worldW / 2, stripY + 10);
  }
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

let staticStadiumCache: { key: string; canvas: HTMLCanvasElement } | null = null;

function drawStaticStadiumGeometry(
  ctx: CanvasRenderingContext2D,
  st: StadiumSpec | undefined,
  arch: StadiumSpec['architecture'],
  lightsOn: boolean,
  quality: GraphicsQuality
) {
  const g = PITCH_GEO;

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

  // VIP Camarotes & Press Cabins along North structure
  px(ctx, g.worldW / 2 - 120, 6, 240, 16, '#1E293B');
  for (let c = 0; c < 6; c++) {
    px(ctx, g.worldW / 2 - 106 + c * 36, 9, 28, 9, lightsOn ? '#FEF08A' : '#38BDF8');
  }
  if (arch === 'grand' || arch === 'modern') {
    for (let v = 0; v < 4; v++) {
      const vx = g.worldW / 2 - 340 + v * 52;
      const vx2 = g.worldW / 2 + 150 + v * 52;
      px(ctx, vx, 8, 40, 12, '#0F172A');
      px(ctx, vx + 3, 10, 34, 7, lightsOn ? 'rgba(253, 224, 71, 0.55)' : '#1E293B');
      px(ctx, vx2, 8, 40, 12, '#0F172A');
      px(ctx, vx2 + 3, 10, 34, 7, lightsOn ? 'rgba(253, 224, 71, 0.55)' : '#1E293B');
    }
  }

  // Perimeter inner wall & track / apron around pitch
  if (st?.trackBorder || arch === 'traditional') {
    px(ctx, 152, 130, g.worldW - 304, g.worldH - 260, '#7C2D12');
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(156, 134, g.worldW - 312, g.worldH - 268);
    ctx.strokeRect(164, 142, g.worldW - 328, g.worldH - 284);
  } else {
    px(ctx, 152, 130, g.worldW - 304, g.worldH - 260, '#111A26');
  }

  // Perimeter security fence / concrete wall + Stadium access gates
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 3;
  ctx.strokeRect(150, 128, g.worldW - 300, g.worldH - 256);
  [210, g.worldW - 224].forEach((gx) => {
    px(ctx, gx, 125, 14, 7, '#94A3B8');
    px(ctx, gx, g.worldH - 132, 14, 7, '#94A3B8');
  });

  // Medical tent & stretcher near tunnel
  px(ctx, g.worldW / 2 + 64, g.worldH - 130, 38, 20, '#F8FAFC');
  px(ctx, g.worldW / 2 + 80, g.worldH - 126, 6, 12, '#EF4444');
  px(ctx, g.worldW / 2 + 77, g.worldH - 123, 12, 6, '#EF4444');

  // Ball-stop protective catcher nets behind both goals
  const midNetY = g.pitchY + g.pitchH / 2;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1;
  [g.pitchX - 66, g.pitchX + g.pitchW + 66].forEach((nx) => {
    ctx.beginPath();
    ctx.moveTo(nx, midNetY - 125);
    ctx.lineTo(nx, midNetY + 125);
    ctx.stroke();
  });

  // Pitch Mowed Grass Stripes + Worn Goalkeeper Box Patches
  const toneA = st?.turfToneA || '#1B6E3A';
  const toneB = st?.turfToneB || '#1F7A41';
  const stripes = 14;
  const sw = g.pitchW / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? toneA : toneB;
    ctx.fillRect(Math.round(g.pitchX + i * sw), g.pitchY, Math.ceil(sw), g.pitchH);
  }

  // Worn goalkeeper turf/earth patches inside both 6-yard boxes
  const midY = g.pitchY + g.pitchH / 2;
  ctx.fillStyle = 'rgba(120, 53, 15, 0.22)';
  ctx.fillRect(g.pitchX + 4, midY - 46, 36, 92);
  ctx.fillRect(g.pitchX + g.pitchW - 40, midY - 46, 36, 92);

  if (quality === 'high') {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = g.pitchX + 18; x < g.pitchX + g.pitchW; x += 48) {
      for (let y = g.pitchY + 18; y < g.pitchY + g.pitchH; y += 48) {
        ctx.fillRect(x, y, 4, 4);
      }
    }
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
    cameraFlash?: number;
    fourthOfficialText?: string;
    scuffMarks?: TurfScuffMark[];
    ballX?: number;
    ballY?: number;
    netImpactLeftY?: number;
    netImpactRightY?: number;
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

  // 1-2. Static Stadium Architecture + Bleachers + Track + Turf Cache
  const cacheKey = `${st?.id || 'def'}|${arch}|${st?.standColor || ''}|${st?.turfToneA || ''}|${st?.turfToneB || ''}|${st?.trackBorder ? 1 : 0}|${lightsOn ? 1 : 0}|${quality}`;
  if (typeof document !== 'undefined') {
    if (!staticStadiumCache || staticStadiumCache.key !== cacheKey) {
      const offscreen = document.createElement('canvas');
      offscreen.width = g.worldW;
      offscreen.height = g.worldH;
      const octx = offscreen.getContext('2d');
      if (octx) {
        octx.imageSmoothingEnabled = false;
        drawStaticStadiumGeometry(octx, st, arch, lightsOn, quality);
        staticStadiumCache = { key: cacheKey, canvas: offscreen };
      }
    }
    if (staticStadiumCache && staticStadiumCache.key === cacheKey) {
      ctx.drawImage(staticStadiumCache.canvas, 0, 0);
    } else {
      drawStaticStadiumGeometry(ctx, st, arch, lightsOn, quality);
    }
  } else {
    drawStaticStadiumGeometry(ctx, st, arch, lightsOn, quality);
  }

  // #3: Ball boys (Gandulas) in bibs around perimeter
  const ballBoys = [
    { x: g.pitchX + 120, y: g.pitchY - 30 },
    { x: g.pitchX + g.pitchW - 120, y: g.pitchY - 30 },
    { x: g.pitchX + 120, y: g.pitchY + g.pitchH + 26 },
    { x: g.pitchX + g.pitchW - 120, y: g.pitchY + g.pitchH + 26 },
  ];
  ballBoys.forEach((bb, idx) => {
    px(ctx, bb.x - 3, bb.y - 3, 7, 6, '#F59E0B');
    px(ctx, bb.x - 2, bb.y - 7, 4, 4, SKIN_TONES[idx % SKIN_TONES.length]);
    px(ctx, bb.x + 5, bb.y, 4, 4, '#FFFFFF');
  });

  // Sideline Photographers behind both goals + Camera Flash bursts
  const midNetY = g.pitchY + g.pitchH / 2;
  const flash = options?.cameraFlash ?? 0;
  const photographers = [
    { x: g.pitchX - 58, y: midNetY - 96 },
    { x: g.pitchX - 58, y: midNetY + 90 },
    { x: g.pitchX + g.pitchW + 52, y: midNetY - 96 },
    { x: g.pitchX + g.pitchW + 52, y: midNetY + 90 },
  ];
  photographers.forEach((ph, idx) => {
    px(ctx, ph.x - 4, ph.y - 4, 8, 7, '#0F172A');
    px(ctx, ph.x - 2, ph.y - 8, 5, 4, SKIN_TONES[(idx + 1) % SKIN_TONES.length]);
    px(ctx, ph.x + (ph.x < g.worldW / 2 ? 3 : -6), ph.y - 4, 4, 3, '#475569');
    if (flash > 0.15 && Math.floor(timeSec * 18 + idx) % 3 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(ph.x - 6, ph.y - 10, 13, 13);
    }
  });

  // Broadcast TV Cameras on Tripods behind goals & corners tracking live ball
  const trackX = options?.ballX ?? g.worldW / 2;
  const trackY = options?.ballY ?? g.worldH / 2;
  const tvCameras = [
    { x: g.pitchX - 38, y: g.pitchY - 12 },
    { x: g.pitchX + g.pitchW + 38, y: g.pitchY - 12 },
    { x: g.pitchX - 58, y: midNetY - 118 },
    { x: g.pitchX + g.pitchW + 58, y: midNetY + 118 },
  ];
  tvCameras.forEach((cam) => {
    const ang = Math.atan2(trackY - cam.y, trackX - cam.x);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    px(ctx, -4, -4, 8, 8, '#334155');
    ctx.rotate(ang);
    px(ctx, -3, -3, 9, 6, '#0F172A');
    px(ctx, 5, -2, 4, 4, '#38BDF8');
    ctx.restore();
  });

  // Sector Signage & Detailed Stitched Club Fence Banners (Faixas de Alambrado)
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

  const homeShort = options?.homeShort || 'CAS';
  const awayShort = options?.awayShort || 'VIS';
  const fenceBanners = [
    { x: 175, y: 130, w: 230, c1: homePrimary, c2: homeSecondary, label: `${homeShort} · RAÇA E TRADIÇÃO` },
    { x: g.worldW - 405, y: 130, w: 230, c1: homePrimary, c2: homeSecondary, label: 'SEMPRE CONTIGO' },
    { x: 185, y: g.worldH - 139, w: 210, c1: homeSecondary, c2: homePrimary, label: `${homeShort} ULTRAS` },
    { x: g.worldW - 395, y: g.worldH - 139, w: 210, c1: awayPrimary, c2: options?.awayKit?.secondary || '#FFFFFF', label: `${awayShort} VISITANTE` },
  ];
  fenceBanners.forEach((fb) => {
    px(ctx, fb.x, fb.y, fb.w, 10, '#090D16');
    px(ctx, fb.x + 1, fb.y + 1, fb.w - 2, 8, fb.c1);
    px(ctx, fb.x + 6, fb.y + 1, 14, 8, fb.c2);
    px(ctx, fb.x + fb.w - 20, fb.y + 1, 14, 8, fb.c2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 6px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fb.label, fb.x + fb.w / 2, fb.y + 5);
  });

  // 3. Player Entrance Tunnel (bottom center) + Dugouts
  const tunnelX = g.worldW / 2 - 36;
  const tunnelY = g.worldH - 132;
  px(ctx, tunnelX, tunnelY, 72, 28, '#020617');
  px(ctx, tunnelX + 4, tunnelY, 64, 8, homePrimary);
  px(ctx, tunnelX + 12, tunnelY + 2, 48, 4, homeSecondary);

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

  // 4th Official with glowing substitution / added-time board
  const fourthX = g.pitchX + g.pitchW / 2;
  const fourthY = g.pitchY - 34;
  px(ctx, fourthX - 4, fourthY - 4, 8, 8, '#0F172A');
  px(ctx, fourthX - 2, fourthY - 8, 5, 4, '#E0AC69');
  if (options?.fourthOfficialText) {
    px(ctx, fourthX + 6, fourthY - 13, 34, 12, '#020617');
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(fourthX + 6, fourthY - 13, 34, 12);
    ctx.fillStyle = options.fourthOfficialText.includes('/') ? '#EF4444' : '#34D399';
    ctx.font = 'bold 7px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.fourthOfficialText, fourthX + 23, fourthY - 7);
  }

  // 4. Live Jumbotrons / Telões
  drawJumbotron(
    ctx,
    g.worldW / 2 - 74,
    132,
    homeShort,
    awayShort,
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
      homeShort,
      awayShort,
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

  // 6. Ultra-Detailed Animated Pixel Crowd (Bleacher Seats + Hair + Scarves + Drums + Multi-Segment Flags)
  const isGoalHome = mood === 'goal_home' || mood === 'celebrating_victory';
  const isGoalAway = mood === 'goal_away';
  const olaWaveCenter = ((timeSec * 380) % (g.worldW + 200)) - 100;
  const awaySec = options?.awayKit?.secondary || '#FFFFFF';

  for (let i = 0; i < crowd.length; i++) {
    const sp = crowd[i];
    // Concrete stadium seat bucket visible even when empty or behind fan
    px(ctx, sp.x - 3, sp.y - 1, 7, 5, sp.isAwaySector ? '#334155' : '#263449');
    if (sp.seatEmpty) continue;

    const cheering =
      (isGoalHome && !sp.isAwaySector) ||
      (isGoalAway && sp.isAwaySector) ||
      goalExcitement > 0.35;
    const disappointed =
      mood === 'disappointed' || (isGoalAway && !sp.isAwaySector) || (isGoalHome && sp.isAwaySector);

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

    // Torso + 2-tone striped jersey
    px(ctx, sx - 3, sy - 3, 7, 6, sp.shirtColor);
    if (sp.shirtStripe) {
      px(ctx, sx - 1, sy - 3, 3, 6, sp.shirtStripe);
    }

    // Head + Realistic Hair Silhouette or Cap
    px(ctx, sx - 2, sy - 7, 4, 4, sp.skinColor);
    if (sp.hatColor) {
      px(ctx, sx - 2, sy - 9, 4, 2, sp.hatColor);
      px(ctx, sx - 1, sy - 9, 5, 1, sp.hatColor);
    } else {
      if (sp.hairShape === 'afro') {
        px(ctx, sx - 3, sy - 9, 6, 3, sp.hairColor);
      } else if (sp.hairShape === 'spiky') {
        px(ctx, sx - 2, sy - 9, 4, 2, sp.hairColor);
        px(ctx, sx - 1, sy - 10, 2, 1, sp.hairColor);
      } else if (sp.hairShape === 'long') {
        px(ctx, sx - 3, sy - 8, 6, 2, sp.hairColor);
        px(ctx, sx - 3, sy - 6, 1, 3, sp.hairColor);
        px(ctx, sx + 2, sy - 6, 1, 3, sp.hairColor);
      } else {
        px(ctx, sx - 2, sy - 8, 4, 2, sp.hairColor);
      }
    }

    // Raised Club Scarf (Cachecol) during excitement or goals!
    if (sp.hasScarf && (cheering || mood === 'excited')) {
      const scarfBob = Math.round(Math.sin(timeSec * 8 + sp.phase) * 1.5);
      const sc1 = sp.isAwaySector ? awayPrimary : homePrimary;
      const sc2 = sp.isAwaySector ? awaySec : homeSecondary;
      px(ctx, sx - 5, sy - 11 + scarfBob, 11, 3, sc1);
      px(ctx, sx - 2, sy - 11 + scarfBob, 5, 3, sc2);
      px(ctx, sx - 5, sy - 8 + scarfBob, 2, 3, sp.skinColor);
      px(ctx, sx + 4, sy - 8 + scarfBob, 2, 3, sp.skinColor);
    } else if (cheering || (sp.behavior === 'waver' && mood === 'excited')) {
      const armWave = Math.round(Math.sin(timeSec * 15 + sp.phase) * 2);
      px(ctx, sx - 5, sy - 7 + armWave, 2, 4, sp.skinColor);
      px(ctx, sx + 4, sy - 7 - armWave, 2, 4, sp.skinColor);
    } else if (disappointed) {
      px(ctx, sx - 4, sy - 7, 2, 3, sp.skinColor);
      px(ctx, sx + 3, sy - 7, 2, 3, sp.skinColor);
    } else if (sp.behavior === 'clapper' && Math.sin(timeSec * 9 + sp.phase) > 0.2) {
      px(ctx, sx - 2, sy - 2, 5, 2, sp.skinColor);
    }

    // Torcida Organizada Drum Corps (Bateria) pulsing on the beat
    if (sp.hasDrum && quality !== 'low') {
      const beat = Math.sin(timeSec * 14 + sp.phase) > 0.35 ? 1 : 0;
      px(ctx, sx - 4, sy - 1 - beat, 8, 6, '#F8FAFC');
      px(ctx, sx - 4, sy + 1 - beat, 8, 2, homePrimary);
      px(ctx, sx - 5, sy - 4 + beat * 2, 2, 4, '#FACC15');
    }

    // Multi-Segment Wind-Rippled Flags & Giant Bandeirões
    if (sp.hasFlag && quality !== 'low') {
      const waveSpeed = cheering ? 12 : 6.5;
      const flagColor = sp.isAwaySector ? awayPrimary : homePrimary;
      const flagAlt = sp.isAwaySector ? awaySec : homeSecondary;
      if (sp.isGiantFlag && quality === 'high') {
        // Angled tall flagpole + 4-segment undulating large flag
        px(ctx, sx + 3, sy - 30, 2, 27, '#F1F5F9');
        for (let seg = 0; seg < 4; seg++) {
          const segY = Math.round(Math.sin(timeSec * waveSpeed + sp.phase - seg * 0.7) * (1.2 + seg * 0.5));
          const colA =
            sp.flagPattern === 'halves' && seg >= 2
              ? flagAlt
              : sp.flagPattern === 'cross' && seg === 1
              ? flagAlt
              : flagColor;
          px(ctx, sx + 5 + seg * 5, sy - 30 + segY, 5, 13, colA);
          if (sp.flagPattern === 'stripes') {
            px(ctx, sx + 5 + seg * 5, sy - 25 + segY, 5, 4, flagAlt);
          } else if (sp.flagPattern === 'quartered' && seg >= 2) {
            px(ctx, sx + 5 + seg * 5, sy - 23 + segY, 5, 6, flagAlt);
          } else if (sp.flagPattern === 'cross') {
            px(ctx, sx + 5 + seg * 5, sy - 25 + segY, 5, 3, flagAlt);
          }
        }
      } else {
        // 3-segment wind-rippled supporter flag
        px(ctx, sx + 3, sy - 18, 2, 14, '#E2E8F0');
        for (let seg = 0; seg < 3; seg++) {
          const segY = Math.round(Math.sin(timeSec * waveSpeed + sp.phase - seg * 0.8) * 1.4);
          px(ctx, sx + 5 + seg * 4, sy - 18 + segY, 4, 7, seg === 1 ? flagAlt : flagColor);
        }
      }
    }
  }

  // Acoustic Vuvuzela / Crowd Soundwave Pulses over organized sectors on excitement
  if ((goalExcitement > 0.35 || mood === 'excited') && quality === 'high') {
    const pulse = (timeSec * 2.2) % 1;
    const rad = Math.round(12 + pulse * 26);
    ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - pulse) * 0.36})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(62, g.worldH / 2, rad, -0.8, 0.8);
    ctx.stroke();
  }

  // 7. Stadium Roof Canopy & Steel Trusses (semi-transparent architectural overhang)
  if (st?.roofCover || arch === 'grand' || arch === 'modern') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.fillRect(10, 10, g.worldW - 20, 26);
    ctx.fillRect(10, g.worldH - 36, g.worldW - 20, 26);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.28)';
    for (let tx = 40; tx < g.worldW - 40; tx += 95) {
      ctx.fillRect(tx, 10, 3, 28);
      ctx.fillRect(tx, g.worldH - 38, 3, 28);
    }
  }

  // 8. Mascot Mosaic / Bandeirão (pre-match opening & big goal celebrations)
  if ((options?.showMosaic || goalExcitement > 0.55) && options?.mascot) {
    drawMascotMosaic(
      ctx,
      options.mascot,
      homePrimary,
      homeSecondary,
      timeSec,
      options?.mosaicProgress ?? 1
    );
  }

  // 9. Flares / Sinalizadores on goals or opening mosaic + rising colored smoke
  if ((options?.showMosaic || goalExcitement > 0.2) && options?.environmentalEffects !== false) {
    const flareSpots = [190, 490, 1110, 1410];
    flareSpots.forEach((fx, idx) => {
      const fy = idx % 2 === 0 ? 108 : g.worldH - 108;
      const flicker = 5 + Math.sin(timeSec * 22 + idx) * 2.5;
      ctx.fillStyle = homePrimary;
      ctx.fillRect(fx - flicker, fy - flicker, flicker * 2, flicker * 2);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(fx - 2, fy - 2, 5, 5);
      for (let sm = 1; sm <= 3; sm++) {
        const driftX = Math.sin(timeSec * 3 + idx + sm) * 6;
        const riseY = fy - sm * 10 - ((timeSec * 14 + idx * 7) % 14);
        ctx.fillStyle = sm === 1 ? 'rgba(248,250,252,0.28)' : 'rgba(203,213,225,0.18)';
        ctx.fillRect(Math.round(fx - 4 + driftX), Math.round(riseY), 9 + sm * 2, 7);
      }
    });
  }

  // Behind-Stadium Goal Fireworks bursts (Noite / Fim de tarde / big goals)
  if (goalExcitement > 0.4 && options?.environmentalEffects !== false) {
    const fwSpots = [
      { x: 260, y: 74, c: homePrimary },
      { x: g.worldW - 260, y: 74, c: '#FACC15' },
      { x: g.worldW / 2, y: 58, c: homeSecondary },
    ];
    fwSpots.forEach((fw, fIdx) => {
      const phase = (timeSec * 1.6 + fIdx * 0.35) % 1;
      const r = phase * 34;
      const alpha = Math.max(0, 1 - phase);
      ctx.fillStyle = fw.c;
      ctx.globalAlpha = alpha;
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2;
        px(ctx, fw.x + Math.cos(a) * r, fw.y + Math.sin(a) * r, 4, 4, p % 2 === 0 ? fw.c : '#FEF08A');
      }
      ctx.globalAlpha = 1;
    });
  }

  // 10. Stadium-specific Floodlight Towers / Ring / Poles + Aviation Beacons
  const lightStyle = st?.floodlightStyle || 'towers';
  if (lightStyle === 'ring') {
    // Continuous LED stadium roof ring bars (modern & grand arenas)
    for (let lx = 180; lx < g.worldW - 180; lx += 80) {
      px(ctx, lx, 16, 44, 5, lightsOn ? '#FEF9C3' : '#475569');
      px(ctx, lx, g.worldH - 21, 44, 5, lightsOn ? '#FEF9C3' : '#475569');
    }
  } else if (lightStyle === 'poles') {
    // 6 slim sideline floodlight poles (compact & municipal stadiums)
    const poles = [290, g.worldW / 2, g.worldW - 290];
    poles.forEach((pxPos) => {
      px(ctx, pxPos - 6, 10, 12, 8, '#334155');
      px(ctx, pxPos - 4, 12, 8, 4, lightsOn ? '#FEF9C3' : '#64748B');
      px(ctx, pxPos - 6, g.worldH - 18, 12, 8, '#334155');
      px(ctx, pxPos - 4, g.worldH - 16, 8, 4, lightsOn ? '#FEF9C3' : '#64748B');
    });
  } else {
    // 4 classic corner floodlight towers
    const towers = [
      [32, 32],
      [g.worldW - 50, 32],
      [32, g.worldH - 50],
      [g.worldW - 50, g.worldH - 50],
    ];
    towers.forEach(([tx, ty], tIdx) => {
      px(ctx, tx, ty, 18, 18, '#1E293B');
      px(ctx, tx + 2, ty + 2, 14, 14, '#334155');
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
      if (lightsOn && Math.floor(timeSec * 2 + tIdx) % 2 === 0) {
        px(ctx, tx + 7, ty - 2, 3, 3, '#EF4444');
      }
    });
  }

  // 11. Dynamic Pitch Atmosphere (Clouds, Rain Puddles, Scuff Marks) over cached turf
  const midY = g.pitchY + g.pitchH / 2;

  // Drifting Cloud Shadows during day / overcast matches
  if (!lightsOn && options?.environmentalEffects !== false && quality !== 'low') {
    const cloudOffset = (timeSec * 18) % (g.pitchW + 420);
    ctx.fillStyle = options?.env?.weather === 'Nublado' ? 'rgba(15, 23, 42, 0.12)' : 'rgba(15, 23, 42, 0.06)';
    for (let c = 0; c < 3; c++) {
      const cx = g.pitchX - 240 + ((cloudOffset + c * 420) % (g.pitchW + 420));
      const cy = g.pitchY + 60 + c * 180;
      ctx.fillRect(Math.round(cx), cy, 170, 74);
      ctx.fillRect(Math.round(cx + 28), cy - 18, 110, 18);
    }
  }

  // Wet Turf Puddles & Animated Rain Ripples + Floodlight Reflections
  if (isRain && options?.env) {
    const puddleCount = options.env.weather === 'Chuva forte' ? 11 : 5;
    for (let i = 0; i < puddleCount; i++) {
      const pxPos = g.pitchX + 95 + ((i * 193) % (g.pitchW - 190));
      const pyPos = g.pitchY + 65 + ((i * 137) % (g.pitchH - 130));
      ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
      ctx.fillRect(pxPos, pyPos, 30, 12);
      ctx.fillRect(pxPos + 6, pyPos - 3, 18, 18);
      const rip = ((timeSec * 1.8 + i * 0.37) % 1) * 10;
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.32 * (1 - rip / 10)})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(pxPos + 15 - rip), Math.round(pyPos + 6 - rip * 0.5), Math.round(rip * 2), Math.round(rip));
      if (lightsOn) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
        ctx.fillRect(pxPos + 8 + Math.round(Math.sin(timeSec * 5 + i) * 2), pyPos + 2, 10, 4);
      }
    }
  }

  // Persistent Turf Scuff & Slide Marks
  if (options?.scuffMarks && options.scuffMarks.length > 0) {
    for (const mk of options.scuffMarks) {
      ctx.save();
      ctx.translate(Math.round(mk.x), Math.round(mk.y));
      ctx.rotate(mk.angle);
      ctx.fillStyle =
        mk.kind === 'slide'
          ? `rgba(20, 83, 45, ${mk.alpha * 0.58})`
          : `rgba(120, 53, 15, ${mk.alpha * 0.45})`;
      ctx.fillRect(0, -2, mk.length, 4);
      ctx.restore();
    }
  }

  // 12. Crisp Pitch Markings
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.92)';
  ctx.lineWidth = 3;
  ctx.strokeRect(g.pitchX, g.pitchY, g.pitchW, g.pitchH);

  const midX = g.pitchX + g.pitchW / 2;
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

  // Multi-Segment Club-Colored Corner Flags!
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
    ctx.fillRect(cx - 2, cy - 14, 3, 14);
    for (let seg = 0; seg < 3; seg++) {
      const wave = Math.round(Math.sin(timeSec * 8 + cx + seg * 0.9) * 1.6);
      ctx.fillStyle = seg === 1 ? homeSecondary : homePrimary;
      ctx.fillRect(cx + 1 + seg * 3, cy - 14 + wave, 3, 6);
    }
  });

  // Overhead Spidercam Cables & Gliding Aerial Camera Unit (Grand & Modern stadiums)
  if ((arch === 'grand' || arch === 'modern') && quality === 'high') {
    const spiderX = g.pitchX + g.pitchW * 0.5 + (trackX - midX) * 0.35;
    const spiderY = g.pitchY + g.pitchH * 0.5 + (trackY - midY) * 0.35;
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.pitchX, g.pitchY);
    ctx.lineTo(spiderX, spiderY);
    ctx.moveTo(g.pitchX + g.pitchW, g.pitchY);
    ctx.lineTo(spiderX, spiderY);
    ctx.moveTo(g.pitchX, g.pitchY + g.pitchH);
    ctx.lineTo(spiderX, spiderY);
    ctx.moveTo(g.pitchX + g.pitchW, g.pitchY + g.pitchH);
    ctx.lineTo(spiderX, spiderY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(Math.round(spiderX + 8), Math.round(spiderY + 14), 10, 6);
    px(ctx, spiderX - 4, spiderY - 4, 8, 8, '#0F172A');
    px(ctx, spiderX - 2, spiderY - 2, 4, 4, '#38BDF8');
  }

  // Windblown Pitch Leaves / Stadium Atmosphere Motes
  if (options?.environmentalEffects !== false && quality !== 'low') {
    for (let lf = 0; lf < 6; lf++) {
      const lx = g.pitchX + ((lf * 213 + timeSec * 42) % g.pitchW);
      const ly = g.pitchY + ((lf * 137 + Math.sin(timeSec * 2 + lf) * 28) % g.pitchH);
      px(ctx, lx, ly, 3, 2, lightsOn ? 'rgba(254, 249, 195, 0.35)' : 'rgba(134, 239, 172, 0.45)');
    }
  }

  const goalTop = midY - g.goalH / 2;
  drawGoalNet(
    ctx,
    g.pitchX - g.goalDepth,
    goalTop,
    g.goalDepth,
    g.goalH,
    'left',
    netRippleLeft,
    timeSec,
    options?.netImpactLeftY
  );
  drawGoalNet(
    ctx,
    g.pitchX + g.pitchW,
    goalTop,
    g.goalDepth,
    g.goalH,
    'right',
    netRippleRight,
    timeSec,
    options?.netImpactRightY
  );
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
  timeSec: number,
  impactY?: number
) {
  const dir = side === 'left' ? -1 : 1;
  const baseOffset = ripple > 0 ? Math.sin(timeSec * 28) * ripple * 6 * dir : 0;
  const iy = impactY ?? y + h / 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
  ctx.fillRect(x + baseOffset * 0.5, y, w, h);

  // 3D layered crossbar/depth roof shading & diagonal side netting
  ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
  ctx.fillRect(x, y, w, 6);
  ctx.fillRect(x, y + h - 6, w, 6);

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let nx = x; nx <= x + w; nx += 6) {
    ctx.moveTo(nx + baseOffset * 0.55, y);
    ctx.lineTo(nx + baseOffset * 0.55, y + h);
  }
  for (let ny = y; ny <= y + h; ny += 6) {
    const distNorm = Math.max(0, 1 - Math.abs(ny - iy) / (h * 0.48));
    const localBulge = baseOffset * (0.4 + distNorm * 0.9);
    ctx.moveTo(x + (side === 'left' ? localBulge : 0), ny);
    ctx.lineTo(x + w + (side === 'right' ? localBulge : 0), ny);
  }
  ctx.stroke();

  // Outer frame & grounded posts
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + baseOffset * 0.4, y, w, h);

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
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.fillRect(
    Math.round(x - 6 * shadowScale),
    Math.round(y + 3),
    Math.round(12 * shadowScale),
    Math.round(5 * shadowScale)
  );

  const drawY = Math.round(y - z);
  const r = Math.round(6 + Math.min(3.5, z * 0.045));

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(Math.round(x - r), drawY - r, r * 2, r * 2);

  const pOff = Math.round(Math.sin(spin) * 2.5);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(Math.round(x - 2 + pOff), drawY - 2, 4, 4);
  ctx.fillRect(Math.round(x - r), drawY - 1, 2, 3);
  ctx.fillRect(Math.round(x + r - 2), drawY - 1, 2, 3);
  // Subtle crisp top-left ball sheen highlight
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(Math.round(x - r + 1), drawY - r + 1, 2, 2);

  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(x - r), drawY - r, r * 2, r * 2);
}

export function drawPixelBallTrail(
  ctx: CanvasRenderingContext2D,
  trail: BallTrailPoint[]
) {
  for (let i = 0; i < trail.length; i++) {
    const pt = trail[i];
    const r = Math.max(2, Math.round((pt.isPower ? 6.5 : 5) * pt.alpha));
    ctx.fillStyle = pt.isPower
      ? `rgba(250, 204, 21, ${pt.alpha * 0.62})`
      : `rgba(248, 250, 252, ${pt.alpha * 0.36})`;
    ctx.fillRect(Math.round(pt.x - r), Math.round(pt.y - pt.z - r), r * 2, r * 2);
  }
}

export function drawPixelLinesman(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animPhase: number,
  flagRaised: boolean,
  isTop: boolean
) {
  const stride = Math.sin(animPhase) * 1.5;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(-6, 8, 12, 3);

  px(ctx, -3, 2 + stride * 0.5, 2, 5, '#111827');
  px(ctx, 1, 2 - stride * 0.5, 2, 5, '#111827');
  px(ctx, -4, -1, 8, 3, '#0F172A');
  px(ctx, -5, -7, 10, 6, '#38BDF8');
  px(ctx, -3, -13, 6, 6, '#E2B48F');
  px(ctx, -3, -15, 6, 2, '#1E293B');

  // Assistant referee flag
  if (flagRaised) {
    px(ctx, 5, -18, 2, 12, '#F8FAFC');
    px(ctx, 7, -18, 7, 5, '#FACC15');
    px(ctx, 7, -15, 4, 2, '#EF4444');
  } else {
    const dirY = isTop ? -4 : 0;
    px(ctx, 5, dirY, 2, 7, '#F8FAFC');
    px(ctx, 7, dirY + 3, 5, 4, '#FACC15');
  }

  ctx.restore();
}

export function drawPixelReferee(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  animPhase: number,
  cardColor?: 'yellow' | 'red' | null,
  advantageActive?: boolean
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

  // Overhead pixel yellow / red card animation
  if (cardColor) {
    px(ctx, 5, -23, 3, 14, '#E2B48F');
    px(ctx, 4, -30, 6, 8, cardColor === 'red' ? '#EF4444' : '#FACC15');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, -30, 6, 8);
  } else if (advantageActive) {
    // Two-arm forward advantage signal + floating pixel 'V' badge
    px(ctx, -9, -15, 3, 9, '#E2B48F');
    px(ctx, 6, -15, 3, 9, '#E2B48F');
    px(ctx, -7, -26, 14, 7, '#0F172A');
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 6px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VANT', 0, -22);
  }

  ctx.restore();
}

export function drawReplayOverlay(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  timeSec: number,
  scorerName: string
) {
  // Subtle CRT scanline broadcast frame during instant goal replay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
  for (let y = 0; y < canvasH; y += 6) {
    ctx.fillRect(0, y, canvasW, 1);
  }
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, canvasW - 16, canvasH - 16);

  if (Math.floor(timeSec * 3) % 2 === 0) {
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(24, 72, 10, 10);
  }
  ctx.fillStyle = 'rgba(11, 18, 29, 0.9)';
  ctx.fillRect(38, 66, 178, 22);
  ctx.fillStyle = '#FACC15';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`REPLAY · ${scorerName.slice(0, 14).toUpperCase()}`, 44, 77);
}


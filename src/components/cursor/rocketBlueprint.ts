export type ParticleTone = 'silver' | 'cyan' | 'amber' | 'white';

export interface RocketStructureParticle {
  lx: number;
  ly: number;
  size: number;
  baseAlpha: number;
  tone: ParticleTone;
  phase: number;
  jitterAmp: number;
  isFlame?: boolean;
  flameReach?: number;
}

export interface ExhaustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  tone: ParticleTone;
}

export function createGlowSprite(
  coreHex: string,
  midRgba: string,
  outerRgba: string
): HTMLCanvasElement {
  const size = 24;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (g) {
    const half = size / 2;
    const grad = g.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, coreHex);
    grad.addColorStop(0.28, midRgba);
    grad.addColorStop(0.62, outerRgba);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  return c;
}

export function createRocketSprites(): {
  sprites: Record<ParticleTone, HTMLCanvasElement>;
  contrastBackingSprite: HTMLCanvasElement;
} {
  return {
    sprites: {
      white: createGlowSprite(
        'rgba(255,255,255,1)',
        'rgba(224,242,254,0.65)',
        'rgba(56,189,248,0.18)'
      ),
      silver: createGlowSprite(
        'rgba(241,245,249,0.98)',
        'rgba(203,213,225,0.55)',
        'rgba(148,163,184,0.15)'
      ),
      cyan: createGlowSprite(
        'rgba(224,242,254,1)',
        'rgba(56,189,248,0.72)',
        'rgba(14,165,233,0.2)'
      ),
      amber: createGlowSprite(
        'rgba(254,243,199,1)',
        'rgba(255,157,56,0.72)',
        'rgba(245,158,11,0.2)'
      ),
    },
    contrastBackingSprite: createGlowSprite(
      'rgba(3,5,10,0.45)',
      'rgba(3,5,10,0.22)',
      'rgba(3,5,10,0)'
    ),
  };
}

/**
 * Generates the exact 34x46 aerospace rocket blueprint (nose-tip at (0, 0))
 * rendered strictly from luminous micro-particles matching MotionParticleWorld.
 */
export function buildRocketParticleBlueprint(): RocketStructureParticle[] {
  const pts: RocketStructureParticle[] = [];
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const push = (
    lx: number,
    ly: number,
    size: number,
    baseAlpha: number,
    tone: ParticleTone,
    jitterAmp = 0.28,
    isFlame = false,
    flameReach = 0
  ) => {
    pts.push({
      lx,
      ly,
      size,
      baseAlpha,
      tone,
      phase: rand() * Math.PI * 2,
      jitterAmp,
      isFlame,
      flameReach,
    });
  };

  // Exact fuselage half-width matching the 34x46 SVG Bezier silhouette (nose tip at 0,0)
  const hullHalfWidth = (y: number): number => {
    if (y <= 0) return 0;
    if (y <= 19.2) {
      const t = y / 19.2;
      return 5.4 * Math.pow(t, 0.72);
    }
    const t = Math.min((y - 19.2) / 6.4, 1);
    return 5.4 - 1.3 * t;
  };

  // 1. Precision nose tip beacon at exact (0, 0) pointer hotspot
  push(0, 0, 2.5, 1.0, 'white', 0);
  push(0, 0.8, 2.0, 0.95, 'cyan', 0.08);

  // 2. Outer aerodynamic fuselage contour (y = 0 .. 25.6) + cyan nose cone accents
  const hullSteps = 22;
  for (let i = 1; i <= hullSteps; i++) {
    const y = (i / hullSteps) * 25.6;
    const hw = hullHalfWidth(y);
    const inNoseCone = y <= 7.8;

    push(-hw, y, inNoseCone ? 1.55 : 1.4, 0.92, inNoseCone ? 'cyan' : 'silver', 0.2);
    push(hw, y, inNoseCone ? 1.55 : 1.4, 0.88, inNoseCone ? 'cyan' : 'silver', 0.2);

    if (inNoseCone) {
      const cols = Math.max(1, Math.round(hw / 1.35));
      for (let c = -cols + 1; c < cols; c++) {
        const x = (c / cols) * hw;
        push(x, y, 1.25, 0.82, c === 0 ? 'white' : 'cyan', 0.18);
      }
    }
  }

  // 3. Recessed teardrop canopy cutout (y = 9.6 .. 17.2)
  const canopyHalfW = (y: number): number => {
    if (y < 9.6 || y > 17.2) return 0;
    const t = (y - 9.6) / 7.6;
    return 2.05 * Math.sin(Math.pow(t, 0.75) * Math.PI);
  };

  for (let i = 0; i <= 12; i++) {
    const y = 9.6 + (i / 12) * 7.6;
    const cw = canopyHalfW(y);
    if (cw > 0.25) {
      push(-cw, y, 1.35, 0.95, 'cyan', 0.14);
      push(cw, y, 1.35, 0.95, 'cyan', 0.14);
    } else {
      push(0, y, 1.4, 0.95, 'cyan', 0.12);
    }
  }
  push(-0.75, 11.7, 1.25, 0.95, 'white', 0.1);
  push(-1.05, 13.0, 1.15, 0.85, 'white', 0.1);

  // 4. Split-lit interior hull shimmer particles
  for (let y = 8.4; y <= 24.8; y += 1.65) {
    const hw = hullHalfWidth(y) * 0.76;
    const cw = canopyHalfW(y);
    for (let x = -hw; x <= hw; x += 1.55) {
      if (cw > 0 && Math.abs(x) < cw + 0.55) continue;
      const isLeftLit = x < 0;
      const tone: ParticleTone = rand() < 0.08 ? 'amber' : isLeftLit ? 'white' : 'silver';
      push(
        x + (rand() - 0.5) * 0.35,
        y + (rand() - 0.5) * 0.35,
        1.15 + rand() * 0.45,
        isLeftLit ? 0.78 : 0.58,
        tone,
        0.26
      );
    }
  }

  // 5. Central dorsal fin spine
  for (let y = 18.4; y <= 25.2; y += 1.15) {
    push(0, y, 1.45, 0.94, 'cyan', 0.15);
  }

  // 6. Swept delta stabilizer wings
  const wingTriangles: [number, number, number, number, number, number][] = [
    [-5.2, 16.8, -11.8, 24.8, -5.4, 23.6],
    [5.2, 16.8, 11.8, 24.8, 5.4, 23.6],
  ];

  for (const [x1, y1, x2, y2, x3, y3] of wingTriangles) {
    const edges: [number, number, number, number, number][] = [
      [x1, y1, x2, y2, 9],
      [x2, y2, x3, y3, 7],
      [x3, y3, x1, y1, 6],
    ];
    for (const [ax, ay, bx, by, steps] of edges) {
      for (let s = 0; s <= steps; s++) {
        const f = s / steps;
        const tone: ParticleTone = s === steps && ax === x1 ? 'amber' : 'cyan';
        push(ax + (bx - ax) * f, ay + (by - ay) * f, 1.35, 0.9, tone, 0.2);
      }
    }
    for (let u = 0.2; u <= 0.78; u += 0.28) {
      for (let v = 0.2; v <= 0.78 - u * 0.5; v += 0.28) {
        const w = 1 - u - v;
        if (w <= 0.08) continue;
        push(
          x1 * u + x2 * v + x3 * w,
          y1 * u + y2 * v + y3 * w,
          1.15,
          0.66,
          rand() < 0.14 ? 'silver' : 'cyan',
          0.25
        );
      }
    }
  }

  // 7. Thruster bell nozzle rim
  for (let x = -3.8; x <= 3.8; x += 1.08) {
    push(x, 25.8, 1.3, 0.85, 'silver', 0.12);
    push(x * 1.05, 27.2, 1.35, 0.9, 'cyan', 0.12);
  }

  // 8. Dynamic particle exhaust plume
  for (let i = 0; i < 34; i++) {
    const reach = i / 33;
    const baseY = 27.8 + reach * 14.5;
    const spread = (1 - reach * 0.75) * 3.1;
    const lx = (rand() - 0.5) * 2 * spread;
    const isCore = Math.abs(lx) < 1.1 && reach < 0.55;
    const tone: ParticleTone = isCore
      ? 'white'
      : reach > 0.45 && rand() < 0.52
      ? 'amber'
      : 'cyan';
    push(
      lx,
      baseY,
      1.75 - reach * 0.65 + rand() * 0.4,
      0.95 - reach * 0.48,
      tone,
      0.75,
      true,
      reach
    );
  }

  return pts;
}

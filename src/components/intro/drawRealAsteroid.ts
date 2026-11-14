/**
 * Realistic 3D-shaded irregular rocky cratered asteroid renderers for:
 * 1) `drawRealAsteroid`: Crisp precision Asteroid Cursor with angular rocky tip
 *    anchored right at `(0, 0)` (cursor hotspot) and boulder mass extending downward-right.
 * 2) `drawPassingAsteroid2D`: Free-rotating multi-cratered space asteroid used by
 *    the 2D Canvas fallback sequence (`EntryAsteroidLanding`).
 */

export interface AsteroidVertex {
  x: number;
  y: number;
}

// Deterministic jagged rocky silhouette anchored so tip at (0,0) acts as a crisp pointer hotspot
const CURSOR_ROCK_POLY: AsteroidVertex[] = [
  { x: 0.0, y: 0.0 },
  { x: 6.2, y: 1.4 },
  { x: 11.4, y: 1.1 },
  { x: 16.8, y: 3.8 },
  { x: 20.6, y: 8.6 },
  { x: 21.8, y: 13.8 },
  { x: 19.2, y: 18.4 },
  { x: 14.5, y: 21.4 },
  { x: 9.2, y: 20.8 },
  { x: 4.8, y: 17.6 },
  { x: 2.2, y: 12.6 },
  { x: 1.3, y: 6.8 },
];

const CURSOR_FACETS: Array<{ pts: [number, number, number]; shade: string }> = [
  { pts: [0, 1, 11], shade: 'rgba(241, 245, 249, 0.24)' },
  { pts: [1, 2, 3], shade: 'rgba(226, 232, 240, 0.16)' },
  { pts: [3, 4, 5], shade: 'rgba(148, 163, 184, 0.14)' },
  { pts: [5, 6, 7], shade: 'rgba(15, 23, 42, 0.42)' },
  { pts: [7, 8, 9], shade: 'rgba(15, 23, 42, 0.36)' },
  { pts: [9, 10, 11], shade: 'rgba(71, 85, 105, 0.22)' },
];

const CURSOR_CRATERS = [
  { cx: 9.4, cy: 7.4, rx: 2.9, ry: 2.35, rot: -0.35, depth: 0.85 },
  { cx: 14.8, cy: 12.6, rx: 3.3, ry: 2.7, rot: 0.25, depth: 0.95 },
  { cx: 7.6, cy: 14.4, rx: 2.15, ry: 1.85, rot: -0.2, depth: 0.78 },
  { cx: 15.2, cy: 6.2, rx: 1.45, ry: 1.25, rot: 0.4, depth: 0.72 },
  { cx: 11.4, cy: 17.6, rx: 1.55, ry: 1.2, rot: -0.15, depth: 0.75 },
];

function buildCursorSilhouettePath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(CURSOR_ROCK_POLY[0].x, CURSOR_ROCK_POLY[0].y);
  for (let i = 1; i < CURSOR_ROCK_POLY.length; i++) {
    ctx.lineTo(CURSOR_ROCK_POLY[i].x, CURSOR_ROCK_POLY[i].y);
  }
  ctx.closePath();
}

export function drawRealAsteroid(
  ctx: CanvasRenderingContext2D,
  scale: number,
  energyGlow: number,
  alpha: number,
  elapsed: number,
  hoverGlow = 0
): void {
  if (alpha <= 0.005 || scale <= 0.01) return;

  ctx.save();
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // 1. Subtle atmospheric / ionized rim aura around asteroid on fast flight or hover
  const auraStrength = Math.min(1, Math.max(energyGlow * 0.65, hoverGlow * 0.9));
  if (auraStrength > 0.04) {
    ctx.save();
    const auraGrad = ctx.createRadialGradient(11, 11, 2, 11, 11, 17);
    if (hoverGlow > energyGlow * 0.7) {
      auraGrad.addColorStop(0, `rgba(56, 189, 248, ${0.32 * auraStrength})`);
      auraGrad.addColorStop(0.55, `rgba(14, 165, 233, ${0.14 * auraStrength})`);
      auraGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    } else {
      auraGrad.addColorStop(0, `rgba(251, 146, 60, ${0.34 * auraStrength})`);
      auraGrad.addColorStop(0.6, `rgba(234, 88, 12, ${0.14 * auraStrength})`);
      auraGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    }
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(11, 11, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Dark obsidian outer contrast casing so rocky silhouette separates cleanly on white or black surfaces
  buildCursorSilhouettePath(ctx);
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.92)';
  ctx.lineWidth = 1.65;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 3. Base 3D Rocky Regolith Body (solar lit top-left -> silicate slate -> deep shadow lower-right)
  buildCursorSilhouettePath(ctx);
  const rockGrad = ctx.createLinearGradient(0, 0, 21.5, 21.5);
  rockGrad.addColorStop(0.0, '#e2e8f0');
  rockGrad.addColorStop(0.18, '#a8a29e');
  rockGrad.addColorStop(0.46, '#78716c');
  rockGrad.addColorStop(0.76, '#44403c');
  rockGrad.addColorStop(1.0, '#1c1917');
  ctx.fillStyle = rockGrad;
  ctx.fill();

  // Clip internal facets, craters, mineral veins & thermal fissure cracks
  ctx.save();
  buildCursorSilhouettePath(ctx);
  ctx.clip();

  // Geometric rocky facets near ridges
  for (const facet of CURSOR_FACETS) {
    const a = CURSOR_ROCK_POLY[facet.pts[0]];
    const b = CURSOR_ROCK_POLY[facet.pts[1]];
    const c = CURSOR_ROCK_POLY[facet.pts[2]];
    ctx.fillStyle = facet.shade;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fill();
  }

  // Internal ridge line from nose tip into boulder belly
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.32)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0.8, 0.8);
  ctx.lineTo(7.4, 5.2);
  ctx.lineTo(12.2, 9.6);
  ctx.lineTo(18.8, 12.8);
  ctx.stroke();

  // Shadow side beneath main ridge
  ctx.strokeStyle = 'rgba(12, 10, 9, 0.45)';
  ctx.lineWidth = 0.95;
  ctx.beginPath();
  ctx.moveTo(1.2, 1.5);
  ctx.lineTo(7.2, 6.0);
  ctx.lineTo(11.8, 10.4);
  ctx.lineTo(18.2, 13.7);
  ctx.stroke();

  // Subtle silicate/magma micro-fissures that warm subtly on fast flight/click boost
  const fissureHeat = Math.min(1, Math.max(0.12, energyGlow * 0.52 + 0.14 * Math.sin(elapsed * 4.5)));
  ctx.strokeStyle =
    hoverGlow > 0.35
      ? `rgba(56, 189, 248, ${0.35 + hoverGlow * 0.45})`
      : `rgba(251, 146, 60, ${0.22 + fissureHeat * 0.45})`;
  ctx.lineWidth = 0.55;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4.2, 3.6);
  ctx.lineTo(6.4, 8.8);
  ctx.lineTo(4.8, 13.0);
  ctx.moveTo(11.8, 3.4);
  ctx.lineTo(13.8, 8.4);
  ctx.lineTo(17.6, 10.6);
  ctx.stroke();

  // 4. Sculpted Concave Impact Craters (shadowed upper-left bowl + lit lower-right inner wall + rim)
  for (const cr of CURSOR_CRATERS) {
    ctx.save();
    ctx.translate(cr.cx, cr.cy);
    ctx.rotate(cr.rot);

    // Outer raised ejecta dust rim
    ctx.strokeStyle = 'rgba(214, 211, 209, 0.32)';
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.ellipse(0, 0, cr.rx + 0.35, cr.ry + 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Concave interior shading (dark shadow top-left where sun misses, lighter bottom-right wall)
    const cGrad = ctx.createLinearGradient(-cr.rx, -cr.ry, cr.rx, cr.ry);
    cGrad.addColorStop(0.0, `rgba(12, 10, 9, ${0.88 * cr.depth})`);
    cGrad.addColorStop(0.55, `rgba(41, 37, 36, ${0.72 * cr.depth})`);
    cGrad.addColorStop(1.0, `rgba(168, 162, 158, ${0.58 * cr.depth})`);
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, cr.rx, cr.ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lower-right inner rim catchlight
    ctx.strokeStyle = 'rgba(245, 245, 244, 0.42)';
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.ellipse(0, 0, cr.rx * 0.92, cr.ry * 0.92, 0, 0.25, Math.PI * 0.9);
    ctx.stroke();

    ctx.restore();
  }

  // Fine mineral grain speckles
  ctx.fillStyle = 'rgba(241, 245, 249, 0.35)';
  ctx.fillRect(4.8, 5.2, 0.7, 0.7);
  ctx.fillRect(10.5, 4.4, 0.65, 0.65);
  ctx.fillRect(16.2, 16.4, 0.65, 0.65);
  ctx.fillRect(6.1, 17.8, 0.6, 0.6);

  ctx.restore(); // end clip

  // 5. Crisp solar specular leading bevel (highlights top-left edge from nose tip)
  ctx.strokeStyle =
    hoverGlow > 0.3
      ? 'rgba(125, 211, 252, 0.92)'
      : 'rgba(248, 250, 252, 0.78)';
  ctx.lineWidth = 0.65;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(CURSOR_ROCK_POLY[10].x, CURSOR_ROCK_POLY[10].y);
  ctx.lineTo(CURSOR_ROCK_POLY[11].x, CURSOR_ROCK_POLY[11].y);
  ctx.lineTo(CURSOR_ROCK_POLY[0].x, CURSOR_ROCK_POLY[0].y);
  ctx.lineTo(CURSOR_ROCK_POLY[1].x, CURSOR_ROCK_POLY[1].y);
  ctx.lineTo(CURSOR_ROCK_POLY[2].x, CURSOR_ROCK_POLY[2].y);
  ctx.stroke();

  // Sharp incandescent or cyan nose-tip pinpoint indicator for pixel precision clicking
  ctx.fillStyle = hoverGlow > 0.3 ? '#7dd3fc' : '#f8fafc';
  ctx.beginPath();
  ctx.arc(0.45, 0.45, 0.95, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a free-spinning 2D rocky asteroid with procedural craters & re-entry glow
 * centered at local origin `(0, 0)` (used by the 2D Canvas WebGL-fallback sequence).
 */
export function drawPassingAsteroid2D(
  ctx: CanvasRenderingContext2D,
  radius: number,
  seed: number,
  rotationRad: number,
  heat: number,
  alpha: number
): void {
  if (alpha <= 0.005 || radius <= 0.5) return;

  ctx.save();
  ctx.rotate(rotationRad);
  ctx.globalAlpha = alpha;

  const verts = 13;
  const pts: AsteroidVertex[] = [];
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2;
    const n1 = Math.sin(a * 3 + seed * 1.7) * 0.16;
    const n2 = Math.cos(a * 5 - seed * 2.3) * 0.09;
    const r = radius * (0.86 + n1 + n2);
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }

  // Hot re-entry halo when streaking fast toward impact
  if (heat > 0.08) {
    const glow = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 1.65);
    glow.addColorStop(0, `rgba(255, 224, 150, ${0.42 * heat})`);
    glow.addColorStop(0.55, `rgba(249, 115, 22, ${0.22 * heat})`);
    glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.65, 0, Math.PI * 2);
    ctx.fill();
  }

  const traceRock = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
  };

  traceRock();
  const bodyGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  bodyGrad.addColorStop(0.0, heat > 0.35 ? '#fcd34d' : '#cbd5e1');
  bodyGrad.addColorStop(0.28, '#8a8279');
  bodyGrad.addColorStop(0.68, '#4a4540');
  bodyGrad.addColorStop(1.0, '#181615');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.save();
  traceRock();
  ctx.clip();

  // Procedural craters
  const craterCount = 4;
  for (let c = 0; c < craterCount; c++) {
    const ca = c * 1.7 + seed * 3.1;
    const dist = radius * (0.24 + ((c * 0.37 + seed) % 0.44));
    const cx = Math.cos(ca) * dist;
    const cy = Math.sin(ca) * dist;
    const cr = radius * (0.14 + ((c * 0.23 + seed * 0.4) % 0.14));

    const cg = ctx.createLinearGradient(cx - cr, cy - cr, cx + cr, cy + cr);
    cg.addColorStop(0, 'rgba(12, 10, 9, 0.85)');
    cg.addColorStop(0.65, 'rgba(41, 37, 36, 0.65)');
    cg.addColorStop(1, 'rgba(168, 162, 158, 0.5)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  if (heat > 0.12) {
    ctx.strokeStyle = `rgba(251, 146, 60, ${Math.min(0.95, heat * 0.9)})`;
    ctx.lineWidth = Math.max(1, radius * 0.045);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, -radius * 0.15);
    ctx.lineTo(0, radius * 0.12);
    ctx.lineTo(radius * 0.42, -radius * 0.28);
    ctx.stroke();
  }

  ctx.restore();

  traceRock();
  ctx.strokeStyle =
    heat > 0.3 ? `rgba(253, 186, 116, ${0.4 + heat * 0.5})` : 'rgba(226, 232, 240, 0.32)';
  ctx.lineWidth = Math.max(0.8, radius * 0.03);
  ctx.stroke();

  ctx.restore();
}

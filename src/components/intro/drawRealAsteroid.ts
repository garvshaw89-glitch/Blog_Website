/**
 * Photorealistic supersampled 3D heightfield-ray-shaded asteroid renderers:
 * 1) `drawRealAsteroid`: Pre-bakes a crisp 160x160 3D normal-lit craggy meteorite sprite
 *    anchored right at the sharp upper-left rocky ridge tip `(0, 0)` so the mouse cursor
 *    looks like an authentic floating space rock with surgical pointer precision.
 * 2) `drawPassingAsteroid2D`: Free-rotating rocky asteroid for 2D fallback mode.
 */

export interface AsteroidVertex {
  x: number;
  y: number;
}

const CURSOR_ROCK_POLY: AsteroidVertex[] = [
  { x: 0.0, y: 0.0 },
  { x: 4.5, y: 1.2 },
  { x: 9.2, y: 0.8 },
  { x: 13.8, y: 2.3 },
  { x: 18.2, y: 5.4 },
  { x: 21.6, y: 10.4 },
  { x: 21.2, y: 15.6 },
  { x: 17.8, y: 19.8 },
  { x: 12.8, y: 21.6 },
  { x: 7.4, y: 20.1 },
  { x: 3.6, y: 16.0 },
  { x: 1.9, y: 10.8 },
  { x: 0.9, y: 5.1 },
];

const CRATERS_SPEC = [
  { cx: 10.6, cy: 7.2, r: 3.3, depth: 0.95 },
  { cx: 15.6, cy: 13.4, r: 3.6, depth: 1.05 },
  { cx: 7.6, cy: 14.8, r: 2.4, depth: 0.85 },
  { cx: 15.8, cy: 5.8, r: 1.7, depth: 0.72 },
  { cx: 11.4, cy: 18.2, r: 1.75, depth: 0.75 },
  { cx: 5.6, cy: 7.2, r: 1.3, depth: 0.65 },
];

function pointInPoly(px: number, py: number, poly: AsteroidVertex[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-6) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function vnoise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm2(x: number, y: number): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    v += amp * (vnoise2(x * freq, y * freq) * 2 - 1);
    freq *= 2.08;
    amp *= 0.48;
  }
  return v;
}

// Compute physical rock heightfield in canonical 24x24 cursor space
function sampleAsteroidHeight(x: number, y: number): number {
  // Distance toward boulder center-of-mass (11.2, 11.2)
  const dx = (x - 11.4) / 10.6;
  const dy = (y - 11.2) / 10.6;
  const radialSq = dx * dx + dy * dy;
  let h = Math.max(0.08, 1.0 - radialSq * 0.55);

  // Ridged angular rock formations & surface grit
  const ridge = 1 - Math.abs(fbm2(x * 0.22 + 2.4, y * 0.22 - 1.7));
  const detail = fbm2(x * 0.65, y * 0.65) * 0.14 + fbm2(x * 1.45, y * 1.45) * 0.06;
  h += ridge * 0.34 + detail;

  // Carve concave spherical impact craters with raised ejecta rims
  for (const cr of CRATERS_SPEC) {
    const dist = Math.hypot(x - cr.cx, y - cr.cy);
    if (dist < cr.r * 1.32) {
      const q = dist / cr.r;
      if (q < 1.0) {
        h -= Math.pow(Math.cos(q * Math.PI * 0.5), 1.35) * 0.42 * cr.depth;
      } else {
        const rimT = (q - 1.0) / 0.32;
        h += Math.sin((1 - rimT) * Math.PI) * 0.12 * cr.depth;
      }
    }
  }
  return h;
}

let cachedRockSprite: HTMLCanvasElement | null = null;
const SPRITE_SIZE = 168; // 7x supersampled over 24x24 canonical cursor box

function getBakedRockCursorSprite(): HTMLCanvasElement {
  if (cachedRockSprite) return cachedRockSprite;

  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(SPRITE_SIZE, SPRITE_SIZE);
  const data = img.data;

  // Directional solar key light from top-left (-0.64, -0.64, +0.42) & Milky Way blue bounce (+0.5, +0.4, +0.3)
  const sunX = -0.64;
  const sunY = -0.64;
  const sunZ = 0.42;
  const eps = 0.16;

  for (let py = 0; py < SPRITE_SIZE; py++) {
    for (let px = 0; px < SPRITE_SIZE; px++) {
      // Map pixel inside [0..24] canonical frame with 1px safety padding for crisp anti-aliased edge
      const x = (px / SPRITE_SIZE) * 24.0;
      const y = (py / SPRITE_SIZE) * 24.0;

      if (!pointInPoly(x, y, CURSOR_ROCK_POLY)) continue;

      // Heightfield finite-difference surface normal for crisp real-rock relief
      const hL = sampleAsteroidHeight(x - eps, y);
      const hR = sampleAsteroidHeight(x + eps, y);
      const hU = sampleAsteroidHeight(x, y - eps);
      const hD = sampleAsteroidHeight(x, y + eps);

      let nx = (hL - hR) / (2 * eps);
      let ny = (hU - hD) / (2 * eps);
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const diff = Math.max(0.05, nx * sunX + ny * sunY + nz * sunZ);
      const rimBlue = Math.max(0, nx * 0.55 + ny * 0.5 + nz * 0.2);

      // Subtle mineral regolith variation (warm gray basalt + darker silicate grains)
      const grain = 0.86 + 0.28 * hash2(Math.floor(x * 3.5), Math.floor(y * 3.5));
      const baseR = 148 * grain;
      const baseG = 141 * grain;
      const baseB = 132 * grain;

      // Specular mineral glint along sunlit ridges
      const spec = Math.pow(diff, 7) * 58;

      const idx = (py * SPRITE_SIZE + px) * 4;
      data[idx] = Math.min(255, Math.floor(baseR * (0.14 + diff * 1.15) + spec + rimBlue * 12));
      data[idx + 1] = Math.min(
        255,
        Math.floor(baseG * (0.13 + diff * 1.12) + spec + rimBlue * 22)
      );
      data[idx + 2] = Math.min(
        255,
        Math.floor(baseB * (0.13 + diff * 1.08) + spec + rimBlue * 36)
      );
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);

  // Add subtle obsidian edge casing so rock reads razor-sharp against bright OR dark UI
  ctx.save();
  const sc = SPRITE_SIZE / 24.0;
  ctx.scale(sc, sc);
  ctx.beginPath();
  ctx.moveTo(CURSOR_ROCK_POLY[0].x, CURSOR_ROCK_POLY[0].y);
  for (let i = 1; i < CURSOR_ROCK_POLY.length; i++) {
    ctx.lineTo(CURSOR_ROCK_POLY[i].x, CURSOR_ROCK_POLY[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.92)';
  ctx.lineWidth = 1.1;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Sharp top-left sun catchlight edge right into the nose tip
  ctx.beginPath();
  ctx.moveTo(CURSOR_ROCK_POLY[11].x, CURSOR_ROCK_POLY[11].y);
  ctx.lineTo(CURSOR_ROCK_POLY[12].x, CURSOR_ROCK_POLY[12].y);
  ctx.lineTo(CURSOR_ROCK_POLY[0].x, CURSOR_ROCK_POLY[0].y);
  ctx.lineTo(CURSOR_ROCK_POLY[1].x, CURSOR_ROCK_POLY[1].y);
  ctx.lineTo(CURSOR_ROCK_POLY[2].x, CURSOR_ROCK_POLY[2].y);
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.lineWidth = 0.55;
  ctx.stroke();
  ctx.restore();

  cachedRockSprite = canvas;
  return canvas;
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

  const rockSprite = getBakedRockCursorSprite();

  ctx.save();
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // 1. Subtle ionized hover / flight energy corona behind rock
  const auraStrength = Math.min(1, Math.max(energyGlow * 0.5, hoverGlow * 0.92));
  if (auraStrength > 0.05) {
    const auraGrad = ctx.createRadialGradient(11, 11, 2, 11, 11, 17);
    if (hoverGlow > energyGlow * 0.65) {
      auraGrad.addColorStop(0, `rgba(56, 189, 248, ${0.34 * auraStrength})`);
      auraGrad.addColorStop(0.55, `rgba(14, 165, 233, ${0.14 * auraStrength})`);
      auraGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    } else {
      auraGrad.addColorStop(0, `rgba(251, 146, 60, ${0.34 * auraStrength})`);
      auraGrad.addColorStop(0.55, `rgba(234, 88, 12, ${0.14 * auraStrength})`);
      auraGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    }
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(11, 11, 17, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Draw pre-baked photorealistic 3D ray-shaded cratered rock cursor
  ctx.drawImage(rockSprite, 0, 0, 24, 24);

  // 3. Subtle glowing micro-fissures during fast flight or interactive hover
  const fissureAlpha = Math.min(
    0.85,
    Math.max(0.14, energyGlow * 0.42 + hoverGlow * 0.6 + 0.08 * Math.sin(elapsed * 4.5))
  );
  ctx.strokeStyle =
    hoverGlow > 0.35
      ? `rgba(125, 211, 252, ${fissureAlpha})`
      : `rgba(251, 146, 60, ${fissureAlpha * 0.8})`;
  ctx.lineWidth = 0.48;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4.2, 4.1);
  ctx.lineTo(6.4, 8.6);
  ctx.lineTo(4.9, 12.6);
  ctx.moveTo(11.6, 3.6);
  ctx.lineTo(13.8, 8.3);
  ctx.lineTo(17.5, 10.6);
  ctx.stroke();

  // Sharp pointer tip pinpoint highlight at (0, 0)
  ctx.fillStyle = hoverGlow > 0.3 ? '#7dd3fc' : '#f8fafc';
  ctx.beginPath();
  ctx.arc(0.45, 0.45, 0.85, 0, Math.PI * 2);
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

  const verts = 14;
  const pts: AsteroidVertex[] = [];
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2;
    const n1 = Math.sin(a * 3 + seed * 1.7) * 0.18;
    const n2 = Math.cos(a * 5 - seed * 2.3) * 0.1;
    const r = radius * (0.85 + n1 + n2);
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }

  if (heat > 0.08) {
    const glow = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 1.7);
    glow.addColorStop(0, `rgba(255, 224, 150, ${0.44 * heat})`);
    glow.addColorStop(0.55, `rgba(249, 115, 22, ${0.24 * heat})`);
    glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.7, 0, Math.PI * 2);
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
  bodyGrad.addColorStop(0.0, heat > 0.35 ? '#fcd34d' : '#d6d3d1');
  bodyGrad.addColorStop(0.28, '#78716c');
  bodyGrad.addColorStop(0.68, '#3f3a36');
  bodyGrad.addColorStop(1.0, '#141210');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.save();
  traceRock();
  ctx.clip();

  for (let c = 0; c < 5; c++) {
    const ca = c * 1.65 + seed * 3.1;
    const dist = radius * (0.22 + ((c * 0.37 + seed) % 0.45));
    const cx = Math.cos(ca) * dist;
    const cy = Math.sin(ca) * dist;
    const cr = radius * (0.14 + ((c * 0.23 + seed * 0.4) % 0.14));

    const cg = ctx.createLinearGradient(cx - cr, cy - cr, cx + cr, cy + cr);
    cg.addColorStop(0, 'rgba(10, 9, 8, 0.9)');
    cg.addColorStop(0.62, 'rgba(38, 34, 31, 0.72)');
    cg.addColorStop(1, 'rgba(168, 162, 158, 0.55)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  if (heat > 0.12) {
    ctx.strokeStyle = `rgba(251, 146, 60, ${Math.min(0.95, heat * 0.92)})`;
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
    heat > 0.3 ? `rgba(253, 186, 116, ${0.42 + heat * 0.5})` : 'rgba(226, 232, 240, 0.35)';
  ctx.lineWidth = Math.max(0.8, radius * 0.03);
  ctx.stroke();

  ctx.restore();
}

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  interactionEngine,
  SingularityInteractionState,
} from '../../context/SingularityInteractionEngine';

export interface MilkyWayGalaxyProps {
  opacity?: number;
  glowIntensity?: number;
  paused?: boolean;
  className?: string;
}

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl =
      probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Fast deterministic 2D value noise + domain-warped FBM for authentic interstellar structure
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise2D(x: number, y: number): number {
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

function fbm2D(x: number, y: number, octaves = 4): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise2D(x * freq, y * freq);
    const nx = x * 0.8 - y * 0.6;
    const ny = x * 0.6 + y * 0.8;
    x = nx;
    y = ny;
    freq *= 2.04;
    amp *= 0.5;
  }
  return v;
}

function ridgedFbm2D(x: number, y: number, octaves = 4): number {
  let v = 0;
  let amp = 0.52;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1.0 - Math.abs(valueNoise2D(x * freq, y * freq) * 2.0 - 1.0);
    v += amp * n * n;
    const nx = x * 0.8 - y * 0.6;
    const ny = x * 0.6 + y * 0.8;
    x = nx;
    y = ny;
    freq *= 2.08;
    amp *= 0.5;
  }
  return v;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ============================================================================
// PRE-BAKED CRISP LUMINOUS GALACTIC DISK TEXTURE (768x768)
// Tightly hugs the blazing galactic bar & spiral arm spines without heavy dark shadow
// Baked once on startup -> 1 ultra-fast texture lookup/frame (locked 60fps)
// ============================================================================
function createGalacticNebulaTexture(): THREE.CanvasTexture {
  const size = 768;
  const nebCanvas = document.createElement('canvas');
  nebCanvas.width = size;
  nebCanvas.height = size;
  const nebCtx = nebCanvas.getContext('2d');

  if (!nebCtx) {
    return new THREE.CanvasTexture(nebCanvas);
  }

  const nebImg = nebCtx.createImageData(size, size);
  const nd = nebImg.data;

  const half = size * 0.5;
  const tightness = 3.25;
  const barRot = 0.44;
  const cosBar = Math.cos(barRot);
  const sinBar = Math.sin(barRot);

  for (let py = 0; py < size; py++) {
    const gy = ((py + 0.5) / half - 1.0) * 1.06;
    for (let px = 0; px < size; px++) {
      const gx = ((px + 0.5) / half - 1.0) * 1.06;
      const r = Math.hypot(gx, gy);
      const idx = (py * size + px) * 4;

      if (r > 1.04) {
        nd[idx + 3] = 0;
        continue;
      }

      const angle = Math.atan2(gy, gx);
      const twist = Math.log(1.0 + r * 5.2) * tightness;

      // Gentle domain warp along spiral coordinates
      const warpX = fbm2D(gx * 3.4 + 4.1, gy * 3.4 - 2.3, 4);
      const warpY = fbm2D(gx * 3.4 - 3.2, gy * 3.4 + 5.7, 4);
      const wx = gx + (warpX - 0.5) * 0.20;
      const wy = gy + (warpY - 0.5) * 0.20;

      const cloudMacro = fbm2D(wx * 4.8 + 1.2, wy * 4.8 - 1.9, 4);
      const cloudFine = fbm2D(wx * 10.5 - 2.4, wy * 10.5 + 3.1, 3);
      const filament = ridgedFbm2D(wx * 8.2 + 0.7, wy * 8.2 - 1.4, 3);

      const phaseMajor = angle - twist + (warpX - 0.5) * 0.28;
      const phaseMinor = phaseMajor + Math.PI * 0.5;

      // Crisp sculpted spiral arms (tight, luminous, zero wide muddy wash)
      const majorSpine = Math.pow(Math.max(Math.cos(2.0 * phaseMajor), 0.0), 3.1);
      const majorShock = Math.pow(Math.max(Math.cos(2.0 * (phaseMajor - 0.12)), 0.0), 6.0);
      const minorSpine = Math.pow(Math.max(Math.cos(2.0 * phaseMinor), 0.0), 3.8) * 0.54;

      const spurWave = Math.pow(
        Math.max(Math.cos(4.0 * (angle - twist * 1.18 + (warpY - 0.5) * 0.38)), 0.0),
        5.0
      );
      const spur = spurWave * smoothstep(0.24, 0.52, r) * (1.0 - smoothstep(0.66, 0.94, r)) * 0.24;

      const armDensity = Math.min(1.0, majorSpine + minorSpine + spur);

      // Compact luminous triaxial galactic bar + blazing golden-ivory nucleus
      const bx = (gx * cosBar + gy * sinBar) * 0.76;
      const by = (-gx * sinBar + gy * cosBar) * 1.56;
      const barDist = Math.hypot(bx, by);
      const barGlow = Math.exp(-barDist * barDist * 24.0);
      const nucleus = Math.exp(-r * r * 62.0);
      const innerBulge = Math.exp(-r * r * 14.5);

      const outerFade = 1.0 - smoothstep(0.56, 1.02, r);
      const diskEnvelope = Math.exp(-r * 1.72) * outerFade;

      // Very delicate internal dust filament texture (subtle definition only — never dark shadow)
      const dustArmEdge =
        Math.pow(Math.max(Math.cos(2.0 * (phaseMajor + 0.22)), 0.0), 4.8) +
        Math.pow(Math.max(Math.cos(2.0 * (phaseMinor + 0.20)), 0.0), 5.5) * 0.4;
      const subtleRift =
        smoothstep(0.46, 0.82, filament) *
        Math.min(1.0, dustArmEdge) *
        smoothstep(0.10, 0.34, r) *
        (1.0 - smoothstep(0.62, 0.92, r));

      // Delicate rose-magenta H-II nebulae pockets along leading edges
      const h2Knot =
        smoothstep(0.58, 0.84, cloudMacro * 0.65 + cloudFine * 0.35) *
        (majorShock * 0.85 + minorSpine * 0.42) *
        smoothstep(0.18, 0.38, r) *
        (1.0 - smoothstep(0.66, 0.92, r));

      const armEmission =
        armDensity * diskEnvelope * (0.42 + 0.68 * cloudMacro) * (0.78 + 0.28 * cloudFine);
      const litArms = Math.max(armEmission * (1.0 - subtleRift * 0.34), 0.0);

      // Luminous sapphire-cyan spiral arms transitioning cleanly to warm golden bar & ivory core
      const blueMix = smoothstep(0.12, 0.82, armDensity * cloudMacro + 0.16);
      let cr = mix(0.24, 0.32, blueMix);
      let cg = mix(0.28, 0.74, blueMix);
      let cb = mix(0.68, 1.0, blueMix);

      const obFlash = majorShock * smoothstep(0.45, 0.85, cloudFine) * outerFade * 0.58;
      cr = mix(cr, 0.78, obFlash);
      cg = mix(cg, 0.92, obFlash);
      cb = mix(cb, 1.0, obFlash);

      const h2Mix = Math.min(0.62, h2Knot * 0.66);
      cr = mix(cr, 0.94, h2Mix);
      cg = mix(cg, 0.40, h2Mix);
      cb = mix(cb, 0.68, h2Mix);

      const goldMix = Math.min(1.0, smoothstep(0.42, 0.08, barDist) * 0.84 + innerBulge * 0.38);
      cr = mix(cr, 0.97, goldMix);
      cg = mix(cg, 0.73, goldMix);
      cb = mix(cb, 0.42, goldMix);

      const nucMix = Math.min(1.0, nucleus * 1.2 + barGlow * 0.58);
      cr = mix(cr, 1.0, nucMix);
      cg = mix(cg, 0.96, nucMix);
      cb = mix(cb, 0.86, nucMix);

      // Compact, crisp glow alpha (no wide hazy shadow)
      const nebAlpha = Math.min(
        0.38,
        nucleus * 0.30 + barGlow * 0.22 + innerBulge * 0.10 + litArms * 0.28 + h2Knot * 0.10
      );

      nd[idx] = Math.round(Math.min(1, cr) * 255);
      nd[idx + 1] = Math.round(Math.min(1, cg) * 255);
      nd[idx + 2] = Math.round(Math.min(1, cb) * 255);
      nd[idx + 3] = Math.round(Math.min(1, nebAlpha) * 255);
    }
  }

  nebCtx.putImageData(nebImg, 0, 0);

  const nebulaTexture = new THREE.CanvasTexture(nebCanvas);
  nebulaTexture.colorSpace = THREE.SRGBColorSpace;
  nebulaTexture.minFilter = THREE.LinearFilter;
  nebulaTexture.magFilter = THREE.LinearFilter;
  nebulaTexture.generateMipmaps = false;
  nebulaTexture.needsUpdate = true;

  return nebulaTexture;
}

// Shared disk vertex shader for both the emission nebula & dark molecular dust veil
const DISK_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uReducedMotion;
  uniform float uAspect;
  uniform float uZOffset;

  varying vec2 vGalUv;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;

    vec3 galPos = vec3(position.x, uZOffset, position.y);

    // Grand 3/4 oblique opening angle -> sweeps smoothly toward dramatic face-on spiral on scroll
    float pitchX = 0.88 - sin(s * 3.14159) * 0.40 + s * 0.10;
    float bankZ  = -0.32 + s * 0.58 + sin(t * 0.08) * 0.025;

    float cx = cos(pitchX), sx = sin(pitchX);
    vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

    float cz = cos(bankZ), sz = sin(bankZ);
    vec3 worldPos = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

    worldPos.x += 0.15 - sin(s * 3.4) * 1.45;
    worldPos.y += 0.05 + cos(s * 2.8) * 0.72 - s * 0.35;
    worldPos.z -= 1.0 + sin(s * 2.4) * 0.9;

    float galSpan = mix(15.2, 20.5, clamp(uAspect - 0.7, 0.0, 1.0));
    vGalUv = position.xy / galSpan;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uDiskMap;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScrollProgress;
  uniform float uReducedMotion;
  uniform vec2 uPointer;

  varying vec2 vGalUv;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * 0.028 * motion;
    float spin = t + uScrollProgress * 2.55;

    float cs = cos(spin), sn = sin(spin);
    vec2 g = vec2(vGalUv.x * cs - vGalUv.y * sn, vGalUv.x * sn + vGalUv.y * cs);
    g += uPointer * 0.014;

    float r = length(g);
    if (r > 1.05) discard;

    vec2 texUv = (g / 1.06) * 0.5 + 0.5;
    vec4 neb = texture2D(uDiskMap, texUv);

    // Subtle synchronized time-based chromatic drift (deep blue -> violet -> cyan) across outer spiral arms
    float phase = fract(uTime * 0.035 * motion + r * 0.28 + atan(g.y, g.x) * 0.05);
    vec3 colDeepBlue = vec3(0.18, 0.42, 0.94);
    vec3 colViolet   = vec3(0.56, 0.34, 0.96);
    vec3 colCyan     = vec3(0.20, 0.84, 0.98);
    vec3 livingHue = phase < 0.3333
      ? mix(colDeepBlue, colViolet, smoothstep(0.0, 0.3333, phase))
      : phase < 0.6667
        ? mix(colViolet, colCyan, smoothstep(0.3333, 0.6667, phase))
        : mix(colCyan, colDeepBlue, smoothstep(0.6667, 1.0, phase));
    float armMask = smoothstep(0.18, 0.62, r);
    vec3 shiftedRgb = mix(neb.rgb, livingHue, armMask * 0.16);

    float scrollAtten = mix(1.0, 0.74, smoothstep(0.08, 0.45, uScrollProgress));
    float breath = 0.96 + 0.04 * sin(uTime * 0.55 * motion + r * 4.5);
    float alpha = neb.a * scrollAtten * uOpacity * breath;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(shiftedRgb, clamp(alpha, 0.0, 0.36));
  }
`;

// ============================================================================
// PHOTOREALISTIC BLACKBODY STARFIELD, 3D TRI-AXIAL BULGE, H-II KNOTS & HALO
// ============================================================================
const GALAXY_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScrollProgress;
  uniform float uScrollVelocity;
  uniform float uAspect;
  uniform vec2 uPointer;
  uniform float uPointerEnergy;
  uniform vec2 uClickOrigin;
  uniform float uClickAge;
  uniform float uReducedMotion;
  uniform float uGlowIntensity;
  uniform vec3 uRocketPos;
  uniform float uRocketActive;
  uniform float uRocketWake;

  attribute vec3 aColor;
  attribute float aRadius;
  attribute float aAngle;
  attribute float aHeight;
  attribute float aSize;
  attribute float aAlpha;
  attribute float aKind; // 0: cosmic stardust cloud, 1: crisp spiral/core star, 2: H-II / OB nebula knot, 3: deep night-sky jewel star

  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vTwinkle;
  varying float vBoost;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;
    float velKick = clamp(uScrollVelocity * 0.004, -0.48, 0.48) * motion;

    vec3 p = vec3(0.0);
    float boost = 0.0;

    if (aKind < 2.5) {
      float r = aRadius;
      // Differential Keplerian orbital drift (faster near galactic bar, serene at outer spiral rim)
      float orbitalRate = (0.032 / (0.26 + r * 0.95)) * motion;
      float scrollSpin = s * (2.55 + (1.0 - min(r, 1.0)) * 0.92) + velKick * 0.72;
      float theta = aAngle + t * orbitalRate + scrollSpin;

      float galSpan = mix(15.2, 20.5, clamp(uAspect - 0.7, 0.0, 1.0));
      float rWorld = r * galSpan;
      float xPlane = cos(theta) * rWorld;
      float zPlane = sin(theta) * rWorld;

      // Subtle authentic galactic S-warp at the outer disk edge
      float warp = sin(theta * 2.0 + rWorld * 0.18 - t * 0.12) * 0.36 * smoothstep(5.5, 16.5, rWorld);
      float yPlane = aHeight + warp;

      vec3 galPos = vec3(xPlane, yPlane, zPlane);

      // Synced 1:1 with DISK_VERTEX_SHADER
      float pitchX = 0.88 - sin(s * 3.14159) * 0.40 + s * 0.10;
      float bankZ  = -0.32 + s * 0.58 + sin(t * 0.08) * 0.025;

      float cx = cos(pitchX), sx = sin(pitchX);
      vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

      float cz = cos(bankZ), sz = sin(bankZ);
      p = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

      p.x += 0.15 - sin(s * 3.4) * 1.45;
      p.y += 0.05 + cos(s * 2.8) * 0.72 - s * 0.35;
      p.z -= 1.0 + sin(s * 2.4) * 0.9;
    } else {
      // Deep space surrounding stars & 1st-magnitude foreground jewels
      p = position;
      p.x += sin(t * 0.038 + aAngle) * 0.22 - sin(s * 3.14159) * 2.0;
      p.y += cos(t * 0.034 + aHeight * 6.0) * 0.18 - s * 3.1;
      p.z += s * 1.4;
    }

    // Rocket Launch Exhaust Wake ('R' key)
    float rocketGlow = 0.0;
    if (uRocketActive > 0.5) {
      vec3 rOff = p - uRocketPos * vec3(0.30, 0.30, 0.35);
      float rDist = length(rOff);
      float rInf = exp(-rDist * 0.30) * uRocketWake;
      vec3 pushDir = rDist > 0.001 ? rOff / rDist : vec3(0.0, 1.0, 0.0);
      p += pushDir * rInf * 3.0;
      rocketGlow = clamp(rInf * 1.4, 0.0, 1.0);
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vec2 ndcPos = gl_Position.xy / max(gl_Position.w, 0.001);
    float centerDist = length(ndcPos * vec2(0.85, 1.15));
    float readDim = smoothstep(0.09, 0.42, uScrollProgress);
    float centerFloor = mix(0.98, 0.58, readDim);
    float centerBalance = mix(centerFloor, 1.0, smoothstep(0.08, 0.72, centerDist));

    // Natural subtle stellar scintillation (atmospheric/optical micro-twinkle)
    float twinkle = 0.82 + 0.18 * sin(t * (1.1 + aAlpha * 2.7) + aAngle * 23.1 + aRadius * 43.0);
    float perspectiveScale = 23.0 / max(-mvPosition.z, 3.0);

    float interactiveScale = 1.0 + rocketGlow * 0.8 + abs(velKick) * 0.16;
    float ptSize = aSize * perspectiveScale * uPixelRatio * interactiveScale;

    float minPt = aKind > 1.5 && aKind < 2.5 ? 2.6 * uPixelRatio : 1.05 * uPixelRatio;
    float maxPt = aKind > 1.5 && aKind < 2.5 ? 14.5 * uPixelRatio : 9.8 * uPixelRatio;
    gl_PointSize = clamp(ptSize, minPt, maxPt);

    boost = rocketGlow;

    // Subtle, living time-based chromatic transition: deep blue -> violet -> cyan
    float colorCycle = fract(t * 0.045 + aAngle * 0.08 + max(aRadius, 0.0) * 0.34);
    vec3 colDeepBlue = vec3(0.18, 0.42, 0.94);
    vec3 colViolet   = vec3(0.56, 0.34, 0.96);
    vec3 colCyan     = vec3(0.20, 0.84, 0.98);
    vec3 cycleColor = colorCycle < 0.3333
      ? mix(colDeepBlue, colViolet, smoothstep(0.0, 0.3333, colorCycle))
      : colorCycle < 0.6667
        ? mix(colViolet, colCyan, smoothstep(0.3333, 0.6667, colorCycle))
        : mix(colCyan, colDeepBlue, smoothstep(0.6667, 1.0, colorCycle));

    // Preserve the warm ivory-gold central bulge while infusing spiral arms, dust & field stars
    float outerMask = aKind > 2.5 ? 0.65 : smoothstep(0.14, 0.44, aRadius);
    float kindWeight = aKind < 0.5 ? 0.34 : aKind < 1.5 ? 0.22 : aKind < 2.5 ? 0.30 : 0.24;
    float shiftAmt = outerMask * kindWeight * mix(1.0, 0.25, uReducedMotion);

    vColor = mix(aColor, cycleColor, shiftAmt);
    vAlpha = clamp((aAlpha * centerBalance + rocketGlow * 0.48) * uGlowIntensity, 0.0, 1.0);
    vKind = aKind;
    vTwinkle = twinkle;
    vBoost = boost;
  }
`;

const GALAXY_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uSectionAccent;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vTwinkle;
  varying float vBoost;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r2 = dot(uv, uv) * 4.0;
    if (r2 > 1.0) discard;

    vec3 col = mix(vColor, uSectionAccent, clamp(vBoost * 0.24, 0.0, 0.36));
    float intensity = 0.0;

    if (vKind < 0.5) {
      // Kind 0: Fine resolved galactic star-cloud mist & micro-stars
      float r = sqrt(r2);
      intensity = smoothstep(1.0, 0.08, r) * 0.88;
    } else if (vKind < 1.5) {
      // Kind 1: Optical Airy-Disk Stars (pinhole incandescent core + soft natural chromatic halo)
      float core = exp(-r2 * 26.0);
      float halo = exp(-r2 * 5.2) * 0.38;
      float isSupergiant = smoothstep(0.68, 0.96, vAlpha);
      float spikeX = exp(-abs(uv.y) * 34.0) * exp(-abs(uv.x) * 5.2);
      float spikeY = exp(-abs(uv.x) * 34.0) * exp(-abs(uv.y) * 5.2);
      float spikes = (spikeX + spikeY) * 0.34 * isSupergiant;
      intensity = (core + halo + spikes) * vTwinkle;
      col = mix(col, vec3(1.0, 0.99, 0.96), clamp(core * 0.84 + spikes * 0.35, 0.0, 0.94));
    } else if (vKind < 2.5) {
      // Kind 2: Soft H-II Star-Forming Knot & OB Association Nebula Glow
      intensity = exp(-r2 * 4.2) * 0.92;
    } else {
      // Kind 3: Deep Night-Sky & 1st-Magnitude Hubble Diffraction Jewel Stars
      float core = exp(-r2 * 28.0);
      float halo = exp(-r2 * 4.8) * 0.34;
      float isBright = smoothstep(0.48, 0.88, vAlpha);
      float spikeX = exp(-abs(uv.y) * 36.0) * exp(-abs(uv.x) * 4.6);
      float spikeY = exp(-abs(uv.x) * 36.0) * exp(-abs(uv.y) * 4.6);
      float spikes = (spikeX + spikeY) * 0.62 * isBright * vTwinkle;
      intensity = core + halo + spikes;
      col = mix(col, vec3(1.0, 0.995, 0.985), clamp(core * 0.88 + spikes * 0.52, 0.0, 0.97));
    }

    float finalAlpha = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
    if (finalAlpha < 0.005) discard;

    gl_FragColor = vec4(col, finalAlpha);
  }
`;

export const MilkyWayGalaxy: React.FC<MilkyWayGalaxyProps> = ({
  opacity = 0.98,
  glowIntensity = 1.30,
  paused = false,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef<boolean>(paused);
  const opacityRef = useRef<number>(opacity);
  const glowRef = useRef<number>(glowIntensity);
  const stateRef = useRef<SingularityInteractionState>(interactionEngine.state);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    opacityRef.current = opacity;
  }, [opacity]);

  useEffect(() => {
    glowRef.current = glowIntensity;
  }, [glowIntensity]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === 'undefined' || !hasWebGLSupport()) {
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL();
    const isMobile = window.innerWidth < 768;

    const scene = new THREE.Scene();
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 720;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 160);
    camera.position.set(0, 0, 11.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        stencil: false,
        depth: false,
      });
    } catch {
      return;
    }

    const pixelRatio = isSoftwareGl
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    // Bake crisp luminous spiral disk once at startup (no heavy dark shadow overlay)
    const nebulaTexture = createGalacticNebulaTexture();

    const diskGeo = new THREE.PlaneGeometry(42, 42);
    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: DISK_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uDiskMap: { value: nebulaTexture },
        uTime: { value: 0 },
        uOpacity: { value: opacityRef.current },
        uScrollProgress: { value: 0 },
        uReducedMotion: { value: stateRef.current.prefersReduced ? 1 : 0 },
        uAspect: { value: width / height },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uZOffset: { value: 0.0 },
      },
    });
    const nebulaMesh = new THREE.Mesh(diskGeo, nebulaMat);
    nebulaMesh.frustumCulled = false;
    nebulaMesh.renderOrder = 1;
    scene.add(nebulaMesh);

    let seed = 31415926;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const randGauss = () => {
      const u1 = Math.max(rand(), 1e-6);
      const u2 = rand();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };

    const particleCount = isMobile ? 16000 : 28000;
    const positions = new Float32Array(particleCount * 3);
    const aColor = new Float32Array(particleCount * 3);
    const aRadius = new Float32Array(particleCount);
    const aAngle = new Float32Array(particleCount);
    const aHeight = new Float32Array(particleCount);
    const aSize = new Float32Array(particleCount);
    const aAlpha = new Float32Array(particleCount);
    const aKind = new Float32Array(particleCount);

    // Authentic Planckian blackbody + interstellar emission color library
    const colNucleusIvory = new THREE.Color(0xfff9ea);
    const colBulgeGold = new THREE.Color(0xf6c57b);
    const colPop2Ochre = new THREE.Color(0xdc8d4f);
    const colDustRedden = new THREE.Color(0xb85b34);
    const colOTypeBlue = new THREE.Color(0x8bc9ff);
    const colBTypeIce = new THREE.Color(0xc5e4ff);
    const colSapphire = new THREE.Color(0x4b89ee);
    const colAFWhite = new THREE.Color(0xf8faff);
    const colH2Magenta = new THREE.Color(0xf25b96);
    const colH2Peach = new THREE.Color(0xff9eb8);
    const tmpCol = new THREE.Color();

    // Matches DISK textures: twist = log(1 + r * 5.2) * 3.25
    const tightness = 3.25;

    // Pre-generate 7 subtle 3D Globular Clusters orbiting above/below the galactic bulge
    const globularClusters = Array.from({ length: 7 }, () => ({
      r: 0.14 + rand() * 0.42,
      angle: rand() * Math.PI * 2,
      height: (rand() < 0.5 ? -1 : 1) * (0.65 + rand() * 1.15),
    }));

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const roll = rand();

      if (roll < 0.23) {
        // ------------------------------------------------------------------
        // A. 3D TRI-AXIAL BARRED GALACTIC BULGE & SAGITTARIUS A* NUCLEUS
        // ------------------------------------------------------------------
        const rRaw = Math.pow(rand(), 2.2) * 0.30;
        const theta = rand() * Math.PI * 2;
        const bx = Math.cos(theta) * rRaw * 1.56;
        const bz = Math.sin(theta) * rRaw * 0.68;
        const rotB = 0.44;
        const gx = bx * Math.cos(rotB) - bz * Math.sin(rotB);
        const gz = bx * Math.sin(rotB) + bz * Math.cos(rotB);

        const rBar = Math.hypot(gx, gz);
        const aBar = Math.atan2(gz, gx);

        aRadius[i] = rBar;
        aAngle[i] = aBar;
        // Authentic 3D vertical peanut/spherical bulge thickness
        aHeight[i] = randGauss() * (0.68 * Math.exp(-rBar * 4.4) + 0.06);

        const subRoll = rand();
        if (subRoll < 0.11) {
          aKind[i] = 2; // Soft warm bulge bloom
          aSize[i] = 1.45 + rand() * 1.35;
          aAlpha[i] = 0.055 + (1 - Math.min(rBar / 0.30, 1)) * 0.075;
        } else if (subRoll < 0.68) {
          aKind[i] = 0; // Dense resolved Population II core stardust
          aSize[i] = 0.46 + rand() * 0.58;
          aAlpha[i] = 0.26 + (1 - Math.min(rBar / 0.30, 1)) * 0.34;
        } else {
          aKind[i] = 1; // Luminous K/G bulge giant stars
          const mag = Math.pow(rand(), 2.1);
          aSize[i] = 0.68 + mag * 1.45;
          aAlpha[i] = 0.54 + mag * 0.46;
        }

        const coreT = Math.min(rBar / 0.28, 1.0);
        tmpCol.copy(colNucleusIvory).lerp(colBulgeGold, Math.pow(coreT, 0.58));
        if (rand() < 0.22) tmpCol.lerp(colPop2Ochre, 0.45);
        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else if (roll < 0.85) {
        // ------------------------------------------------------------------
        // B. GRAND 4-ARM LOGARITHMIC SPIRAL DISK + OB ASSOCIATIONS + H-II KNOTS
        // Asymmetric shock front with interstellar dust reddening along inner troughs
        // ------------------------------------------------------------------
        let r = 0.08;
        let angle = 0;
        let isPrimary = true;
        let cloudDensity = 0.65;
        let shockOffset = 0;

        for (let attempt = 0; attempt < 3; attempt++) {
          r = 0.08 + Math.pow(rand(), 0.86) * 1.02;
          isPrimary = rand() < 0.68;
          const armIdx = (i + attempt) % 2;
          const baseAngle =
            (armIdx / 2) * Math.PI * 2 + (isPrimary ? 0 : Math.PI * 0.5);

          const spiralTwist = Math.log(1.0 + r * 5.2) * tightness;
          // Asymmetric Gaussian: sharp leading compression edge, wider trailing star trail
          const gRaw = randGauss();
          const armSpread = (isPrimary ? 0.105 : 0.145) + r * 0.135;
          const asymSpread = gRaw < 0 ? gRaw * armSpread * 0.68 : gRaw * armSpread * 1.28;
          const isSpur = rand() < 0.15;
          const spurAngle = isSpur ? (rand() - 0.35) * 0.58 : 0;

          shockOffset = asymSpread;
          angle = baseAngle + spiralTwist + asymSpread + spurAngle;

          const nx = Math.cos(angle) * r * 3.8;
          const nz = Math.sin(angle) * r * 3.8;
          cloudDensity = fbm2D(nx + 10.2, nz + 5.7, 3);
          if (cloudDensity > 0.30 || attempt === 2) break;
        }

        aRadius[i] = r;
        aAngle[i] = angle;
        // Thin galactic star-forming disk with gentle flare toward the outer rim
        aHeight[i] = randGauss() * (0.065 + 0.16 * r);

        const isNearShock = Math.abs(shockOffset) < 0.085 && r > 0.18 && r < 0.86;
        const isDustTrough = shockOffset < -0.055 && r > 0.14 && r < 0.72;
        const isH2Nursery = isNearShock && cloudDensity > 0.56 && rand() < 0.22;
        const armWeight = isPrimary ? 1.0 : 0.68;

        const subRoll = rand();
        if (isH2Nursery && subRoll < 0.42) {
          // Compact glowing H-alpha star-forming nebula bead
          aKind[i] = 2;
          aSize[i] = 1.25 + rand() * 1.55;
          aAlpha[i] = (0.065 + cloudDensity * 0.085) * armWeight;
          tmpCol.copy(colH2Magenta).lerp(colH2Peach, rand() * 0.45);
        } else if (subRoll < 0.10) {
          // Soft blue-indigo OB association cloud glow
          aKind[i] = 2;
          aSize[i] = 1.35 + rand() * 1.45;
          aAlpha[i] = (0.042 + cloudDensity * 0.052) * armWeight;
          tmpCol.copy(colOTypeBlue).lerp(colSapphire, rand() * 0.55);
        } else if (subRoll < 0.68) {
          // Fine resolved stellar cloud sand
          aKind[i] = 0;
          aSize[i] = 0.44 + rand() * 0.60;
          aAlpha[i] = (0.22 + cloudDensity * 0.30) * armWeight;
          if (r < 0.30) {
            tmpCol.copy(colBulgeGold).lerp(colAFWhite, rand() * 0.55);
          } else {
            tmpCol.copy(colBTypeIce).lerp(colSapphire, rand() * 0.62);
          }
        } else {
          // Individual pinpoint stars across the spiral arms (OB supergiants & main sequence)
          aKind[i] = 1;
          const mag = Math.pow(rand(), 2.35);
          aSize[i] = 0.64 + mag * 1.75;
          aAlpha[i] = (0.46 + mag * 0.54) * armWeight;

          if (isH2Nursery) {
            tmpCol.copy(colH2Peach).lerp(colAFWhite, 0.45);
          } else if (isNearShock && rand() < 0.68) {
            // Luminous young O/B blue-white supergiants right along the leading spiral edge
            tmpCol.copy(colOTypeBlue).lerp(colBTypeIce, rand() * 0.65);
          } else if (r < 0.34) {
            tmpCol.copy(colBulgeGold).lerp(colAFWhite, rand() * 0.62);
          } else {
            const temp = rand();
            if (temp < 0.46) {
              tmpCol.copy(colBTypeIce).lerp(colAFWhite, rand() * 0.55);
            } else if (temp < 0.78) {
              tmpCol.copy(colAFWhite).lerp(colOTypeBlue, rand() * 0.38);
            } else {
              tmpCol.copy(colBulgeGold).lerp(colPop2Ochre, rand() * 0.48);
            }
          }
        }

        // Subtle warm dust tinting on inner boundary without over-dimming star brilliance
        if (isDustTrough && !isH2Nursery && rand() < 0.35) {
          tmpCol.lerp(colDustRedden, 0.24);
          aAlpha[i] *= 0.88;
        }

        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else if (roll < 0.90) {
        // ------------------------------------------------------------------
        // C. 3D GALACTIC HALO & ORBITING GLOBULAR CLUSTERS (Parallax Depth)
        // ------------------------------------------------------------------
        const inCluster = rand() < 0.48;
        if (inCluster) {
          const cl = globularClusters[i % globularClusters.length];
          aRadius[i] = Math.max(0.05, cl.r + randGauss() * 0.018);
          aAngle[i] = cl.angle + randGauss() * 0.045;
          aHeight[i] = cl.height + randGauss() * 0.14;
          aKind[i] = 1;
          aSize[i] = 0.52 + rand() * 0.72;
          aAlpha[i] = 0.35 + rand() * 0.48;
          tmpCol.copy(colNucleusIvory).lerp(colBulgeGold, 0.45 + rand() * 0.35);
        } else {
          aRadius[i] = 0.12 + Math.pow(rand(), 0.7) * 0.95;
          aAngle[i] = rand() * Math.PI * 2;
          aHeight[i] = randGauss() * 1.45;
          aKind[i] = 1;
          aSize[i] = 0.45 + rand() * 0.62;
          aAlpha[i] = 0.22 + rand() * 0.36;
          tmpCol.copy(colAFWhite).lerp(colBulgeGold, rand() * 0.55);
        }
        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else {
        // ------------------------------------------------------------------
        // D. DEEP NIGHT-SKY BACKGROUND & 1ST-MAGNITUDE JEWEL STARS
        // ------------------------------------------------------------------
        aKind[i] = 3;
        positions[i3] = (rand() - 0.5) * 48.0;
        positions[i3 + 1] = (rand() - 0.5) * 30.0;
        positions[i3 + 2] = -20.0 + rand() * 24.0;

        aRadius[i] = -1.0;
        aAngle[i] = rand() * Math.PI * 2;
        aHeight[i] = rand();

        const isJewel = rand() < 0.09;
        aSize[i] = isJewel ? 1.45 + rand() * 1.45 : 0.42 + rand() * 0.66;
        aAlpha[i] = isJewel ? 0.68 + rand() * 0.32 : 0.20 + rand() * 0.40;

        const skyTemp = rand();
        if (skyTemp < 0.52) {
          tmpCol.copy(colAFWhite).lerp(colOTypeBlue, rand() * 0.48);
        } else if (skyTemp < 0.84) {
          tmpCol.copy(colNucleusIvory).lerp(colBulgeGold, rand() * 0.58);
        } else {
          tmpCol.copy(colPop2Ochre).lerp(colBulgeGold, 0.45);
        }
        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));
    geometry.setAttribute('aRadius', new THREE.BufferAttribute(aRadius, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(aAngle, 1));
    geometry.setAttribute('aHeight', new THREE.BufferAttribute(aHeight, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha, 1));
    geometry.setAttribute('aKind', new THREE.BufferAttribute(aKind, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 80);

    const accentTarget = new THREE.Color(0x38bdf8);
    const accentCurrent = new THREE.Color(0x38bdf8);

    const material = new THREE.ShaderMaterial({
      vertexShader: GALAXY_VERTEX_SHADER,
      fragmentShader: GALAXY_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uScrollProgress: { value: 0 },
        uScrollVelocity: { value: 0 },
        uAspect: { value: width / height },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uPointerEnergy: { value: 0 },
        uClickOrigin: { value: new THREE.Vector2(0, 0) },
        uClickAge: { value: 99 },
        uReducedMotion: { value: stateRef.current.prefersReduced ? 1 : 0 },
        uGlowIntensity: { value: glowRef.current },
        uOpacity: { value: opacityRef.current },
        uRocketPos: { value: new THREE.Vector3(0, -20, 0) },
        uRocketActive: { value: 0 },
        uRocketWake: { value: 0 },
        uSectionAccent: { value: accentCurrent.clone() },
      },
    });

    const galaxyPoints = new THREE.Points(geometry, material);
    galaxyPoints.frustumCulled = false;
    galaxyPoints.renderOrder = 3;
    scene.add(galaxyPoints);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let clickNdcX = 0;
    let clickNdcY = 0;
    const unsubscribe = interactionEngine.subscribe((nextState) => {
      stateRef.current = nextState;
      accentTarget.setHex(nextState.sectionTheme.primary);
      if (nextState.clickOrigin) {
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        clickNdcX = (nextState.clickOrigin.x / w) * 2 - 1;
        clickNdcY = -(nextState.clickOrigin.y / h) * 2 + 1;
      }
    });

    let smoothedPointerX = 0;
    let smoothedPointerY = 0;
    let smoothedScrollProgress = 0;
    let frameId = 0;
    let isDisposed = false;
    let isContextLost = false;
    let lastTimestamp = performance.now();
    let elapsed = 0;

    const handleResize = () => {
      if (isDisposed) return;
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      material.uniforms.uAspect.value = w / h;
      nebulaMat.uniforms.uAspect.value = w / h;
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
    };

    const handleContextRestored = () => {
      isContextLost = false;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const status = sync
            ? gl.getSyncParameter(sync, gl.SYNC_STATUS)
            : gl.SIGNALED;
          if (status === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const scheduleNext = () => {
      if (isDisposed) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      if (isDisposed) return;

      const now = performance.now();
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      if (pausedRef.current || isContextLost) {
        frameId = window.setTimeout(tick, 140);
        return;
      }

      elapsed += dt;
      interactionEngine.step();
      const s = stateRef.current;

      const pointerDamp = 1 - Math.exp(-8.5 * dt);
      smoothedPointerX += (s.ndcX - smoothedPointerX) * pointerDamp;
      smoothedPointerY += (s.ndcY - smoothedPointerY) * pointerDamp;
      smoothedScrollProgress +=
        (s.scrollProgress - smoothedScrollProgress) * (1 - Math.exp(-5.5 * dt));

      accentCurrent.lerp(accentTarget, 1 - Math.exp(-3.2 * dt));

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uScrollProgress.value = smoothedScrollProgress;
      material.uniforms.uScrollVelocity.value = s.smoothedScrollVelocity;
      material.uniforms.uPointer.value.set(smoothedPointerX, smoothedPointerY);
      material.uniforms.uPointerEnergy.value = s.normalizedEnergy;
      material.uniforms.uClickOrigin.value.set(clickNdcX, clickNdcY);
      material.uniforms.uClickAge.value =
        s.lastClickTime > 0 ? (now - s.lastClickTime) / 1000 : 99;
      material.uniforms.uReducedMotion.value = s.prefersReduced ? 1 : 0;
      material.uniforms.uGlowIntensity.value = glowRef.current;
      material.uniforms.uOpacity.value = opacityRef.current;
      material.uniforms.uRocketPos.value.copy(s.rocketEmitter.position);
      material.uniforms.uRocketActive.value = s.rocketEmitter.isActive ? 1.0 : 0.0;
      material.uniforms.uRocketWake.value = s.rocketEmitter.wakeIntensity;
      material.uniforms.uSectionAccent.value.copy(accentCurrent);

      nebulaMat.uniforms.uTime.value = elapsed;
      nebulaMat.uniforms.uOpacity.value = opacityRef.current;
      nebulaMat.uniforms.uScrollProgress.value = smoothedScrollProgress;
      nebulaMat.uniforms.uReducedMotion.value = s.prefersReduced ? 1 : 0;
      nebulaMat.uniforms.uPointer.value.set(smoothedPointerX, smoothedPointerY);

      // Sweeping 3D orbital fly-through across the Milky Way
      const sp = smoothedScrollProgress;
      const camX = smoothedPointerX * 0.65 - Math.sin(sp * Math.PI * 1.4) * 2.2;
      const camY = smoothedPointerY * 0.38 + Math.sin(sp * Math.PI * 2.0) * 1.25 - sp * 0.35;
      const camZ = 11.4 - Math.sin(sp * Math.PI) * 1.65;
      camera.position.set(camX, camY, camZ);

      const lookX = -Math.sin(sp * 3.0) * 0.65;
      const lookY = -sp * 0.38;
      camera.lookAt(lookX, lookY, -1.0);

      renderer.render(scene, camera);
      scheduleNext();
    };

    scheduleNext();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      scene.remove(galaxyPoints);
      scene.remove(nebulaMesh);
      geometry.dispose();
      material.dispose();
      diskGeo.dispose();
      nebulaMat.dispose();
      nebulaTexture.dispose();
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`MilkyWayGalaxy fixed inset-0 w-full h-full pointer-events-none z-[2] overflow-hidden ${className}`.trim()}
      style={{ contain: 'strict', transform: 'translateZ(0)' }}
    />
  );
};

export default MilkyWayGalaxy;

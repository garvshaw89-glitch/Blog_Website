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

// Pre-allocated math helpers outside the render loop (zero per-frame GC)
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _lookCurrent = new THREE.Vector3(0, 0, -1);

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

// Quintic C2-continuous noise + ridged FBM for zero-crease organic interstellar nebulosity & dust rifts
function hash2(x: number, y: number): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

function valueNoise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  // Quintic Hermite curve eliminates grid-axis derivative discontinuities
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
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
    freq *= 2.03;
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
    freq *= 2.07;
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
// PRE-BAKED ASTROPHOTOGRAPHY GALACTIC DISK & INTERSTELLAR SHADOW TEXTURES
// - Baked at 768x768 with mipmaps & anisotropic filtering for silky gradients
// - Features luminous pearl-ivory galactic bulge transitioning cleanly through
//   ice-cyan -> royal sapphire -> violet arms with ionized H-II emission knots
// - Sculpted dark "Great Rift" molecular dust veins tracing concave arm edges
// ============================================================================
function createGalacticDiskTextures(maxAnisotropy: number): {
  nebulaTexture: THREE.CanvasTexture;
  shadowTexture: THREE.CanvasTexture;
} {
  const size = 768;
  const nebCanvas = document.createElement('canvas');
  nebCanvas.width = size;
  nebCanvas.height = size;
  const nebCtx = nebCanvas.getContext('2d');

  const shdCanvas = document.createElement('canvas');
  shdCanvas.width = size;
  shdCanvas.height = size;
  const shdCtx = shdCanvas.getContext('2d');

  if (!nebCtx || !shdCtx) {
    return {
      nebulaTexture: new THREE.CanvasTexture(nebCanvas),
      shadowTexture: new THREE.CanvasTexture(shdCanvas),
    };
  }

  const nebImg = nebCtx.createImageData(size, size);
  const nd = nebImg.data;
  const shdImg = shdCtx.createImageData(size, size);
  const sd = shdImg.data;

  const half = size * 0.5;
  const tightness = 3.32;
  const barRot = 0.44;
  const cosBar = Math.cos(barRot);
  const sinBar = Math.sin(barRot);

  for (let py = 0; py < size; py++) {
    const gy = ((py + 0.5) / half - 1.0) * 1.06;
    for (let px = 0; px < size; px++) {
      const gx = ((px + 0.5) / half - 1.0) * 1.06;
      const r = Math.hypot(gx, gy);
      const idx = (py * size + px) * 4;

      if (r > 1.05) {
        nd[idx + 3] = 0;
        sd[idx + 3] = 0;
        continue;
      }

      const angle = Math.atan2(gy, gx);
      const twist = Math.log(1.0 + r * 5.3) * tightness;

      // Multi-scale domain warping for wispy filamentous interstellar gas & dust
      const warpX = fbm2D(gx * 3.1 + 4.1, gy * 3.1 - 2.3, 3);
      const warpY = fbm2D(gx * 3.1 - 3.2, gy * 3.1 + 5.7, 3);
      const wx = gx + (warpX - 0.5) * 0.24;
      const wy = gy + (warpY - 0.5) * 0.24;

      const cloudMacro = fbm2D(wx * 4.6 + 1.2, wy * 4.6 - 1.9, 4);
      const cloudFine = fbm2D(wx * 11.4 - 2.4, wy * 11.4 + 3.1, 3);
      const ridgePrimary = ridgedFbm2D(wx * 7.8 + 0.7, wy * 7.8 - 1.4, 3);
      const ridgeFine = ridgedFbm2D(wx * 16.5 - 3.1, wy * 16.5 + 2.2, 3);

      const phaseMajor = angle - twist + (warpX - 0.5) * 0.32;
      const phaseMinor = phaseMajor + Math.PI * 0.5;

      // Sculpted logarithmic spiral arms: 2 grand primary arms + 2 secondary + spurs
      const majorSpine = Math.pow(Math.max(Math.cos(2.0 * phaseMajor), 0.0), 2.75);
      const majorShock = Math.pow(
        Math.max(Math.cos(2.0 * (phaseMajor - 0.13)), 0.0),
        5.8
      );
      const minorSpine =
        Math.pow(Math.max(Math.cos(2.0 * phaseMinor), 0.0), 3.4) * 0.58;

      const spurWave = Math.pow(
        Math.max(
          Math.cos(4.0 * (angle - twist * 1.19 + (warpY - 0.5) * 0.4)),
          0.0
        ),
        4.6
      );
      const spur =
        spurWave *
        smoothstep(0.20, 0.48, r) *
        (1.0 - smoothstep(0.68, 0.96, r)) *
        0.30;

      const armDensity = Math.min(1.0, majorSpine + minorSpine + spur);

      // Luminous Galactic Bar & Incandescent Core Bulge
      const bx = (gx * cosBar + gy * sinBar) * 0.74;
      const by = (-gx * sinBar + gy * cosBar) * 1.56;
      const barDist = Math.hypot(bx, by);
      const barGlow = Math.exp(-barDist * barDist * 22.0);
      const nucleus = Math.exp(-r * r * 58.0);
      const innerHalo = Math.exp(-r * r * 11.5);

      const outerFade = 1.0 - smoothstep(0.54, 1.03, r);
      const diskEnvelope = Math.exp(-r * 1.55) * outerFade;

      // Sculpted Dark Interstellar Dust Lanes ("Great Rift" & concave arm shock shadows)
      const dustArmEdge =
        Math.pow(Math.max(Math.cos(2.0 * (phaseMajor + 0.22)), 0.0), 3.8) +
        Math.pow(Math.max(Math.cos(2.0 * (phaseMinor + 0.21)), 0.0), 4.4) * 0.52;
      const dustFeathers =
        Math.pow(Math.max(Math.cos(4.0 * (phaseMajor + 0.35)), 0.0), 4.8) * 0.36;

      const filamentMask = smoothstep(
        0.34,
        0.78,
        ridgePrimary * 0.64 + ridgeFine * 0.36
      );
      const riftRadial =
        smoothstep(0.08, 0.26, r) * (1.0 - smoothstep(0.62, 0.96, r));
      const shadowLane = Math.min(
        1.0,
        filamentMask * Math.min(1.0, dustArmEdge + dustFeathers) * riftRadial
      );

      // Ionized H-II & violet-amethyst star-forming emission knots along leading arm shocks
      const nebulaKnot =
        smoothstep(0.54, 0.84, cloudMacro * 0.60 + cloudFine * 0.40) *
        (majorShock * 0.88 + minorSpine * 0.45) *
        smoothstep(0.16, 0.36, r) *
        (1.0 - smoothstep(0.68, 0.94, r));

      const armEmission =
        armDensity *
        diskEnvelope *
        (0.45 + 0.68 * cloudMacro) *
        (0.76 + 0.30 * cloudFine);
      // Carve deep dark dust veins directly through the luminous spiral glow
      const litArms = Math.max(armEmission * (1.0 - shadowLane * 0.78), 0.0);

      // Astrophotography palette: deep royal sapphire -> ice cyan -> amethyst -> pearl-ivory core
      const blueMix = smoothstep(0.08, 0.84, armDensity * cloudMacro + 0.14);
      let cr = mix(0.11, 0.24, blueMix);
      let cg = mix(0.28, 0.78, blueMix);
      let cb = mix(0.80, 1.00, blueMix);

      // Violet-indigo outer nebula depth
      const violetMix =
        smoothstep(0.24, 0.78, r) * (1.0 - majorShock) * cloudFine * 0.54;
      cr = mix(cr, 0.48, violetMix);
      cg = mix(cg, 0.30, violetMix);
      cb = mix(cb, 0.96, violetMix);

      // Ionized H-II rose-amethyst starbirth glow along bright arm ridges
      const h2Mix = Math.min(0.48, nebulaKnot * 0.75);
      cr = mix(cr, 0.86, h2Mix);
      cg = mix(cg, 0.38, h2Mix);
      cb = mix(cb, 0.94, h2Mix);

      // Luminous ice-white OB star clusters along leading shock edge
      const obFlash =
        majorShock * smoothstep(0.40, 0.84, cloudFine) * outerFade * 0.66;
      cr = mix(cr, 0.85, obFlash);
      cg = mix(cg, 0.95, obFlash);
      cb = mix(cb, 1.00, obFlash);

      // Subtle pearl-ivory warmth in the dense ancient galactic bar & bulge
      const coreWarmMix = Math.min(
        1.0,
        smoothstep(0.42, 0.05, barDist) * 0.82 + innerHalo * 0.44
      );
      cr = mix(cr, 0.94, coreWarmMix);
      cg = mix(cg, 0.95, coreWarmMix);
      cb = mix(cb, 1.00, coreWarmMix);

      const nucMix = Math.min(1.0, nucleus * 1.28 + barGlow * 0.66);
      cr = mix(cr, 1.00, nucMix);
      cg = mix(cg, 0.985, nucMix);
      cb = mix(cb, 0.965, nucMix);

      const nebAlpha = Math.min(
        0.42,
        nucleus * 0.32 +
          barGlow * 0.22 +
          innerHalo * 0.11 +
          litArms * 0.33 +
          nebulaKnot * 0.10
      );

      nd[idx] = Math.round(Math.min(1, cr) * 255);
      nd[idx + 1] = Math.round(Math.min(1, cg) * 255);
      nd[idx + 2] = Math.round(Math.min(1, cb) * 255);
      nd[idx + 3] = Math.round(Math.min(1, nebAlpha) * 255);

      // Deep midnight-obsidian interstellar dust lane alpha
      const shadowAlpha = Math.min(0.48, shadowLane * (0.32 + 0.28 * cloudMacro));
      sd[idx] = 2;
      sd[idx + 1] = 4;
      sd[idx + 2] = 12;
      sd[idx + 3] = Math.round(Math.min(1, shadowAlpha) * 255);
    }
  }

  nebCtx.putImageData(nebImg, 0, 0);
  shdCtx.putImageData(shdImg, 0, 0);

  const nebulaTexture = new THREE.CanvasTexture(nebCanvas);
  nebulaTexture.colorSpace = THREE.SRGBColorSpace;
  nebulaTexture.minFilter = THREE.LinearMipmapLinearFilter;
  nebulaTexture.magFilter = THREE.LinearFilter;
  nebulaTexture.generateMipmaps = true;
  nebulaTexture.anisotropy = Math.min(maxAnisotropy, 8);
  nebulaTexture.needsUpdate = true;

  const shadowTexture = new THREE.CanvasTexture(shdCanvas);
  shadowTexture.colorSpace = THREE.SRGBColorSpace;
  shadowTexture.minFilter = THREE.LinearMipmapLinearFilter;
  shadowTexture.magFilter = THREE.LinearFilter;
  shadowTexture.generateMipmaps = true;
  shadowTexture.anisotropy = Math.min(maxAnisotropy, 8);
  shadowTexture.needsUpdate = true;

  return { nebulaTexture, shadowTexture };
}

// ============================================================================
// VOLUMETRIC DISK SHADERS (Synced 1:1 with particle kinematics)
// Supports multi-slice 3D disk thickness via uZOffset & uSliceSpread
// ============================================================================
const DISK_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uReducedMotion;
  uniform float uAspect;
  uniform float uZOffset;
  uniform float uScaleMult;

  varying vec2 vGalUv;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;

    vec3 galPos = vec3(position.x * uScaleMult, uZOffset, position.y * uScaleMult);

    float pitchX = 0.88 - sin(s * 3.14159) * 0.40 + s * 0.10;
    float bankZ  = -0.32 + s * 0.58 + sin(t * 0.08) * 0.025;

    float cx = cos(pitchX), sx = sin(pitchX);
    vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

    float cz = cos(bankZ), sz = sin(bankZ);
    vec3 worldPos = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

    worldPos.x += 0.15 - sin(s * 3.4) * 1.45;
    worldPos.y += 0.05 + cos(s * 2.8) * 0.72 - s * 0.35;
    worldPos.z -= 1.0 + sin(s * 2.4) * 0.9;

    float galSpan = mix(15.4, 21.0, clamp(uAspect - 0.7, 0.0, 1.0));
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
  uniform float uLayerGain;
  uniform float uSpinSpeed;
  uniform float uMaxRadius;

  varying vec2 vGalUv;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * uSpinSpeed * motion;
    float spin = t + uScrollProgress * 2.55;

    float cs = cos(spin), sn = sin(spin);
    vec2 g = vec2(vGalUv.x * cs - vGalUv.y * sn, vGalUv.x * sn + vGalUv.y * cs);
    g += uPointer * 0.012;

    float r = length(g);
    if (r > uMaxRadius) discard;

    vec2 texUv = (g / 1.06) * 0.5 + 0.5;
    vec4 neb = texture2D(uDiskMap, texUv);

    // Subtle organic chromatic shimmer across spiral arms
    float angle = atan(g.y, g.x);
    float phase = fract(uTime * 0.032 * motion + r * 0.28 + angle * 0.05);
    vec3 colDeepBlue = vec3(0.15, 0.42, 0.96);
    vec3 colViolet   = vec3(0.56, 0.32, 0.96);
    vec3 colCyan     = vec3(0.18, 0.86, 0.98);
    vec3 livingHue = phase < 0.3333
      ? mix(colDeepBlue, colViolet, smoothstep(0.0, 0.3333, phase))
      : phase < 0.6667
        ? mix(colViolet, colCyan, smoothstep(0.3333, 0.6667, phase))
        : mix(colCyan, colDeepBlue, smoothstep(0.6667, 1.0, phase));
    float armMask = smoothstep(0.16, 0.62, r);
    vec3 shiftedRgb = mix(neb.rgb, livingHue, armMask * 0.20);

    float radialMask = smoothstep(uMaxRadius, uMaxRadius * 0.60, r);
    float scrollAtten = mix(1.0, 0.78, smoothstep(0.08, 0.45, uScrollProgress));
    float breath = 0.965 + 0.035 * sin(uTime * 0.52 * motion + r * 4.2);
    float alpha = neb.a * radialMask * scrollAtten * uOpacity * breath * uLayerGain;

    if (alpha < 0.003) discard;
    gl_FragColor = vec4(shiftedRgb, clamp(alpha, 0.0, 0.38));
  }
`;

const SHADOW_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uShadowMap;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScrollProgress;
  uniform float uReducedMotion;
  uniform vec2 uPointer;

  varying vec2 vGalUv;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * 0.026 * motion;
    float spin = t + uScrollProgress * 2.55;

    float cs = cos(spin), sn = sin(spin);
    vec2 g = vec2(vGalUv.x * cs - vGalUv.y * sn, vGalUv.x * sn + vGalUv.y * cs);
    g += uPointer * 0.014;

    float r = length(g);
    if (r > 1.04) discard;

    vec2 texUv = (g / 1.06) * 0.5 + 0.5;
    vec4 shd = texture2D(uShadowMap, texUv);

    float scrollAtten = mix(1.0, 0.82, smoothstep(0.12, 0.50, uScrollProgress));
    float alpha = shd.a * scrollAtten * uOpacity;

    if (alpha < 0.006) discard;
    gl_FragColor = vec4(shd.rgb, clamp(alpha, 0.0, 0.44));
  }
`;

// ============================================================================
// VOLUMETRIC 3D INTERSTELLAR DUST CLOUD SHADER ("Great Rift" & Bok Globules)
// Renders dark swirling molecular clouds in 3D space between mid-plane stars
// and foreground supergiants for genuine astronomical depth & occlusion
// ============================================================================
const DUST_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScrollProgress;
  uniform float uScrollVelocity;
  uniform float uAspect;
  uniform vec2 uPointer;
  uniform float uReducedMotion;

  attribute float aRadius;
  attribute float aAngle;
  attribute float aHeight;
  attribute float aSize;
  attribute float aAlpha;
  attribute float aSeed;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;
    float velKick = clamp(uScrollVelocity * 0.004, -0.45, 0.45) * motion;

    float r = aRadius;
    float orbitalRate = (0.032 / (0.26 + r * 0.95)) * motion;
    float scrollSpin = s * (2.55 + (1.0 - min(r, 1.0)) * 0.92) + velKick * 0.72;
    float theta = aAngle + t * orbitalRate + scrollSpin;

    float galSpan = mix(15.4, 21.0, clamp(uAspect - 0.7, 0.0, 1.0));
    float rWorld = r * galSpan;
    float warp = sin(theta * 2.0 + rWorld * 0.18 - t * 0.12) * 0.34 * smoothstep(5.5, 16.5, rWorld);

    vec3 galPos = vec3(cos(theta) * rWorld, aHeight + warp, sin(theta) * rWorld);

    float pitchX = 0.88 - sin(s * 3.14159) * 0.40 + s * 0.10;
    float bankZ  = -0.32 + s * 0.58 + sin(t * 0.08) * 0.025;

    float cx = cos(pitchX), sx = sin(pitchX);
    vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

    float cz = cos(bankZ), sz = sin(bankZ);
    vec3 p = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

    p.x += 0.15 - sin(s * 3.4) * 1.45 - uPointer.x * 0.08;
    p.y += 0.05 + cos(s * 2.8) * 0.72 - s * 0.35 - uPointer.y * 0.05;
    p.z -= 1.0 + sin(s * 2.4) * 0.9;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float perspectiveScale = 23.5 / max(-mvPosition.z, 3.0);
    gl_PointSize = clamp(aSize * perspectiveScale * uPixelRatio, 5.0 * uPixelRatio, 32.0 * uPixelRatio);

    float scrollAtten = mix(1.0, 0.80, smoothstep(0.12, 0.48, uScrollProgress));
    vAlpha = aAlpha * scrollAtten;
    vSeed = aSeed;
  }
`;

const DUST_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    // Rotate sprite per-cloud so dark clouds never repeat same orientation
    float ang = vSeed * 6.28318;
    float cs = cos(ang), sn = sin(ang);
    vec2 ruv = vec2(uv.x * cs - uv.y * sn, uv.x * sn + uv.y * cs);
    // Elongate slightly along filament axis
    ruv.y *= 1.35;

    float r2 = dot(ruv, ruv) * 4.0;
    if (r2 > 1.0) discard;

    float wispPattern = 0.58 + 0.42 * sin(ruv.x * 7.2 + vSeed * 19.0) * cos(ruv.y * 8.4 - vSeed * 13.0);
    float radial = pow(1.0 - r2, 1.9);
    float wisp = radial * (0.48 + 0.62 * wispPattern);
    float alpha = clamp(wisp * vAlpha * uOpacity, 0.0, 0.44);
    if (alpha < 0.005) discard;

    // Deep obsidian-midnight molecular cloud hue
    gl_FragColor = vec4(0.012, 0.020, 0.052, alpha);
  }
`;

// ============================================================================
// CRISP 3D PARTICLE STARFIELD, H-II NEBULA CLOUDS, CLUSTERS & JEWEL STARS
// - Sub-pixel area fade eliminates scintillation shimmer
// - Astronomical Moffat stellar PSF + diagonal Hubble diffraction spikes
// - Interactive cursor parallax & subtle click luminosity wave
// ============================================================================
const GALAXY_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPointScale;
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
  attribute float aKind; // 0: cosmic stardust, 1: pinpoint spiral/core star, 2: H-II ionized cloud / cluster glow, 3: deep night-sky jewel star

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

    if (aKind < 2.5) {
      float r = aRadius;
      float orbitalRate = (0.032 / (0.26 + r * 0.95)) * motion;
      float scrollSpin = s * (2.55 + (1.0 - min(r, 1.0)) * 0.92) + velKick * 0.72;
      float theta = aAngle + t * orbitalRate + scrollSpin;

      float galSpan = mix(15.4, 21.0, clamp(uAspect - 0.7, 0.0, 1.0));
      float rWorld = r * galSpan;
      float xPlane = cos(theta) * rWorld;
      float zPlane = sin(theta) * rWorld;

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

      p.x += 0.15 - sin(s * 3.4) * 1.45 - uPointer.x * 0.10;
      p.y += 0.05 + cos(s * 2.8) * 0.72 - s * 0.35 - uPointer.y * 0.06;
      p.z -= 1.0 + sin(s * 2.4) * 0.9;
    } else {
      // Deep sky & foreground parallax jewel stars
      p = position;
      float depthFactor = smoothstep(-20.0, 6.0, position.z);
      p.x += sin(t * 0.035 + aAngle) * 0.20 - sin(s * 3.14159) * 2.0 - uPointer.x * (0.08 + depthFactor * 0.22);
      p.y += cos(t * 0.032 + aHeight * 6.0) * 0.16 - s * 3.1 - uPointer.y * (0.05 + depthFactor * 0.14);
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
    float centerFloor = mix(0.98, 0.62, readDim);
    float centerBalance = mix(centerFloor, 1.0, smoothstep(0.08, 0.72, centerDist));

    // Gentle expanding cosmic ripple on click
    float rippleGlow = 0.0;
    if (uClickAge < 2.2) {
      float waveR = uClickAge * 0.85;
      float dClick = length((ndcPos - uClickOrigin) * vec2(uAspect, 1.0));
      float waveBand = exp(-pow((dClick - waveR) * 5.2, 2.0));
      float waveFade = exp(-uClickAge * 1.55);
      rippleGlow = waveBand * waveFade * 0.34 * mix(1.0, 0.15, uReducedMotion);
    }

    // Gentle pointer resonance near cursor
    float cursorDist = length((ndcPos - uPointer) * vec2(uAspect, 1.0));
    float cursorHalo = exp(-cursorDist * cursorDist * 14.0) * min(uPointerEnergy, 1.0) * 0.18;

    float twinkle = 0.84 + 0.16 * sin(t * (1.05 + aAlpha * 2.4) + aAngle * 23.1 + aRadius * 43.0);
    float perspectiveScale = 23.0 / max(-mvPosition.z, 3.0);

    float interactiveScale = 1.0 + rocketGlow * 0.8 + abs(velKick) * 0.14 + rippleGlow * 0.45 + cursorHalo * 0.35;
    float rawPtSize = aSize * uPointScale * perspectiveScale * uPixelRatio * interactiveScale;

    // Smooth energy-conserving sub-pixel fade (zero shimmer aliasing when tiny stars drift)
    float minRenderPx = (aKind > 1.5 && aKind < 2.5 ? 2.4 : 1.35) * uPixelRatio;
    float maxRenderPx = (aKind > 1.5 && aKind < 2.5 ? 12.0 : 10.5) * uPixelRatio;
    float subpixelFade = rawPtSize < minRenderPx ? clamp(rawPtSize / minRenderPx, 0.14, 1.0) : 1.0;
    gl_PointSize = clamp(rawPtSize, minRenderPx, maxRenderPx);

    // Living cool-cosmic spectral shift (deep blue -> violet -> cyan)
    float colorCycle = fract(t * 0.042 + aAngle * 0.08 + max(aRadius, 0.0) * 0.34);
    vec3 colDeepBlue = vec3(0.16, 0.42, 0.96);
    vec3 colViolet   = vec3(0.56, 0.32, 0.96);
    vec3 colCyan     = vec3(0.18, 0.86, 0.98);
    vec3 cycleColor = colorCycle < 0.3333
      ? mix(colDeepBlue, colViolet, smoothstep(0.0, 0.3333, colorCycle))
      : colorCycle < 0.6667
        ? mix(colViolet, colCyan, smoothstep(0.3333, 0.6667, colorCycle))
        : mix(colCyan, colDeepBlue, smoothstep(0.6667, 1.0, colorCycle));

    float outerMask = aKind > 2.5 ? 0.65 : smoothstep(0.10, 0.42, aRadius);
    float kindWeight = aKind < 0.5 ? 0.36 : aKind < 1.5 ? 0.22 : aKind < 2.5 ? 0.28 : 0.22;
    float shiftAmt = outerMask * kindWeight * mix(1.0, 0.25, uReducedMotion);

    vColor = mix(aColor, cycleColor, shiftAmt);
    vAlpha = clamp(
      (aAlpha * centerBalance * subpixelFade + rocketGlow * 0.48 + rippleGlow * aAlpha + cursorHalo * 0.25) * uGlowIntensity,
      0.0,
      1.0
    );
    vKind = aKind;
    vTwinkle = twinkle;
    vBoost = rocketGlow + rippleGlow * 0.6 + cursorHalo * 0.5;
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

    float edgeFade = smoothstep(1.0, 0.72, r2);
    vec3 col = mix(vColor, uSectionAccent, clamp(vBoost * 0.24, 0.0, 0.36));
    float intensity = 0.0;

    if (vKind < 0.5) {
      // Kind 0: Velvet micro-resolved cosmic stardust
      float moffat = pow(1.0 + r2 * 4.2, -2.0);
      intensity = moffat * edgeFade * 0.88;
    } else if (vKind < 1.5) {
      // Kind 1: Moffat Optical PSF Stars (incandescent core + soft wing + diagonal supergiant spikes)
      float core = pow(1.0 + r2 * 22.0, -2.5);
      float halo = pow(1.0 + r2 * 4.0, -1.9) * 0.36;
      float isSupergiant = smoothstep(0.66, 0.96, vAlpha);
      // 22-degree optical diffraction cross feels natural and non-UI
      vec2 ruv = vec2(uv.x * 0.927 - uv.y * 0.375, uv.x * 0.375 + uv.y * 0.927);
      float spikeX = exp(-abs(ruv.y) * 36.0) * exp(-abs(ruv.x) * 5.0);
      float spikeY = exp(-abs(ruv.x) * 36.0) * exp(-abs(ruv.y) * 5.0);
      float spikes = (spikeX + spikeY) * 0.36 * isSupergiant;
      intensity = (core + halo + spikes) * edgeFade * vTwinkle;
      col = mix(col, vec3(0.99, 0.995, 1.0), clamp(core * 0.88 + spikes * 0.42, 0.0, 0.96));
    } else if (vKind < 2.5) {
      // Kind 2: Soft ionized H-II & violet-cyan star-cluster nebula puff
      float core = pow(1.0 + r2 * 10.0, -2.1);
      float glow = pow(1.0 + r2 * 2.8, -1.7) * 0.52;
      intensity = (core * 0.58 + glow) * edgeFade * vTwinkle;
      col = mix(col, vec3(0.96, 0.96, 1.0), clamp(core * 0.48, 0.0, 0.68));
    } else {
      // Kind 3: Deep Night-Sky & 1st-Magnitude Hubble Diffraction Jewel Stars
      float core = pow(1.0 + r2 * 24.0, -2.6);
      float halo = pow(1.0 + r2 * 3.6, -1.8) * 0.34;
      float isBright = smoothstep(0.46, 0.88, vAlpha);
      vec2 ruv = vec2(uv.x * 0.927 - uv.y * 0.375, uv.x * 0.375 + uv.y * 0.927);
      float spikeX = exp(-abs(ruv.y) * 38.0) * exp(-abs(ruv.x) * 4.4);
      float spikeY = exp(-abs(ruv.x) * 38.0) * exp(-abs(ruv.y) * 4.4);
      float spikes = (spikeX + spikeY) * 0.64 * isBright * vTwinkle;
      intensity = (core + halo + spikes) * edgeFade;
      col = mix(col, vec3(0.99, 0.995, 1.0), clamp(core * 0.92 + spikes * 0.54, 0.0, 0.98));
    }

    float finalAlpha = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
    if (finalAlpha < 0.004) discard;

    gl_FragColor = vec4(col, finalAlpha);
  }
`;

export const MilkyWayGalaxy: React.FC<MilkyWayGalaxyProps> = ({
  opacity = 0.98,
  glowIntensity = 1.32,
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
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 720;
    const isSmallMobile = width < 640;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const cpuCores =
      typeof navigator !== 'undefined' && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 8;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 160);
    camera.position.set(0, 0, 11.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl && !isMobile,
        powerPreference: 'high-performance',
        stencil: false,
        depth: false,
      });
    } catch {
      return;
    }

    const getEffectivePixelRatio = () =>
      isSoftwareGl
        ? 1
        : isMobile
        ? Math.min(window.devicePixelRatio || 1, 1.25)
        : Math.min(window.devicePixelRatio || 1, 1.45);

    const pixelRatio = getEffectivePixelRatio();
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

    // Pre-bake mipmapped 768x768 galactic spiral nebula & interstellar dust shadow lanes
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const { nebulaTexture, shadowTexture } = createGalacticDiskTextures(maxAnisotropy);

    const diskGeo = new THREE.PlaneGeometry(43, 43);
    const innerHaloGeo = new THREE.PlaneGeometry(28, 28);

    // Layer 1: Compact inner core volumetric halo slab (adds 3D thickness without full-screen overdraw)
    const nebulaBackMat = new THREE.ShaderMaterial({
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
        uZOffset: { value: -0.20 },
        uScaleMult: { value: 1.03 },
        uLayerGain: { value: 0.42 },
        uSpinSpeed: { value: 0.025 },
        uMaxRadius: { value: 0.64 },
      },
    });
    const nebulaBackMesh = new THREE.Mesh(innerHaloGeo, nebulaBackMat);
    nebulaBackMesh.frustumCulled = false;
    nebulaBackMesh.renderOrder = 1;
    scene.add(nebulaBackMesh);

    // Layer 2: Primary crisp spiral nebula & bulge emission
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
        uScaleMult: { value: 1.0 },
        uLayerGain: { value: 0.92 },
        uSpinSpeed: { value: 0.026 },
        uMaxRadius: { value: 1.05 },
      },
    });
    const nebulaMesh = new THREE.Mesh(diskGeo, nebulaMat);
    nebulaMesh.frustumCulled = false;
    nebulaMesh.renderOrder = 2;
    scene.add(nebulaMesh);

    // Layer 3: Sculpted obsidian-indigo interstellar dust rift veins
    const shadowMat = new THREE.ShaderMaterial({
      vertexShader: DISK_VERTEX_SHADER,
      fragmentShader: SHADOW_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uShadowMap: { value: shadowTexture },
        uTime: { value: 0 },
        uOpacity: { value: opacityRef.current },
        uScrollProgress: { value: 0 },
        uReducedMotion: { value: stateRef.current.prefersReduced ? 1 : 0 },
        uAspect: { value: width / height },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uZOffset: { value: 0.04 },
        uScaleMult: { value: 1.0 },
      },
    });
    const shadowMesh = new THREE.Mesh(diskGeo, shadowMat);
    shadowMesh.frustumCulled = false;
    shadowMesh.renderOrder = 3;
    scene.add(shadowMesh);

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

    const particleCount = isSmallMobile
      ? 22000
      : isMobile
      ? 26000
      : isTablet
      ? 34000
      : cpuCores <= 4
      ? 38000
      : 44000;

    // Partition cleanly: deep/mid disk stars (rendered behind volumetric dust clouds)
    // vs elevated foreground stars, OB supergiants, & sky jewels (rendered in front of dust)
    const foregroundCount = Math.floor(particleCount * 0.14);
    const mainCount = particleCount - foregroundCount;
    const dustCloudCount = isSmallMobile ? 160 : isMobile ? 200 : isTablet ? 260 : 320;

    const allocStarBuffers = (count: number) => ({
      positions: new Float32Array(count * 3),
      aColor: new Float32Array(count * 3),
      aRadius: new Float32Array(count),
      aAngle: new Float32Array(count),
      aHeight: new Float32Array(count),
      aSize: new Float32Array(count),
      aAlpha: new Float32Array(count),
      aKind: new Float32Array(count),
    });

    const mainBuf = allocStarBuffers(mainCount);
    const fgBuf = allocStarBuffers(foregroundCount);

    // Palette: pearl-ivory nucleus -> diamond white -> ice cyan -> sapphire -> deep indigo -> violet + H-II rose
    const colPearlIvory = new THREE.Color(0xfff6ea);
    const colPureWhite = new THREE.Color(0xffffff);
    const colIceWhite = new THREE.Color(0xeaf5ff);
    const colSkyIce = new THREE.Color(0xbce7ff);
    const colCyanBright = new THREE.Color(0x52d6ff);
    const colOTypeBlue = new THREE.Color(0x7cc4ff);
    const colSapphire = new THREE.Color(0x3f7ef5);
    const colDeepIndigo = new THREE.Color(0x4648d6);
    const colShadowNavy = new THREE.Color(0x22337c);
    const colVioletGlow = new THREE.Color(0x9a6bff);
    const colH2Rose = new THREE.Color(0xd946ef);
    const tmpCol = new THREE.Color();

    const tightness = 3.32;

    const globularClusters = Array.from({ length: 12 }, () => ({
      r: 0.14 + rand() * 0.56,
      angle: rand() * Math.PI * 2,
      height: (rand() < 0.5 ? -1 : 1) * (0.58 + rand() * 1.4),
    }));

    // 1. Populate Deep/Mid Galactic Disk, Core Bulge, Clusters & Cosmic Dust
    for (let i = 0; i < mainCount; i++) {
      const i3 = i * 3;
      const roll = rand();

      if (roll < 0.21) {
        // A. Luminous Pearl-Ivory to Ice-White Galactic Core & Bar
        const rRaw = Math.pow(rand(), 2.15) * 0.30;
        const theta = rand() * Math.PI * 2;
        const bx = Math.cos(theta) * rRaw * 1.54;
        const bz = Math.sin(theta) * rRaw * 0.68;
        const rotB = 0.44;
        const gx = bx * Math.cos(rotB) - bz * Math.sin(rotB);
        const gz = bx * Math.sin(rotB) + bz * Math.cos(rotB);

        const rBar = Math.hypot(gx, gz);
        const aBar = Math.atan2(gz, gx);

        mainBuf.aRadius[i] = rBar;
        mainBuf.aAngle[i] = aBar;
        mainBuf.aHeight[i] = randGauss() * (0.68 * Math.exp(-rBar * 4.4) + 0.055);

        const subRoll = rand();
        if (subRoll < 0.64) {
          mainBuf.aKind[i] = 0;
          mainBuf.aSize[i] = 0.38 + rand() * 0.48;
          mainBuf.aAlpha[i] = 0.18 + (1 - Math.min(rBar / 0.30, 1)) * 0.28;
        } else {
          mainBuf.aKind[i] = 1;
          const mag = Math.pow(rand(), 2.25);
          mainBuf.aSize[i] = 0.58 + mag * 1.36;
          mainBuf.aAlpha[i] = 0.44 + mag * 0.52;
        }

        const coreT = Math.min(rBar / 0.28, 1.0);
        tmpCol.copy(colPearlIvory).lerp(colPureWhite, Math.min(1, coreT * 1.2));
        tmpCol.lerp(colSkyIce, Math.pow(coreT, 0.72));
        if (rand() < 0.24) tmpCol.lerp(colCyanBright, 0.28);
        mainBuf.aColor[i3] = tmpCol.r;
        mainBuf.aColor[i3 + 1] = tmpCol.g;
        mainBuf.aColor[i3 + 2] = tmpCol.b;
      } else if (roll < 0.91) {
        // B. Grand 4-Arm Logarithmic Spiral Disk + H-II Emission Pockets
        let r = 0.08;
        let angle = 0;
        let isPrimary = true;
        let cloudDensity = 0.65;
        let shockOffset = 0;

        for (let attempt = 0; attempt < 3; attempt++) {
          r = 0.08 + Math.pow(rand(), 0.85) * 1.04;
          isPrimary = rand() < 0.66;
          const armIdx = (i + attempt) % 2;
          const baseAngle =
            (armIdx / 2) * Math.PI * 2 + (isPrimary ? 0 : Math.PI * 0.5);

          const spiralTwist = Math.log(1.0 + r * 5.3) * tightness;
          const gRaw = randGauss();
          const armSpread = (isPrimary ? 0.105 : 0.145) + r * 0.138;
          const asymSpread =
            gRaw < 0 ? gRaw * armSpread * 0.68 : gRaw * armSpread * 1.30;
          const isSpur = rand() < 0.19;
          const spurAngle = isSpur ? (rand() - 0.35) * 0.62 : 0;

          shockOffset = asymSpread;
          angle = baseAngle + spiralTwist + asymSpread + spurAngle;

          const nx = Math.cos(angle) * r * 3.8;
          const nz = Math.sin(angle) * r * 3.8;
          cloudDensity = fbm2D(nx + 10.2, nz + 5.7, 3);
          if (cloudDensity > 0.28 || attempt === 2) break;
        }

        mainBuf.aRadius[i] = r;
        mainBuf.aAngle[i] = angle;
        mainBuf.aHeight[i] = randGauss() * (0.068 + 0.175 * r);

        const isNearShock =
          Math.abs(shockOffset) < 0.085 && r > 0.18 && r < 0.88;
        const isShadowTrough =
          shockOffset < -0.055 && r > 0.12 && r < 0.74;
        const isClusterPocket =
          isNearShock && cloudDensity > 0.55 && rand() < 0.22;
        const armWeight = isPrimary ? 1.0 : 0.72;

        const subRoll = rand();
        if (isClusterPocket && subRoll < 0.34) {
          mainBuf.aKind[i] = 2;
          mainBuf.aSize[i] = 0.90 + rand() * 1.05;
          mainBuf.aAlpha[i] = (0.12 + cloudDensity * 0.14) * armWeight;
          if (rand() < 0.28) {
            tmpCol.copy(colH2Rose).lerp(colVioletGlow, 0.45 + rand() * 0.35);
          } else {
            tmpCol.copy(colVioletGlow).lerp(colCyanBright, rand() * 0.55);
          }
        } else if (subRoll < 0.62) {
          mainBuf.aKind[i] = 0;
          mainBuf.aSize[i] = 0.38 + rand() * 0.52;
          mainBuf.aAlpha[i] = (0.19 + cloudDensity * 0.26) * armWeight;
          if (r < 0.30) {
            tmpCol.copy(colIceWhite).lerp(colSkyIce, rand() * 0.65);
          } else if (rand() < 0.38) {
            tmpCol.copy(colSapphire).lerp(colVioletGlow, rand() * 0.55);
          } else {
            tmpCol.copy(colSkyIce).lerp(colCyanBright, rand() * 0.55);
          }
        } else {
          mainBuf.aKind[i] = 1;
          const mag = Math.pow(rand(), 2.35);
          mainBuf.aSize[i] = 0.55 + mag * 1.72;
          mainBuf.aAlpha[i] = (0.44 + mag * 0.54) * armWeight;

          if (isNearShock && rand() < 0.64) {
            tmpCol.copy(colCyanBright).lerp(colIceWhite, rand() * 0.65);
          } else if (r < 0.34) {
            tmpCol.copy(colPureWhite).lerp(colSkyIce, rand() * 0.55);
          } else {
            const temp = rand();
            if (temp < 0.42) {
              tmpCol.copy(colIceWhite).lerp(colOTypeBlue, rand() * 0.55);
            } else if (temp < 0.74) {
              tmpCol.copy(colOTypeBlue).lerp(colSapphire, rand() * 0.55);
            } else {
              tmpCol.copy(colDeepIndigo).lerp(colVioletGlow, rand() * 0.65);
            }
          }
        }

        // Dust trough extinction dims stars behind dense molecular arms
        if (isShadowTrough && !isClusterPocket && rand() < 0.52) {
          tmpCol.lerp(colShadowNavy, 0.42);
          mainBuf.aAlpha[i] *= 0.70;
        }

        mainBuf.aColor[i3] = tmpCol.r;
        mainBuf.aColor[i3 + 1] = tmpCol.g;
        mainBuf.aColor[i3 + 2] = tmpCol.b;
      } else {
        // C. 3D Galactic Halo & Orbiting Globular Clusters
        const inCluster = rand() < 0.54;
        if (inCluster) {
          const cl = globularClusters[i % globularClusters.length];
          mainBuf.aRadius[i] = Math.max(0.05, cl.r + randGauss() * 0.016);
          mainBuf.aAngle[i] = cl.angle + randGauss() * 0.04;
          mainBuf.aHeight[i] = cl.height + randGauss() * 0.13;
          mainBuf.aKind[i] = 1;
          mainBuf.aSize[i] = 0.48 + rand() * 0.72;
          mainBuf.aAlpha[i] = 0.34 + rand() * 0.48;
          tmpCol.copy(colPearlIvory).lerp(colSkyIce, 0.40 + rand() * 0.4);
        } else {
          mainBuf.aRadius[i] = 0.12 + Math.pow(rand(), 0.7) * 0.98;
          mainBuf.aAngle[i] = rand() * Math.PI * 2;
          mainBuf.aHeight[i] = randGauss() * 1.65;
          mainBuf.aKind[i] = 1;
          mainBuf.aSize[i] = 0.42 + rand() * 0.62;
          mainBuf.aAlpha[i] = 0.22 + rand() * 0.36;
          tmpCol.copy(colIceWhite).lerp(colOTypeBlue, rand() * 0.55);
        }
        mainBuf.aColor[i3] = tmpCol.r;
        mainBuf.aColor[i3 + 1] = tmpCol.g;
        mainBuf.aColor[i3 + 2] = tmpCol.b;
      }
    }

    // 2. Populate Volumetric 3D Dark Interstellar Dust Rift Clouds (Great Rift & inner arm shock rifts)
    const dustPos = new Float32Array(dustCloudCount * 3);
    const dustRadius = new Float32Array(dustCloudCount);
    const dustAngle = new Float32Array(dustCloudCount);
    const dustHeight = new Float32Array(dustCloudCount);
    const dustSize = new Float32Array(dustCloudCount);
    const dustAlpha = new Float32Array(dustCloudCount);
    const dustSeed = new Float32Array(dustCloudCount);

    for (let i = 0; i < dustCloudCount; i++) {
      const r = 0.10 + Math.pow(rand(), 0.9) * 0.78;
      const isPrimary = rand() < 0.72;
      const armIdx = i % 2;
      const baseAngle =
        (armIdx / 2) * Math.PI * 2 + (isPrimary ? 0 : Math.PI * 0.5);
      const spiralTwist = Math.log(1.0 + r * 5.3) * tightness;
      // Sit right along the inner concave dust shock lane (-0.22 rad)
      const angle = baseAngle + spiralTwist - 0.22 + randGauss() * 0.085;

      dustRadius[i] = r;
      dustAngle[i] = angle;
      dustHeight[i] = 0.05 + randGauss() * 0.085;
      dustSize[i] = 2.6 + rand() * 3.8;
      dustAlpha[i] = (0.20 + rand() * 0.22) * (1.0 - smoothstep(0.60, 0.88, r));
      dustSeed[i] = rand();
    }

    // 3. Populate Elevated Foreground Supergiants & Deep-Sky Hubble Jewel Stars (render cleanly above dust)
    for (let i = 0; i < foregroundCount; i++) {
      const i3 = i * 3;
      const isDeepSky = rand() < 0.68;

      if (isDeepSky) {
        fgBuf.aKind[i] = 3;
        fgBuf.positions[i3] = (rand() - 0.5) * 54.0;
        fgBuf.positions[i3 + 1] = (rand() - 0.5) * 34.0;
        fgBuf.positions[i3 + 2] = -20.0 + rand() * 24.5;

        fgBuf.aRadius[i] = -1.0;
        fgBuf.aAngle[i] = rand() * Math.PI * 2;
        fgBuf.aHeight[i] = rand();

        const isJewel = rand() < 0.11;
        fgBuf.aSize[i] = isJewel ? 1.42 + rand() * 1.55 : 0.40 + rand() * 0.64;
        fgBuf.aAlpha[i] = isJewel ? 0.70 + rand() * 0.30 : 0.18 + rand() * 0.36;

        const skyTemp = rand();
        if (skyTemp < 0.52) {
          tmpCol.copy(colPureWhite).lerp(colOTypeBlue, rand() * 0.45);
        } else if (skyTemp < 0.82) {
          tmpCol.copy(colIceWhite).lerp(colCyanBright, rand() * 0.45);
        } else {
          tmpCol.copy(colOTypeBlue).lerp(colVioletGlow, rand() * 0.45);
        }
      } else {
        // Elevated OB supergiants riding above the dust plane along spiral arms
        const r = 0.14 + Math.pow(rand(), 0.85) * 0.84;
        const armIdx = i % 2;
        const isPrimary = rand() < 0.68;
        const baseAngle =
          (armIdx / 2) * Math.PI * 2 + (isPrimary ? 0 : Math.PI * 0.5);
        const angle = baseAngle + Math.log(1.0 + r * 5.3) * tightness + randGauss() * 0.09;

        fgBuf.aKind[i] = 1;
        fgBuf.aRadius[i] = r;
        fgBuf.aAngle[i] = angle;
        fgBuf.aHeight[i] = 0.12 + Math.abs(randGauss()) * 0.20;
        const mag = Math.pow(rand(), 1.9);
        fgBuf.aSize[i] = 0.72 + mag * 1.45;
        fgBuf.aAlpha[i] = 0.52 + mag * 0.48;
        tmpCol.copy(colPureWhite).lerp(colCyanBright, rand() * 0.55);
      }

      fgBuf.aColor[i3] = tmpCol.r;
      fgBuf.aColor[i3 + 1] = tmpCol.g;
      fgBuf.aColor[i3 + 2] = tmpCol.b;
    }

    const buildStarGeometry = (buf: ReturnType<typeof allocStarBuffers>) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(buf.positions, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(buf.aColor, 3));
      geo.setAttribute('aRadius', new THREE.BufferAttribute(buf.aRadius, 1));
      geo.setAttribute('aAngle', new THREE.BufferAttribute(buf.aAngle, 1));
      geo.setAttribute('aHeight', new THREE.BufferAttribute(buf.aHeight, 1));
      geo.setAttribute('aSize', new THREE.BufferAttribute(buf.aSize, 1));
      geo.setAttribute('aAlpha', new THREE.BufferAttribute(buf.aAlpha, 1));
      geo.setAttribute('aKind', new THREE.BufferAttribute(buf.aKind, 1));
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 80);
      return geo;
    };

    const mainGeometry = buildStarGeometry(mainBuf);
    const fgGeometry = buildStarGeometry(fgBuf);

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    dustGeometry.setAttribute('aRadius', new THREE.BufferAttribute(dustRadius, 1));
    dustGeometry.setAttribute('aAngle', new THREE.BufferAttribute(dustAngle, 1));
    dustGeometry.setAttribute('aHeight', new THREE.BufferAttribute(dustHeight, 1));
    dustGeometry.setAttribute('aSize', new THREE.BufferAttribute(dustSize, 1));
    dustGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(dustAlpha, 1));
    dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
    dustGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 80);

    const accentTarget = new THREE.Color(0x38bdf8);
    const accentCurrent = new THREE.Color(0x38bdf8);

    const pointScale = isMobile ? 1.15 : isTablet ? 1.06 : 1.0;

    const createStarUniforms = () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uPointScale: { value: pointScale },
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
    });

    const starMaterial = new THREE.ShaderMaterial({
      vertexShader: GALAXY_VERTEX_SHADER,
      fragmentShader: GALAXY_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: createStarUniforms(),
    });

    const dustMaterial = new THREE.ShaderMaterial({
      vertexShader: DUST_VERTEX_SHADER,
      fragmentShader: DUST_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uScrollProgress: { value: 0 },
        uScrollVelocity: { value: 0 },
        uAspect: { value: width / height },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uReducedMotion: { value: stateRef.current.prefersReduced ? 1 : 0 },
        uOpacity: { value: opacityRef.current },
      },
    });

    const mainPoints = new THREE.Points(mainGeometry, starMaterial);
    mainPoints.frustumCulled = false;
    mainPoints.renderOrder = 4;
    scene.add(mainPoints);

    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    dustPoints.frustumCulled = false;
    dustPoints.renderOrder = 5;
    scene.add(dustPoints);

    const fgPoints = new THREE.Points(fgGeometry, starMaterial);
    fgPoints.frustumCulled = false;
    fgPoints.renderOrder = 6;
    scene.add(fgPoints);

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
    let smoothedVelocity = 0;
    let frameId = 0;
    let isDisposed = false;
    let isContextLost = false;
    let lastTimestamp = performance.now();
    let elapsed = 0;

    const handleResize = () => {
      if (isDisposed) return;
      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 720;
      const pr = getEffectivePixelRatio();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h);
      starMaterial.uniforms.uPixelRatio.value = pr;
      dustMaterial.uniforms.uPixelRatio.value = pr;
      starMaterial.uniforms.uAspect.value = w / h;
      dustMaterial.uniforms.uAspect.value = w / h;
      nebulaBackMat.uniforms.uAspect.value = w / h;
      nebulaMat.uniforms.uAspect.value = w / h;
      shadowMat.uniforms.uAspect.value = w / h;
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
    };

    const handleContextRestored = () => {
      isContextLost = false;
    };

    let isTabHidden = typeof document !== 'undefined' ? document.hidden : false;
    const handleVisibilityChange = () => {
      isTabHidden = document.hidden;
      if (!isTabHidden) {
        lastTimestamp = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
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

      if (pausedRef.current || isContextLost || isTabHidden) {
        frameId = window.setTimeout(tick, isTabHidden ? 240 : 140);
        return;
      }

      elapsed += dt;
      interactionEngine.step();
      const s = stateRef.current;

      // Frame-rate independent exponential damping for silky motion at 60/120Hz
      smoothedPointerX = THREE.MathUtils.damp(smoothedPointerX, s.ndcX, 7.2, dt);
      smoothedPointerY = THREE.MathUtils.damp(smoothedPointerY, s.ndcY, 7.2, dt);
      smoothedScrollProgress = THREE.MathUtils.damp(
        smoothedScrollProgress,
        s.scrollProgress,
        5.2,
        dt
      );
      smoothedVelocity = THREE.MathUtils.damp(
        smoothedVelocity,
        s.smoothedScrollVelocity,
        6.8,
        dt
      );

      accentCurrent.lerp(accentTarget, 1 - Math.exp(-3.2 * dt));

      const clickAgeSec =
        s.lastClickTime > 0 ? (now - s.lastClickTime) / 1000 : 99;
      const reduced = s.prefersReduced ? 1 : 0;

      starMaterial.uniforms.uTime.value = elapsed;
      starMaterial.uniforms.uScrollProgress.value = smoothedScrollProgress;
      starMaterial.uniforms.uScrollVelocity.value = smoothedVelocity;
      starMaterial.uniforms.uPointer.value.set(smoothedPointerX, smoothedPointerY);
      starMaterial.uniforms.uPointerEnergy.value = s.normalizedEnergy;
      starMaterial.uniforms.uClickOrigin.value.set(clickNdcX, clickNdcY);
      starMaterial.uniforms.uClickAge.value = clickAgeSec;
      starMaterial.uniforms.uReducedMotion.value = reduced;
      starMaterial.uniforms.uGlowIntensity.value = glowRef.current;
      starMaterial.uniforms.uOpacity.value = opacityRef.current;
      starMaterial.uniforms.uRocketPos.value.copy(s.rocketEmitter.position);
      starMaterial.uniforms.uRocketActive.value = s.rocketEmitter.isActive ? 1.0 : 0.0;
      starMaterial.uniforms.uRocketWake.value = s.rocketEmitter.wakeIntensity;
      starMaterial.uniforms.uSectionAccent.value.copy(accentCurrent);

      dustMaterial.uniforms.uTime.value = elapsed;
      dustMaterial.uniforms.uScrollProgress.value = smoothedScrollProgress;
      dustMaterial.uniforms.uScrollVelocity.value = smoothedVelocity;
      dustMaterial.uniforms.uPointer.value.set(smoothedPointerX, smoothedPointerY);
      dustMaterial.uniforms.uReducedMotion.value = reduced;
      dustMaterial.uniforms.uOpacity.value = opacityRef.current;

      nebulaBackMat.uniforms.uTime.value = elapsed;
      nebulaBackMat.uniforms.uOpacity.value = opacityRef.current;
      nebulaBackMat.uniforms.uScrollProgress.value = smoothedScrollProgress;
      nebulaBackMat.uniforms.uReducedMotion.value = reduced;
      nebulaBackMat.uniforms.uPointer.value.set(smoothedPointerX, smoothedPointerY);

      nebulaMat.uniforms.uTime.value = elapsed;
      nebulaMat.uniforms.uOpacity.value = opacityRef.current;
      nebulaMat.uniforms.uScrollProgress.value = smoothedScrollProgress;
      nebulaMat.uniforms.uReducedMotion.value = reduced;
      nebulaMat.uniforms.uPointer.value.set(smoothedPointerX, smoothedPointerY);

      shadowMat.uniforms.uTime.value = elapsed;
      shadowMat.uniforms.uOpacity.value = opacityRef.current;
      shadowMat.uniforms.uScrollProgress.value = smoothedScrollProgress;
      shadowMat.uniforms.uReducedMotion.value = reduced;
      shadowMat.uniforms.uPointer.value.set(smoothedPointerX, smoothedPointerY);

      // Sweeping damped 3D orbital fly-through across the Milky Way
      const sp = smoothedScrollProgress;
      _camTarget.set(
        smoothedPointerX * 0.62 - Math.sin(sp * Math.PI * 1.4) * 2.15,
        smoothedPointerY * 0.36 + Math.sin(sp * Math.PI * 2.0) * 1.2 - sp * 0.35,
        11.4 - Math.sin(sp * Math.PI) * 1.65
      );
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camTarget.x, 7.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camTarget.y, 7.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camTarget.z, 7.5, dt);

      _lookTarget.set(-Math.sin(sp * 3.0) * 0.65, -sp * 0.38, -1.0);
      _lookCurrent.x = THREE.MathUtils.damp(_lookCurrent.x, _lookTarget.x, 7.5, dt);
      _lookCurrent.y = THREE.MathUtils.damp(_lookCurrent.y, _lookTarget.y, 7.5, dt);
      _lookCurrent.z = THREE.MathUtils.damp(_lookCurrent.z, _lookTarget.z, 7.5, dt);
      camera.lookAt(_lookCurrent);

      renderer.render(scene, camera);
      scheduleNext();
    };

    scheduleNext();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      scene.remove(nebulaBackMesh);
      scene.remove(nebulaMesh);
      scene.remove(shadowMesh);
      scene.remove(mainPoints);
      scene.remove(dustPoints);
      scene.remove(fgPoints);

      mainGeometry.dispose();
      fgGeometry.dispose();
      dustGeometry.dispose();
      starMaterial.dispose();
      dustMaterial.dispose();
      diskGeo.dispose();
      innerHaloGeo.dispose();
      nebulaBackMat.dispose();
      nebulaMat.dispose();
      shadowMat.dispose();
      nebulaTexture.dispose();
      shadowTexture.dispose();
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

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

// Deterministic 2D value noise + FBM for natural star-cluster clumping along spiral arms
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

function fbm2D(x: number, y: number, octaves = 3): number {
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

// ============================================================================
// PURE CRISP 3D PARTICLE MILKY WAY STARFIELD (ZERO SHADOW / HAZE OVERLAYS)
// Subtle living time-based chromatic transition: deep blue -> violet -> cyan
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
  attribute float aKind; // 0: crisp cosmic stardust, 1: pinpoint spiral/core star, 2: compact cluster sparkle, 3: deep night-sky jewel star

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
      // Differential Keplerian orbital drift (faster near core, serene at outer spiral rim)
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

      // Grand 3/4 oblique opening angle -> sweeps smoothly toward face-on spiral on scroll
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
    float centerFloor = mix(0.98, 0.60, readDim);
    float centerBalance = mix(centerFloor, 1.0, smoothstep(0.08, 0.72, centerDist));

    // Natural subtle stellar scintillation
    float twinkle = 0.82 + 0.18 * sin(t * (1.1 + aAlpha * 2.7) + aAngle * 23.1 + aRadius * 43.0);
    float perspectiveScale = 23.0 / max(-mvPosition.z, 3.0);

    float interactiveScale = 1.0 + rocketGlow * 0.8 + abs(velKick) * 0.16;
    float ptSize = aSize * perspectiveScale * uPixelRatio * interactiveScale;

    float minPt = aKind > 1.5 && aKind < 2.5 ? 1.8 * uPixelRatio : 1.0 * uPixelRatio;
    float maxPt = aKind > 1.5 && aKind < 2.5 ? 7.8 * uPixelRatio : 9.4 * uPixelRatio;
    gl_PointSize = clamp(ptSize, minPt, maxPt);

    boost = rocketGlow;

    // Subtle, living time-based chromatic transition: deep blue -> violet -> cyan
    float colorCycle = fract(t * 0.045 + aAngle * 0.08 + max(aRadius, 0.0) * 0.34);
    vec3 colDeepBlue = vec3(0.18, 0.44, 0.96);
    vec3 colViolet   = vec3(0.56, 0.34, 0.96);
    vec3 colCyan     = vec3(0.18, 0.85, 0.98);
    vec3 cycleColor = colorCycle < 0.3333
      ? mix(colDeepBlue, colViolet, smoothstep(0.0, 0.3333, colorCycle))
      : colorCycle < 0.6667
        ? mix(colViolet, colCyan, smoothstep(0.3333, 0.6667, colorCycle))
        : mix(colCyan, colDeepBlue, smoothstep(0.6667, 1.0, colorCycle));

    // Keep the galactic core luminous diamond-white while spiral arms & field stars breathe through blue/violet/cyan
    float outerMask = aKind > 2.5 ? 0.65 : smoothstep(0.10, 0.42, aRadius);
    float kindWeight = aKind < 0.5 ? 0.38 : aKind < 1.5 ? 0.24 : aKind < 2.5 ? 0.36 : 0.24;
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
      // Kind 0: Crisp fine resolved starlight dust
      float r = sqrt(r2);
      intensity = smoothstep(1.0, 0.06, r) * 0.88;
    } else if (vKind < 1.5) {
      // Kind 1: Optical Airy-Disk Stars (incandescent pure-white core + tight luminous halo + delicate spikes)
      float core = exp(-r2 * 26.0);
      float halo = exp(-r2 * 6.0) * 0.34;
      float isSupergiant = smoothstep(0.66, 0.96, vAlpha);
      float spikeX = exp(-abs(uv.y) * 34.0) * exp(-abs(uv.x) * 5.2);
      float spikeY = exp(-abs(uv.x) * 34.0) * exp(-abs(uv.y) * 5.2);
      float spikes = (spikeX + spikeY) * 0.34 * isSupergiant;
      intensity = (core + halo + spikes) * vTwinkle;
      col = mix(col, vec3(0.98, 0.995, 1.0), clamp(core * 0.86 + spikes * 0.38, 0.0, 0.95));
    } else if (vKind < 2.5) {
      // Kind 2: Tight crisp star-cluster accent glint (zero foggy smear)
      float core = exp(-r2 * 14.0);
      float glow = exp(-r2 * 5.6) * 0.42;
      intensity = (core * 0.65 + glow) * vTwinkle;
      col = mix(col, vec3(0.95, 0.99, 1.0), clamp(core * 0.55, 0.0, 0.72));
    } else {
      // Kind 3: Deep Night-Sky & 1st-Magnitude Hubble Diffraction Jewel Stars
      float core = exp(-r2 * 28.0);
      float halo = exp(-r2 * 5.2) * 0.32;
      float isBright = smoothstep(0.48, 0.88, vAlpha);
      float spikeX = exp(-abs(uv.y) * 36.0) * exp(-abs(uv.x) * 4.6);
      float spikeY = exp(-abs(uv.x) * 36.0) * exp(-abs(uv.y) * 4.6);
      float spikes = (spikeX + spikeY) * 0.62 * isBright * vTwinkle;
      intensity = core + halo + spikes;
      col = mix(col, vec3(0.98, 0.995, 1.0), clamp(core * 0.90 + spikes * 0.52, 0.0, 0.97));
    }

    float finalAlpha = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
    if (finalAlpha < 0.005) discard;

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

    const particleCount = isMobile ? 16500 : 29000;
    const positions = new Float32Array(particleCount * 3);
    const aColor = new Float32Array(particleCount * 3);
    const aRadius = new Float32Array(particleCount);
    const aAngle = new Float32Array(particleCount);
    const aHeight = new Float32Array(particleCount);
    const aSize = new Float32Array(particleCount);
    const aAlpha = new Float32Array(particleCount);
    const aKind = new Float32Array(particleCount);

    // Pure luminous cosmic palette (pure starlight white, ice-cyan, sapphire, deep blue & violet — zero yellow/amber shadow)
    const colPureWhite = new THREE.Color(0xffffff);
    const colIceWhite = new THREE.Color(0xeaf5ff);
    const colSkyIce = new THREE.Color(0xbce7ff);
    const colCyanBright = new THREE.Color(0x52d6ff);
    const colOTypeBlue = new THREE.Color(0x7cc4ff);
    const colSapphire = new THREE.Color(0x3f7ef5);
    const colDeepIndigo = new THREE.Color(0x5b5cf0);
    const colVioletGlow = new THREE.Color(0x9a6bff);
    const tmpCol = new THREE.Color();

    const tightness = 3.25;

    // 7 crisp 3D Globular Clusters orbiting above/below the galactic core for parallax depth
    const globularClusters = Array.from({ length: 7 }, () => ({
      r: 0.14 + rand() * 0.42,
      angle: rand() * Math.PI * 2,
      height: (rand() < 0.5 ? -1 : 1) * (0.65 + rand() * 1.15),
    }));

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const roll = rand();

      if (roll < 0.21) {
        // ------------------------------------------------------------------
        // A. CRISP LUMINOUS GALACTIC CORE & BAR (DIAMOND-WHITE TO ICE-BLUE)
        // ------------------------------------------------------------------
        const rRaw = Math.pow(rand(), 2.15) * 0.29;
        const theta = rand() * Math.PI * 2;
        const bx = Math.cos(theta) * rRaw * 1.54;
        const bz = Math.sin(theta) * rRaw * 0.68;
        const rotB = 0.44;
        const gx = bx * Math.cos(rotB) - bz * Math.sin(rotB);
        const gz = bx * Math.sin(rotB) + bz * Math.cos(rotB);

        const rBar = Math.hypot(gx, gz);
        const aBar = Math.atan2(gz, gx);

        aRadius[i] = rBar;
        aAngle[i] = aBar;
        aHeight[i] = randGauss() * (0.62 * Math.exp(-rBar * 4.6) + 0.055);

        const subRoll = rand();
        if (subRoll < 0.60) {
          aKind[i] = 0; // Crisp resolved core stardust
          aSize[i] = 0.42 + rand() * 0.54;
          aAlpha[i] = 0.24 + (1 - Math.min(rBar / 0.29, 1)) * 0.34;
        } else {
          aKind[i] = 1; // Brilliant white & ice-blue core stars
          const mag = Math.pow(rand(), 2.1);
          aSize[i] = 0.65 + mag * 1.42;
          aAlpha[i] = 0.52 + mag * 0.48;
        }

        const coreT = Math.min(rBar / 0.28, 1.0);
        tmpCol.copy(colPureWhite).lerp(colSkyIce, Math.pow(coreT, 0.62));
        if (rand() < 0.24) tmpCol.lerp(colCyanBright, 0.32);
        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else if (roll < 0.84) {
        // ------------------------------------------------------------------
        // B. GRAND 4-ARM LOGARITHMIC SPIRAL DISK (ICE-WHITE, CYAN, BLUE, VIOLET)
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
        aHeight[i] = randGauss() * (0.065 + 0.16 * r);

        const isNearShock = Math.abs(shockOffset) < 0.085 && r > 0.18 && r < 0.86;
        const isClusterPocket = isNearShock && cloudDensity > 0.58 && rand() < 0.18;
        const armWeight = isPrimary ? 1.0 : 0.68;

        const subRoll = rand();
        if (isClusterPocket && subRoll < 0.32) {
          // Compact luminous violet-cyan star-cluster sparkle
          aKind[i] = 2;
          aSize[i] = 0.85 + rand() * 0.95;
          aAlpha[i] = (0.14 + cloudDensity * 0.14) * armWeight;
          tmpCol.copy(colVioletGlow).lerp(colCyanBright, rand() * 0.55);
        } else if (subRoll < 0.60) {
          // Fine resolved stellar cloud sand
          aKind[i] = 0;
          aSize[i] = 0.42 + rand() * 0.56;
          aAlpha[i] = (0.22 + cloudDensity * 0.30) * armWeight;
          if (r < 0.30) {
            tmpCol.copy(colIceWhite).lerp(colSkyIce, rand() * 0.65);
          } else if (rand() < 0.35) {
            tmpCol.copy(colSapphire).lerp(colVioletGlow, rand() * 0.55);
          } else {
            tmpCol.copy(colSkyIce).lerp(colCyanBright, rand() * 0.55);
          }
        } else {
          // Individual pinpoint stars across the spiral arms
          aKind[i] = 1;
          const mag = Math.pow(rand(), 2.3);
          aSize[i] = 0.62 + mag * 1.72;
          aAlpha[i] = (0.48 + mag * 0.52) * armWeight;

          if (isNearShock && rand() < 0.62) {
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
          aAlpha[i] = 0.36 + rand() * 0.48;
          tmpCol.copy(colPureWhite).lerp(colSkyIce, 0.35 + rand() * 0.4);
        } else {
          aRadius[i] = 0.12 + Math.pow(rand(), 0.7) * 0.95;
          aAngle[i] = rand() * Math.PI * 2;
          aHeight[i] = randGauss() * 1.45;
          aKind[i] = 1;
          aSize[i] = 0.45 + rand() * 0.62;
          aAlpha[i] = 0.24 + rand() * 0.36;
          tmpCol.copy(colIceWhite).lerp(colOTypeBlue, rand() * 0.55);
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
        if (skyTemp < 0.54) {
          tmpCol.copy(colPureWhite).lerp(colOTypeBlue, rand() * 0.48);
        } else if (skyTemp < 0.84) {
          tmpCol.copy(colIceWhite).lerp(colCyanBright, rand() * 0.45);
        } else {
          tmpCol.copy(colOTypeBlue).lerp(colVioletGlow, rand() * 0.48);
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
    galaxyPoints.renderOrder = 1;
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
      geometry.dispose();
      material.dispose();
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

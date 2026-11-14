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

// Fast deterministic 2D noise + FBM for sculpting organic Milky Way star-clouds & dark rift lanes at mount
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

function fbm2D(x: number, y: number): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    v += amp * valueNoise2D(x * freq, y * freq);
    const nx = x * 0.8 - y * 0.6;
    const ny = x * 0.6 + y * 0.8;
    x = nx;
    y = ny;
    freq *= 2.05;
    amp *= 0.5;
  }
  return v;
}

// ============================================================================
// REALISTIC MILKY WAY ASTROPHOTOGRAPHY PARTICLE SHADER
// Baked fractal star-cloud clustering + Great Rift lane density + Planck stellar colors
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

  attribute vec3 aColor;     // Precomputed realistic Planck / H-II / Core spectral RGB
  attribute float aRadius;   // Normalized galactic radius [0..1.2], negative => background sky star
  attribute float aAngle;    // Polar azimuth angle
  attribute float aHeight;   // Galactic disk Z/Y thickness
  attribute float aSize;     // Point base size
  attribute float aAlpha;    // Individual optical luminosity weight
  attribute float aKind;     // 0: unresolved milky sand/dust, 1: crisp star pinpoint, 2: soft star-cloud bloom, 3: sky star

  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vTwinkle;
  varying float vBoost;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;
    float velKick = clamp(uScrollVelocity * 0.0042, -0.5, 0.5) * motion;

    vec3 p = vec3(0.0);
    float boost = 0.0;

    if (aKind < 2.5) {
      // Differential galactic rotation + clear, continuous spin & tilt as the page scrolls
      float r = aRadius;
      float orbitalRate = (0.032 / (0.24 + r * 0.95)) * motion;
      float scrollSpin = s * (2.75 + (1.0 - min(r, 1.0)) * 1.15) + velKick * 0.8;
      float theta = aAngle + t * orbitalRate + scrollSpin;

      float rWorld = r * mix(11.8, 14.8, clamp(uAspect - 0.7, 0.0, 1.0));
      float xPlane = cos(theta) * rWorld;
      float zPlane = sin(theta) * rWorld;

      // Natural slight galactic outer disk warp (like real Milky Way HI warp)
      float warp = sin(theta * 2.0 + rWorld * 0.28 - t * 0.16) * 0.26 * smoothstep(3.2, 11.0, rWorld);
      float yPlane = aHeight + warp;

      vec3 galPos = vec3(xPlane, yPlane, zPlane);

      // Scroll-reactive 3D camera-relative orientation:
      // Starts at iconic diagonal Milky Way band view (~70 deg grazing tilt) -> sweeps smoothly open toward spiral view (~34 deg) -> banks gracefully
      float pitchX = 1.24 - sin(s * 3.14159) * 0.58 + s * 0.12;
      float bankZ  = -0.44 + s * 0.72 + sin(t * 0.08) * 0.025;

      float cx = cos(pitchX), sx = sin(pitchX);
      vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

      float cz = cos(bankZ), sz = sin(bankZ);
      p = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

      // Sweeping orbital translation with scroll so the entire Milky Way glides across the screen
      p.x += 0.35 - sin(s * 3.8) * 1.65;
      p.y += 0.12 + cos(s * 3.2) * 0.85 - s * 0.5;
      p.z -= 1.6 + sin(s * 2.6) * 1.25;
    } else {
      // Layer 3: Deep Foreground / Night-Sky Stars surrounding the Milky Way
      p = position;
      p.x += sin(t * 0.04 + aAngle) * 0.2 - sin(s * 3.14159) * 1.9;
      p.y += cos(t * 0.035 + aHeight * 6.0) * 0.18 - s * 3.2;
      p.z += s * 1.4;
    }

    // Smooth gravitational eddy around rocket cursor
    float halfW = max(12.2 * max(uAspect, 0.85), 10.0);
    vec2 pointerWorld = vec2(uPointer.x * halfW * 0.78, uPointer.y * 6.8);
    vec2 toStar = p.xy - pointerWorld;
    float pDist = length(toStar);
    float wakeRadius = 3.8 + uPointerEnergy * 2.0;
    float wake = smoothstep(wakeRadius, 0.0, pDist) * (0.38 + uPointerEnergy * 0.82);

    if (wake > 0.001) {
      vec2 radialDir = pDist > 0.001 ? toStar / pDist : vec2(0.0, 1.0);
      vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
      float swirl = wake * (1.0 + uPointerEnergy * 0.85);
      p.xy += radialDir * (wake * 0.72) + tangentDir * (sin(swirl) * 0.72);
      p.z += wake * 1.2;
    }

    // Click Supernova Ripple Wave
    float ripple = 0.0;
    if (uClickAge > 0.0 && uClickAge < 2.4) {
      vec2 clickWorld = vec2(uClickOrigin.x * halfW * 0.78, uClickOrigin.y * 6.8);
      float cDist = length(p.xy - clickWorld);
      float waveFront = uClickAge * 11.2;
      float band = exp(-pow((cDist - waveFront) * 0.9, 2.0));
      float fade = 1.0 - smoothstep(0.0, 2.4, uClickAge);
      ripple = band * fade;
      vec2 cDir = cDist > 0.001 ? (p.xy - clickWorld) / cDist : vec2(1.0, 0.0);
      p.xy += cDir * ripple * 1.25;
      p.z += ripple * 1.7;
    }

    // Rocket Launch Exhaust Wake ('R' key)
    float rocketGlow = 0.0;
    if (uRocketActive > 0.5) {
      vec3 rOff = p - uRocketPos * vec3(0.28, 0.28, 0.35);
      float rDist = length(rOff);
      float rInf = exp(-rDist * 0.32) * uRocketWake;
      vec3 pushDir = rDist > 0.001 ? rOff / rDist : vec3(0.0, 1.0, 0.0);
      p += pushDir * rInf * 2.8;
      rocketGlow = clamp(rInf * 1.4, 0.0, 1.0);
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Full blazing luminosity on initial showcase & behind transparent PORTFOLIO cutout;
    // softly ease central contrast only after scrolling down into text cards
    vec2 ndcPos = gl_Position.xy / max(gl_Position.w, 0.001);
    float centerDist = length(ndcPos * vec2(0.85, 1.15));
    float readDim = smoothstep(0.09, 0.42, uScrollProgress);
    float centerFloor = mix(0.98, 0.56, readDim);
    float centerBalance = mix(centerFloor, 1.0, smoothstep(0.08, 0.72, centerDist));

    float twinkle = 0.80 + 0.20 * sin(t * (1.2 + aAlpha * 3.4) + aAngle * 19.3 + aRadius * 41.0);
    float perspectiveScale = 21.5 / max(-mvPosition.z, 3.2);

    float interactiveScale = 1.0 + wake * 0.45 + ripple * 0.7 + rocketGlow * 0.8 + abs(velKick) * 0.18;
    float ptSize = aSize * perspectiveScale * uPixelRatio * interactiveScale;

    float minPt = aKind > 1.5 && aKind < 2.5 ? 3.5 * uPixelRatio : 1.0 * uPixelRatio;
    float maxPt = aKind > 1.5 && aKind < 2.5 ? 24.0 * uPixelRatio : 11.0 * uPixelRatio;
    gl_PointSize = clamp(ptSize, minPt, maxPt);

    boost = wake * 0.65 + ripple * 0.95 + rocketGlow;

    vColor = aColor;
    vAlpha = clamp((aAlpha * centerBalance + wake * 0.18 + ripple * 0.38 + rocketGlow * 0.45) * uGlowIntensity, 0.0, 1.0);
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
    float r = length(uv) * 2.0; // 0 center .. 1 edge
    if (r > 1.0) discard;

    vec3 col = mix(vColor, uSectionAccent, clamp(vBoost * 0.22, 0.0, 0.38));
    float intensity = 0.0;

    if (vKind < 0.5) {
      // Kind 0: Ultra-fine Milky Sand / Unresolved Starlight River
      // Overlapping thousands of these create the genuine grainy luminous Milky Way band!
      intensity = exp(-r * r * 5.2);
    } else if (vKind < 1.5) {
      // Kind 1: Resolvable Spiral Arm & Core Pinpoint Stars
      float core = exp(-r * r * 22.0);
      float airy = exp(-r * r * 5.5) * 0.38;
      intensity = (core + airy) * vTwinkle;
      col = mix(col, vec3(1.0, 0.99, 0.97), clamp(core * 0.72, 0.0, 0.85));
    } else if (vKind < 2.5) {
      // Kind 2: Soft Optical Star-Cloud & H-II Nursery Bloom (additive glow, zero shadow patches)
      intensity = exp(-r * r * 4.4);
    } else {
      // Kind 3: Deep Night-Sky & First-Magnitude Bright Stars with delicate diffraction spikes
      float core = exp(-r * r * 24.0);
      float airy = exp(-r * r * 5.0) * 0.32;
      float isBright = smoothstep(0.45, 0.85, vAlpha);
      float spikeX = exp(-abs(uv.y) * 34.0) * exp(-abs(uv.x) * 4.8);
      float spikeY = exp(-abs(uv.x) * 34.0) * exp(-abs(uv.y) * 4.8);
      float spikes = (spikeX + spikeY) * 0.55 * isBright * vTwinkle;
      intensity = (core + airy + spikes);
      col = mix(col, vec3(1.0), clamp(core * 0.8 + spikes * 0.55, 0.0, 0.95));
    }

    float finalAlpha = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
    if (finalAlpha < 0.004) discard;

    gl_FragColor = vec4(col, finalAlpha);
  }
`;

export const MilkyWayGalaxy: React.FC<MilkyWayGalaxyProps> = ({
  opacity = 0.98,
  glowIntensity = 1.22,
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

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 140);
    camera.position.set(0, 0, 14.0);

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
      : Math.min(window.devicePixelRatio || 1, 1.85);
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

    // Deterministic PRNG + Gaussian helper
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

    // High-density real astronomical distribution (~52,000 desktop / ~24,000 mobile)
    const particleCount = isMobile ? 24000 : 52000;
    const positions = new Float32Array(particleCount * 3);
    const aColor = new Float32Array(particleCount * 3);
    const aRadius = new Float32Array(particleCount);
    const aAngle = new Float32Array(particleCount);
    const aHeight = new Float32Array(particleCount);
    const aSize = new Float32Array(particleCount);
    const aAlpha = new Float32Array(particleCount);
    const aKind = new Float32Array(particleCount);

    // Palette anchors calibrated to real ESA Gaia / Hubble / Milky Way astrophotography
    const colCoreWhite = new THREE.Color(0xfff7e6);
    const colCoreGold = new THREE.Color(0xf7c377);
    const colAmberDust = new THREE.Color(0xd9874c);
    const colBlueOB = new THREE.Color(0x88d4ff);
    const colDeepBlue = new THREE.Color(0x5288e6);
    const colDiamondWhite = new THREE.Color(0xf1f5f9);
    const colH2Rose = new THREE.Color(0xe86ca2);
    const tmpCol = new THREE.Color();

    const tightness = 3.55;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const roll = rand();

      if (roll < 0.24) {
        // ------------------------------------------------------------------
        // A. RADIANT GALACTIC BULGE & CENTRAL BAR (dense warm cream-gold core)
        // ------------------------------------------------------------------
        const rRaw = Math.pow(rand(), 2.35) * 0.27;
        const theta = rand() * Math.PI * 2;
        // Elliptical barred core elongation along 0.42 rad
        const bx = Math.cos(theta) * rRaw * 1.48;
        const bz = Math.sin(theta) * rRaw * 0.68;
        const rotB = 0.42;
        const gx = bx * Math.cos(rotB) - bz * Math.sin(rotB);
        const gz = bx * Math.sin(rotB) + bz * Math.cos(rotB);

        const rBar = Math.hypot(gx, gz);
        const aBar = Math.atan2(gz, gx);

        aRadius[i] = rBar;
        aAngle[i] = aBar;
        aHeight[i] = randGauss() * (0.48 * Math.exp(-rBar * 5.2));

        const subRoll = rand();
        if (subRoll < 0.14) {
          // Soft warm core optical bloom motes
          aKind[i] = 2;
          aSize[i] = 1.8 + rand() * 1.8;
          aAlpha[i] = 0.048 + (1 - Math.min(rBar / 0.28, 1)) * 0.055;
        } else if (subRoll < 0.72) {
          // Ultra-fine milky core stardust sand
          aKind[i] = 0;
          aSize[i] = 0.45 + rand() * 0.55;
          aAlpha[i] = 0.14 + (1 - Math.min(rBar / 0.28, 1)) * 0.22;
        } else {
          // Crisp golden bulge stars
          aKind[i] = 1;
          aSize[i] = 0.7 + Math.pow(rand(), 2.0) * 1.3;
          aAlpha[i] = 0.48 + rand() * 0.44;
        }

        const coreT = Math.min(rBar / 0.26, 1.0);
        tmpCol.copy(colCoreWhite).lerp(colCoreGold, Math.pow(coreT, 0.7));
        if (rand() < 0.18) tmpCol.lerp(colAmberDust, 0.45);
        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else if (roll < 0.89) {
        // ------------------------------------------------------------------
        // B. SPIRAL ARMS, STAR-CLOUDS & NATURAL INTERSTELLAR RIFT LATTICE
        // ------------------------------------------------------------------
        // Rejection-sculpt radius & angle via organic FBM noise so real mottled star clouds
        // and natural dark dust rifts form strictly from particle density (zero shadow planes!)
        let r = 0.08;
        let angle = 0;
        let armWeight = 0.5;
        let cloudDensity = 0.6;
        let isRiftEdge = 0;

        for (let attempt = 0; attempt < 4; attempt++) {
          r = 0.075 + Math.pow(rand(), 0.92) * 1.04;
          const isSecondary = rand() < 0.38;
          const armIdx = (i + attempt) % 2;
          const baseAngle =
            (armIdx / 2) * Math.PI * 2 + (isSecondary ? Math.PI * 0.52 : 0);

          const spiralTwist = Math.log(1.0 + r * 5.4) * tightness;
          const angularJitter = randGauss() * ((isSecondary ? 0.34 : 0.20) + r * 0.26);
          const spurOffset = rand() < 0.24 ? (rand() - 0.5) * 1.15 : 0;

          angle = baseAngle + spiralTwist + angularJitter + spurOffset;

          const nx = Math.cos(angle) * r * 3.8;
          const nz = Math.sin(angle) * r * 3.8;
          const fbmCloud = fbm2D(nx + 12.4, nz + 7.1);
          const riftNoise = fbm2D(nx * 1.85 - 4.2, nz * 1.85 + 9.3);

          // Natural dark Great Rift lanes inside mid-disk create real photographic contrast without shadow masks
          const inRift = riftNoise > 0.54 && r > 0.14 && r < 0.85;
          isRiftEdge = Math.max(0, 1 - Math.abs(riftNoise - 0.54) * 8.0);
          cloudDensity = fbmCloud;
          armWeight = isSecondary ? 0.55 : 1.0;

          if (!inRift && fbmCloud > 0.34) break;
          if (rand() < 0.18) break; // Keep sparse faint stars inside dark lanes just like real space
        }

        aRadius[i] = r;
        aAngle[i] = angle;
        aHeight[i] = randGauss() * (0.065 + 0.15 * r);

        const subRoll = rand();
        const isH2Nursery = cloudDensity > 0.66 && r > 0.18 && r < 0.78 && rand() < 0.28;

        if (subRoll < 0.11) {
          // Soft optical star-cloud / H-II bloom motes (very subtle additive glow, builds milky band luminosity)
          aKind[i] = 2;
          aSize[i] = 1.7 + rand() * 2.1;
          aAlpha[i] = (0.024 + cloudDensity * 0.036) * armWeight;
        } else if (subRoll < 0.78) {
          // Ultra-fine milky sand grains forming crisp mottled clouds & spiral trails
          aKind[i] = 0;
          aSize[i] = 0.42 + rand() * 0.56;
          aAlpha[i] = 0.09 + cloudDensity * 0.17 * armWeight;
        } else {
          // Resolvable star pinpoints along spiral arms & OB associations
          aKind[i] = 1;
          const mag = Math.pow(rand(), 2.6);
          aSize[i] = 0.62 + mag * 1.55;
          aAlpha[i] = 0.38 + mag * 0.58;
        }

        // Authentic spectral star & nebula coloration
        if (isH2Nursery) {
          tmpCol.copy(colH2Rose).lerp(colCoreGold, rand() * 0.35);
        } else if (isRiftEdge > 0.45 && rand() < 0.5) {
          tmpCol.copy(colAmberDust).lerp(colCoreGold, rand() * 0.5);
        } else if (r < 0.35) {
          tmpCol.copy(colCoreGold).lerp(colDiamondWhite, rand() * 0.65);
        } else {
          const temp = rand();
          if (temp < 0.48) {
            tmpCol.copy(colBlueOB).lerp(colDiamondWhite, rand() * 0.6);
          } else if (temp < 0.78) {
            tmpCol.copy(colDiamondWhite).lerp(colDeepBlue, rand() * 0.45);
          } else {
            tmpCol.copy(colCoreGold).lerp(colAmberDust, rand() * 0.4);
          }
        }

        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else {
        // ------------------------------------------------------------------
        // C. DEEP NIGHT-SKY & FOREGROUND BRIGHT STARS (full cosmic enclosure)
        // ------------------------------------------------------------------
        aKind[i] = 3;
        positions[i3] = (rand() - 0.5) * 44.0;
        positions[i3 + 1] = (rand() - 0.5) * 26.0;
        positions[i3 + 2] = -18.0 + rand() * 22.0;

        aRadius[i] = -1.0;
        aAngle[i] = rand() * Math.PI * 2;
        aHeight[i] = rand();

        const isJewel = rand() < 0.085;
        aSize[i] = isJewel ? 1.45 + rand() * 1.4 : 0.42 + rand() * 0.68;
        aAlpha[i] = isJewel ? 0.62 + rand() * 0.36 : 0.18 + rand() * 0.38;

        const skyTemp = rand();
        if (skyTemp < 0.55) {
          tmpCol.copy(colDiamondWhite).lerp(colBlueOB, rand() * 0.45);
        } else if (skyTemp < 0.85) {
          tmpCol.copy(colCoreWhite).lerp(colCoreGold, rand() * 0.55);
        } else {
          tmpCol.copy(colAmberDust).lerp(colCoreGold, 0.5);
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
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 70);

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

      // Curved 3D celestial flight through the Milky Way as the visitor scrolls
      const sp = smoothedScrollProgress;
      const camX = smoothedPointerX * 0.65 - Math.sin(sp * Math.PI * 1.45) * 2.25;
      const camY = smoothedPointerY * 0.38 + Math.sin(sp * Math.PI * 2.0) * 1.25 - sp * 0.4;
      const camZ = 14.0 - Math.sin(sp * Math.PI) * 3.4;
      camera.position.set(camX, camY, camZ);

      const lookX = -Math.sin(sp * 3.1) * 0.7;
      const lookY = -sp * 0.45;
      camera.lookAt(lookX, lookY, -1.5);

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
      className={`MilkyWayGalaxy fixed inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden ${className}`.trim()}
    />
  );
};

export default MilkyWayGalaxy;

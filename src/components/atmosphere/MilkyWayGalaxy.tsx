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

// Fast deterministic 2D noise + FBM for organic spiral star-cloud clumping
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
// PRE-BAKED PROCEDURAL SPIRAL NEBULA TEXTURE (Baked once at init -> 1 texture lookup/px)
// Eliminates 16 octaves of per-pixel FBM on 7M pixels/frame so scrolling stays locked at 60fps
// ============================================================================
function createProceduralNebulaTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const img = ctx.createImageData(size, size);
  const data = img.data;
  const half = size * 0.5;
  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;

  for (let py = 0; py < size; py++) {
    const gy = ((py + 0.5) / half - 1.0) * 1.05;
    for (let px = 0; px < size; px++) {
      const gx = ((px + 0.5) / half - 1.0) * 1.05;
      const r = Math.hypot(gx, gy);
      const idx = (py * size + px) * 4;

      if (r > 1.04) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        continue;
      }

      const angle = Math.atan2(gy, gx);
      const twist = Math.log(1.0 + r * 5.2) * 3.25;
      const majorArms = Math.pow(Math.max(Math.cos(2.0 * (angle - twist)), 0.0), 3.2);
      const minorArms =
        Math.pow(Math.max(Math.cos(2.0 * (angle - twist + 1.5708)), 0.0), 3.8) * 0.55;
      const armSpine = Math.min(1.0, majorArms + minorArms);

      const warpX = fbm2D(gx * 3.6 + 2.1, gy * 3.6 + 1.3);
      const warpY = fbm2D(gx * 3.6 - 1.7, gy * 3.6 + 4.3);
      const cloudTex = fbm2D(gx * 5.4 + warpX * 1.05, gy * 5.4 + warpY * 1.05);
      const fineRift = fbm2D(gx * 9.2 + warpX * 1.4, gy * 9.2 + warpY * 1.4);

      const riftCarve =
        smoothstep(0.52, 0.76, fineRift) *
        smoothstep(0.08, 0.55, r) *
        (1.0 - smoothstep(0.68, 0.98, r));

      const barX = gx * 0.78 + gy * 0.34;
      const barY = -gx * 0.34 + gy * 1.45;
      const bulgeDist = Math.hypot(barX, barY);
      const bulge = Math.exp(-bulgeDist * bulgeDist * 24.0);
      const coreAura = Math.exp(-r * r * 12.0);

      const outerFade = 1.0 - smoothstep(0.65, 1.04, r);
      const armGlow = armSpine * Math.exp(-r * 1.65) * outerFade * (0.45 + 0.65 * cloudTex);
      const litArms = Math.max(armGlow * (1.0 - riftCarve * 0.62), 0.0);

      const h2Pocket =
        smoothstep(0.62, 0.86, cloudTex) * smoothstep(0.16, 0.65, r) * armSpine;

      const armBlend = smoothstep(0.15, 0.85, armSpine * cloudTex + 0.18);
      let cr = mix(0.32, 0.30, armBlend);
      let cg = mix(0.30, 0.74, armBlend);
      let cb = mix(0.72, 1.0, armBlend);

      // H2 Rose pockets
      const h2Mix = h2Pocket * 0.48;
      cr = mix(cr, 0.88, h2Mix);
      cg = mix(cg, 0.42, h2Mix);
      cb = mix(cb, 0.66, h2Mix);

      // Warm amber inner bar
      const amberMix = smoothstep(0.36, 0.06, bulgeDist) * 0.82;
      cr = mix(cr, 0.95, amberMix);
      cg = mix(cg, 0.68, amberMix);
      cb = mix(cb, 0.36, amberMix);

      // Blazing core white-gold
      const coreMix = Math.min(1.0, bulge * 1.2);
      cr = mix(cr, 1.0, coreMix);
      cg = mix(cg, 0.95, coreMix);
      cb = mix(cb, 0.82, coreMix);

      // Subtle dusty ember near rifts
      const riftMix = riftCarve * 0.24 * coreAura;
      cr = mix(cr, 0.72, riftMix);
      cg = mix(cg, 0.38, riftMix);
      cb = mix(cb, 0.22, riftMix);

      const alpha = Math.min(0.42, bulge * 0.32 + coreAura * 0.13 + litArms * 0.30);

      data[idx] = Math.round(Math.min(1, cr) * 255);
      data[idx + 1] = Math.round(Math.min(1, cg) * 255);
      data[idx + 2] = Math.round(Math.min(1, cb) * 255);
      data[idx + 3] = Math.round(Math.min(1, alpha) * 255);
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const NEBULA_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uReducedMotion;
  uniform float uAspect;

  varying vec2 vGalUv;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;

    vec3 galPos = vec3(position.x, 0.0, position.y);

    // Grand 3/4 oblique opening view (~50 deg) -> opens smoothly toward dramatic face-on spiral on scroll
    float pitchX = 0.88 - sin(s * 3.14159) * 0.40 + s * 0.10;
    float bankZ  = -0.32 + s * 0.58 + sin(t * 0.08) * 0.025;

    float cx = cos(pitchX), sx = sin(pitchX);
    vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

    float cz = cos(bankZ), sz = sin(bankZ);
    vec3 worldPos = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

    worldPos.x += 0.15 - sin(s * 3.4) * 1.45;
    worldPos.y += 0.05 + cos(s * 2.8) * 0.72 - s * 0.35;
    worldPos.z -= 1.0 + sin(s * 2.4) * 0.9;

    // Normalize UVs to exact big spiral world radius
    float galSpan = mix(15.2, 20.5, clamp(uAspect - 0.7, 0.0, 1.0));
    vGalUv = position.xy / galSpan;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
  }
`;

const NEBULA_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uNebulaMap;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScrollProgress;
  uniform float uReducedMotion;
  uniform vec2 uPointer;

  varying vec2 vGalUv;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * 0.03 * motion;
    float spin = t + uScrollProgress * 2.55;

    float cs = cos(spin), sn = sin(spin);
    vec2 g = vec2(vGalUv.x * cs - vGalUv.y * sn, vGalUv.x * sn + vGalUv.y * cs);
    g += uPointer * 0.015;

    float r = length(g);
    if (r > 1.04) discard;

    vec2 texUv = (g / 1.05) * 0.5 + 0.5;
    vec4 neb = texture2D(uNebulaMap, texUv);

    float scrollAtten = mix(1.0, 0.72, smoothstep(0.08, 0.45, uScrollProgress));
    float breath = 0.96 + 0.04 * sin(uTime * 0.65 * motion + r * 4.0);
    float alpha = neb.a * scrollAtten * uOpacity * breath;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(neb.rgb, clamp(alpha, 0.0, 0.36));
  }
`;

// ============================================================================
// MASSIVE 48,000-PARTICLE BIG MILKY WAY GALAXY SHADER
// Clear sculpted barred spiral arms + blazing core + cosmic sand trails + foreground stars
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
  attribute float aKind; // 0: milky sand stream, 1: crisp spiral/core star, 2: compact glow mote, 3: deep sky star

  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vTwinkle;
  varying float vBoost;

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;
    float velKick = clamp(uScrollVelocity * 0.0045, -0.55, 0.55) * motion;

    vec3 p = vec3(0.0);
    float boost = 0.0;

    if (aKind < 2.5) {
      float r = aRadius;
      float orbitalRate = (0.036 / (0.24 + r * 0.92)) * motion;
      float scrollSpin = s * (2.55 + (1.0 - min(r, 1.0)) * 1.15) + velKick * 0.85;
      float theta = aAngle + t * orbitalRate + scrollSpin;

      // Monumental galactic wingspan stretching generously across the entire screen
      float galSpan = mix(15.2, 20.5, clamp(uAspect - 0.7, 0.0, 1.0));
      float rWorld = r * galSpan;
      float xPlane = cos(theta) * rWorld;
      float zPlane = sin(theta) * rWorld;

      float sandWave = aKind < 0.5
        ? sin(theta * 4.0 - t * 0.55 + rWorld * 0.5) * 0.18
        : 0.0;
      float warp = sin(theta * 2.0 + rWorld * 0.22 - t * 0.16) * 0.34 * smoothstep(4.5, 16.0, rWorld);
      float yPlane = aHeight + warp + sandWave;

      vec3 galPos = vec3(xPlane, yPlane, zPlane);

      // Synced 1:1 with NEBULA_VERTEX_SHADER
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
      // Deep space surrounding stars across entire viewport
      p = position;
      p.x += sin(t * 0.045 + aAngle) * 0.25 - sin(s * 3.14159) * 2.2;
      p.y += cos(t * 0.04 + aHeight * 6.0) * 0.22 - s * 3.4;
      p.z += s * 1.6;
    }

    // Keep galaxy particles cohesive around cursor (no radial separation wake)
    float wake = 0.0;
    float ripple = 0.0;

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
    float centerFloor = mix(0.98, 0.56, readDim);
    float centerBalance = mix(centerFloor, 1.0, smoothstep(0.08, 0.72, centerDist));

    float twinkle = 0.78 + 0.22 * sin(t * (1.35 + aAlpha * 3.1) + aAngle * 18.7 + aRadius * 39.0);
    float perspectiveScale = 23.0 / max(-mvPosition.z, 3.0);

    float interactiveScale = 1.0 + wake * 0.5 + ripple * 0.75 + rocketGlow * 0.85 + abs(velKick) * 0.22;
    float ptSize = aSize * perspectiveScale * uPixelRatio * interactiveScale;

    float minPt = aKind > 1.5 && aKind < 2.5 ? 2.8 * uPixelRatio : 1.05 * uPixelRatio;
    float maxPt = aKind > 1.5 && aKind < 2.5 ? 14.0 * uPixelRatio : 9.5 * uPixelRatio;
    gl_PointSize = clamp(ptSize, minPt, maxPt);

    boost = wake * 0.68 + ripple * 0.95 + rocketGlow;

    vColor = aColor;
    vAlpha = clamp((aAlpha * centerBalance + wake * 0.22 + ripple * 0.42 + rocketGlow * 0.5) * uGlowIntensity, 0.0, 1.0);
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
    float r = length(uv) * 2.0;
    if (r > 1.0) discard;

    vec3 col = mix(vColor, uSectionAccent, clamp(vBoost * 0.22, 0.0, 0.38));
    float intensity = 0.0;

    if (vKind < 0.5) {
      // Kind 0: Crisp Flowing Cosmic Sand Grains
      intensity = smoothstep(1.0, 0.14, r) * 0.94;
    } else if (vKind < 1.5) {
      // Kind 1: Luminous Spiral-Arm & Galactic Core Star Dots
      float core = exp(-r * r * 19.0);
      float airy = exp(-r * r * 4.8) * 0.42;
      intensity = (core + airy) * vTwinkle;
      col = mix(col, vec3(1.0, 0.99, 0.97), clamp(core * 0.76, 0.0, 0.90));
    } else if (vKind < 2.5) {
      // Kind 2: Small Optical Cluster Bloom
      intensity = exp(-r * r * 4.5);
    } else {
      // Kind 3: Deep Night-Sky & 1st-Magnitude Jewel Stars with crisp diffraction spikes
      float core = exp(-r * r * 21.0);
      float airy = exp(-r * r * 4.6) * 0.36;
      float isBright = smoothstep(0.45, 0.85, vAlpha);
      float spikeX = exp(-abs(uv.y) * 32.0) * exp(-abs(uv.x) * 4.5);
      float spikeY = exp(-abs(uv.x) * 32.0) * exp(-abs(uv.y) * 4.5);
      float spikes = (spikeX + spikeY) * 0.56 * isBright * vTwinkle;
      intensity = (core + airy + spikes);
      col = mix(col, vec3(1.0), clamp(core * 0.82 + spikes * 0.54, 0.0, 0.96));
    }

    float finalAlpha = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
    if (finalAlpha < 0.005) discard;

    gl_FragColor = vec4(col, finalAlpha);
  }
`;

export const MilkyWayGalaxy: React.FC<MilkyWayGalaxyProps> = ({
  opacity = 0.98,
  glowIntensity = 1.28,
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

    // Monumental cosmic framing so the Big Milky Way dominates from edge to edge
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

    // Pre-baked procedural nebula texture (1 texture lookup per pixel vs 16-octave live FBM)
    const nebulaTexture = createProceduralNebulaTexture();

    // Spiral-hugging small shadow & glowing core plane scaled to match the Big Milky Way
    const nebulaGeo = new THREE.PlaneGeometry(42, 42);
    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERTEX_SHADER,
      fragmentShader: NEBULA_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uNebulaMap: { value: nebulaTexture },
        uTime: { value: 0 },
        uOpacity: { value: opacityRef.current },
        uScrollProgress: { value: 0 },
        uReducedMotion: { value: stateRef.current.prefersReduced ? 1 : 0 },
        uAspect: { value: width / height },
        uPointer: { value: new THREE.Vector2(0, 0) },
      },
    });
    const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.frustumCulled = false;
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

    const particleCount = isMobile ? 16000 : 26000;
    const positions = new Float32Array(particleCount * 3);
    const aColor = new Float32Array(particleCount * 3);
    const aRadius = new Float32Array(particleCount);
    const aAngle = new Float32Array(particleCount);
    const aHeight = new Float32Array(particleCount);
    const aSize = new Float32Array(particleCount);
    const aAlpha = new Float32Array(particleCount);
    const aKind = new Float32Array(particleCount);

    const colCoreWhite = new THREE.Color(0xfff9ec);
    const colCoreGold = new THREE.Color(0xf8cb7f);
    const colAmberSand = new THREE.Color(0xe09556);
    const colBlueOB = new THREE.Color(0x7cd4ff);
    const colDeepBlue = new THREE.Color(0x4f89eb);
    const colDiamondWhite = new THREE.Color(0xf8fafc);
    const colH2Rose = new THREE.Color(0xec6ba5);
    const tmpCol = new THREE.Color();

    // Matches NEBULA_FRAGMENT_SHADER twist = log(1 + r * 5.2) * 3.25
    const tightness = 3.25;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const roll = rand();

      if (roll < 0.24) {
        // ------------------------------------------------------------------
        // A. BLAZING GALACTIC CORE & BARRED CENTRAL NUCLEUS
        // ------------------------------------------------------------------
        const rRaw = Math.pow(rand(), 2.15) * 0.28;
        const theta = rand() * Math.PI * 2;
        const bx = Math.cos(theta) * rRaw * 1.5;
        const bz = Math.sin(theta) * rRaw * 0.72;
        const rotB = 0.40;
        const gx = bx * Math.cos(rotB) - bz * Math.sin(rotB);
        const gz = bx * Math.sin(rotB) + bz * Math.cos(rotB);

        const rBar = Math.hypot(gx, gz);
        const aBar = Math.atan2(gz, gx);

        aRadius[i] = rBar;
        aAngle[i] = aBar;
        aHeight[i] = randGauss() * (0.48 * Math.exp(-rBar * 4.8));

        const subRoll = rand();
        if (subRoll < 0.14) {
          aKind[i] = 2; // Core optical bloom
          aSize[i] = 1.6 + rand() * 1.5;
          aAlpha[i] = 0.065 + (1 - Math.min(rBar / 0.28, 1)) * 0.075;
        } else if (subRoll < 0.72) {
          aKind[i] = 0; // Crisp golden core stardust sand
          aSize[i] = 0.50 + rand() * 0.62;
          aAlpha[i] = 0.24 + (1 - Math.min(rBar / 0.28, 1)) * 0.30;
        } else {
          aKind[i] = 1; // Bright golden bulge stars
          aSize[i] = 0.78 + Math.pow(rand(), 1.9) * 1.35;
          aAlpha[i] = 0.56 + rand() * 0.42;
        }

        const coreT = Math.min(rBar / 0.26, 1.0);
        tmpCol.copy(colCoreWhite).lerp(colCoreGold, Math.pow(coreT, 0.65));
        if (rand() < 0.16) tmpCol.lerp(colAmberSand, 0.38);
        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else if (roll < 0.90) {
        // ------------------------------------------------------------------
        // B. GRAND SCULPTED 4-ARM SPIRAL MILKY WAY + COSMIC SAND RIVERS
        // Tight cohesive spiral tracks so the Milky Way silhouette reads boldly
        // ------------------------------------------------------------------
        let r = 0.08;
        let angle = 0;
        let isPrimary = true;
        let cloudDensity = 0.65;

        for (let attempt = 0; attempt < 3; attempt++) {
          r = 0.08 + Math.pow(rand(), 0.88) * 1.02;
          isPrimary = rand() < 0.66;
          const armIdx = (i + attempt) % 2;
          // Primary arms at 0, PI; Secondary arms interleaved at PI/2, 3PI/2
          const baseAngle =
            (armIdx / 2) * Math.PI * 2 + (isPrimary ? 0 : Math.PI * 0.5);

          const spiralTwist = Math.log(1.0 + r * 5.2) * tightness;
          // Crisp arm coherence so spiral geometry stands out powerfully!
          const armSpread = (isPrimary ? 0.115 : 0.155) + r * 0.135;
          const isSubSpur = rand() < 0.14;
          const spurAngle = isSubSpur ? (rand() - 0.5) * 0.55 : 0;

          angle = baseAngle + spiralTwist + randGauss() * armSpread + spurAngle;

          const nx = Math.cos(angle) * r * 3.8;
          const nz = Math.sin(angle) * r * 3.8;
          cloudDensity = fbm2D(nx + 10.2, nz + 5.7);
          if (cloudDensity > 0.30 || attempt === 2) break;
        }

        aRadius[i] = r;
        aAngle[i] = angle;
        aHeight[i] = randGauss() * (0.08 + 0.18 * r);

        const subRoll = rand();
        const isH2Nursery = cloudDensity > 0.64 && r > 0.18 && r < 0.82 && rand() < 0.25;
        const armWeight = isPrimary ? 1.0 : 0.65;

        if (subRoll < 0.11) {
          aKind[i] = 2; // Soft arm-spine star-cloud bloom
          aSize[i] = 1.45 + rand() * 1.65;
          aAlpha[i] = (0.036 + cloudDensity * 0.048) * armWeight;
        } else if (subRoll < 0.74) {
          aKind[i] = 0; // Luminous flowing cosmic sand & spiral stardust
          aSize[i] = 0.48 + rand() * 0.66;
          aAlpha[i] = (0.20 + cloudDensity * 0.28) * armWeight;
        } else {
          aKind[i] = 1; // Bright spiral-arm jewel dots
          const mag = Math.pow(rand(), 2.2);
          aSize[i] = 0.72 + mag * 1.6;
          aAlpha[i] = (0.48 + mag * 0.50) * armWeight;
        }

        if (isH2Nursery) {
          tmpCol.copy(colH2Rose).lerp(colCoreGold, rand() * 0.35);
        } else if (r < 0.32) {
          tmpCol.copy(colCoreGold).lerp(colDiamondWhite, rand() * 0.68);
        } else {
          const temp = rand();
          if (temp < 0.52) {
            tmpCol.copy(colBlueOB).lerp(colDiamondWhite, rand() * 0.58);
          } else if (temp < 0.82) {
            tmpCol.copy(colDiamondWhite).lerp(colDeepBlue, rand() * 0.42);
          } else {
            tmpCol.copy(colCoreGold).lerp(colAmberSand, rand() * 0.38);
          }
        }

        aColor[i3] = tmpCol.r;
        aColor[i3 + 1] = tmpCol.g;
        aColor[i3 + 2] = tmpCol.b;
      } else {
        // ------------------------------------------------------------------
        // C. DEEP SPACE SURROUNDING JEWEL STARS
        // ------------------------------------------------------------------
        aKind[i] = 3;
        positions[i3] = (rand() - 0.5) * 48.0;
        positions[i3 + 1] = (rand() - 0.5) * 30.0;
        positions[i3 + 2] = -20.0 + rand() * 24.0;

        aRadius[i] = -1.0;
        aAngle[i] = rand() * Math.PI * 2;
        aHeight[i] = rand();

        const isJewel = rand() < 0.10;
        aSize[i] = isJewel ? 1.55 + rand() * 1.45 : 0.45 + rand() * 0.70;
        aAlpha[i] = isJewel ? 0.68 + rand() * 0.32 : 0.22 + rand() * 0.42;

        const skyTemp = rand();
        if (skyTemp < 0.55) {
          tmpCol.copy(colDiamondWhite).lerp(colBlueOB, rand() * 0.48);
        } else if (skyTemp < 0.85) {
          tmpCol.copy(colCoreWhite).lerp(colCoreGold, rand() * 0.55);
        } else {
          tmpCol.copy(colAmberSand).lerp(colCoreGold, 0.5);
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

      // Sweeping 3D orbital fly-through across the massive Milky Way (calibrated depth for zero fill-rate spikes)
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
      nebulaGeo.dispose();
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

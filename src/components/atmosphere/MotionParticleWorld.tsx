import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { interactionEngine } from '../../context/SingularityInteractionEngine';

/**
 * LUMINOUS SHINING DOT-PARTICLE FIELD
 * 
 * High-visibility, sparkling generative particle cosmos with brilliant diamond
 * specular glints, optical star diffraction rays, and expanded density.
 * 
 * Key Visual Attributes:
 * 1. Radiant Optical Shine:
 *    - Specular star diffraction rays (4-point cross flare + diagonal facet glints)
 *    - Crystalline pure white diamond core
 *    - Phase-offset twinkle scintillation for organic shimmering
 * 2. Increased Density & Cosmic Abundance:
 *    - 5,200 active particles across the full frustum
 *    - Balanced between wide celestial constellation and flowing wave streams
 * 3. High Contrast & Visibility:
 *    - Base opacities from 0.42 up to 0.96 (clearly visible across all sections)
 *    - Crisp sizing: 1.0 to 2.5 CSS pixels (clamped to >= 1.8 physical pixels)
 *    - Brilliant silver, arctic platinum, and pure diamond white palette
 *    - Seamless presence across the entire hero section
 */

export interface MotionParticleWorldProps {
  opacity?: number;
  sizeVariation?: number;
  className?: string;
}

const PARTICLE_COUNT = 5200;

const vertexShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;          // Normalized [-1, 1] screen coordinates
  uniform vec2 uPointerVel;       // Cursor velocity vector
  uniform float uPointerRadius;   // Influence radius (~140px)
  uniform float uPointerForce;    // Gentle repulsion force
  uniform float uPointerActive;   // Smooth fade factor [0..1] for cursor presence
  uniform float uScrollOffset;    // Smooth vertical scroll parallax
  uniform float uScrollVel;       // Scroll momentum impulse
  uniform float uScrollProgress;  // Normalized scroll progression [0.0 to 1.0]
  uniform float uScrollSpeedNorm; // Normalized scroll speed [0.0 to 1.0+]
  uniform float uShockTime;       // Click shockwave time elapsed
  uniform vec2 uShockOrigin;      // Click origin in NDC
  uniform float uPixelRatio;      // Device pixel ratio (1x, 2x, 3x)
  uniform vec3 uThemeColor;       // Subtly blended ambient section tone
  uniform float uOpacity;         // Global opacity uniform
  uniform float uSizeVariation;   // Global size variation uniform

  attribute float aSize;          // Pre-calibrated CSS pixel diameter (1.0 to 2.5)
  attribute float aLayer;         // 0 = DISTANT, 1 = MAIN, 2 = HIGHLIGHT
  attribute vec3 aSeed;           // Deterministic unique particle seeds
  attribute float aAlpha;         // Base target alpha (0.42 to 0.96)

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vTwinkle;

  // 3D Simplex-like noise helper for smooth organic fluid currents
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Curl-like fluid flow derivative approximation for natural organic drift
  vec3 curlNoise(vec3 p, float t) {
    float e = 0.08;
    float n1 = snoise(p + vec3(0.0, e, 0.0) + t);
    float n2 = snoise(p - vec3(0.0, e, 0.0) + t);
    float n3 = snoise(p + vec3(e, 0.0, 0.0) + t);
    float n4 = snoise(p - vec3(e, 0.0, 0.0) + t);
    float n5 = snoise(p + vec3(0.0, 0.0, e) + t);
    float n6 = snoise(p - vec3(0.0, 0.0, e) + t);

    float x = (n1 - n2) - (n5 - n6);
    float y = (n5 - n6) - (n3 - n4);
    float z = (n3 - n4) - (n1 - n2);
    return vec3(x, y, z) * 0.40;
  }

  // =========================================================================
  // 5 COORDINATED SCROLL STATES (HIGH VISIBILITY & RICH MORPHING)
  // =========================================================================

  // STATE A: Ambient Field with Gentle Currents & Flowing Streams
  vec3 getAmbientField(vec3 basePos, vec3 seed, float t, float mobility) {
    vec3 noiseCoord = basePos * 0.022 + vec3(seed.y * 6.0, seed.z * 6.0, 0.0);
    vec3 flow = curlNoise(noiseCoord, t * 0.032);
    vec3 p = basePos;
    p.x += flow.x * (10.0 * mobility) + sin(t * 0.18 + seed.x * 6.28) * (2.4 * mobility);
    p.y += flow.y * (9.0 * mobility) + cos(t * 0.16 + seed.y * 6.28) * (2.4 * mobility);
    p.z += flow.z * (7.5 * mobility);
    return p;
  }

  // STATE B: Flowing Waves (Undulating topological contours)
  vec3 getFlowingWaves(vec3 seed, float t) {
    float waveX = (seed.x - 0.5) * 140.0;
    float waveFreq1 = 0.032;
    float waveFreq2 = 0.064;
    float waveY = sin(waveX * waveFreq1 + t * 0.50 + seed.z * 2.2) * 13.0 
                + sin(waveX * waveFreq2 - t * 0.35) * 5.0 
                + (seed.y - 0.5) * 22.0;
    float waveZ = cos(waveX * waveFreq1 + t * 0.45 + seed.y * 2.2) * 11.0 
                + (seed.z - 0.5) * 14.0 - 10.0;
    return vec3(waveX, waveY, waveZ);
  }

  // STATE C: Spatial Tunnel (3D architectural depth lines)
  vec3 getSpatialTunnel(vec3 seed, float t) {
    float angle = seed.x * 6.283185;
    float radius = 18.0 + seed.y * 24.0;
    float tunnelLength = 100.0;
    float tunnelZ = mod((seed.z - 0.5) * tunnelLength + t * 12.0, tunnelLength) - (tunnelLength * 0.5);
    float twist = tunnelZ * 0.016;
    float tunnelX = radius * cos(angle + twist);
    float tunnelY = radius * sin(angle + twist) * 0.72;
    return vec3(tunnelX, tunnelY, tunnelZ);
  }

  // STATE D: Orbital Structures (Concentric rings & logarithmic spiral orbits)
  vec3 getOrbitalStructures(vec3 seed, float t) {
    float ringIndex = floor(seed.x * 4.0);
    float baseR = 15.0 + ringIndex * 9.0 + seed.y * 5.0;
    float direction = (seed.z > 0.5) ? 1.0 : -0.8;
    float speed = (0.22 / (1.0 + ringIndex * 0.20)) * direction;
    float theta = seed.y * 6.283185 + t * speed;
    float tilt = 0.26 * (ringIndex - 1.5);

    float orbX = baseR * cos(theta);
    float orbY = baseR * sin(theta) * cos(tilt) + (seed.z - 0.5) * 6.0;
    float orbZ = baseR * sin(theta) * sin(tilt) - 10.0;
    return vec3(orbX, orbY, orbZ);
  }

  // STATE E: Dissolving Field (Quiet, spacious atmospheric dispersal)
  vec3 getDissolvingField(vec3 seed, float t) {
    float expansion = 1.0 + (seed.x + seed.y) * 0.32;
    float dissX = (seed.x - 0.5) * 150.0 * expansion + sin(t * 0.15 + seed.z * 4.0) * 6.0;
    float dissY = (seed.y - 0.5) * 105.0 * expansion + cos(t * 0.13 + seed.x * 4.0) * 6.0;
    float dissZ = (seed.z - 0.5) * 60.0 - 12.0;
    return vec3(dissX, dissY, dissZ);
  }

  void main() {
    vLayer = aLayer;
    float effectiveTime = uTime;

    float mobility = 0.26 + aLayer * 0.36;

    // 1. CALCULATE 5 CONTINUOUS STATES
    vec3 posA = getAmbientField(position, aSeed, effectiveTime, mobility);
    vec3 posB = getFlowingWaves(aSeed, effectiveTime);
    vec3 posC = getSpatialTunnel(aSeed, effectiveTime);
    vec3 posD = getOrbitalStructures(aSeed, effectiveTime);
    vec3 posE = getDissolvingField(aSeed, effectiveTime);

    // 2. SMOOTH C-INFINITY MORPHING ACROSS SCROLL PROGRESS
    float p = clamp(uScrollProgress, 0.0, 1.0);
    float distA = abs(p - 0.04);
    float distB = abs(p - 0.26);
    float distC = abs(p - 0.50);
    float distD = abs(p - 0.74);
    float distE = abs(p - 0.96);

    float wA = exp(-distA * distA * 36.0);
    float wB = exp(-distB * distB * 36.0);
    float wC = exp(-distC * distC * 36.0);
    float wD = exp(-distD * distD * 36.0);
    float wE = exp(-distE * distE * 36.0);

    float totalW = wA + wB + wC + wD + wE + 0.0001;
    wA /= totalW;
    wB /= totalW;
    wC /= totalW;
    wD /= totalW;
    wE /= totalW;

    vec3 pos = posA * wA + posB * wB + posC * wC + posD * wD + posE * wE;

    // Vertical scroll parallax & momentum impulse
    pos.y += uScrollOffset * (0.030 + aLayer * 0.040);
    pos.y += uScrollVel * (0.055 + aLayer * 0.070);

    // Screen-space NDC projection
    vec4 projected = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vec2 ndc = projected.xy / projected.w;

    // =========================================================================
    // 3. CURSOR INTERACTION (SMOOTH DEFLECTION & LIGHT WAKE)
    // =========================================================================
    vec2 aspectVec = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 pointerDiff = (ndc - uPointer) * aspectVec;
    float distToPointer = length(pointerDiff);

    float radius = uPointerRadius; // Smooth NDC radius (~140px)
    float cursorGlow = 0.0;

    if (distToPointer < radius && distToPointer > 0.0001 && uPointerActive > 0.001) {
      float tDist = 1.0 - (distToPointer / radius);
      float falloff = tDist * tDist * (3.0 - 2.0 * tDist) * uPointerActive;

      vec2 repulseDir = normalize(pointerDiff);
      float depthFactor = (0.35 + aLayer * 0.45);

      vec2 repulseDisp = repulseDir * (falloff * uPointerForce * depthFactor);

      float velMag = length(uPointerVel);
      vec2 velDir = velMag > 0.001 ? normalize(uPointerVel) : vec2(0.0);
      vec2 velWake = velDir * (falloff * clamp(velMag * 0.28, 0.0, 0.18) * depthFactor);

      pos.xy += (repulseDisp + velWake) * (projected.w * 0.38);
      pos.z -= falloff * 5.0 * depthFactor;

      cursorGlow = falloff * 0.35;
    }

    // Click shockwave pulse
    if (uShockTime > 0.0 && uShockTime < 1.0) {
      vec2 shockDiff = (ndc - uShockOrigin) * aspectVec;
      float shockDist = length(shockDiff);
      float waveRadius = uShockTime * 0.85;
      float waveThickness = 0.12;
      float waveDelta = abs(shockDist - waveRadius);
      if (waveDelta < waveThickness) {
        float waveStrength = (1.0 - waveDelta / waveThickness) * (1.0 - uShockTime / 1.0);
        vec2 waveDir = normalize(shockDiff + 0.0001);
        pos.xy += waveDir * (waveStrength * 5.0 * (0.50 + aLayer * 0.35));
        cursorGlow += waveStrength * 0.45;
      }
    }

    // Recalculate MVP position after physical displacements
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // =========================================================================
    // 4. POINT SIZING (HIGH VISIBILITY + CRISP PHYSICAL PIXELS)
    // =========================================================================
    float distanceCam = -mvPosition.z;
    float perspectiveScale = clamp(70.0 / max(distanceCam, 10.0), 0.78, 1.25);
    float speedSizeBoost = 1.0 + clamp(uScrollSpeedNorm * 0.12, 0.0, 0.18);

    float cssDiameter = aSize * perspectiveScale * uSizeVariation * speedSizeBoost;
    // Calibrated range: 1.0 px to 2.6 px
    cssDiameter = clamp(cssDiameter, 0.95, 2.60);

    // Convert CSS pixels directly to physical device pixels via uPixelRatio
    float physicalSize = cssDiameter * uPixelRatio;
    // Guaranteed crisp rendering: clamp between 1.8px physical and 5.5px physical
    gl_PointSize = clamp(physicalSize, 1.8, 5.5 * uPixelRatio * uSizeVariation);

    // =========================================================================
    // 5. RADIANT TWINKLE & SHINE SCINTILLATION
    // =========================================================================
    float twinklePhase = effectiveTime * (2.2 + aSeed.y * 3.2) + aSeed.x * 62.83;
    float twinkle = pow(max(0.0, sin(twinklePhase)), 6.0);
    vTwinkle = twinkle * (0.6 + aSeed.z * 0.4);

    float depthAlpha = 0.75 + 0.25 * smoothstep(-110.0, -30.0, mvPosition.z);
    float pulse = 0.92 + 0.08 * sin(effectiveTime * 0.65 + aSeed.z * 10.0);

    // Final alpha output (rich, clear presence)
    vAlpha = clamp((aAlpha * depthAlpha * pulse + cursorGlow + vTwinkle * 0.3) * uOpacity, 0.0, 1.0);

    // =========================================================================
    // 6. HIGH-CONTRAST LUMINOUS PALETTE
    // Brilliant silver, crisp platinum, and celestial diamond white
    // =========================================================================
    vec3 distantSilver = vec3(0.68, 0.74, 0.84);  // Luminous cool silver
    vec3 midPlatinum   = vec3(0.85, 0.90, 0.98);  // Crisp radiant platinum
    vec3 nearDiamond   = vec3(0.98, 0.99, 1.00);  // Pure crystalline diamond white

    vec3 baseCol;
    if (aLayer < 0.5) {
      baseCol = distantSilver;
    } else if (aLayer < 1.5) {
      baseCol = mix(distantSilver, midPlatinum, 0.75);
    } else {
      baseCol = mix(midPlatinum, nearDiamond, 0.85);
    }

    // Barely-there section tone accent
    vColor = mix(baseCol, uThemeColor, 0.06);
  }
`;

const fragmentShader = `
  uniform float uOpacity;

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    // Coordinate normalized to [-0.5, 0.5] from center of point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    // Strict circular discard
    if (dist > 0.5) {
      discard;
    }

    // =========================================================================
    // OPTICAL DIAMOND SPECULAR SHINE & STAR DIFFRACTION RAYS
    // Produces genuine crystalline shine, sparkle, and radiant specular facets
    // =========================================================================
    // 1. Sharp optical 4-point diamond star cross rays
    float rayH = exp(-abs(coord.y) * 22.0) * max(0.0, 1.0 - abs(coord.x) * 2.2);
    float rayV = exp(-abs(coord.x) * 22.0) * max(0.0, 1.0 - abs(coord.y) * 2.2);
    float starFlare = (rayH + rayV) * 0.70;

    // 2. Diagonal glint facets for sparkling scintillation
    vec2 diag = vec2(coord.x + coord.y, coord.x - coord.y) * 0.7071;
    float diagRay1 = exp(-abs(diag.y) * 28.0) * max(0.0, 1.0 - abs(diag.x) * 2.5);
    float diagRay2 = exp(-abs(diag.x) * 28.0) * max(0.0, 1.0 - abs(diag.y) * 2.5);
    float diamondGlint = (diagRay1 + diagRay2) * 0.40;

    // 3. Intense needle-point specular core
    float specularCore = exp(-dist * 10.0) * 1.6;

    // 4. Smooth circular disc perimeter
    float outerDisc = smoothstep(0.50, 0.20, dist);

    // 5. Total combined optical shine
    float shine = specularCore 
                + starFlare * (0.75 + vTwinkle * 1.5) 
                + diamondGlint * (0.45 + vTwinkle * 1.0) 
                + outerDisc * 0.45;

    // 6. Brilliant pure white diamond highlight in center
    vec3 pureWhite = vec3(1.0, 1.0, 1.0);
    float whiteness = clamp(specularCore * 1.3 + vTwinkle * 0.6, 0.0, 1.0);
    vec3 finalColor = mix(vColor, pureWhite, whiteness);

    float finalAlpha = clamp(vAlpha * (shine * 0.75 + outerDisc * 0.35) * uOpacity, 0.0, 1.0);

    if (finalAlpha < 0.008) {
      discard;
    }

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export const MotionParticleWorld: React.FC<MotionParticleWorldProps> = ({
  opacity = 1.0,
  sizeVariation = 1.0,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const opacityRef = useRef(opacity);
  const sizeVariationRef = useRef(sizeVariation);

  useEffect(() => {
    opacityRef.current = opacity;
    sizeVariationRef.current = sizeVariation;
  }, [opacity, sizeVariation]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === 'undefined') return;

    // WebGL support verification
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) return;
    } catch {
      return;
    }

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(46, width / height, 1, 300);
    camera.position.set(0, 0, 70);

    // 2. Crisp WebGL Renderer Setup with Additive Tone
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0); // 100% transparent clear color
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const domCanvas = renderer.domElement;
    domCanvas.style.position = 'absolute';
    domCanvas.style.top = '0';
    domCanvas.style.left = '0';
    domCanvas.style.width = '100%';
    domCanvas.style.height = '100%';
    domCanvas.style.pointerEvents = 'none';
    container.appendChild(domCanvas);

    // =========================================================================
    // 3. EXPANDED GENERATIVE BUFFERGEOMETRY (5,200 SHINING PARTICLES)
    // =========================================================================
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const layers = new Float32Array(PARTICLE_COUNT);
    const seeds = new Float32Array(PARTICLE_COUNT * 3);
    const alphas = new Float32Array(PARTICLE_COUNT);

    const spreadX = 96;
    const spreadY = 68;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const seedVal = Math.random();

      // Layer Distribution for Rich Depth & High Visibility:
      // - Distant (~74%): 1.05–1.45 CSS px, Alpha: 0.42–0.60
      // - Main Stream (~20%): 1.50–1.95 CSS px, Alpha: 0.65–0.82
      // - Highlight Star (~6%): 2.00–2.55 CSS px, Alpha: 0.85–0.98
      let layer = 0;
      let zMin = -54;
      let zMax = -22;
      let cssSize = 1.05 + Math.random() * 0.40;   // 1.05 – 1.45 CSS px
      let alphaBase = 0.44 + Math.random() * 0.16; // 0.44 – 0.60 opacity

      if (seedVal > 0.94) {
        // HIGHLIGHT STAR LAYER (6%)
        layer = 2;
        zMin = -8;
        zMax = 14;
        cssSize = 2.05 + Math.random() * 0.48;     // 2.05 – 2.53 CSS px
        alphaBase = 0.85 + Math.random() * 0.12;   // 0.85 – 0.97 opacity
      } else if (seedVal > 0.74) {
        // MAIN STREAM LAYER (20%)
        layer = 1;
        zMin = -24;
        zMax = -6;
        cssSize = 1.50 + Math.random() * 0.45;     // 1.50 – 1.95 CSS px
        alphaBase = 0.66 + Math.random() * 0.16;   // 0.66 – 0.82 opacity
      }

      // =======================================================================
      // SPATIAL COMPOSITION:
      // 45% wide atmospheric constellation + 55% flowing organic wave streams
      // =======================================================================
      let x: number;
      let y: number;

      if (i % 9 < 4) {
        // Wide ambient celestial constellation across entire viewport
        const rad = Math.sqrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        x = rad * Math.cos(theta) * spreadX;
        y = rad * Math.sin(theta) * spreadY;
      } else {
        // Dual undulating diagonal flowing generative streams
        const streamSide = i % 2 === 0 ? 1 : -1;
        const streamT = (Math.random() - 0.5) * 2.0;
        const ribbonSpread = (Math.random() - 0.5) * 26.0;

        x = streamT * spreadX * 0.94 + (Math.random() - 0.5) * 16.0;
        y = (streamT * 0.48 + streamSide * 0.22) * spreadY 
          + Math.sin(streamT * 3.4) * 14.0 
          + ribbonSpread;
      }

      const z = zMin + Math.random() * (zMax - zMin);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      layers[i] = layer;
      sizes[i] = cssSize;
      alphas[i] = alphaBase;

      seeds[i3] = Math.random();
      seeds[i3 + 1] = Math.random();
      seeds[i3 + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));

    // 4. Custom Shader Material with Additive Blending
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerVel: { value: new THREE.Vector2(0, 0) },
      uPointerRadius: { value: 0.20 },     // Smooth localized force field (~140px)
      uPointerForce: { value: 0.14 },      // Gentle, restrained localized push
      uPointerActive: { value: 0.0 },      // Smooth fade for enter/leave
      uScrollOffset: { value: 0 },
      uScrollVel: { value: 0 },
      uScrollProgress: { value: 0 },
      uScrollSpeedNorm: { value: 0 },
      uShockTime: { value: -1 },
      uShockOrigin: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: pixelRatio },  // DPR calibrated
      uThemeColor: { value: new THREE.Color(0xc2ccdb) }, // Radiant platinum
      uOpacity: { value: opacityRef.current },
      uSizeVariation: { value: sizeVariationRef.current },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 5. Interaction Tracking & Physics State
    let targetPointerX = 0;
    let targetPointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;
    let pointerVelX = 0;
    let pointerVelY = 0;
    let targetPointerActive = 0.0;
    let smoothPointerActive = 0.0;

    let targetScrollY = 0;
    let smoothScrollY = 0;
    let targetScrollProgress = 0;
    let smoothScrollProgress = 0;
    let scrollVel = 0;
    let rawScrollSpeed = 0;
    let smoothScrollSpeedNorm = 0;

    let shockStartTime = -1;
    const targetColor = new THREE.Color(0xc2ccdb);

    // Window pointer activity listeners
    const onPointerEnter = () => {
      targetPointerActive = 1.0;
    };
    const onPointerLeave = () => {
      targetPointerActive = 0.0;
    };
    const onPointerMoveWindow = () => {
      targetPointerActive = 1.0;
    };

    window.addEventListener('pointerenter', onPointerEnter, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('pointermove', onPointerMoveWindow, { passive: true });

    // Listen to SingularityInteractionEngine
    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPointerX = state.ndcX;
      targetPointerY = state.ndcY;
      targetScrollY = state.scrollY;
      targetScrollProgress = state.scrollProgress;
      rawScrollSpeed = Math.abs(state.scrollVelocity || state.smoothedScrollVelocity || 0);

      targetPointerActive = 1.0;

      if (state.lastClickTime > 0) {
        shockStartTime = state.lastClickTime / 1000;
        uniforms.uShockOrigin.value.set(state.ndcX, state.ndcY);
      }

      // Restrained section theme adaptation (brilliant platinum/silver nuances)
      const secName = state.sectionTheme?.name || 'hero';
      if (secName === 'hero') {
        targetColor.setHex(0xc2ccdb); // Platinum silver
      } else if (secName === 'about') {
        targetColor.setHex(0xa8b1bf); // Cool graphite
      } else if (secName === 'projects' || secName === 'capabilities') {
        targetColor.setHex(0xb2b9c7); // Slate titanium
      } else if (secName === 'engineering') {
        targetColor.setHex(0xc8d2e2); // Arctic platinum
      } else if (secName === 'constellation' || secName === 'digital-dna') {
        targetColor.setHex(0xd0d8e8); // Brilliant silver
      } else if (secName === 'writing') {
        targetColor.setHex(0xa4abb8); // Quiet steel
      } else if (secName === 'contact') {
        targetColor.setHex(0xd8e0ee); // Pearl silver
      }
    });

    // 6. Handle Window Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pr);
      uniforms.uResolution.value.set(w, h);
      uniforms.uPixelRatio.value = pr;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // WebGL Context Recovery
    let rafId: number;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(rafId);
    };

    const handleContextRestored = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      rafId = requestAnimationFrame(animate);
    };

    domCanvas.addEventListener('webglcontextlost', handleContextLost, false);
    domCanvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 7. Animation Loop (Delta-Time Based)
    let prevTime = performance.now();

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);

      const dt = Math.min(Math.max((time - prevTime) / 1000, 0.001), 0.08);
      prevTime = time;

      const seconds = time * 0.001;
      uniforms.uTime.value = seconds;

      uniforms.uOpacity.value = opacityRef.current;
      uniforms.uSizeVariation.value = sizeVariationRef.current;

      // Smooth pointer presence
      smoothPointerActive += (targetPointerActive - smoothPointerActive) * (dt * 7.5);
      uniforms.uPointerActive.value = smoothPointerActive;

      // Pointer interpolation
      const oldX = smoothPointerX;
      const oldY = smoothPointerY;
      smoothPointerX += (targetPointerX - smoothPointerX) * 0.12;
      smoothPointerY += (targetPointerY - smoothPointerY) * 0.12;

      pointerVelX = (smoothPointerX - oldX) / dt;
      pointerVelY = (smoothPointerY - oldY) / dt;

      uniforms.uPointer.value.set(smoothPointerX, smoothPointerY);
      uniforms.uPointerVel.value.set(pointerVelX * 0.012, pointerVelY * 0.012);

      // Scroll interpolation
      const oldScroll = smoothScrollY;
      smoothScrollY += (targetScrollY - smoothScrollY) * 0.10;
      scrollVel = (smoothScrollY - oldScroll) * 0.018;

      // Dynamic velocity calculation
      const deltaScrollSpeed = Math.abs(smoothScrollY - oldScroll) / dt;
      const combinedScrollSpeed = Math.max(deltaScrollSpeed, rawScrollSpeed * 60.0);
      const targetSpeedNorm = Math.min(combinedScrollSpeed / 1200.0, 1.5);
      smoothScrollSpeedNorm += (targetSpeedNorm - smoothScrollSpeedNorm) * 0.10;
      uniforms.uScrollSpeedNorm.value = smoothScrollSpeedNorm;

      // Viewport scroll progress fallback
      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const directProgress = Math.min(Math.max((window.scrollY || 0) / docHeight, 0), 1);
      const activeProgressTarget = targetScrollProgress > 0 ? targetScrollProgress : directProgress;
      smoothScrollProgress += (activeProgressTarget - smoothScrollProgress) * 0.08;

      uniforms.uScrollOffset.value = -smoothScrollY * 0.010;
      uniforms.uScrollVel.value = -scrollVel;
      uniforms.uScrollProgress.value = smoothScrollProgress;

      // Shockwave timing
      if (shockStartTime > 0) {
        const shockElapsed = seconds - shockStartTime;
        if (shockElapsed > 1.2) {
          uniforms.uShockTime.value = -1;
        } else {
          uniforms.uShockTime.value = shockElapsed;
        }
      }

      uniforms.uThemeColor.value.lerp(targetColor, 0.03);

      // Subtle scene camera breathing
      camera.position.x += (smoothPointerX * 1.6 - camera.position.x) * 0.03;
      camera.position.y += (smoothPointerY * 1.2 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      unsubscribe();
      window.removeEventListener('pointerenter', onPointerEnter);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointermove', onPointerMoveWindow);
      window.removeEventListener('resize', handleResize);
      domCanvas.removeEventListener('webglcontextlost', handleContextLost);
      domCanvas.removeEventListener('webglcontextrestored', handleContextRestored);
      cancelAnimationFrame(rafId);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(domCanvas)) {
        container.removeChild(domCanvas);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={mountRef}
      className={`MotionParticleWorld fixed inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden ${className}`.trim()}
      style={{
        contain: 'strict',
      }}
    />
  );
};

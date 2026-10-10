import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { interactionEngine } from '../../context/SingularityInteractionEngine';

/**
 * LIVING DIGITAL MATTER — HIGH-END MOTION PARTICLE WORLD
 * 
 * Clean, Precision Rendering:
 * - Direct WebGL rendering with high clarity (zero heavy post-processing bloom haze)
 * - Anti-aliased soft circular particle discs with crisp diamond/specular cores
 * - Custom Uniforms:
 *   - uOpacity: Global opacity control for subtle to pronounced luminous presence
 *   - uSizeVariation: Point size scaling and depth spread variation
 * - Physical cursor field: radial repulsion with cubic falloff, water-like wake displacement
 * - Click shockwave: expanding refraction wave with particle crest
 * - Procedural 3D morphing: AMBIENT fluid -> WAVE ribbon -> CELESTIAL SPHERE -> CONSTELLATION lattice
 * - Section-aware chromatic shifts and atmospheric modulation
 * - Outside React render cycle (zero state updates per particle)
 * - Layered at z-[1] (above background vignette, below interactive content)
 * - pointer-events: none (completely unobtrusive, custom cursor authoritative)
 */

export interface MotionParticleWorldProps {
  opacity?: number;
  sizeVariation?: number;
  className?: string;
}

const PARTICLE_COUNT = 3800;

const vertexShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;        // Normalized [-1, 1] screen coords
  uniform vec2 uPointerVel;     // Cursor velocity
  uniform float uPointerRadius; // World radius of influence
  uniform float uPointerForce;  // Repulsion force
  uniform float uScrollOffset;  // Scroll parallax offset
  uniform float uScrollVel;     // Scroll impulse
  uniform float uScrollProgress;// Normalized scroll position [0.0 to 1.0]
  uniform float uShockTime;     // Time since last click
  uniform vec2 uShockOrigin;    // Click origin in NDC [-1, 1]
  uniform float uPixelRatio;
  uniform float uMorphState;    // 0 = Ambient, 1 = Wave, 2 = Sphere, 3 = Constellation
  uniform float uMorphWeight;   // 0.0 to 1.0 transition blend
  uniform vec3 uThemeColor;     // Dynamic section accent
  uniform float uOpacity;       // Custom uniform for overall opacity
  uniform float uSizeVariation; // Custom uniform for point size variation

  attribute float aSize;
  attribute float aLayer;       // 0 = FAR, 1 = MID, 2 = NEAR
  attribute vec3 aSeed;         // Unique per-particle phase, speed & rotation seed
  attribute float aAlpha;

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vSparkle;
  varying vec3 vSeed;

  // GLSL 3D Simplex-like noise helper for organic fluid currents
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

  // Curl-like fluid flow derivative approximation
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
    return vec3(x, y, z) * 0.5;
  }

  // Procedural 3D Formations
  vec3 getTargetFormation(vec3 basePos, vec3 seed, float t, float state) {
    // 1.0 = WAVE (Undulating oceanic ribbon across space)
    if (state < 1.5) {
      float waveX = (seed.x - 0.5) * 130.0;
      float waveY = sin(waveX * 0.045 + t * 0.5) * 16.0 + (seed.y - 0.5) * 22.0;
      float waveZ = cos(waveX * 0.04 + t * 0.4) * 14.0 + (seed.z - 0.5) * 15.0;
      return vec3(waveX, waveY, waveZ);
    }
    // 2.0 = CELESTIAL SPHERE / ORBIT
    else if (state < 2.5) {
      float theta = seed.x * 6.28318 + t * 0.12;
      float phi = (seed.y - 0.5) * 3.14159;
      float r = 26.0 + seed.z * 10.0;
      return vec3(
        r * cos(phi) * cos(theta),
        r * sin(phi) * 0.9,
        r * cos(phi) * sin(theta) - 5.0
      );
    }
    // 3.0 = CONSTELLATION / GEOMETRIC LATTICE
    else {
      float col = floor(seed.x * 12.0) - 6.0;
      float row = floor(seed.y * 8.0) - 4.0;
      float nodeX = col * 12.0 + mod(row, 2.0) * 6.0 + sin(t * 0.3 + seed.z * 6.0) * 3.0;
      float nodeY = row * 10.0 + cos(t * 0.25 + seed.x * 6.0) * 3.0;
      float nodeZ = (seed.z - 0.5) * 24.0;
      return vec3(nodeX, nodeY, nodeZ);
    }
  }

  void main() {
    vLayer = aLayer;
    vSeed = aSeed;
    vec3 pos = position;

    // Mobility coefficients per depth layer
    float mobility = 0.28 + aLayer * 0.42;
    float timeScale = 0.038 * (0.65 + aSeed.x * 0.35);

    // 1. Large-scale evolving 3D curl flow field
    vec3 noiseCoord = pos * 0.025 + vec3(aSeed.y * 8.0, aSeed.z * 8.0, 0.0);
    vec3 flow = curlNoise(noiseCoord, uTime * timeScale);

    // Continuous laminar drift + organic sinusoids
    pos.x += flow.x * (18.0 * mobility) + sin(uTime * 0.22 + aSeed.x * 6.28) * (3.5 * mobility);
    pos.y += flow.y * (16.0 * mobility) + cos(uTime * 0.20 + aSeed.y * 6.28) * (3.5 * mobility);
    pos.z += flow.z * (12.0 * mobility);

    // 2. Procedural Morphing Transition
    if (uMorphWeight > 0.001) {
      vec3 targetPos = getTargetFormation(position, aSeed, uTime, uMorphState);
      pos = mix(pos, targetPos, uMorphWeight * (0.65 + aLayer * 0.2));
    }

    // 3. Vertical scroll parallax & momentum impulse
    pos.y += uScrollOffset * (0.045 + aLayer * 0.06);
    pos.y += uScrollVel * (0.09 + aLayer * 0.12);

    // Screen-space NDC projection of particle
    vec4 projected = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vec2 ndc = projected.xy / projected.w;

    // Aspect ratio corrected distance
    vec2 aspectVec = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 pointerDiff = (ndc - uPointer) * aspectVec;
    float distToPointer = length(pointerDiff);

    // 4. CURSOR PHYSICAL FORCE & FLUID REVOLUTION
    float radius = uPointerRadius; // NDC radius (~180-220px)
    float cursorGlow = 0.0;

    if (distToPointer < radius && distToPointer > 0.0001) {
      float t = 1.0 - (distToPointer / radius);
      float falloff = t * t * (3.0 - 2.0 * t);

      vec2 dir = normalize(pointerDiff);
      float depthFactor = (0.35 + aLayer * 0.45);

      vec2 displacement = dir * (falloff * uPointerForce * depthFactor);
      vec2 velNorm = length(uPointerVel) > 0.001 ? normalize(uPointerVel) : vec2(0.0);
      vec2 wake = velNorm * (falloff * 0.18 * depthFactor);

      pos.xy += (displacement + wake) * (projected.w * 0.50);
      pos.z -= falloff * 9.0 * depthFactor;

      cursorGlow = falloff * 0.65;
    }

    // 5. CLICK SHOCKWAVE PULSE
    if (uShockTime > 0.0 && uShockTime < 1.4) {
      vec2 shockDiff = (ndc - uShockOrigin) * aspectVec;
      float shockDist = length(shockDiff);
      float waveRadius = uShockTime * 0.95;
      float waveThickness = 0.14;
      float waveDelta = abs(shockDist - waveRadius);
      if (waveDelta < waveThickness) {
        float waveStrength = (1.0 - waveDelta / waveThickness) * (1.0 - uShockTime / 1.4);
        vec2 waveDir = normalize(shockDiff + 0.0001);
        pos.xy += waveDir * (waveStrength * 16.0 * (0.55 + aLayer * 0.4));
        pos.z += sin(uShockTime * 4.5) * 8.0;
        cursorGlow += waveStrength * 0.8;
      }
    }

    // Recalculate MVP position after physical displacements
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // 6. POINT SIZE ATTENUATION WITH CUSTOM SIZE VARIATION UNIFORM
    // Base size modulated by individual seed variation and the uSizeVariation uniform
    float seedVariation = 0.80 + aSeed.y * 0.40;
    float baseSize = aSize * seedVariation * uSizeVariation;
    gl_PointSize = baseSize * (220.0 / -mvPosition.z) * uPixelRatio;
    // Clamped comfortably with size variation scaling
    gl_PointSize = clamp(gl_PointSize, 2.5 * uSizeVariation, 26.0 * uSizeVariation);

    // 7. OPTICAL SHINE & SCINTILLATION (TWINKLE)
    float sparklePhase = uTime * (1.6 + aSeed.y * 2.4) + aSeed.x * 62.83;
    float sparkle = pow(max(0.0, sin(sparklePhase)), 10.0);
    vSparkle = sparkle;

    // Depth alpha attenuation
    float depthAlpha = 0.52 + 0.48 * smoothstep(-135.0, -45.0, mvPosition.z);

    // Ambient breathing oscillation
    float pulse = 0.88 + 0.12 * sin(uTime * 0.75 + aSeed.z * 14.0);

    // Calculate alpha with custom uOpacity uniform modulation
    vAlpha = clamp((aAlpha * depthAlpha * pulse + cursorGlow + sparkle * 0.5) * uOpacity, 0.05, 1.0);

    // 8. SCROLL-DRIVEN SUBTLE COLOR-SHIFTING CYCLE: COLD BLUE -> VIBRANT CYAN
    // Progressively shifts from cold blue hues at top to vibrant cyan tones as user scrolls
    float seedPhase = (aSeed.x - 0.5) * 0.18 + (aSeed.y - 0.5) * 0.10;
    float harmonicBreathe = sin(uTime * 0.35 + aSeed.z * 6.28) * 0.05;
    float scrollProg = clamp(uScrollProgress, 0.0, 1.0);
    // Smooth, cinematic cycle progression with organic particle phase dispersion
    float cycleT = clamp(smoothstep(0.0, 0.88, scrollProg) + seedPhase + harmonicBreathe, 0.0, 1.0);

    // COLD BLUE SPECTRUM (Scroll position = 0 / Hero & top)
    // Deep, crystalline glacial blues with pristine depth
    vec3 coldBlueFar  = vec3(0.20, 0.42, 0.82); // Cold glacial cobalt
    vec3 coldBlueMid  = vec3(0.38, 0.62, 0.96); // Luminous arctic ice blue
    vec3 coldBlueNear = vec3(0.72, 0.86, 1.00); // Crisp celestial diamond blue

    // VIBRANT CYAN SPECTRUM (Lower scroll positions / Mid-to-bottom sections)
    // Luminous, vibrant electric cyan and radiant aqua
    vec3 cyanFar  = vec3(0.02, 0.64, 0.84);     // Deep electric ocean cyan
    vec3 cyanMid  = vec3(0.12, 0.88, 0.98);     // Vibrant radiant cyan
    vec3 cyanNear = vec3(0.58, 0.98, 1.00);     // Brilliant luminous aquamarine diamond

    // Interpolate per depth layer across the scroll color-shift cycle
    vec3 shiftedFar  = mix(coldBlueFar, cyanFar, cycleT);
    vec3 shiftedMid  = mix(coldBlueMid, cyanMid, cycleT);
    vec3 shiftedNear = mix(coldBlueNear, cyanNear, cycleT);

    vec3 baseCol;
    if (aLayer < 0.5) {
      baseCol = shiftedFar;
    } else if (aLayer < 1.5) {
      baseCol = mix(shiftedFar, shiftedMid, 0.65);
    } else {
      baseCol = mix(shiftedMid, shiftedNear, 0.85);
    }

    // Blend gently with section theme accent while preserving cold blue -> vibrant cyan cycle
    vColor = mix(baseCol, uThemeColor, 0.14);
  }
`;

const fragmentShader = `
  uniform float uOpacity;       // Custom uniform for opacity
  uniform float uSizeVariation; // Custom uniform for point size variation

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vSparkle;
  varying vec3 vSeed;

  void main() {
    // Coordinate normalized to [-0.5, 0.5] from center of point sprite
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    // Circular point boundary clipping with smooth anti-aliased edge
    if (dist > 0.5) {
      discard;
    }

    // Normalized radial distance factor: 1.0 at center, 0.0 at outer boundary
    float radialFactor = clamp(1.0 - dist * 2.0, 0.0, 1.0);

    // =========================================================================
    // CLEAN, CRISP PARTICLE SHAPING (No excessive bloom haze)
    // =========================================================================
    // Crisp, natural disc falloff: sharp anti-aliased edge with smooth inner falloff
    float disc = smoothstep(0.5, 0.28, dist);

    // Subtle gentle specular core for elegant luxury shine
    float coreNucleus = smoothstep(0.18, 0.0, dist) * (1.2 + vSparkle * 0.8);

    // Subtle natural light intensity without milky over-saturation
    float intensity = disc + coreNucleus * 0.5;

    // Pristine diamond center mix
    vec3 hotCore = vec3(1.0, 1.0, 1.0);
    float coreMix = clamp(coreNucleus * 0.8 + vSparkle * 0.6, 0.0, 1.0);
    vec3 finalColor = mix(vColor, hotCore, coreMix);

    // Multiply by alpha and opacity uniform
    float finalAlpha = clamp(vAlpha * intensity * uOpacity, 0.0, 0.95);

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

    // WebGL support check
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
    const camera = new THREE.PerspectiveCamera(48, width / height, 1, 300);
    camera.position.set(0, 0, 70);

    // 2. Direct Crisp WebGL Renderer Setup (No heavy post-processing bloom haze)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% transparent clear color
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const domCanvas = renderer.domElement;
    domCanvas.style.position = 'absolute';
    domCanvas.style.top = '0';
    domCanvas.style.left = '0';
    domCanvas.style.width = '100%';
    domCanvas.style.height = '100%';
    domCanvas.style.pointerEvents = 'none';
    container.appendChild(domCanvas);

    // 3. BufferGeometry & Attributes
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const layers = new Float32Array(PARTICLE_COUNT);
    const seeds = new Float32Array(PARTICLE_COUNT * 3);
    const alphas = new Float32Array(PARTICLE_COUNT);

    // Distribution bounds in 3D camera frustum
    const spreadX = 92;
    const spreadY = 66;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      const randLayer = Math.random();
      let layer = 0; // FAR
      let zMin = -55;
      let zMax = -25;
      let sizeBase = 2.8;
      let alphaBase = 0.65;

      if (randLayer > 0.82) {
        layer = 2; // NEAR
        zMin = 0;
        zMax = 18;
        sizeBase = 5.8;
        alphaBase = 0.95;
      } else if (randLayer > 0.50) {
        layer = 1; // MID
        zMin = -25;
        zMax = 0;
        sizeBase = 4.0;
        alphaBase = 0.80;
      }

      // Natural central clustering with organic boundary dispersion
      const rad = Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const x = rad * Math.cos(theta) * spreadX;
      const y = rad * Math.sin(theta) * spreadY;
      const z = zMin + Math.random() * (zMax - zMin);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      layers[i] = layer;
      sizes[i] = sizeBase * (0.85 + Math.random() * 0.45);
      alphas[i] = alphaBase * (0.80 + Math.random() * 0.35);

      seeds[i3] = Math.random();
      seeds[i3 + 1] = Math.random();
      seeds[i3 + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));

    // 4. Custom Shader Material with Additive Blending & Custom Uniforms
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerVel: { value: new THREE.Vector2(0, 0) },
      uPointerRadius: { value: 0.30 }, // NDC radius (~180-220px)
      uPointerForce: { value: 0.22 },  // Smooth physical repulsion
      uScrollOffset: { value: 0 },
      uScrollVel: { value: 0 },
      uScrollProgress: { value: 0 },   // Scroll-driven color shift uniform [0..1]
      uShockTime: { value: -1 },
      uShockOrigin: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uMorphState: { value: 0 },       // 0: Ambient, 1: Wave, 2: Sphere, 3: Constellation
      uMorphWeight: { value: 0 },      // 0 to 1
      uThemeColor: { value: new THREE.Color(0x7ea7ff) },
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

    let targetScrollY = 0;
    let smoothScrollY = 0;
    let targetScrollProgress = 0;
    let smoothScrollProgress = 0;
    let scrollVel = 0;

    let shockStartTime = -1;

    // Morph state animation
    let currentMorphState = 0;
    let targetMorphWeight = 0;
    let currentMorphWeight = 0;

    const targetColor = new THREE.Color(0x7ea7ff);

    // Listen to SingularityInteractionEngine
    const unsubscribe = interactionEngine.subscribe((state) => {
      targetPointerX = state.ndcX;
      targetPointerY = state.ndcY;
      targetScrollY = state.scrollY;
      targetScrollProgress = state.scrollProgress;

      if (state.lastClickTime > 0) {
        shockStartTime = state.lastClickTime / 1000;
        uniforms.uShockOrigin.value.set(state.ndcX, state.ndcY);
      }

      // Section-aware morphology & color adaptation
      const secName = state.sectionTheme?.name || 'hero';
      if (secName === 'hero') {
        currentMorphState = 0;
        targetMorphWeight = 0.0;
        targetColor.setHex(0x7ea7ff);
      } else if (secName === 'about') {
        currentMorphState = 1;
        targetMorphWeight = 0.35;
        targetColor.setHex(0x6366f1);
      } else if (secName === 'projects' || secName === 'capabilities') {
        currentMorphState = 1;
        targetMorphWeight = 0.45;
        targetColor.setHex(0x38bdf8);
      } else if (secName === 'engineering') {
        currentMorphState = 3;
        targetMorphWeight = 0.50;
        targetColor.setHex(0x2563eb);
      } else if (secName === 'constellation' || secName === 'digital-dna') {
        currentMorphState = 2;
        targetMorphWeight = 0.55;
        targetColor.setHex(0xa855f7);
      } else if (secName === 'writing') {
        currentMorphState = 0;
        targetMorphWeight = 0.15;
        targetColor.setHex(0x94a3b8);
      } else if (secName === 'contact') {
        currentMorphState = 2;
        targetMorphWeight = 0.40;
        targetColor.setHex(0x14b8a6);
      }
    });

    // 6. Handle Window Resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
      uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // WebGL Context Recovery
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

    // 7. Animation Loop (Outside React Render Loop)
    let rafId: number;
    let prevTime = performance.now();

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);

      const dt = Math.min((time - prevTime) / 1000, 0.08);
      prevTime = time;

      const seconds = time * 0.001;
      uniforms.uTime.value = seconds;

      // Sync custom uniform props
      uniforms.uOpacity.value = opacityRef.current;
      uniforms.uSizeVariation.value = sizeVariationRef.current;

      // Smooth pointer lerp
      const oldX = smoothPointerX;
      const oldY = smoothPointerY;
      smoothPointerX += (targetPointerX - smoothPointerX) * 0.14;
      smoothPointerY += (targetPointerY - smoothPointerY) * 0.14;

      // Pointer velocity in NDC
      pointerVelX = (smoothPointerX - oldX) / Math.max(dt, 0.001);
      pointerVelY = (smoothPointerY - oldY) / Math.max(dt, 0.001);

      uniforms.uPointer.value.set(smoothPointerX, smoothPointerY);
      uniforms.uPointerVel.value.set(pointerVelX * 0.015, pointerVelY * 0.015);

      // Smooth scroll lerp
      const oldScroll = smoothScrollY;
      smoothScrollY += (targetScrollY - smoothScrollY) * 0.1;
      scrollVel = (smoothScrollY - oldScroll) * 0.02;

      // Calculate scroll progress with real-time viewport fallback
      const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const directProgress = Math.min(Math.max((window.scrollY || 0) / docHeight, 0), 1);
      const activeProgressTarget = targetScrollProgress > 0 ? targetScrollProgress : directProgress;
      smoothScrollProgress += (activeProgressTarget - smoothScrollProgress) * 0.08;

      // Normalize scroll offset and progress to uniforms
      uniforms.uScrollOffset.value = -smoothScrollY * 0.012;
      uniforms.uScrollVel.value = -scrollVel;
      uniforms.uScrollProgress.value = smoothScrollProgress;

      // Shockwave timing
      if (shockStartTime > 0) {
        const shockElapsed = seconds - shockStartTime;
        if (shockElapsed > 1.5) {
          uniforms.uShockTime.value = -1;
        } else {
          uniforms.uShockTime.value = shockElapsed;
        }
      }

      // Smooth morph weight lerp
      currentMorphWeight += (targetMorphWeight - currentMorphWeight) * 0.035;
      uniforms.uMorphState.value = currentMorphState;
      uniforms.uMorphWeight.value = currentMorphWeight;

      // Smooth theme color lerp
      uniforms.uThemeColor.value.lerp(targetColor, 0.04);

      // Subtle scene camera breathing & inclination based on pointer
      camera.position.x += (smoothPointerX * 2.8 - camera.position.x) * 0.04;
      camera.position.y += (smoothPointerY * 2.2 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Clean direct rendering: crisp, anti-aliased luxury matter without blooming haze
      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      unsubscribe();
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

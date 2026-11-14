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

// ============================================================================
// PURE DOT & FINE SAND MILKY WAY GALAXY SHADER (Zero shadow/cloud planes)
// ============================================================================
const STAR_VERTEX_SHADER = /* glsl */ `
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

  attribute float aLayer;    // 0: Galactic Bulge & Bar, 1: Spiral Arm Stars, 2: Fine Flowing Galactic Sand, 3: Deep Celestial Stars
  attribute float aRadius;   // Normalized galactic radius [0..1.15]
  attribute float aAngle;    // Initial polar angle
  attribute float aHeight;   // Vertical disk height
  attribute float aSize;     // Grain / star dot size
  attribute float aSparkle;  // 0..1: brilliance / crisp star glint
  attribute float aColorKey; // 0..1: stellar color palette blend

  varying float vAlpha;
  varying float vColorKey;
  varying float vSparkle;
  varying float vLayer;
  varying float vBoost;
  varying float vTwinkle;

  mat2 rot2(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    float motion = mix(1.0, 0.14, uReducedMotion);
    float t = uTime * motion;
    float s = uScrollProgress;
    float velKick = clamp(uScrollVelocity * 0.0045, -0.55, 0.55) * motion;

    vec3 p = vec3(0.0);
    float baseAlpha = 0.78;
    float boost = 0.0;

    if (aLayer < 2.5) {
      // Differential galactic rotation + visible continuous spin & fly-through on scroll
      float orbitalRate = (0.038 / (0.28 + aRadius * 0.92)) * motion;
      float scrollSpin = s * (2.65 + (1.0 - min(aRadius, 1.0)) * 1.15) + velKick * 0.85;
      float theta = aAngle + t * orbitalRate + scrollSpin;

      float rWorld = aRadius * mix(10.8, 13.6, clamp(uAspect - 0.7, 0.0, 1.0));
      float xPlane = cos(theta) * rWorld;
      float zPlane = sin(theta) * rWorld;

      // Central barred galactic bulge elongation
      if (aLayer < 0.5) {
        vec2 barPos = rot2(0.38) * vec2(xPlane * 1.42, zPlane * 0.68);
        xPlane = barPos.x;
        zPlane = barPos.y;
      }

      // Subtle S-shaped galactic disk wave + fine sand drift harmonic
      float sandDrift = aLayer > 1.5
        ? sin(theta * 3.0 - t * 0.55 + aRadius * 8.0) * 0.18
        : 0.0;
      float warp = sin(theta * 2.0 + rWorld * 0.34 - t * 0.22) * 0.24 * smoothstep(2.2, 9.5, rWorld);
      float yPlane = aHeight + warp + sandDrift;

      vec3 galPos = vec3(xPlane, yPlane, zPlane);

      // Synced 3D tilt/bank transformation driven smoothly by scroll progress
      float pitchX = 1.14 - sin(s * 3.14159) * 0.46 + s * 0.14;
      float bankZ  = -0.36 + s * 0.62 + sin(t * 0.1) * 0.03;

      float cx = cos(pitchX), sx = sin(pitchX);
      vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

      float cz = cos(bankZ), sz = sin(bankZ);
      p = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

      // Synchronized spatial travel during scroll
      p.x += 0.15 - sin(s * 4.2) * 1.4;
      p.y += 0.05 + cos(s * 3.5) * 0.7 - s * 0.55;
      p.z -= 1.35 + sin(s * 2.8) * 1.1;

      if (aLayer < 0.5) {
        // Dense Golden Core Dots
        baseAlpha = mix(0.98, 0.62, smoothstep(0.0, 0.30, aRadius));
        boost = 0.52 * (1.0 - smoothstep(0.0, 0.25, aRadius));
      } else if (aLayer < 1.5) {
        // Crisp Spiral Arm Stars & Spur Dots
        baseAlpha = mix(0.94, 0.42, smoothstep(0.18, 1.08, aRadius));
        boost = aSparkle * 0.55;
      } else {
        // Fine Luminous Galactic Sand Grains along the spiral streams
        baseAlpha = mix(0.76, 0.32, smoothstep(0.08, 1.05, aRadius));
        boost = 0.28;
      }
    } else {
      // Layer 3: Deep Parallax Foreground & Outer Halo Dots
      p = position;
      p.x += sin(t * 0.06 + aAngle) * 0.3 - sin(s * 3.14159) * 1.8;
      p.y += cos(t * 0.05 + aRadius * 6.0) * 0.25 - s * 3.4;
      p.z += s * 1.6;
      baseAlpha = mix(0.42, 0.90, aSparkle);
      boost = aSparkle * 0.34;
    }

    // Smooth pointer gravitational eddy
    float halfW = max(12.2 * max(uAspect, 0.85), 10.0);
    vec2 pointerWorld = vec2(uPointer.x * halfW * 0.78, uPointer.y * 6.8);
    vec2 toStar = p.xy - pointerWorld;
    float pDist = length(toStar);
    float wakeRadius = 4.0 + uPointerEnergy * 2.0;
    float wake = smoothstep(wakeRadius, 0.0, pDist) * (0.42 + uPointerEnergy * 0.85);

    if (wake > 0.001) {
      vec2 radialDir = pDist > 0.001 ? toStar / pDist : vec2(0.0, 1.0);
      vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
      float swirl = wake * (1.0 + uPointerEnergy * 0.85);
      p.xy += radialDir * (wake * 0.8) + tangentDir * (sin(swirl) * 0.78);
      p.z += wake * 1.35;
    }

    // Click Supernova Ripple Wave
    float ripple = 0.0;
    if (uClickAge > 0.0 && uClickAge < 2.4) {
      vec2 clickWorld = vec2(uClickOrigin.x * halfW * 0.78, uClickOrigin.y * 6.8);
      float cDist = length(p.xy - clickWorld);
      float waveFront = uClickAge * 10.8;
      float band = exp(-pow((cDist - waveFront) * 0.88, 2.0));
      float fade = 1.0 - smoothstep(0.0, 2.4, uClickAge);
      ripple = band * fade;
      vec2 cDir = cDist > 0.001 ? (p.xy - clickWorld) / cDist : vec2(1.0, 0.0);
      p.xy += cDir * ripple * 1.25;
      p.z += ripple * 1.8;
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

    // Bright across opening screen & transparent PORTFOLIO cutout; gently soften in center during scrolled sections
    vec2 ndcPos = gl_Position.xy / max(gl_Position.w, 0.001);
    float centerDist = length(ndcPos * vec2(0.85, 1.15));
    float readDim = smoothstep(0.08, 0.38, uScrollProgress);
    float centerFloor = mix(0.98, 0.60, readDim);
    float centerBalance = mix(centerFloor, 1.0, smoothstep(0.08, 0.74, centerDist));

    float twinkle = 0.76 + 0.24 * sin(t * (1.4 + aColorKey * 2.9) + aAngle * 15.1 + aRadius * 29.7);
    float perspectiveScale = 22.0 / max(-mvPosition.z, 3.0);

    // Pure crisp dots & fine sand grains (zero giant cloud smudges)
    float isSand = (aLayer > 1.5 && aLayer < 2.5) ? 1.0 : 0.0;
    float starFlare = (1.0 - isSand) * mix(1.0, 1.75, smoothstep(0.84, 1.0, aSparkle)) + isSand;
    float interactiveScale = 1.0 + wake * 0.45 + ripple * 0.65 + rocketGlow * 0.75 + abs(velKick) * 0.22;

    float ptSize = aSize * starFlare * perspectiveScale * uPixelRatio * interactiveScale * (0.94 + 0.06 * twinkle);
    float maxPt = mix(11.5 * uPixelRatio, 4.2 * uPixelRatio, isSand);

    gl_PointSize = clamp(ptSize, 1.1 * uPixelRatio, maxPt);

    vAlpha = clamp((baseAlpha * centerBalance + wake * 0.4 + ripple * 0.6 + rocketGlow * 0.65) * uGlowIntensity, 0.0, 1.0);
    vColorKey = aColorKey;
    vSparkle = aSparkle;
    vLayer = aLayer;
    vBoost = clamp(boost + wake * 0.65 + ripple * 0.9 + rocketGlow, 0.0, 1.6);
    vTwinkle = twinkle;
  }
`;

const STAR_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  uniform float uGlowIntensity;
  uniform vec3 uCoreGold;
  uniform vec3 uArmBlue;
  uniform vec3 uNebulaRose;
  uniform vec3 uSectionAccent;

  varying float vAlpha;
  varying float vColorKey;
  varying float vSparkle;
  varying float vLayer;
  varying float vBoost;
  varying float vTwinkle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv) * 2.0; // 0 center .. 1 edge
    if (r > 1.0) discard;

    // Stellar dot & fine sand grain spectral palette
    vec3 starColor;
    if (vLayer < 0.5) {
      // Warm golden-ivory galactic bulge dots
      starColor = mix(vec3(1.0, 0.96, 0.86), uCoreGold, smoothstep(0.12, 0.88, vColorKey));
    } else if (vLayer < 1.5) {
      // Spiral arms: brilliant blue-white OB dots, diamond white stars, warm gold & subtle rose pockets
      vec3 blueWhite = mix(vec3(0.95, 0.97, 1.0), uArmBlue, smoothstep(0.18, 0.72, vColorKey));
      vec3 warmGiant = mix(blueWhite, uCoreGold, smoothstep(0.70, 0.88, vColorKey));
      vec3 h2Tint = mix(warmGiant, uNebulaRose, smoothstep(0.88, 1.0, vColorKey));
      starColor = mix(h2Tint, uSectionAccent, 0.12 + vBoost * 0.16);
    } else if (vLayer < 2.5) {
      // Fine champagne-silver & cyan-tinted cosmic sand particles
      vec3 sandMix = mix(uCoreGold, vec3(0.92, 0.95, 1.0), smoothstep(0.15, 0.68, vColorKey));
      starColor = mix(sandMix, uArmBlue, smoothstep(0.68, 1.0, vColorKey) * 0.72);
    } else {
      // Deep halo stars
      starColor = mix(vec3(0.92, 0.95, 1.0), uCoreGold, step(0.76, vColorKey) * 0.65);
    }

    float intensity = 0.0;
    if (vLayer > 1.5 && vLayer < 2.5) {
      // Crisp micro sand grain dot (sharp falloff, zero haze)
      intensity = smoothstep(1.0, 0.18, r) * 0.92 * uGlowIntensity;
    } else {
      // Crisp luminous star dot + tight airy glow + subtle diffraction spike on brightest stars
      float core = exp(-r * r * 18.0);
      float tightHalo = exp(-r * r * 5.2) * (0.20 + 0.34 * smoothstep(0.62, 1.0, vSparkle) + vBoost * 0.18);

      float glintMask = smoothstep(0.92, 1.0, vSparkle);
      float spikeX = exp(-abs(uv.y) * 34.0) * exp(-abs(uv.x) * 4.8);
      float spikeY = exp(-abs(uv.x) * 34.0) * exp(-abs(uv.y) * 4.8);
      float spikes = (spikeX + spikeY) * 0.42 * glintMask * vTwinkle;

      intensity = (core + tightHalo + spikes) * uGlowIntensity;
      starColor = mix(starColor, vec3(0.99, 0.99, 1.0), clamp(core * 0.82 + spikes * 0.5, 0.0, 0.96));
    }

    float finalAlpha = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
    if (finalAlpha < 0.008) discard;

    gl_FragColor = vec4(starColor, finalAlpha);
  }
`;

export const MilkyWayGalaxy: React.FC<MilkyWayGalaxyProps> = ({
  opacity = 0.96,
  glowIntensity = 1.24,
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
    camera.position.set(0, 0, 14.2);

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

    // Deterministic PRNG + Gaussian scatter for rich Milky Way spiral & sand distribution
    let seed = 791347;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const randGauss = () => {
      const u1 = Math.max(rand(), 1e-6);
      const u2 = rand();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };

    const particleCount = isMobile ? 14000 : 28000;
    const positions = new Float32Array(particleCount * 3);
    const aLayer = new Float32Array(particleCount);
    const aRadius = new Float32Array(particleCount);
    const aAngle = new Float32Array(particleCount);
    const aHeight = new Float32Array(particleCount);
    const aSize = new Float32Array(particleCount);
    const aSparkle = new Float32Array(particleCount);
    const aColorKey = new Float32Array(particleCount);

    const mainArms = 2;
    const tightness = 3.45;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const roll = rand();

      if (roll < 0.22) {
        // 0: Dense Golden Galactic Core & Central Bar Dots
        aLayer[i] = 0;
        const r = Math.pow(rand(), 1.9) * 0.28;
        aRadius[i] = r;
        aAngle[i] = rand() * Math.PI * 2;
        aHeight[i] = randGauss() * (0.48 * (1.0 - r * 2.0));
        aSparkle[i] = rand();
        aSize[i] = aSparkle[i] > 0.91 ? 1.35 + rand() * 0.85 : 0.45 + rand() * 0.65;
        aColorKey[i] = rand();
      } else if (roll < 0.66) {
        // 1: Crisp Two Main Spiral Arms + Two Secondary Arms & Spur Dots
        aLayer[i] = 1;
        const r = 0.09 + Math.pow(rand(), 0.94) * 1.04;
        const isSecondary = rand() < 0.38;
        const armIdx = i % mainArms;
        const baseAngle =
          (armIdx / mainArms) * Math.PI * 2 + (isSecondary ? Math.PI * 0.5 : 0);

        const spiralTwist = Math.log(1.0 + r * 5.2) * tightness;
        const armSpread = (isSecondary ? 0.26 : 0.16) + r * 0.24;
        const isSpur = rand() < 0.22;
        const angle =
          baseAngle +
          spiralTwist +
          randGauss() * armSpread +
          (isSpur ? (rand() - 0.5) * 0.85 : 0);

        aRadius[i] = r;
        aAngle[i] = angle;
        aHeight[i] = randGauss() * (0.09 + 0.20 * r);
        aSparkle[i] = rand();
        aSize[i] =
          aSparkle[i] > 0.92
            ? 1.5 + rand() * 1.05
            : aSparkle[i] > 0.72
            ? 0.9 + rand() * 0.65
            : 0.42 + rand() * 0.52;
        aColorKey[i] = Math.min(Math.max(r * 0.45 + rand() * 0.58, 0), 1);
      } else if (roll < 0.88) {
        // 2: Fine Flowing Galactic Sand Grains tracing the Milky Way disk & arms
        aLayer[i] = 2;
        const r = 0.04 + Math.pow(rand(), 0.88) * 1.0;
        const armIdx = i % 4;
        const baseAngle = (armIdx / 4) * Math.PI * 2;
        const spiralTwist = Math.log(1.0 + r * 5.2) * tightness;
        aRadius[i] = r;
        aAngle[i] = baseAngle + spiralTwist + randGauss() * 0.34;
        aHeight[i] = randGauss() * 0.16;
        aSparkle[i] = rand();
        aSize[i] = 0.42 + rand() * 0.62;
        aColorKey[i] = Math.min(Math.max(r * 0.65 + rand() * 0.38, 0), 1);
      } else {
        // 3: Deep Parallax Foreground & Outer Halo Dots
        aLayer[i] = 3;
        positions[i3] = (rand() - 0.5) * 38.0;
        positions[i3 + 1] = (rand() - 0.5) * 24.0;
        positions[i3 + 2] = -16.0 + rand() * 20.0;
        aRadius[i] = rand();
        aAngle[i] = rand() * Math.PI * 2;
        aHeight[i] = 0;
        aSparkle[i] = rand();
        aSize[i] = aSparkle[i] > 0.89 ? 1.3 + rand() * 0.85 : 0.38 + rand() * 0.52;
        aColorKey[i] = rand();
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(aLayer, 1));
    geometry.setAttribute('aRadius', new THREE.BufferAttribute(aRadius, 1));
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(aAngle, 1));
    geometry.setAttribute('aHeight', new THREE.BufferAttribute(aHeight, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geometry.setAttribute('aSparkle', new THREE.BufferAttribute(aSparkle, 1));
    geometry.setAttribute('aColorKey', new THREE.BufferAttribute(aColorKey, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60);

    const accentTarget = new THREE.Color(0x38bdf8);
    const accentCurrent = new THREE.Color(0x38bdf8);

    const material = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX_SHADER,
      fragmentShader: STAR_FRAGMENT_SHADER,
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
        uCoreGold: { value: new THREE.Color(0xf6ca84) },
        uArmBlue: { value: new THREE.Color(0x7ad6ff) },
        uNebulaRose: { value: new THREE.Color(0xe57fa6) },
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

      // Cinematic curved 3D scroll fly-through across the Milky Way galaxy
      const sp = smoothedScrollProgress;
      const camX = smoothedPointerX * 0.65 - Math.sin(sp * Math.PI * 1.4) * 2.1;
      const camY = smoothedPointerY * 0.38 + Math.sin(sp * Math.PI * 2.0) * 1.15 - sp * 0.45;
      const camZ = 14.2 - Math.sin(sp * Math.PI) * 3.1;
      camera.position.set(camX, camY, camZ);

      const lookX = -Math.sin(sp * 3.2) * 0.65;
      const lookY = -sp * 0.45;
      camera.lookAt(lookX, lookY, -1.2);

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

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

const VERTEX_SHADER = /* glsl */ `
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

  attribute float aLayer;    // 0: Galactic Core & Bar, 1: Spiral Arms, 2: Glowing Nebula Clouds, 3: Deep Celestial Stars
  attribute float aRadius;   // Normalized galactic radius [0..1+]
  attribute float aAngle;    // Initial galactic polar angle
  attribute float aHeight;   // Vertical thickness offset above/below galactic disk
  attribute float aSize;     // Base particle radius
  attribute float aSparkle;  // 0..1: star brilliance / diffraction glint probability
  attribute float aColorKey; // 0..1: spectral stellar temperature (warm core -> blue-white arm -> violet nebula)

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
    float scrollSpin = uScrollProgress * 0.85 + clamp(uScrollVelocity * 0.0025, -0.35, 0.35);

    vec3 p = vec3(0.0);
    float baseAlpha = 0.7;
    float boost = 0.0;

    if (aLayer < 2.5) {
      // Differential galactic rotation: inner bulge rotates smoothly faster than outer halo
      float angularSpeed = (0.042 / (0.35 + aRadius * 0.92)) * motion;
      float theta = aAngle + t * angularSpeed + scrollSpin * (0.4 + 0.6 * (1.0 - min(aRadius, 1.0)));

      float rWorld = aRadius * mix(9.8, 12.6, clamp(uAspect - 0.7, 0.0, 1.0));
      float xPlane = cos(theta) * rWorld;
      float zPlane = sin(theta) * rWorld;

      // Slight barred-spiral elongation inside the inner galactic core
      if (aLayer < 0.5) {
        vec2 barPos = rot2(0.35) * vec2(xPlane * 1.38, zPlane * 0.72);
        xPlane = barPos.x;
        zPlane = barPos.y;
      }

      // Gentle vertical undulation of the Milky Way galactic warp
      float warp = sin(theta * 2.0 + rWorld * 0.32 - t * 0.25) * 0.28 * smoothstep(2.5, 9.0, rWorld);
      float yPlane = aHeight + warp;

      vec3 galPos = vec3(xPlane, yPlane, zPlane);

      // Sculpted cinematic Milky Way orientation: diagonal grand sweep across viewport
      float pitchX = 1.06 + uScrollProgress * 0.24; // ~61 deg tilt showing spiral structure + core depth
      float bankZ  = -0.42 + sin(t * 0.12) * 0.04;

      // Tilt around X
      float cx = cos(pitchX), sx = sin(pitchX);
      vec3 tilted = vec3(galPos.x, galPos.y * cx - galPos.z * sx, galPos.y * sx + galPos.z * cx);

      // Bank diagonally around Z
      float cz = cos(bankZ), sz = sin(bankZ);
      p = vec3(tilted.x * cz - tilted.y * sz, tilted.x * sz + tilted.y * cz, tilted.z);

      // Slight offset so the radiant core frames editorial typography gracefully
      p.x += 0.85;
      p.y += 0.25 - uScrollProgress * 0.9;
      p.z -= 1.2;

      if (aLayer < 0.5) {
        // Galactic Bulge & Bar
        baseAlpha = mix(0.95, 0.52, smoothstep(0.0, 0.32, aRadius));
        boost = 0.55 * (1.0 - smoothstep(0.0, 0.28, aRadius));
      } else if (aLayer < 1.5) {
        // Luminous Spiral Arms & Star Clusters
        baseAlpha = mix(0.88, 0.36, smoothstep(0.18, 1.05, aRadius));
        boost = aSparkle * 0.55;
      } else {
        // Soft Volumetric Nebula Dust Cloud Band
        baseAlpha = mix(0.24, 0.09, smoothstep(0.1, 1.0, aRadius));
        boost = 0.25;
      }
    } else {
      // Layer 3: Deep Foreground/Background Celestial Starfield
      p = position;
      p.x += sin(t * 0.08 + aAngle) * 0.35;
      p.y += cos(t * 0.07 + aRadius * 6.0) * 0.3 - uScrollProgress * 1.4;
      baseAlpha = mix(0.32, 0.82, aSparkle);
      boost = aSparkle * 0.35;
    }

    // Interactive gravitational swirl around the rocket cursor
    float halfW = max(12.0 * max(uAspect, 0.85), 10.0);
    vec2 pointerWorld = vec2(uPointer.x * halfW * 0.78, uPointer.y * 6.8);
    vec2 toStar = p.xy - pointerWorld;
    float pDist = length(toStar);
    float wakeRadius = 4.2 + uPointerEnergy * 2.0;
    float wake = smoothstep(wakeRadius, 0.0, pDist) * (0.48 + uPointerEnergy * 0.95);

    if (wake > 0.001) {
      vec2 radialDir = pDist > 0.001 ? toStar / pDist : vec2(0.0, 1.0);
      vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
      float swirl = wake * (1.1 + uPointerEnergy * 0.9);
      p.xy += radialDir * (wake * 0.95) + tangentDir * (sin(swirl) * 0.88);
      p.z += wake * 1.5;
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
      p.xy += cDir * ripple * 1.35;
      p.z += ripple * 1.9;
    }

    // Rocket Launch Shockwave Wake ('R' key)
    float rocketGlow = 0.0;
    if (uRocketActive > 0.5) {
      vec3 rOff = p - uRocketPos * vec3(0.28, 0.28, 0.35);
      float rDist = length(rOff);
      float rInf = exp(-rDist * 0.32) * uRocketWake;
      vec3 pushDir = rDist > 0.001 ? rOff / rDist : vec3(0.0, 1.0, 0.0);
      p += pushDir * rInf * 3.0;
      rocketGlow = clamp(rInf * 1.4, 0.0, 1.0);
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Gentle readability breathing room directly under central foreground headline
    vec2 ndcPos = gl_Position.xy / max(gl_Position.w, 0.001);
    float centerDist = length(ndcPos * vec2(0.85, 1.15));
    float centerBalance = mix(0.66, 1.0, smoothstep(0.08, 0.72, centerDist));

    float twinkle = 0.72 + 0.28 * sin(t * (1.5 + aColorKey * 3.2) + aAngle * 13.7 + aRadius * 31.4);
    float perspectiveScale = 23.0 / max(-mvPosition.z, 3.0);

    float nebulaScale = aLayer > 1.5 && aLayer < 2.5 ? 4.4 : 1.0;
    float starFlare = aLayer < 1.5 || aLayer > 2.5 ? mix(1.0, 2.35, smoothstep(0.76, 1.0, aSparkle)) : 1.0;
    float interactiveScale = 1.0 + wake * 0.55 + ripple * 0.8 + rocketGlow * 0.85;

    float ptSize = aSize * nebulaScale * starFlare * perspectiveScale * uPixelRatio * interactiveScale * (0.92 + 0.08 * twinkle);
    float maxPt = (aLayer > 1.5 && aLayer < 2.5) ? 46.0 * uPixelRatio : 20.0 * uPixelRatio;

    gl_PointSize = clamp(ptSize, 1.35 * uPixelRatio, maxPt);

    vAlpha = clamp((baseAlpha * centerBalance + wake * 0.42 + ripple * 0.62 + rocketGlow * 0.68) * uGlowIntensity, 0.0, 1.0);
    vColorKey = aColorKey;
    vSparkle = aSparkle;
    vLayer = aLayer;
    vBoost = clamp(boost + wake * 0.7 + ripple * 0.95 + rocketGlow, 0.0, 1.6);
    vTwinkle = twinkle;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  uniform float uGlowIntensity;
  uniform vec3 uCoreGold;
  uniform vec3 uArmBlue;
  uniform vec3 uNebulaViolet;
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

    // Color synthesis across stellar populations
    vec3 starColor;
    if (vLayer < 0.5) {
      // Radiant champagne-gold galactic core & warm giant bulge
      starColor = mix(vec3(1.0, 0.96, 0.86), uCoreGold, smoothstep(0.15, 0.85, vColorKey));
    } else if (vLayer < 1.5) {
      // Spiral arms: brilliant blue-white young stars, cyan nurseries, subtle gold giants
      vec3 blueWhite = mix(vec3(0.92, 0.96, 1.0), uArmBlue, smoothstep(0.15, 0.75, vColorKey));
      vec3 nebulaTint = mix(blueWhite, uNebulaViolet, smoothstep(0.72, 1.0, vColorKey));
      starColor = mix(nebulaTint, uSectionAccent, 0.18 + vBoost * 0.22);
    } else if (vLayer < 2.5) {
      // Volumetric Milky Way nebula clouds (amber core haze -> sapphire/violet arm mist)
      vec3 haze = mix(uCoreGold * 0.92, uNebulaViolet, smoothstep(0.12, 0.78, vColorKey));
      starColor = mix(haze, uArmBlue, smoothstep(0.65, 1.0, vColorKey) * 0.65);
    } else {
      // Deep celestial starfield
      starColor = mix(vec3(0.88, 0.93, 1.0), uCoreGold, step(0.82, vColorKey) * 0.6);
    }

    float intensity = 0.0;
    if (vLayer > 1.5 && vLayer < 2.5) {
      // Soft atmospheric nebula cloud gaussian falloff (zero sharp edges)
      intensity = exp(-r * r * 3.6) * 0.45 * uGlowIntensity;
    } else {
      // Crisp luminous star core + soft halo + subtle 4-point optical diffraction spikes on bright stars
      float core = exp(-r * r * 16.0);
      float halo = exp(-r * r * 3.8) * (0.28 + 0.46 * smoothstep(0.55, 1.0, vSparkle) + vBoost * 0.22);

      float glintMask = smoothstep(0.89, 1.0, vSparkle);
      float spikeX = exp(-abs(uv.y) * 28.0) * exp(-abs(uv.x) * 4.2);
      float spikeY = exp(-abs(uv.x) * 28.0) * exp(-abs(uv.y) * 4.2);
      float spikes = (spikeX + spikeY) * 0.55 * glintMask * vTwinkle;

      intensity = (core + halo + spikes) * uGlowIntensity;
      starColor = mix(starColor, vec3(0.99, 0.99, 1.0), clamp(core * 0.75 + spikes * 0.55, 0.0, 0.94));
    }

    float finalAlpha = clamp(intensity * vAlpha * uOpacity, 0.0, 1.0);
    if (finalAlpha < 0.005) discard;

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

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 0, 14.5);

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

    // Deterministic PRNG + Gaussian helper for realistic spiral arm scatter
    let seed = 420619;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const randGauss = () => {
      const u1 = Math.max(rand(), 1e-6);
      const u2 = rand();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };

    const particleCount = isMobile ? 9000 : 17500;
    const positions = new Float32Array(particleCount * 3);
    const aLayer = new Float32Array(particleCount);
    const aRadius = new Float32Array(particleCount);
    const aAngle = new Float32Array(particleCount);
    const aHeight = new Float32Array(particleCount);
    const aSize = new Float32Array(particleCount);
    const aSparkle = new Float32Array(particleCount);
    const aColorKey = new Float32Array(particleCount);

    const armCount = 4;
    const armTightness = 3.25;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const roll = rand();

      if (roll < 0.22) {
        // 0: Radiant Galactic Core & Central Bar
        aLayer[i] = 0;
        const r = Math.pow(rand(), 1.85) * 0.28;
        aRadius[i] = r;
        aAngle[i] = rand() * Math.PI * 2;
        aHeight[i] = randGauss() * (0.58 * (1.0 - r * 2.2));
        aSparkle[i] = rand();
        aSize[i] = aSparkle[i] > 0.9 ? 1.55 + rand() * 1.1 : 0.65 + rand() * 0.85;
        aColorKey[i] = rand();
      } else if (roll < 0.68) {
        // 1: Logarithmic Milky Way Spiral Arms + Trailing Spurs
        aLayer[i] = 1;
        const r = 0.12 + Math.pow(rand(), 0.92) * 0.98;
        const armIndex = i % armCount;
        const armBaseAngle = (armIndex / armCount) * Math.PI * 2;
        // Classic logarithmic spiral twist + organic star-cluster scatter
        const spiralTwist = Math.log(1.0 + r * 5.2) * armTightness;
        const angularSpread = randGauss() * (0.22 + r * 0.28);
        // Occasional inter-arm spur stars for natural Milky Way richness
        const isSpur = rand() < 0.18;
        const angle =
          armBaseAngle +
          spiralTwist +
          angularSpread +
          (isSpur ? (rand() - 0.5) * 0.9 : 0);

        aRadius[i] = r;
        aAngle[i] = angle;
        aHeight[i] = randGauss() * (0.14 + 0.26 * r);
        aSparkle[i] = rand();
        aSize[i] =
          aSparkle[i] > 0.91
            ? 1.7 + rand() * 1.35
            : aSparkle[i] > 0.72
            ? 1.1 + rand() * 0.8
            : 0.55 + rand() * 0.65;
        aColorKey[i] = Math.min(Math.max(r * 0.6 + rand() * 0.45, 0), 1);
      } else if (roll < 0.86) {
        // 2: Volumetric Milky Way Nebula Dust Clouds (gives luminous misty band glow)
        aLayer[i] = 2;
        const r = 0.06 + Math.pow(rand(), 0.95) * 0.94;
        const armIndex = i % armCount;
        const armBaseAngle = (armIndex / armCount) * Math.PI * 2;
        const spiralTwist = Math.log(1.0 + r * 5.2) * armTightness;
        aRadius[i] = r;
        aAngle[i] = armBaseAngle + spiralTwist + randGauss() * 0.34;
        aHeight[i] = randGauss() * 0.24;
        aSparkle[i] = rand();
        aSize[i] = 1.6 + rand() * 1.9;
        aColorKey[i] = Math.min(Math.max(r * 0.75 + rand() * 0.3, 0), 1);
      } else {
        // 3: Deep Celestial Starfield & Distant Halo Clusters
        aLayer[i] = 3;
        positions[i3] = (rand() - 0.5) * 34.0;
        positions[i3 + 1] = (rand() - 0.5) * 20.0;
        positions[i3 + 2] = -14.0 + rand() * 18.0;
        aRadius[i] = rand();
        aAngle[i] = rand() * Math.PI * 2;
        aHeight[i] = 0;
        aSparkle[i] = rand();
        aSize[i] = aSparkle[i] > 0.88 ? 1.45 + rand() * 1.1 : 0.45 + rand() * 0.65;
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
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 50);

    const accentTarget = new THREE.Color(0x38bdf8);
    const accentCurrent = new THREE.Color(0x38bdf8);

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
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
        uCoreGold: { value: new THREE.Color(0xf4cf8b) },     // Warm golden galactic bulge
        uArmBlue: { value: new THREE.Color(0x60d2ff) },      // Luminous blue-cyan star nurseries
        uNebulaViolet: { value: new THREE.Color(0x8b7cf8) }, // Deep cosmic indigo-violet dust
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

      const dampFactor = 1 - Math.exp(-8.5 * dt);
      smoothedPointerX += (s.ndcX - smoothedPointerX) * dampFactor;
      smoothedPointerY += (s.ndcY - smoothedPointerY) * dampFactor;
      smoothedScrollProgress +=
        (s.scrollProgress - smoothedScrollProgress) * (1 - Math.exp(-6.0 * dt));

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

      // Gentle 3D galactic vantage parallax responding to cursor & scroll
      camera.position.x = smoothedPointerX * 0.65;
      camera.position.y = smoothedPointerY * 0.38 - smoothedScrollProgress * 0.7;
      camera.lookAt(0, -smoothedScrollProgress * 0.55, 0);

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

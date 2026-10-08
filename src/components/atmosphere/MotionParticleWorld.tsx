import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { interactionEngine } from '../../context/SingularityInteractionEngine';

/**
 * LIVING DIGITAL MATTER PARTICLE WORLD
 * 
 * High-End Motion Particle System
 * - GPU-accelerated THREE.Points with custom ShaderMaterial
 * - Procedural 3D Simplex/Curl-like fluid flow field
 * - Multi-depth layering: FAR (dim, slow), MID (subtle flow), NEAR (responsive, fluid)
 * - Radial cursor force field: smooth repulsion + physical wake displacement & return
 * - Subtle organic luminance breathing, depth falloff, and natural convergence/divergence
 * - Scroll parallax and velocity momentum
 * - Click shockwave propagation
 * - Strictly non-obtrusive, elegant, luxury aesthetic (neutral white/silver with subtle warm/cool sheen)
 * - Outside React render cycle (zero state updates per particle)
 * - pointer-events: none (completely unclickable, purely visual depth)
 */

const PARTICLE_COUNT = 3200;

const vertexShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;        // Normalized [-1, 1] screen coords
  uniform vec2 uPointerVel;     // Cursor velocity
  uniform float uPointerRadius; // World radius of influence
  uniform float uPointerForce;  // Repulsion force
  uniform float uScrollOffset;  // Scroll parallax offset
  uniform float uScrollVel;     // Scroll impulse
  uniform float uShockTime;     // Time since last click
  uniform vec2 uShockOrigin;    // Click origin in NDC [-1, 1]
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aLayer;       // 0 = FAR, 1 = MID, 2 = NEAR
  attribute vec3 aSeed;         // Unique per-particle phase & speed seed
  attribute float aAlpha;

  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;
  varying float vDistToCenter;

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

  void main() {
    vLayer = aLayer;
    vec3 pos = position;

    // Layer-based mobility coefficients
    // FAR (0.0): slowest, subtle micro-drift
    // MID (1.0): moderate flowing current
    // NEAR (2.0): fluid, dynamic, highly responsive
    float mobility = 0.25 + aLayer * 0.45;
    float timeScale = 0.035 * (0.6 + aSeed.x * 0.4);

    // 1. Large-scale evolving 3D flow field
    vec3 noiseCoord = pos * 0.028 + vec3(aSeed.y * 10.0, aSeed.z * 10.0, 0.0);
    vec3 flow = curlNoise(noiseCoord, uTime * timeScale);

    // Continuous laminar drift + smooth sinusoids
    pos.x += flow.x * (18.0 * mobility) + sin(uTime * 0.2 + aSeed.x * 6.28) * (3.0 * mobility);
    pos.y += flow.y * (16.0 * mobility) + cos(uTime * 0.18 + aSeed.y * 6.28) * (3.0 * mobility);
    pos.z += flow.z * (12.0 * mobility);

    // 2. Vertical scroll parallax
    pos.y += uScrollOffset * (0.04 + aLayer * 0.05);
    pos.y += uScrollVel * (0.08 + aLayer * 0.1);

    // Screen-space NDC projection of particle
    vec4 projected = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vec2 ndc = projected.xy / projected.w;

    // Aspect ratio corrected distance
    vec2 aspectVec = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 pointerDiff = (ndc - uPointer) * aspectVec;
    float distToPointer = length(pointerDiff);

    // 3. CURSOR PHYSICAL FORCE & FLUID REVOLUTION
    // Radius of influence in screen-space NDC
    float radius = uPointerRadius; // e.g. ~0.35 NDC (scaled to screen)
    if (distToPointer < radius && distToPointer > 0.0001) {
      // Smooth cubic falloff curve: 1.0 at center, 0.0 at perimeter
      float t = 1.0 - (distToPointer / radius);
      float falloff = t * t * (3.0 - 2.0 * t); // smoothstep-like cubic

      // Repulsion direction away from cursor
      vec2 dir = normalize(pointerDiff);

      // Depth responsiveness: NEAR particles react 2.5x stronger than FAR
      float depthFactor = (0.35 + aLayer * 0.45);

      // Radial displacement
      vec2 displacement = dir * (falloff * uPointerForce * depthFactor);

      // Digital wake: particle is pushed along velocity tangential wake
      vec2 velNorm = length(uPointerVel) > 0.001 ? normalize(uPointerVel) : vec2(0.0);
      vec2 wake = velNorm * (falloff * 0.15 * depthFactor);

      // Apply screen-space displacement back to 3D world space
      pos.xy += (displacement + wake) * (projected.w * 0.45);
      // Slight push into depth for authentic 3D spatial parting
      pos.z -= falloff * 8.0 * depthFactor;
    }

    // 4. CLICK SHOCKWAVE PULSE
    if (uShockTime > 0.0 && uShockTime < 1.4) {
      vec2 shockDiff = (ndc - uShockOrigin) * aspectVec;
      float shockDist = length(shockDiff);
      // Expanding wave ring
      float waveRadius = uShockTime * 0.9;
      float waveThickness = 0.12;
      float waveDelta = abs(shockDist - waveRadius);
      if (waveDelta < waveThickness) {
        float waveStrength = (1.0 - waveDelta / waveThickness) * (1.0 - uShockTime / 1.4);
        vec2 waveDir = normalize(shockDiff + 0.0001);
        pos.xy += waveDir * (waveStrength * 14.0 * (0.5 + aLayer * 0.35));
        pos.z += sin(uShockTime * 4.0) * 6.0;
      }
    }

    // Recalculate MVP position after physical displacements
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // 5. POINT SIZE ATTENUATION WITH DEPTH
    // Perspective attenuation: size shrinks naturally as Z recedes
    float baseSize = aSize;
    // Scale for device pixel ratio
    gl_PointSize = baseSize * (160.0 / -mvPosition.z) * uPixelRatio;
    // Clamp to aesthetic ranges: never huge blocks, never invisible subpixels
    gl_PointSize = clamp(gl_PointSize, 1.2, 10.0);

    // 6. LUMINANCE & OPACITY HIERARCHY
    // Distance from camera falloff
    float depthAlpha = smoothstep(-140.0, -10.0, mvPosition.z);
    
    // Ambient breathing oscillation per seed
    float pulse = 0.85 + 0.15 * sin(uTime * 0.8 + aSeed.z * 12.0);

    // Proximity luminance boost near cursor
    float cursorGlow = distToPointer < radius ? (1.0 - distToPointer / radius) * 0.35 : 0.0;

    vAlpha = (aAlpha * depthAlpha * pulse + cursorGlow);
    vDistToCenter = length(pos.xy) / 80.0;

    // 7. COLOR PALETTE: LUXURY MONOCHROME WITH AIRY CELESTIAL UNDERTONE
    // Base: Pure luminous silver/white with subtle coolness on NEAR particles
    vec3 farColor = vec3(0.55, 0.60, 0.68);     // Muted deep slate/silver
    vec3 midColor = vec3(0.82, 0.86, 0.92);     // Platinum white
    vec3 nearColor = vec3(0.95, 0.97, 1.00);    // Crisp crystalline diamond white

    if (aLayer < 0.5) {
      vColor = farColor;
    } else if (aLayer < 1.5) {
      vColor = mix(farColor, midColor, 0.65);
    } else {
      vColor = mix(midColor, nearColor, 0.8);
    }
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying float vLayer;
  varying vec3 vColor;

  void main() {
    // Distance from center of point sprite [0..0.5]
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) {
      discard;
    }

    // Micro soft-edge circle falloff: crisp nucleus with delicate gaussian-like softness
    // Inner crisp core: dist < 0.28
    // Soft perimeter: 0.28 to 0.5
    float edge = smoothstep(0.5, 0.15, dist);

    // Soft core highlight
    float core = smoothstep(0.25, 0.0, dist) * 0.35;

    float finalAlpha = vAlpha * (edge + core);

    gl_FragColor = vec4(vColor, clamp(finalAlpha, 0.0, 0.85));
  }
`;

export const MotionParticleWorld: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

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
    camera.position.set(0, 0, 75);

    // 2. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false, // Performance friendly; point sprites have soft shader edges
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% transparent clear color

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
    const spreadX = 90;
    const spreadY = 65;
    const spreadZNear = -5;
    const spreadZFar = -90;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Layer segmentation:
      // 55% FAR (dense atmospheric star dust)
      // 30% MID (flowing filaments)
      // 15% NEAR (interactive foreground liquid crystals)
      const randLayer = Math.random();
      let layer = 0; // FAR
      let zMin = -90;
      let zMax = -40;
      let sizeBase = 1.6;
      let alphaBase = 0.28;

      if (randLayer > 0.85) {
        layer = 2; // NEAR
        zMin = -20;
        zMax = spreadZNear;
        sizeBase = 3.6;
        alphaBase = 0.65;
      } else if (randLayer > 0.55) {
        layer = 1; // MID
        zMin = -45;
        zMax = -18;
        sizeBase = 2.4;
        alphaBase = 0.42;
      }

      // Natural central clustering with organic boundary dispersion
      const rad = Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const x = rad * Math.cos(theta) * spreadX * 0.9;
      const y = rad * Math.sin(theta) * spreadY * 0.9;
      const z = zMin + Math.random() * (zMax - zMin);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      layers[i] = layer;
      sizes[i] = sizeBase * (0.8 + Math.random() * 0.45);
      alphas[i] = alphaBase * (0.7 + Math.random() * 0.45);

      seeds[i3] = Math.random();
      seeds[i3 + 1] = Math.random();
      seeds[i3 + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));

    // 4. Custom Shader Material
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerVel: { value: new THREE.Vector2(0, 0) },
      uPointerRadius: { value: 0.28 }, // NDC radius (~180px on 1080p)
      uPointerForce: { value: 0.18 },  // Smooth physical repulsion
      uScrollOffset: { value: 0 },
      uScrollVel: { value: 0 },
      uShockTime: { value: -1 },
      uShockOrigin: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
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
    let scrollVel = 0;

    let shockStartTime = -1;

    // Listen to SingularityInteractionEngine
    const unsubscribe = interactionEngine.subscribe((state) => {
      // NDC pointer
      targetPointerX = state.ndcX;
      targetPointerY = state.ndcY;

      targetScrollY = state.scrollY;

      if (state.lastClickTime > 0) {
        shockStartTime = state.lastClickTime / 1000;
        uniforms.uShockOrigin.value.set(state.ndcX, state.ndcY);
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

      // Normalize scroll offset to subtle world units
      uniforms.uScrollOffset.value = -smoothScrollY * 0.012;
      uniforms.uScrollVel.value = -scrollVel;

      // Shockwave timing
      if (shockStartTime > 0) {
        const shockElapsed = seconds - shockStartTime;
        if (shockElapsed > 1.5) {
          uniforms.uShockTime.value = -1;
        } else {
          uniforms.uShockTime.value = shockElapsed;
        }
      }

      // Subtle scene camera breathing & inclination based on pointer
      camera.position.x += (smoothPointerX * 2.5 - camera.position.x) * 0.04;
      camera.position.y += (smoothPointerY * 2.0 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

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
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{
        contain: 'strict',
      }}
    />
  );
};
